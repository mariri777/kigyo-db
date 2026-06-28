import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Bookmark,
  Share2,
  MessageSquare,
  Sparkles,
  Zap,
  AlertTriangle,
  Building2,
  Cpu,
  Search,
  ChevronRight,
  Clock,
  Star,
  Activity,
  ArrowUpRight,
  Flame,
  CircleDot,
} from "lucide-react";
import {
  ANGLE_META,
  angleFromCategorySlug,
  type Subject as ArticleSubject,
} from "./articles/_lib/posts";
import { SIGNAL_META, type SignalKind } from "./articles/_lib/signals";
import { getDb } from "@/server/db/client";
import {
  findLatestMarketBrief,
  listLatestHighlights,
  listMarketIndices,
  type HighlightRow,
  type MarketBriefRow,
  type MarketIndexRow,
} from "@/server/repo/homepageRepo";
import { listAll as listAllArticles, type ArticleListItem } from "@/server/repo/articleRepo";

// 動的データ取得 (D1) が入るため、build 時 prerender を避ける
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "日本株 3800 社のAI銘柄分析データベース",
  description:
    "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。今日の市場サマリ・AI Daily Brief・注目企業/業界カード・予測コーナー・業界マップ・記事を 1 つに。日々の見落とし論点と先回りキュレーションをまとめて読める。",
  alternates: { canonical: "/v2" },
  openGraph: {
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・AI Daily Brief・注目企業/業界・予測・業界マップ・記事を 1 つに。",
    url: "/v2",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・AI Daily Brief・注目企業/業界・予測・業界マップ・記事を 1 つに。",
  },
};

// ─────────────────────────────────────────────────────────
// ダミーデータ (D1 接続失敗時の fallback)
// ─────────────────────────────────────────────────────────

const INDICES = [
  { name: "日経平均", value: "42,318.47", change: "+1.24%", delta: "+517.84", positive: true },
  { name: "TOPIX", value: "2,983.12", change: "+0.87%", delta: "+25.71", positive: true },
  { name: "東証グロース", value: "812.44", change: "-0.32%", delta: "-2.61", positive: false },
  { name: "USD/JPY", value: "152.18", change: "-0.41%", delta: "-0.62", positive: false },
  { name: "SOX 指数", value: "5,624.91", change: "+2.18%", delta: "+119.84", positive: true },
] as const;

const AI_SUMMARY = {
  lede: "半導体に火が戻った1日。HBM需要観測とSOX高で東エレク・アドバンが牽引、ディフェンシブは利確優勢で頭打ち。",
  bullets: [
    "東エレ +3.4% / アドバン +4.1%。米AI設備投資の上方修正が前場から効いた。",
    "三井物産・伊藤忠は商社の調整局面入りを示唆、円安一服も逆風。",
    "明日は決算ラッシュ初日。指数の動きより個別の予想ズレに資金が向きやすい。",
  ],
  watchThemes: [
    { name: "HBM・先端パッケージ", change: "+3.8%", icon: Cpu },
    { name: "電力インフラ", change: "+1.9%", icon: Zap },
    { name: "防衛・宇宙", change: "+0.7%", icon: Activity },
  ],
};

function unsplashUrl(id: string, w: number, h?: number) {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(w),
    q: "75",
  });
  if (h) params.set("h", String(h));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

const FEATURED = [
  {
    kind: "company" as const,
    badge: "今日の主役",
    badgeIcon: Flame,
    badgeColor: "bg-orange-500 text-white",
    name: "東京エレクトロン",
    code: "8035",
    why: "SOX高 + HBM需要観測のダブル材料。月内の戻り高値を更新。",
    metric: "¥38,420",
    change: "+3.4%",
    positive: true,
    spark: [32, 34, 35, 33, 36, 37, 38, 39, 41, 42, 41, 43, 45, 46],
    image: "photo-1581092921461-eab62e97a780", // chip / wafer
  },
  {
    kind: "company" as const,
    badge: "決算前夜",
    badgeIcon: Clock,
    badgeColor: "bg-blue-500 text-white",
    name: "ソフトバンクG",
    code: "9984",
    why: "明日 16:00 決算発表。Arm株評価益とOpenAIの含み益が論点。",
    metric: "¥12,140",
    change: "+0.8%",
    positive: true,
    spark: [50, 52, 48, 49, 51, 53, 54, 52, 55, 56, 58, 57, 59, 60],
    image: "photo-1551288049-bebda4e38f71", // financial charts on screen
  },
  {
    kind: "industry" as const,
    badge: "業界の地殻変動",
    badgeIcon: Zap,
    badgeColor: "bg-emerald-500 text-white",
    name: "電力・送配電",
    why: "AIデータセンタ向け需要で系統増強が現実化。電線・変圧器が連動。",
    metric: "業界平均 +1.9%",
    change: "週間 +6.2%",
    positive: true,
    spark: [30, 31, 32, 31, 33, 35, 36, 38, 37, 39, 41, 42, 44, 45],
    image: "photo-1473341304170-971dccb5ac1e", // power lines
  },
  {
    kind: "company" as const,
    badge: "見落とし論点",
    badgeIcon: AlertTriangle,
    badgeColor: "bg-neutral-900 text-white",
    name: "ニデック",
    code: "6594",
    why: "車載モーターの減損後、ROEは底打ち。市場の織り込みは前向き不足。",
    metric: "¥3,210",
    change: "-1.2%",
    positive: false,
    spark: [55, 54, 52, 51, 50, 49, 48, 47, 46, 45, 46, 45, 44, 43],
    image: "photo-1568667256531-3379a4076b1e", // electric motor / industrial
  },
  {
    kind: "industry" as const,
    badge: "テーマの再評価",
    badgeIcon: Sparkles,
    badgeColor: "bg-purple-500 text-white",
    name: "防衛・宇宙",
    why: "受注残はピーク前。三菱重工/川重の中計に対する織り込みは控えめ。",
    metric: "業界平均 +0.7%",
    change: "月間 +12.4%",
    positive: true,
    spark: [40, 41, 42, 43, 44, 45, 47, 48, 50, 52, 54, 55, 57, 58],
    image: "photo-1446776877081-d282a0f896e2", // space
  },
];

type Prediction = {
  question: string;
  category: string;
  categoryIcon: typeof Cpu;
  pickLabel: string;
  noLabel: string;
  probability: number;
  rationale: string;
  resolveLabel: string;
  volume: string;
  voters: number;
  status: "live" | "soon";
};

const PREDICTIONS: Prediction[] = [
  {
    question: "明日のソフトバンクG決算、市場予想以上か?",
    category: "決算",
    categoryIcon: TrendingUp,
    pickLabel: "予想以上",
    noLabel: "予想以下",
    probability: 68,
    rationale: "Arm株評価益 + OpenAI関連評価益の積み上がりが市場予想を上回る可能性が高い。",
    resolveLabel: "明日 16:00",
    volume: "¥1.2M",
    voters: 1284,
    status: "live",
  },
  {
    question: "TOPIX、6月末までに 3,000 pt を超えるか?",
    category: "指数",
    categoryIcon: Activity,
    pickLabel: "超える",
    noLabel: "超えない",
    probability: 43,
    rationale: "上値抵抗が厚く、海外勢のリバランス売りが先行するシナリオ。",
    resolveLabel: "6/30 大引け",
    volume: "¥890k",
    voters: 892,
    status: "live",
  },
  {
    question: "東京エレクトロン、来週 ¥40,000 を回復するか?",
    category: "個別株",
    categoryIcon: Cpu,
    pickLabel: "回復する",
    noLabel: "回復しない",
    probability: 71,
    rationale: "SOX連動と需給。HBM4関連の取材記事が来週前半に出る公算大。",
    resolveLabel: "7/4 大引け",
    volume: "¥1.5M",
    voters: 1562,
    status: "live",
  },
  {
    question: "ファーストリテイリング、通期見通しを上方修正か?",
    category: "決算",
    categoryIcon: TrendingUp,
    pickLabel: "上方修正",
    noLabel: "据え置き",
    probability: 38,
    rationale: "海外好調も保守的。為替ヘッジの効きで上方は次Qに持ち越し。",
    resolveLabel: "7/11 決算",
    volume: "¥700k",
    voters: 703,
    status: "soon",
  },
  {
    question: "ニデック、通期EPSは会社計画を上回るか?",
    category: "決算",
    categoryIcon: TrendingUp,
    pickLabel: "上回る",
    noLabel: "下回る",
    probability: 54,
    rationale: "車載減損後の構造改革効果。会社計画は下方寄りに保守化済み。",
    resolveLabel: "8/8 決算",
    volume: "¥420k",
    voters: 418,
    status: "soon",
  },
  {
    question: "三菱重工、防衛セグメント受注前年比+30%超え?",
    category: "個別株",
    categoryIcon: Zap,
    pickLabel: "超える",
    noLabel: "超えない",
    probability: 76,
    rationale: "防衛省の長期契約案件が今期に積み上がる。中計の控えめ前提が効く。",
    resolveLabel: "8/1 決算",
    volume: "¥960k",
    voters: 964,
    status: "soon",
  },
];

const TRACK_RECORD = { resolved: 184, hits: 117, accuracy: 63.6, live: 9, volume: "¥18.4M" };

const SECTOR_CHIPS = [
  { name: "電気機器", count: 248, hot: true },
  { name: "情報・通信", count: 583, hot: true },
  { name: "輸送用機器", count: 92 },
  { name: "化学", count: 213 },
  { name: "機械", count: 234 },
  { name: "医薬品", count: 71 },
  { name: "卸売", count: 309 },
  { name: "小売", count: 320 },
  { name: "銀行", count: 81 },
  { name: "保険", count: 13 },
  { name: "建設", count: 162 },
  { name: "不動産", count: 142 },
];

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function V2HomePage() {
  // D1 取得は並列。ローカルで未seedの場合は空配列が返って fallback に倒れる。
  const data = await loadHomepageData();
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-12">
        <h1 className="sr-only">
          超!企業DB — 日本株 3800 社の AI 銘柄分析データベース
        </h1>
        <PrototypeBanner />
        <MarketSummary indices={data.indices} brief={data.brief} today={data.today} />
        <MarketSignals highlights={data.highlights} />
        <ArticlesSection posts={data.latestArticles} />
        <Featured />
        <Predictions />
        <ExploreRails />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Data loaders
// ─────────────────────────────────────────────────────────

type HomepageData = {
  today: string;
  indices: IndexView[];
  brief: BriefView;
  highlights: HighlightView[];
  latestArticles: ArticleListItem[];
};

async function loadHomepageData(): Promise<HomepageData> {
  try {
    const db = await getDb();
    const [indices, brief, highlights, articles] = await Promise.all([
      listMarketIndices(db),
      findLatestMarketBrief(db),
      listLatestHighlights(db, 6),
      listAllArticles(db),
    ]);
    return {
      today: formatTodayJp(brief?.date),
      indices: indices.length > 0 ? indices.map(toIndexView) : FALLBACK_INDICES,
      brief: brief ? toBriefView(brief) : FALLBACK_BRIEF,
      highlights:
        highlights.length > 0 ? highlights.map(toHighlightView) : FALLBACK_HIGHLIGHTS,
      latestArticles: articles
        .filter((a) => a.status === "published")
        .slice(0, 5),
    };
  } catch {
    // D1 バインディングが無い (例: 一部の preview) ときは fallback で安全に表示
    return {
      today: formatTodayJp(undefined),
      indices: FALLBACK_INDICES,
      brief: FALLBACK_BRIEF,
      highlights: FALLBACK_HIGHLIGHTS,
      latestArticles: [],
    };
  }
}

type IndexView = {
  key: string;
  name: string;
  value: string;
  change: string;
  delta: string;
  positive: boolean;
};

type BriefView = {
  lede: string;
  bullets: string[];
  watchThemes: Array<{ name: string; change: string; icon: typeof Cpu }>;
};

type HighlightView = {
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

function toIndexView(r: MarketIndexRow): IndexView {
  const positive = (r.change1dPct ?? 0) >= 0;
  return {
    key: r.symbol,
    name: r.name,
    value: r.value != null ? formatNumber(r.value) : "—",
    change: r.change1dPct != null ? formatPctSigned(r.change1dPct) : "—",
    delta: r.change1dAbs != null ? formatPctSigned(r.change1dAbs) : "—",
    positive,
  };
}

function toBriefView(b: MarketBriefRow): BriefView {
  return {
    lede: b.lede ?? "",
    bullets: b.bullets,
    watchThemes: b.watchThemes.map((t) => ({
      name: t.name,
      change: formatPctSigned(t.changePct),
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
      ? `/v2/articles/${h.relatedArticleSlug}`
      : h.subjectKind === "company" && h.subjectCode
        ? `/v2/stocks/${h.subjectCode}`
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

function formatNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPctSigned(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function formatTodayJp(isoDate?: string): string {
  const d = isoDate ? new Date(`${isoDate}T00:00:00+09:00`) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${y}年${m}月${day}日 (${wd})`;
}

// D1 が空のときの fallback。デザイン崩れを防ぐ。
const FALLBACK_INDICES: IndexView[] = INDICES.map((i) => ({
  key: i.name,
  name: i.name,
  value: i.value,
  change: i.change,
  delta: i.delta,
  positive: i.positive,
}));

const FALLBACK_BRIEF: BriefView = {
  lede: AI_SUMMARY.lede,
  bullets: [...AI_SUMMARY.bullets],
  watchThemes: AI_SUMMARY.watchThemes.map((t) => ({
    name: t.name,
    change: t.change,
    icon: t.icon,
  })),
};

const FALLBACK_HIGHLIGHTS: HighlightView[] = [];

// ─────────────────────────────────────────────────────────
// Banner
// ─────────────────────────────────────────────────────────

function PrototypeBanner() {
  return (
    <div className="bg-neutral-900 text-white rounded-xl px-4 py-2.5 text-xs flex items-center justify-between gap-3">
      <span className="font-mono uppercase tracking-wider flex items-center gap-2">
        <CircleDot className="w-3.5 h-3.5 text-orange-400" />
        v2 prototype · データ未接続 · デザイン議論用
      </span>
      <Link
        href="/"
        className="text-neutral-300 hover:text-white transition flex items-center gap-1"
      >
        現行サイトへ <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Market Summary
// ─────────────────────────────────────────────────────────

function MarketSummary({
  indices,
  brief,
  today,
}: {
  indices: IndexView[];
  brief: BriefView;
  today: string;
}) {
  const hero = indices[0] ?? FALLBACK_INDICES[0];
  const subIndices = indices.slice(1);
  return (
    <section>
      <SectionHeader
        kicker={today}
        title="本日の市場サマリ"
        icon={Activity}
        tag={{ label: "AI 要約", color: "bg-emerald-500 text-white" }}
      />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ヒーロー: 日経平均 + 写真 + チャート背景 */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-sm min-h-[300px] flex flex-col">
          {/* 背景写真 (東京の街並み・トレーディングフロアなど) */}
          <Image
            src={unsplashUrl("photo-1535320903710-d993d3d77d29", 1200, 600)}
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-neutral-900/60" />
          <ChartBackdrop positive={hero.positive} />
          <div className="relative p-6 sm:p-7 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                <Activity className="w-3 h-3" />
                本日の主役指標
              </span>
              <span className="text-xs text-neutral-300 font-mono tabular">
                15:00 大引け
              </span>
            </div>

            <div className="mt-auto pt-8">
              <div className="text-sm font-semibold text-neutral-300 mb-1">
                {hero.name}
              </div>
              <div className="flex items-baseline gap-4 flex-wrap">
                <div className="font-mono tabular text-5xl sm:text-6xl font-bold tracking-tight">
                  {hero.value}
                </div>
                <div className="flex items-center gap-1.5 font-mono tabular font-bold text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-2xl">{hero.change}</span>
                  <span className="text-base text-neutral-300 font-normal">
                    {hero.delta}
                  </span>
                </div>
              </div>
            </div>

            {/* sub indices inline */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subIndices.map((idx) => (
                <div key={idx.key} className="rounded-xl bg-white/5 backdrop-blur px-3 py-2.5 hover:bg-white/10 transition cursor-pointer">
                  <div className="text-[10px] text-neutral-300 font-semibold mb-0.5 truncate">
                    {idx.name}
                  </div>
                  <div className="font-mono tabular text-sm font-bold truncate">
                    {idx.value}
                  </div>
                  <div
                    className={`flex items-center gap-0.5 font-mono tabular text-xs font-semibold ${
                      idx.positive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {idx.positive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {idx.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Brief サマリ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold">AI Daily Brief</div>
                <div className="text-[10px] text-neutral-500">17:00 JST 生成</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition" aria-label="ブックマーク">
                <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition" aria-label="共有">
                <Share2 className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-4 flex-1">
            <p className="text-base font-bold leading-snug tracking-tight">
              {brief.lede}
            </p>
            <ul className="space-y-2.5">
              {brief.bullets.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                  <span className="font-mono text-emerald-600 font-bold tabular shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-neutral-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-neutral-100">
            <div className="px-5 pt-3 pb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Watch Themes
              </span>
            </div>
            <ul className="px-3 pb-3">
              {brief.watchThemes.map((t) => {
                const Icon = t.icon;
                return (
                  <li
                    key={t.name}
                    className="px-2 py-2 flex items-center gap-2.5 hover:bg-neutral-50 rounded-lg transition cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1 text-xs font-semibold truncate">
                      {t.name}
                    </span>
                    <span className="text-xs text-emerald-600 font-mono tabular font-bold">
                      {t.change}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartBackdrop({ positive }: { positive: boolean }) {
  // ダミーの株価ラインを背景に大きく描く
  const data = [42, 41, 43, 42, 44, 43, 45, 47, 46, 48, 50, 51, 53, 52, 54, 56, 57, 58, 60, 62];
  const w = 600;
  const h = 240;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${h - ((d - min) / range) * h * 0.85 - h * 0.05}`)
    .join(" ");
  const stroke = positive ? "#10b981" : "#f43f5e";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 w-full h-full opacity-40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
        <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#hero-chart-fill)" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Articles (編集記事のみ。密度高い縦リスト + テーマrail)
// AI速報 (signals) は MarketSignals セクションに分離。
// ─────────────────────────────────────────────────────────

function ArticlesSection({ posts }: { posts: ArticleListItem[] }) {
  const [hero, ...rest] = posts;
  return (
    <section id="articles" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">記事</h2>
        <Link
          href="/v2/articles"
          className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
        >
          すべての記事
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          公開済みの記事はまだありません。
        </p>
      ) : (
        <div className="mt-5 space-y-1">
          {hero && <ArticleHero post={hero} />}
          <ul className="divide-y divide-neutral-200">
            {rest.map((p) => (
              <li key={p.id}>
                <ArticleRowTop post={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function articleSubject(p: ArticleListItem): ArticleSubject {
  if (p.subjectKind === "company") {
    return { kind: "company", code: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "industry") {
    return { kind: "industry", slug: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "theme") {
    return { kind: "theme", slug: p.subjectRef, name: p.subjectName };
  }
  return { kind: "metric", slug: p.subjectRef, name: p.subjectName };
}

function articleAngleMeta(p: ArticleListItem) {
  const key = angleFromCategorySlug(p.categorySlug);
  if (key) return ANGLE_META[key];
  return { label: p.categoryName, icon: Sparkles, color: "bg-neutral-100 text-neutral-700" };
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function ArticleHero({ post }: { post: ArticleListItem }) {
  const angle = articleAngleMeta(post);
  const AngleIcon = angle.icon;
  return (
    <Link
      href={`/v2/articles/${post.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden mb-2"
    >
      <div className="p-5 sm:p-6 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
          >
            <AngleIcon className="w-3 h-3" />
            {angle.label}
          </span>
          <ArticleSubjectChip subject={articleSubject(post)} />
        </div>
        <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-snug group-hover:text-neutral-900 line-clamp-3">
          {post.title}
        </h3>
        <p className="text-[13px] sm:text-sm text-neutral-700 leading-relaxed line-clamp-3">
          {post.lede}
        </p>
        <div className="mt-auto pt-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {formatPublishedAt(post.publishedAt)}
        </div>
      </div>
    </Link>
  );
}

function ArticleRowTop({ post }: { post: ArticleListItem }) {
  const angle = articleAngleMeta(post);
  const AngleIcon = angle.icon;
  return (
    <Link
      href={`/v2/articles/${post.slug}`}
      className="group flex items-start gap-3 sm:gap-4 py-4 hover:bg-neutral-100/40 -mx-2 px-2 rounded-lg transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
          >
            <AngleIcon className="w-2.5 h-2.5" />
            {angle.label}
          </span>
          <ArticleSubjectChip subject={articleSubject(post)} compact />
        </div>
        <h4 className="text-[15px] sm:text-base font-bold tracking-tight leading-snug group-hover:text-neutral-900 line-clamp-2">
          {post.title}
        </h4>
        <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed line-clamp-2 mt-0.5">
          {post.lede}
        </p>
        <div className="mt-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {formatPublishedAt(post.publishedAt)}
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// Market signals (シグナル: DBの更新から自動生成された通知)
// 市場サマリの下に、リアルタイム感のある縦リストとして出す。
// ─────────────────────────────────────────────────────────

function MarketSignals({ highlights }: { highlights: HighlightView[] }) {
  return (
    <section id="signals" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          本日のハイライト
        </h2>
        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
          当日分 / DB自動生成
        </span>
      </div>
      {highlights.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          本日のハイライトはまだありません。パイプラインで <code className="font-mono">derive-highlights</code> を実行してください。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
          {highlights.map((h) => (
            <li key={h.id}>
              <SignalRow highlight={h} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignalRow({ highlight: h }: { highlight: HighlightView }) {
  const meta = SIGNAL_META[h.kind];
  const MetaIcon = meta.icon;
  const positive = h.keyMetric.positive;
  const subject: ArticleSubject =
    h.subjectKind === "company" && h.subjectCode
      ? { kind: "company", code: h.subjectCode, name: h.subjectName.replace(/^\d{4}\s*/, "") }
      : h.subjectKind === "industry"
        ? { kind: "industry", slug: "industry", name: h.subjectName }
        : h.subjectKind === "theme"
          ? { kind: "theme", slug: "theme", name: h.subjectName }
          : { kind: "metric", slug: "metric", name: h.subjectName };
  const href = h.relatedHref ?? "/v2/articles";
  return (
    <Link href={href} className="group flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-neutral-50 transition">
      <div className="text-[10px] font-mono tabular text-neutral-500 w-12 shrink-0">
        {h.publishedAt}
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600 w-28 shrink-0">
        <MetaIcon className="w-3 h-3" />
        {meta.label}
      </div>
      <ArticleSubjectChip subject={subject} compact />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-neutral-800 leading-snug line-clamp-1 group-hover:text-neutral-900">
          {h.oneLiner}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className={`font-mono tabular text-sm font-black tracking-tight inline-flex items-center gap-0.5 ${
            positive === null
              ? "text-neutral-900"
              : positive
                ? "text-emerald-600"
                : "text-rose-600"
          }`}
        >
          {positive === true && <TrendingUp className="w-3 h-3" />}
          {positive === false && <TrendingDown className="w-3 h-3" />}
          {h.keyMetric.value}
        </div>
        <div className="text-[9px] text-neutral-500 font-mono">{h.keyMetric.label}</div>
      </div>
      {h.relatedHref && h.relatedHref.startsWith("/v2/articles/") && (
        <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-widest text-emerald-700 shrink-0">
          解釈あり
        </span>
      )}
    </Link>
  );
}

function ArticleSubjectChip({
  subject,
  compact = false,
}: {
  subject: ArticleSubject;
  compact?: boolean;
}) {
  const map: Record<ArticleSubject["kind"], { icon: typeof Cpu; label: string; color: string }> =
    {
      company: {
        icon: Building2,
        label: "企業",
        color: "bg-blue-50 text-blue-700 border-blue-100",
      },
      industry: {
        icon: Building2,
        label: "業界",
        color: "bg-amber-50 text-amber-700 border-amber-100",
      },
      theme: {
        icon: Sparkles,
        label: "テーマ",
        color: "bg-purple-50 text-purple-700 border-purple-100",
      },
      metric: {
        icon: Activity,
        label: "指標",
        color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
    };
  const meta = map[subject.kind];
  const Icon = meta.icon;
  const text =
    subject.kind === "company"
      ? `${subject.code} ${subject.name}`
      : subject.name;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${meta.color}`}
    >
      <Icon className="w-3 h-3" />
      {compact ? text : `${meta.label}: ${text}`}
    </span>
  );
}


// ─────────────────────────────────────────────────────────
// Featured (注目企業/業界カード3列)
// ─────────────────────────────────────────────────────────

function Featured() {
  return (
    <section id="featured" className="scroll-mt-20">
      <SectionHeader
        kicker="編集キュレーション"
        title="今、注目すべき企業 / 業界"
        icon={Star}
      />

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURED.map((f, i) => (
          <FeaturedCard key={i} item={f} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ item }: { item: (typeof FEATURED)[number] }) {
  const BadgeIcon = item.badgeIcon;
  return (
    <article className="group bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer">
      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-200">
        <Image
          src={unsplashUrl(item.image, 480, 270)}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0 pointer-events-none" />
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${item.badgeColor}`}
        >
          <BadgeIcon className="w-3 h-3" />
          {item.badge}
        </span>
        <span className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-widest text-white/90 font-bold">
          {item.kind === "company" ? "COMPANY" : "INDUSTRY"}
        </span>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold tracking-tight drop-shadow">{item.name}</h3>
            {item.code && (
              <span className="font-mono tabular text-sm text-white/80 font-semibold">
                {item.code}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-neutral-600">{item.why}</p>
        <Sparkline data={item.spark} positive={item.positive} />
        <div className="mt-auto flex items-baseline justify-between pt-3 border-t border-neutral-100">
          <span className="font-mono tabular text-lg font-bold">{item.metric}</span>
          <span
            className={`flex items-center gap-1 font-mono tabular text-sm font-bold ${
              item.positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {item.positive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {item.change}
          </span>
        </div>
      </div>
    </article>
  );
}

function Sparkline({ data, positive }: { data: readonly number[]; positive: boolean }) {
  const w = 240;
  const h = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${h - ((d - min) / range) * h}`)
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const stroke = positive ? "#10b981" : "#f43f5e";
  const fillId = positive ? "spark-pos" : "spark-neg";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${fillId})`} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Predictions (Polymarket風)
// ─────────────────────────────────────────────────────────

function Predictions() {
  return (
    <section id="predictions" className="scroll-mt-20">
      <SectionHeader
        kicker="AI が事前にロックする予想"
        title="AI 予測コーナー"
        icon={Sparkles}
        tag={{ label: "● LIVE", color: "bg-rose-500 text-white animate-pulse" }}
      />

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Sparkles} label="累積的中率" value={`${TRACK_RECORD.accuracy}%`} accent="emerald" />
        <StatCard icon={Activity} label="判定済み" value={`${TRACK_RECORD.hits} / ${TRACK_RECORD.resolved}`} accent="neutral" />
        <StatCard icon={CircleDot} label="LIVE" value={String(TRACK_RECORD.live)} accent="rose" />
        <StatCard icon={TrendingUp} label="累計取扱高" value={TRACK_RECORD.volume} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PREDICTIONS.map((p, i) => (
          <PredictionCard key={i} pred={p} />
        ))}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  accent: "emerald" | "rose" | "neutral";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    neutral: "bg-neutral-100 text-neutral-700",
  }[accent];
  return (
    <div className="bg-white rounded-xl shadow-sm p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </div>
        <div className="font-mono tabular font-bold text-base truncate">{value}</div>
      </div>
    </div>
  );
}

function PredictionCard({ pred }: { pred: Prediction }) {
  const CatIcon = pred.categoryIcon;
  const inverse = 100 - pred.probability;
  return (
    <article className="group bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600">
          <CatIcon className="w-3.5 h-3.5" />
          {pred.category}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
            pred.status === "live" ? "text-rose-600" : "text-neutral-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              pred.status === "live" ? "bg-rose-500 animate-pulse" : "bg-neutral-300"
            }`}
          />
          {pred.status === "live" ? "LIVE" : "SOON"}
        </span>
      </div>

      <div className="px-4 pb-4 flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-sm leading-snug tracking-tight">{pred.question}</h3>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-semibold text-neutral-500">確率</span>
          <span className="font-mono tabular text-2xl font-bold tracking-tight text-emerald-600">
            {pred.probability}
            <span className="text-base">%</span>
          </span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
            style={{ width: `${pred.probability}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-between transition">
          <span>{pred.pickLabel}</span>
          <span className="font-mono tabular font-bold">{pred.probability}%</span>
        </button>
        <button className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-between transition">
          <span>{pred.noLabel}</span>
          <span className="font-mono tabular font-bold">{inverse}%</span>
        </button>
      </div>

      <p className="px-4 pb-3 text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
        {pred.rationale}
      </p>

      <div className="px-4 py-2.5 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-mono tabular font-semibold">{pred.volume}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span className="font-mono tabular">{pred.voters.toLocaleString()}</span>
          </span>
        </div>
        <span className="font-mono tabular">{pred.resolveLabel}</span>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────
// Explore Rails (半導体 + 全企業DB)
// ─────────────────────────────────────────────────────────

function ExploreRails() {
  return (
    <section id="semiconductor" className="grid grid-cols-1 lg:grid-cols-2 gap-5 scroll-mt-20">
      <Link
        href="/themes/semiconductor"
        className="group relative overflow-hidden rounded-2xl bg-neutral-900 text-white p-6 flex flex-col gap-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 min-h-[280px]"
      >
        <Image
          src={unsplashUrl("photo-1518770660439-4636190af475", 800, 600)}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/85 to-purple-900/70" />
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            <Cpu className="w-3 h-3" />
            FEATURED THEME · DEEP DIVE
          </span>
          <span className="font-mono text-xs text-neutral-400">01</span>
        </div>
        <h3 className="relative text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          半導体特集
        </h3>
        <p className="relative text-sm leading-relaxed text-neutral-300">
          前工程・後工程・装置・材料・OSAT まで、工程ごとの企業ポジションと
          バリュエーションを 1 つに。月次で更新。
        </p>
        <div className="relative mt-4 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-mono tabular font-bold">32</span>
            <span className="text-neutral-400">銘柄</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-mono tabular font-bold">47</span>
            <span className="text-neutral-400">記事</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold group-hover:gap-2 transition-all">
            特集ページへ <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      <div className="rounded-2xl bg-white shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
            <Building2 className="w-3 h-3" />
            FULL DATABASE
          </span>
          <span className="font-mono text-xs text-neutral-400">02</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
            東証 <span className="text-emerald-600">3,800</span> 社、すべて
          </h3>
          <Link
            href="/v2/stocks"
            className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
          >
            銘柄一覧へ
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>
        <form
          action="/v2/stocks"
          method="get"
          className="flex items-center bg-neutral-50 rounded-xl pl-3 pr-2 py-1 focus-within:ring-2 focus-within:ring-neutral-900 transition"
        >
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            name="q"
            placeholder="銘柄コード・社名で検索 (例: 7203, トヨタ)"
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none"
            aria-label="銘柄検索"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            検索
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_CHIPS.map((s) => (
            <Link
              key={s.name}
              href={`/v2/stocks?sector=${encodeURIComponent(s.name)}`}
              className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 transition ${
                s.hot
                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {s.hot && <Flame className="w-3 h-3" />}
              {s.name}
              <span className="font-mono tabular text-[10px] opacity-60">
                {s.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Section header (共通)
// ─────────────────────────────────────────────────────────

function SectionHeader({
  kicker,
  title,
  icon: Icon,
  tag,
  action,
}: {
  kicker?: string;
  title: string;
  icon?: typeof Cpu;
  tag?: { label: string; color: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {kicker && (
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            {kicker}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
          {tag && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tag.color}`}
            >
              {tag.label}
            </span>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
