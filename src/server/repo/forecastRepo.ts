/**
 * AI 予測 (stock 型) のデータアクセス層。
 *
 * 対象テーブル:
 *   - forecasts            1 予測 1 行
 *   - forecast_takes       本文段落 (kind: macro/technical/sentiment/bull/bear/key-data)
 *   - forecast_scenarios   base / bull / bear の 3 シナリオ
 *   - forecast_shifts      確率推移 (スパークライン用)
 *
 * トップは未解決の最新 N 件、一覧は live + resolved を混ぜて返す。
 */
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import {
  forecastScenarios,
  forecastShifts,
  forecastTakes,
  forecasts,
} from "@/server/db/schema";
import type { Db as DbClient } from "@/server/db/client";

// ─────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────

export type ForecastSummary = {
  id: number;
  targetSymbol: string;
  targetName: string;
  targetKind: "global-index" | "jp-stock" | "fx" | "commodity";
  question: string;
  headline: string;
  lede: string;
  probability: number;
  confidence: "low" | "med" | "high";
  resolveAt: string;
  referencePrice: number | null;
  status: "live" | "resolved" | "archived";
  outcome: "up" | "down" | "flat" | null;
  outcomePrice: number | null;
  outcomeAt: string | null;
  closingNote: string | null;
  generatedAt: string;
  updatedAt: string;
  shifts: ForecastShiftPoint[];
};

export type ForecastShiftPoint = {
  at: string;
  probability: number;
};

export type ForecastTake = {
  kind: "macro" | "technical" | "sentiment" | "bull" | "bear" | "key-data" | "contrarian";
  position: number;
  heading: string;
  body: string;
  bias: "up" | "down" | "neutral";
};

export type ForecastScenario = {
  kind: "base" | "bull" | "bear";
  label: string;
  probability: number;
  priceLow: number | null;
  priceHigh: number | null;
  note: string;
};

export type ForecastDetail = ForecastSummary & {
  takes: ForecastTake[];
  scenarios: ForecastScenario[];
};

// ─────────────────────────────────────────────────────────
// 関数
// ─────────────────────────────────────────────────────────

/**
 * トップページ用: 未解決 (live + resolveAt が未来) の最新 N 件。
 * 各予測の直近 4 件の forecast_shifts も同梱する。
 */
export async function listLatestLiveForecasts(
  db: DbClient,
  limit = 2,
): Promise<ForecastSummary[]> {
  const nowIso = new Date().toISOString();
  const rows = await db
    .select()
    .from(forecasts)
    .where(
      and(
        eq(forecasts.status, "live"),
        gte(forecasts.resolveAt, nowIso),
      ),
    )
    .orderBy(forecasts.resolveAt)
    .limit(limit)
    .all();
  if (rows.length === 0) return [];

  const summaries: ForecastSummary[] = [];
  for (const r of rows) {
    const shifts = await fetchShifts(db, r.id, 4);
    summaries.push(rowToSummary(r, shifts));
  }
  return summaries;
}

/**
 * 一覧ページ用: 全件 (live → resolved → archived 順)。
 * 同じ resolveAt は新しいものが上に来る。
 */
export async function listAllForecasts(
  db: DbClient,
  limit = 60,
): Promise<ForecastSummary[]> {
  const rows = await db
    .select()
    .from(forecasts)
    .orderBy(
      // live を上、resolved を下、archived はその下
      sql`CASE ${forecasts.status} WHEN 'live' THEN 0 WHEN 'resolved' THEN 1 ELSE 2 END`,
      desc(forecasts.resolveAt),
    )
    .limit(limit)
    .all();
  const out: ForecastSummary[] = [];
  for (const r of rows) {
    const shifts = await fetchShifts(db, r.id, 8);
    out.push(rowToSummary(r, shifts));
  }
  return out;
}

/** 詳細ページ用。takes / scenarios / shifts 全部入り */
export async function findForecastDetail(
  db: DbClient,
  id: number,
): Promise<ForecastDetail | null> {
  const rows = await db.select().from(forecasts).where(eq(forecasts.id, id)).all();
  const r = rows[0];
  if (!r) return null;

  const [takesRaw, scenariosRaw, shifts] = await Promise.all([
    db
      .select()
      .from(forecastTakes)
      .where(eq(forecastTakes.forecastId, id))
      .orderBy(asc(forecastTakes.kind), asc(forecastTakes.position))
      .all(),
    db
      .select()
      .from(forecastScenarios)
      .where(eq(forecastScenarios.forecastId, id))
      .orderBy(asc(forecastScenarios.kind))
      .all(),
    fetchShifts(db, id, 24),
  ]);

  const summary = rowToSummary(r, shifts);
  return {
    ...summary,
    takes: takesRaw.map((t) => ({
      kind: t.kind as ForecastTake["kind"],
      position: t.position,
      heading: t.heading,
      body: t.body,
      bias: t.bias as ForecastTake["bias"],
    })),
    scenarios: scenariosRaw.map((s) => ({
      kind: s.kind as ForecastScenario["kind"],
      label: s.label,
      probability: s.probability,
      priceLow: s.priceLow,
      priceHigh: s.priceHigh,
      note: s.note,
    })),
  };
}

/** 同じ指数の過去予測 (resolved を中心に) を id と一緒に返す */
export async function listForecastsByTarget(
  db: DbClient,
  targetSymbol: string,
  limit = 12,
): Promise<ForecastSummary[]> {
  const rows = await db
    .select()
    .from(forecasts)
    .where(eq(forecasts.targetSymbol, targetSymbol))
    .orderBy(desc(forecasts.resolveAt))
    .limit(limit)
    .all();
  const out: ForecastSummary[] = [];
  for (const r of rows) {
    const shifts = await fetchShifts(db, r.id, 4);
    out.push(rowToSummary(r, shifts));
  }
  return out;
}

// ─────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────

async function fetchShifts(
  db: DbClient,
  forecastId: number,
  limit: number,
): Promise<ForecastShiftPoint[]> {
  const rows = await db
    .select({ at: forecastShifts.at, probability: forecastShifts.probability })
    .from(forecastShifts)
    .where(eq(forecastShifts.forecastId, forecastId))
    .orderBy(desc(forecastShifts.at))
    .limit(limit)
    .all();
  // 古い順に並べ替えてスパークラインに使えるように
  return rows.reverse();
}

function rowToSummary(
  r: typeof forecasts.$inferSelect,
  shifts: ForecastShiftPoint[],
): ForecastSummary {
  return {
    id: r.id,
    targetSymbol: r.targetSymbol,
    targetName: r.targetName,
    targetKind: r.targetKind as ForecastSummary["targetKind"],
    question: r.question,
    headline: r.headline,
    lede: r.lede,
    probability: r.probability,
    confidence: r.confidence as ForecastSummary["confidence"],
    resolveAt: r.resolveAt,
    referencePrice: r.referencePrice,
    status: r.status as ForecastSummary["status"],
    outcome: r.outcome as ForecastSummary["outcome"],
    outcomePrice: r.outcomePrice,
    outcomeAt: r.outcomeAt,
    closingNote: r.closingNote,
    generatedAt: r.generatedAt,
    updatedAt: r.updatedAt,
    shifts,
  };
}
