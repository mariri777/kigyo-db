import "server-only";

import { cache } from "react";
import { getDb } from "@/server/db/client";
import * as stockRepo from "@/server/repo/stockRepo";
import * as overlayRepo from "@/server/repo/overlayRepo";
import type { Stock } from "@/domain/types";
import { toBrief } from "./stockBriefs";

/**
 * AI 生成データ(オーバーレイ)を持つ全銘柄を一括で返す。
 *
 * N+1 解消の本丸:
 *   旧実装は 1 社ずつ getStock() を呼び、60 社 × 8 = ~480 クエリ + getCloudflareContext を
 *   60+ 回呼んでいた。本実装は IN 句で 1 + 1 + 8 = 10 クエリで完結する。
 *
 * 利用箇所: ホーム集計 / テーマランキング / 比較 / 類似計算の母集団。
 *
 * メモ化:
 *   React の `cache()` でラップし、同一リクエスト内での重複呼び出しを 1 回に集約する。
 *   例: /stocks/[code]/page.tsx と /stocks/[code]/page.tsx 内で表示される類似銘柄カードの
 *   両方が呼んでも、リクエスト毎に Drizzle クエリは 1 セットだけ走る。
 */
export const listOverlayStocks = cache(
  async function listOverlayStocks(): Promise<Stock[]> {
    const db = await getDb();

    const companyIds = await overlayRepo.listOverlayCompanyIds(db);
    if (companyIds.length === 0) return [];

    const stockRows = await stockRepo.listByCompanyIds(db, companyIds);
    if (stockRows.length === 0) return [];

    const [
      clusters,
      tagsByCo,
      segmentsByCo,
      insightsByCo,
      phaseByCo,
      factorByCo,
      valuationByCo,
    ] = await Promise.all([
      overlayRepo.listIndustryClusterNamesByCompanies(db, companyIds),
      overlayRepo.listBusinessTagsByCompanies(db, companyIds),
      overlayRepo.listSegmentsByCompanies(db, companyIds),
      overlayRepo.listInsightsByCompanies(db, companyIds),
      overlayRepo.listPhaseByCompanies(db, companyIds),
      overlayRepo.listFactorByCompanies(db, companyIds),
      overlayRepo.listValuationByCompanies(db, companyIds),
    ]);

    return stockRows.map((base): Stock => {
      const segments = segmentsByCo.get(base.companyId);
      const phase = phaseByCo.get(base.companyId);
      const factor = factorByCo.get(base.companyId);
      return {
        ...toBrief(base),
        description: base.description ?? "",
        oneLiner: base.oneLiner ?? "",
        industryCluster: clusters.get(base.companyId) ?? base.sectorTSE,
        tier: 3,
        roe: null,
        operatingMargin: null,
        revenueGrowth3y: null,
        tags: tagsByCo.get(base.companyId) ?? [],
        segments: segments?.list ?? [],
        segmentsPeriod: segments?.period ?? null,
        phaseScores: phase?.scores ?? null,
        phaseRationale: phase?.rationale ?? null,
        factorBetas: factor?.betas ?? null,
        factorPeriod: factor?.period ?? null,
        insights: insightsByCo.get(base.companyId) ?? [],
        valuationCall: valuationByCo.get(base.companyId) ?? null,
      };
    });
  },
);
