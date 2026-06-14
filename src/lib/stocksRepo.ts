/**
 * 銘柄リポジトリ層。Drizzle (Cloudflare D1) から StockBrief / Stock を組み立てる。
 *
 * - listStockBriefs() / getStockBrief(code) : 全銘柄(3,572 件)で取れる軽量型。stocks + companies JOIN 1 本。
 * - getStock(code) : 詳細型。tags/segments/insights/valuation 等を別クエリで取って合成する。
 *                     オーバーレイがない銘柄は最低限のフィールドで Stock 型を満たす。
 *
 * UI 側からは `import { listStockBriefs, getStockBrief, getStock } from "@/lib/stocksRepo"` で使う。
 */

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as s from "@/db/schema";
import type {
  BusinessTag,
  FactorBetas,
  Insight,
  PhaseScores,
  Segment,
  Source,
  Stock,
  StockBrief,
  TagDimension,
  ValuationCall,
} from "./types";

// ─── StockBrief ─────────────────────────────────────

export async function listStockBriefs(): Promise<StockBrief[]> {
  const db = getDb();
  const rows = await db
    .select({
      code: s.stocks.code,
      name: s.companies.name,
      nameEn: s.companies.nameEn,
      exchange: s.stocks.exchange,
      sectorTSE: s.stocks.sectorTSE,
      priceJpy: s.stocks.priceJpy,
      priceDate: s.stocks.priceDate,
      changePct: s.stocks.changePct,
      marketCapOku: s.stocks.marketCapOku,
      per: s.stocks.per,
      pbr: s.stocks.pbr,
      dividendYield: s.stocks.dividendYield,
    })
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId));
  return rows.map(toBrief);
}

export async function getStockBrief(code: string): Promise<StockBrief | null> {
  const db = getDb();
  const rows = await db
    .select({
      code: s.stocks.code,
      name: s.companies.name,
      nameEn: s.companies.nameEn,
      exchange: s.stocks.exchange,
      sectorTSE: s.stocks.sectorTSE,
      priceJpy: s.stocks.priceJpy,
      priceDate: s.stocks.priceDate,
      changePct: s.stocks.changePct,
      marketCapOku: s.stocks.marketCapOku,
      per: s.stocks.per,
      pbr: s.stocks.pbr,
      dividendYield: s.stocks.dividendYield,
    })
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .where(eq(s.stocks.code, code))
    .limit(1);
  return rows[0] ? toBrief(rows[0]) : null;
}

type BriefRow = {
  code: string;
  name: string;
  nameEn: string | null;
  exchange: "Prime" | "Standard" | "Growth";
  sectorTSE: string;
  priceJpy: number | null;
  priceDate: string | null;
  changePct: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
};

function toBrief(r: BriefRow): StockBrief {
  return {
    code: r.code,
    name: r.name,
    nameEn: r.nameEn ?? undefined,
    exchange: r.exchange,
    sectorTSE: r.sectorTSE,
    priceJpy: r.priceJpy ?? 0,
    priceDate: r.priceDate ?? "",
    changePct: r.changePct ?? 0,
    marketCapOku: r.marketCapOku ?? 0,
    per: r.per ?? 0,
    pbr: r.pbr ?? 0,
    dividendYield: r.dividendYield ?? 0,
  };
}

// ─── 詳細型を持つ銘柄(オーバーレイ済み)一覧 ───────────────
// AI 生成データ(insights/valuation/phase/factor)とタグ・セグメントを
// 持つ銘柄だけを返す。類似計算・テーマランキング・スクリーンで使う。

export async function listOverlayStocks(): Promise<Stock[]> {
  const db = getDb();
  // オーバーレイ済み = company_phase_scores に行がある企業
  const ids = (
    await db.select({ id: s.companyPhaseScores.companyId }).from(s.companyPhaseScores)
  ).map((r) => r.id);
  if (ids.length === 0) return [];

  const stockRows = await db
    .select({
      code: s.stocks.code,
    })
    .from(s.stocks)
    .where(inArray(s.stocks.companyId, ids));

  const stocks = await Promise.all(stockRows.map((r) => getStock(r.code)));
  return stocks.filter((x): x is Stock => x !== null);
}

// ─── Stock(詳細) ──────────────────────────────────

export async function getStock(code: string): Promise<Stock | null> {
  const db = getDb();
  const rows = await db
    .select({
      code: s.stocks.code,
      name: s.companies.name,
      nameEn: s.companies.nameEn,
      description: s.companies.description,
      oneLiner: s.companies.oneLiner,
      companyId: s.stocks.companyId,
      exchange: s.stocks.exchange,
      sectorTSE: s.stocks.sectorTSE,
      priceJpy: s.stocks.priceJpy,
      priceDate: s.stocks.priceDate,
      changePct: s.stocks.changePct,
      marketCapOku: s.stocks.marketCapOku,
      per: s.stocks.per,
      pbr: s.stocks.pbr,
      dividendYield: s.stocks.dividendYield,
    })
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .where(eq(s.stocks.code, code))
    .limit(1);

  if (!rows[0]) return null;
  const main = rows[0];

  // 並列で残りのテーブルを読む(D1 は単純な並列クエリで十分速い)
  const [
    industryClusterName,
    tags,
    segments,
    insights,
    phase,
    factor,
    valuation,
  ] = await Promise.all([
    fetchIndustryClusterName(main.companyId, main.sectorTSE),
    fetchBusinessTags(main.companyId),
    fetchSegments(main.companyId),
    fetchInsights(main.companyId),
    fetchPhaseScores(main.companyId),
    fetchFactorBetas(main.companyId),
    fetchValuationCall(main.companyId),
  ]);

  const brief = toBrief(main);
  return {
    ...brief,
    description: main.description ?? "",
    oneLiner: main.oneLiner ?? "",
    industryCluster: industryClusterName,
    tier: 3,
    roe: 0,
    operatingMargin: 0,
    revenueGrowth3y: 0,
    tags,
    segments: segments.list,
    segmentsPeriod: segments.period,
    phaseScores: phase.scores,
    phaseRationale: phase.rationale,
    factorBetas: factor.betas,
    factorPeriod: factor.period,
    insights,
    valuationCall: valuation,
  };
}

async function fetchIndustryClusterName(
  companyId: number,
  fallbackSectorTSE: string,
): Promise<string> {
  const db = getDb();
  const rows = await db
    .select({ name: s.industryClusters.name })
    .from(s.companyIndustryClusters)
    .innerJoin(
      s.industryClusters,
      eq(s.industryClusters.id, s.companyIndustryClusters.industryClusterId),
    )
    .where(eq(s.companyIndustryClusters.companyId, companyId))
    .limit(1);
  return rows[0]?.name ?? fallbackSectorTSE;
}

async function fetchBusinessTags(companyId: number): Promise<BusinessTag[]> {
  const db = getDb();
  const rows = await db
    .select({
      dimension: s.businessTags.dimension,
      value: s.businessTags.value,
      doc: s.sources.doc,
      page: s.sources.page,
      period: s.sources.period,
      url: s.sources.url,
    })
    .from(s.businessTags)
    .leftJoin(s.sources, eq(s.sources.id, s.businessTags.sourceId))
    .where(eq(s.businessTags.companyId, companyId));
  return rows.map((r) => ({
    dimension: r.dimension as TagDimension,
    value: r.value,
    source: sourceFrom(r),
  }));
}

async function fetchSegments(
  companyId: number,
): Promise<{ list: Segment[]; period: string }> {
  const db = getDb();
  const rows = await db
    .select({
      period: s.companySegments.period,
      name: s.companySegments.name,
      revenueOku: s.companySegments.revenueOku,
      share: s.companySegments.share,
      operatingMargin: s.companySegments.operatingMargin,
    })
    .from(s.companySegments)
    .where(eq(s.companySegments.companyId, companyId));
  const list: Segment[] = rows.map((r) => ({
    name: r.name,
    revenueOku: r.revenueOku ?? 0,
    share: r.share ?? 0,
    operatingMargin: r.operatingMargin ?? undefined,
  }));
  const period = rows[0]?.period ?? "";
  return { list, period };
}

async function fetchInsights(companyId: number): Promise<Insight[]> {
  const db = getDb();
  const insightRows = await db
    .select({
      id: s.companyInsights.id,
      title: s.companyInsights.title,
      lede: s.companyInsights.lede,
      body: s.companyInsights.body,
      generatedAt: s.companyInsights.generatedAt,
    })
    .from(s.companyInsights)
    .where(eq(s.companyInsights.companyId, companyId));
  if (insightRows.length === 0) return [];

  const ids = insightRows.map((i) => i.id);
  const srcRows = await db
    .select({
      insightId: s.insightSources.insightId,
      doc: s.sources.doc,
      page: s.sources.page,
      period: s.sources.period,
      url: s.sources.url,
    })
    .from(s.insightSources)
    .innerJoin(s.sources, eq(s.sources.id, s.insightSources.sourceId))
    .where(inArray(s.insightSources.insightId, ids));

  const citationsById = new Map<number, Source[]>();
  for (const r of srcRows) {
    const arr = citationsById.get(r.insightId) ?? [];
    arr.push(sourceFrom(r));
    citationsById.set(r.insightId, arr);
  }
  return insightRows.map((i) => ({
    title: i.title,
    lede: i.lede ?? undefined,
    body: i.body,
    citations: citationsById.get(i.id) ?? [],
    generatedAt: i.generatedAt,
  }));
}

async function fetchPhaseScores(
  companyId: number,
): Promise<{ scores: PhaseScores; rationale: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(s.companyPhaseScores)
    .where(eq(s.companyPhaseScores.companyId, companyId))
    .limit(1);
  const r = rows[0];
  return {
    scores: {
      launch: r?.launch ?? 0,
      expansion: r?.expansion ?? 0,
      mature: r?.mature ?? 0,
      decline: r?.decline ?? 0,
    },
    rationale: r?.rationale ?? "",
  };
}

async function fetchFactorBetas(
  companyId: number,
): Promise<{ betas: FactorBetas; period: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(s.companyFactorBetas)
    .where(eq(s.companyFactorBetas.companyId, companyId))
    .limit(1);
  const r = rows[0];
  return {
    betas: {
      usdjpy: r?.usdjpy ?? 0,
      us10y: r?.us10y ?? 0,
      oil: r?.oil ?? 0,
      sox: r?.sox ?? 0,
      china: r?.china ?? 0,
      market: r?.market ?? 0,
      size: r?.size ?? 0,
      value: r?.value ?? 0,
      momentum: r?.momentum ?? 0,
    },
    period: r?.period ?? "",
  };
}

async function fetchValuationCall(companyId: number): Promise<ValuationCall> {
  const db = getDb();
  const rows = await db
    .select({
      verdict: s.companyValuationCalls.verdict,
      score: s.companyValuationCalls.score,
      rationale: s.companyValuationCalls.rationale,
    })
    .from(s.companyValuationCalls)
    .where(eq(s.companyValuationCalls.companyId, companyId))
    .limit(1);
  const v = rows[0];
  if (!v) {
    return { verdict: "ほぼ妥当", score: 50, rationale: "", citations: [] };
  }
  const srcRows = await db
    .select({
      doc: s.sources.doc,
      page: s.sources.page,
      period: s.sources.period,
      url: s.sources.url,
    })
    .from(s.valuationSources)
    .innerJoin(s.sources, eq(s.sources.id, s.valuationSources.sourceId))
    .where(eq(s.valuationSources.companyId, companyId));
  return {
    verdict: v.verdict as ValuationCall["verdict"],
    score: v.score,
    rationale: v.rationale ?? "",
    citations: srcRows.map(sourceFrom),
  };
}

function sourceFrom(r: {
  doc: string | null;
  page: number | null;
  period: string | null;
  url: string | null;
}): Source {
  return {
    doc: r.doc ?? "",
    page: r.page ?? undefined,
    period: r.period ?? undefined,
    url: r.url ?? undefined,
  };
}
