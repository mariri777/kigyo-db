import "server-only";

import { getDb } from "@/server/db/client";
import * as stockRepo from "@/server/repo/stockRepo";
import * as overlayRepo from "@/server/repo/overlayRepo";
import type { Stock } from "@/domain/types";
import { toBrief } from "./stockBriefs";

/**
 * 1 銘柄の詳細を返す。基本行 1 クエリ + オーバーレイ 7 並列クエリ。
 *
 * オーバーレイ無し銘柄(全 3,572 中 ~60 社以外)は、tags/segments/insights=[],
 * phaseScores/factorBetas/valuationCall=null で返す。UI で「データ未取得」と表示する。
 */
export async function getStockDetail(code: string): Promise<Stock | null> {
  const db = await getDb();
  const base = await stockRepo.findByCode(db, code);
  if (!base) return null;

  const [
    industryCluster,
    tags,
    segments,
    insights,
    phase,
    factor,
    valuation,
  ] = await Promise.all([
    overlayRepo.getIndustryClusterName(db, base.companyId),
    overlayRepo.getBusinessTags(db, base.companyId),
    overlayRepo.getSegments(db, base.companyId),
    overlayRepo.getInsights(db, base.companyId),
    overlayRepo.getPhase(db, base.companyId),
    overlayRepo.getFactor(db, base.companyId),
    overlayRepo.getValuation(db, base.companyId),
  ]);

  return {
    ...toBrief(base),
    description: base.description ?? "",
    oneLiner: base.oneLiner ?? "",
    industryCluster: industryCluster ?? base.sectorTSE,
    tier: 3,
    roe: null,
    operatingMargin: null,
    revenueGrowth3y: null,
    tags,
    segments: segments.list,
    segmentsPeriod: segments.period,
    phaseScores: phase?.scores ?? null,
    phaseRationale: phase?.rationale ?? null,
    factorBetas: factor?.betas ?? null,
    factorPeriod: factor?.period ?? null,
    insights,
    valuationCall: valuation,
  };
}
