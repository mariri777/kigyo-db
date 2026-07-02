import { Activity, Cpu, Sparkles, Zap } from "lucide-react";

import { getDb } from "@/server/db/client";
import {
  findLatestMarketBrief,
  listLatestHighlights,
  listMarketIndices,
  type HighlightRow,
  type MarketBriefRow,
  type MarketIndexRow,
} from "@/server/repo/homepageRepo";
import {
  listLatestLiveForecasts,
  type ForecastSummary,
} from "@/server/repo/forecastRepo";
import { listAll as listAllArticles, type ArticleListItem } from "@/server/repo/articleRepo";
import type { Subject as ArticleSubject } from "../articles/_lib/posts";
import type { SignalKind } from "../articles/_lib/signals";

// ─────────────────────────────────────────────────────────
// View 型
// ─────────────────────────────────────────────────────────

export type IndexView = {
  key: string;
  name: string;
  value: string;
  change: string;
  delta: string;
  /** null = 前日比データなし(矢印・色を出さない) */
  positive: boolean | null;
};

export type BriefView = {
  lede: string;
  bullets: string[];
  watchThemes: Array<{ name: string; changePct: number | null; icon: typeof Cpu }>;
};

export type HighlightView = {
  id: string;
  kind: SignalKind;
  publishedAt: string;
  publishedAtIso: string;
  subjectKind: ArticleSubject["kind"];
  subjectCode: string | null;
  subjectName: string;
  oneLiner: string;
  keyMetric: { label: string; value: string; positive: boolean | null };
  relatedHref: string | null;
};

export type HomepageData = {
  /** 表示用「2026年6月28日 (日)」。データ日付基準、無ければ null */
  today: string | null;
  /** データ基準日 YYYY-MM-DD(鮮度ラベル用)。無ければ null */
  asOfDate: string | null;
  indices: IndexView[];
  brief: BriefView | null;
  highlights: HighlightView[];
  latestArticles: ArticleListItem[];
  forecasts: ForecastSummary[];
};

// ─────────────────────────────────────────────────────────
// Loader
// ─────────────────────────────────────────────────────────

/**
 * D1 が空・未バインドの場合はダミー値を出さず、正直な空状態を返す。
 * (以前はハードコードの指数・AIまとめを本物のように表示していた)
 */
export async function loadHomepageData(): Promise<HomepageData> {
  try {
    const db = await getDb();
    const [indices, brief, highlights, articles, forecasts] = await Promise.all([
      listMarketIndices(db),
      findLatestMarketBrief(db),
      listLatestHighlights(db, 6),
      listAllArticles(db),
      listLatestLiveForecasts(db, 2),
    ]);
    return {
      today: brief?.date ? formatDateJp(brief.date) : null,
      asOfDate: brief?.date ?? null,
      indices: indices.map(toIndexView),
      brief: brief ? toBriefView(brief) : null,
      highlights: highlights.map(toHighlightView),
      latestArticles: articles.filter((a) => a.status === "published").slice(0, 5),
      forecasts,
    };
  } catch {
    // D1 バインディングが無い (例: 一部の preview) ときも UI が壊れないように
    return {
      today: null,
      asOfDate: null,
      indices: [],
      brief: null,
      highlights: [],
      latestArticles: [],
      forecasts: [],
    };
  }
}

// ─────────────────────────────────────────────────────────
// Row → View 変換
// ─────────────────────────────────────────────────────────

function toIndexView(r: MarketIndexRow): IndexView {
  return {
    key: r.symbol,
    name: r.name,
    value: r.value != null ? formatNumber(r.value) : "—",
    change: r.change1dPct != null ? formatPctSigned(r.change1dPct) : "—",
    delta: r.change1dAbs != null ? formatSigned(r.change1dAbs) : "—",
    positive: r.change1dPct != null ? r.change1dPct >= 0 : null,
  };
}

function toBriefView(b: MarketBriefRow): BriefView {
  return {
    lede: b.lede ?? "",
    bullets: b.bullets,
    watchThemes: b.watchThemes.map((t) => ({
      name: t.name,
      changePct: typeof t.changePct === "number" && t.changePct !== 0 ? t.changePct : null,
      icon: themeIcon(t.name),
    })),
  };
}

function toHighlightView(h: HighlightRow): HighlightView {
  const SUPPORTED: SignalKind[] = ["earnings_brief", "price_anomaly", "indicator_shift"];
  const kind = (SUPPORTED.includes(h.kind as SignalKind) ? h.kind : "indicator_shift") as SignalKind;
  return {
    id: h.id,
    kind,
    publishedAt: h.publishedAt,
    publishedAtIso: h.publishedAtIso,
    subjectKind: h.subjectKind as ArticleSubject["kind"],
    subjectCode: h.subjectCode,
    subjectName: h.subjectName,
    oneLiner: h.oneLiner,
    keyMetric: {
      label: h.keyMetricLabel,
      value: h.keyMetricValue,
      positive: h.keyMetricPositive,
    },
    relatedHref: h.relatedArticleSlug
      ? `/articles/${h.relatedArticleSlug}`
      : h.subjectKind === "company" && h.subjectCode
        ? `/stocks/${h.subjectCode}`
        : null,
  };
}

// Watch テーマ名 → アイコンの軽いマッピング。当たらなければ Sparkles。
function themeIcon(name: string): typeof Cpu {
  if (/半導体|HBM|チップ/i.test(name)) return Cpu;
  if (/電力|エネルギ|送配電/i.test(name)) return Zap;
  if (/防衛|宇宙/i.test(name)) return Activity;
  return Sparkles;
}

// ─────────────────────────────────────────────────────────
// フォーマッタ
// ─────────────────────────────────────────────────────────

export function formatNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPctSigned(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

/** 指数の前日比絶対値など、% を付けない符号付き数値 */
export function formatSigned(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${formatNumber(v)}`;
}

export function formatDateJp(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00+09:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${y}年${m}月${day}日 (${wd})`;
}

/** "2026-06-28" → "6/28" (鮮度ラベル用の短い形式) */
export function formatDateShortJp(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  return `${Number(m[2])}/${Number(m[3])}`;
}
