import "server-only";

import { eq, inArray } from "drizzle-orm";
import { chunkedFetch } from "@/server/db/helpers";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";
import type {
  BusinessTag,
  FactorBetas,
  Insight,
  PhaseScores,
  Segment,
  Source,
  TagDimension,
  ValuationCall,
  Verdict,
} from "@/domain/types";

/**
 * オーバーレイ層(AI 生成データ・タグ・セグメント)の I/O。
 *
 * 各リソースに 1 社版(getXxx)と複数社一括版(listXxxByCompanies)を用意する。
 *  - 1 社版: 銘柄詳細ページなど、特定の銘柄だけ深く取るとき
 *  - 一括版: テーマ/比較/類似の母集団用。1 社ずつ取ると N+1 で爆発するので必ずこちら
 */

function toSource(r: {
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

// ─── オーバーレイ済 company id ────────────────────

/** AI 生成データ(phase score)を持つ企業 = オーバーレイ済とみなす。 */
export async function listOverlayCompanyIds(db: Db): Promise<number[]> {
  const rows = await db
    .select({ id: s.companyPhaseScores.companyId })
    .from(s.companyPhaseScores);
  return rows.map((r) => r.id);
}

// ─── industry cluster ─────────────────────────────

export async function getIndustryClusterName(
  db: Db,
  companyId: number,
): Promise<string | null> {
  const rows = await db
    .select({ name: s.industryClusters.name })
    .from(s.companyIndustryClusters)
    .innerJoin(
      s.industryClusters,
      eq(s.industryClusters.id, s.companyIndustryClusters.industryClusterId),
    )
    .where(eq(s.companyIndustryClusters.companyId, companyId))
    .limit(1);
  return rows[0]?.name ?? null;
}

export async function listIndustryClusterNamesByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, string>> {
  const rows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        companyId: s.companyIndustryClusters.companyId,
        name: s.industryClusters.name,
      })
      .from(s.companyIndustryClusters)
      .innerJoin(
        s.industryClusters,
        eq(s.industryClusters.id, s.companyIndustryClusters.industryClusterId),
      )
      .where(inArray(s.companyIndustryClusters.companyId, chunk)),
  );
  const out = new Map<number, string>();
  for (const r of rows) if (!out.has(r.companyId)) out.set(r.companyId, r.name);
  return out;
}

// ─── business tags ────────────────────────────────

export async function getBusinessTags(
  db: Db,
  companyId: number,
): Promise<BusinessTag[]> {
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
    source: toSource(r),
  }));
}

export async function listBusinessTagsByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, BusinessTag[]>> {
  const rows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        companyId: s.businessTags.companyId,
        dimension: s.businessTags.dimension,
        value: s.businessTags.value,
        doc: s.sources.doc,
        page: s.sources.page,
        period: s.sources.period,
        url: s.sources.url,
      })
      .from(s.businessTags)
      .leftJoin(s.sources, eq(s.sources.id, s.businessTags.sourceId))
      .where(inArray(s.businessTags.companyId, chunk)),
  );
  const out = new Map<number, BusinessTag[]>();
  for (const r of rows) {
    const tag: BusinessTag = {
      dimension: r.dimension as TagDimension,
      value: r.value,
      source: toSource(r),
    };
    const list = out.get(r.companyId);
    if (list) list.push(tag);
    else out.set(r.companyId, [tag]);
  }
  return out;
}

// ─── segments ─────────────────────────────────────

export type SegmentsBundle = { list: Segment[]; period: string | null };

export async function getSegments(
  db: Db,
  companyId: number,
): Promise<SegmentsBundle> {
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
  return {
    list: rows.map((r) => ({
      name: r.name,
      revenueOku: r.revenueOku ?? 0,
      share: r.share ?? 0,
      operatingMargin: r.operatingMargin ?? undefined,
    })),
    period: rows[0]?.period ?? null,
  };
}

export async function listSegmentsByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, SegmentsBundle>> {
  const rows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        companyId: s.companySegments.companyId,
        period: s.companySegments.period,
        name: s.companySegments.name,
        revenueOku: s.companySegments.revenueOku,
        share: s.companySegments.share,
        operatingMargin: s.companySegments.operatingMargin,
      })
      .from(s.companySegments)
      .where(inArray(s.companySegments.companyId, chunk)),
  );
  const out = new Map<number, SegmentsBundle>();
  for (const r of rows) {
    const seg: Segment = {
      name: r.name,
      revenueOku: r.revenueOku ?? 0,
      share: r.share ?? 0,
      operatingMargin: r.operatingMargin ?? undefined,
    };
    const existing = out.get(r.companyId);
    if (existing) existing.list.push(seg);
    else out.set(r.companyId, { list: [seg], period: r.period });
  }
  return out;
}

// ─── insights ─────────────────────────────────────

export async function getInsights(
  db: Db,
  companyId: number,
): Promise<Insight[]> {
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
  const srcRows = await chunkedFetch(ids, (chunk) =>
    db
      .select({
        insightId: s.insightSources.insightId,
        doc: s.sources.doc,
        page: s.sources.page,
        period: s.sources.period,
        url: s.sources.url,
      })
      .from(s.insightSources)
      .innerJoin(s.sources, eq(s.sources.id, s.insightSources.sourceId))
      .where(inArray(s.insightSources.insightId, chunk)),
  );

  const citationsById = new Map<number, Source[]>();
  for (const r of srcRows) {
    const list = citationsById.get(r.insightId);
    const src = toSource(r);
    if (list) list.push(src);
    else citationsById.set(r.insightId, [src]);
  }
  return insightRows.map((i) => ({
    title: i.title,
    lede: i.lede ?? undefined,
    body: i.body,
    citations: citationsById.get(i.id) ?? [],
    generatedAt: i.generatedAt,
  }));
}

export async function listInsightsByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, Insight[]>> {
  const insightRows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        id: s.companyInsights.id,
        companyId: s.companyInsights.companyId,
        title: s.companyInsights.title,
        lede: s.companyInsights.lede,
        body: s.companyInsights.body,
        generatedAt: s.companyInsights.generatedAt,
      })
      .from(s.companyInsights)
      .where(inArray(s.companyInsights.companyId, chunk)),
  );
  if (insightRows.length === 0) return new Map();

  const insightIds = insightRows.map((i) => i.id);
  const srcRows = await chunkedFetch(insightIds, (chunk) =>
    db
      .select({
        insightId: s.insightSources.insightId,
        doc: s.sources.doc,
        page: s.sources.page,
        period: s.sources.period,
        url: s.sources.url,
      })
      .from(s.insightSources)
      .innerJoin(s.sources, eq(s.sources.id, s.insightSources.sourceId))
      .where(inArray(s.insightSources.insightId, chunk)),
  );

  const citationsById = new Map<number, Source[]>();
  for (const r of srcRows) {
    const list = citationsById.get(r.insightId);
    const src = toSource(r);
    if (list) list.push(src);
    else citationsById.set(r.insightId, [src]);
  }

  const out = new Map<number, Insight[]>();
  for (const i of insightRows) {
    const insight: Insight = {
      title: i.title,
      lede: i.lede ?? undefined,
      body: i.body,
      citations: citationsById.get(i.id) ?? [],
      generatedAt: i.generatedAt,
    };
    const list = out.get(i.companyId);
    if (list) list.push(insight);
    else out.set(i.companyId, [insight]);
  }
  return out;
}

// ─── phase scores ──────────────────────────────────

export type PhaseBundle = { scores: PhaseScores; rationale: string };

export async function getPhase(
  db: Db,
  companyId: number,
): Promise<PhaseBundle | null> {
  const rows = await db
    .select()
    .from(s.companyPhaseScores)
    .where(eq(s.companyPhaseScores.companyId, companyId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    scores: {
      launch: r.launch,
      expansion: r.expansion,
      mature: r.mature,
      decline: r.decline,
    },
    rationale: r.rationale ?? "",
  };
}

export async function listPhaseByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, PhaseBundle>> {
  const rows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select()
      .from(s.companyPhaseScores)
      .where(inArray(s.companyPhaseScores.companyId, chunk)),
  );
  const out = new Map<number, PhaseBundle>();
  for (const r of rows) {
    out.set(r.companyId, {
      scores: {
        launch: r.launch,
        expansion: r.expansion,
        mature: r.mature,
        decline: r.decline,
      },
      rationale: r.rationale ?? "",
    });
  }
  return out;
}

// ─── factor betas ──────────────────────────────────

export type FactorBundle = { betas: FactorBetas; period: string | null };

export async function getFactor(
  db: Db,
  companyId: number,
): Promise<FactorBundle | null> {
  const rows = await db
    .select()
    .from(s.companyFactorBetas)
    .where(eq(s.companyFactorBetas.companyId, companyId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    betas: {
      usdjpy: r.usdjpy,
      us10y: r.us10y,
      oil: r.oil,
      sox: r.sox,
      china: r.china,
      market: r.market,
      size: r.size,
      value: r.value,
      momentum: r.momentum,
    },
    period: r.period ?? null,
  };
}

export async function listFactorByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, FactorBundle>> {
  const rows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select()
      .from(s.companyFactorBetas)
      .where(inArray(s.companyFactorBetas.companyId, chunk)),
  );
  const out = new Map<number, FactorBundle>();
  for (const r of rows) {
    out.set(r.companyId, {
      betas: {
        usdjpy: r.usdjpy,
        us10y: r.us10y,
        oil: r.oil,
        sox: r.sox,
        china: r.china,
        market: r.market,
        size: r.size,
        value: r.value,
        momentum: r.momentum,
      },
      period: r.period ?? null,
    });
  }
  return out;
}

// ─── valuation calls ───────────────────────────────

export async function getValuation(
  db: Db,
  companyId: number,
): Promise<ValuationCall | null> {
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
  if (!v) return null;
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
    verdict: v.verdict as Verdict,
    score: v.score,
    rationale: v.rationale ?? "",
    citations: srcRows.map(toSource),
  };
}

export async function listValuationByCompanies(
  db: Db,
  companyIds: number[],
): Promise<Map<number, ValuationCall>> {
  const valRows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        companyId: s.companyValuationCalls.companyId,
        verdict: s.companyValuationCalls.verdict,
        score: s.companyValuationCalls.score,
        rationale: s.companyValuationCalls.rationale,
      })
      .from(s.companyValuationCalls)
      .where(inArray(s.companyValuationCalls.companyId, chunk)),
  );
  if (valRows.length === 0) return new Map();

  const srcRows = await chunkedFetch(companyIds, (chunk) =>
    db
      .select({
        companyId: s.valuationSources.companyId,
        doc: s.sources.doc,
        page: s.sources.page,
        period: s.sources.period,
        url: s.sources.url,
      })
      .from(s.valuationSources)
      .innerJoin(s.sources, eq(s.sources.id, s.valuationSources.sourceId))
      .where(inArray(s.valuationSources.companyId, chunk)),
  );

  const sourcesByCompany = new Map<number, Source[]>();
  for (const r of srcRows) {
    const list = sourcesByCompany.get(r.companyId);
    const src = toSource(r);
    if (list) list.push(src);
    else sourcesByCompany.set(r.companyId, [src]);
  }

  const out = new Map<number, ValuationCall>();
  for (const v of valRows) {
    out.set(v.companyId, {
      verdict: v.verdict as Verdict,
      score: v.score,
      rationale: v.rationale ?? "",
      citations: sourcesByCompany.get(v.companyId) ?? [],
    });
  }
  return out;
}
