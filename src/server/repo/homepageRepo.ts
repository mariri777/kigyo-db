/**
 * v2 トップページのデータアクセス層。
 *
 * - 指数: market_indices テーブル
 * - 当日サマリ: market_brief テーブル
 * - ハイライト: homepage_highlights テーブル
 *
 * いずれも drizzle ベース。詳細ページや管理画面ではなく、トップ専用の集約読み出し。
 */
import { desc, eq, sql } from "drizzle-orm";

import {
  homepageHighlights,
  marketBrief,
  marketIndices,
} from "@/server/db/schema";
import type { Db as DbClient } from "@/server/db/client";

// ─────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────

export type MarketIndexRow = {
  symbol: string;
  name: string;
  value: number | null;
  previousClose: number | null;
  change1dPct: number | null;
  change1dAbs: number | null;
  asOf: string | null;
};

export type MarketBriefRow = {
  date: string;
  lede: string | null;
  bullets: string[];
  watchThemes: Array<{ name: string; changePct: number }>;
  generatedAt: string | null;
};

export type HighlightRow = {
  id: string;
  kind: "earnings_brief" | "price_anomaly" | "indicator_shift" | "dividend_shift";
  subjectKind: "company" | "industry" | "theme" | "metric";
  subjectCode: string | null;
  subjectName: string;
  oneLiner: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  keyMetricPositive: boolean | null;
  source: string;
  publishedAt: string;
  publishedAtIso: string;
  relatedArticleSlug: string | null;
  asOf: string;
};

// ─────────────────────────────────────────────────────────
// 関数
// ─────────────────────────────────────────────────────────

/** display_order 昇順で全件 */
export async function listMarketIndices(db: DbClient): Promise<MarketIndexRow[]> {
  const rows = await db
    .select()
    .from(marketIndices)
    .orderBy(marketIndices.displayOrder)
    .all();
  return rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    value: r.value,
    previousClose: r.previousClose,
    change1dPct: r.change1dPct,
    change1dAbs: r.change1dAbs,
    asOf: r.asOf,
  }));
}

/** 当日 (= 最新) の market_brief を 1 件。無ければ null */
export async function findLatestMarketBrief(
  db: DbClient,
): Promise<MarketBriefRow | null> {
  const rows = await db
    .select()
    .from(marketBrief)
    .orderBy(desc(marketBrief.date))
    .limit(1)
    .all();
  const r = rows[0];
  if (!r) return null;
  return {
    date: r.date,
    lede: r.lede,
    bullets: parseJsonArray(r.bulletsJson),
    watchThemes: parseJsonArrayOf<{ name: string; changePct: number }>(r.watchThemesJson),
    generatedAt: r.generatedAt,
  };
}

/**
 * 最新のハイライトを score 降順で先頭 N 件。
 * 「最新の as_of」を内側 SQL で決め、その日付のものだけ返す。
 */
export async function listLatestHighlights(
  db: DbClient,
  limit = 8,
): Promise<HighlightRow[]> {
  const rows = await db
    .select()
    .from(homepageHighlights)
    .where(
      eq(
        homepageHighlights.asOf,
        sql`(SELECT MAX(as_of) FROM ${homepageHighlights})`,
      ),
    )
    .orderBy(desc(homepageHighlights.score))
    .limit(limit)
    .all();
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as HighlightRow["kind"],
    subjectKind: r.subjectKind as HighlightRow["subjectKind"],
    subjectCode: r.subjectCode,
    subjectName: r.subjectName,
    oneLiner: r.oneLiner,
    keyMetricLabel: r.keyMetricLabel,
    keyMetricValue: r.keyMetricValue,
    keyMetricPositive:
      r.keyMetricPositive == null ? null : r.keyMetricPositive === 1,
    source: r.source,
    publishedAt: r.publishedAt,
    publishedAtIso: r.publishedAtIso,
    relatedArticleSlug: r.relatedArticleSlug,
    asOf: r.asOf,
  }));
}

// ─────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────

function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonArrayOf<T>(json: string | null): T[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
