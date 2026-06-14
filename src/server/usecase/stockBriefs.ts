import "server-only";

import { cache } from "react";
import { getDb } from "@/server/db/client";
import * as stockRepo from "@/server/repo/stockRepo";
import type { StockRow } from "@/server/repo/stockRepo";
import type { StockBrief } from "@/domain/types";

export function toBrief(r: StockRow): StockBrief {
  return {
    code: r.code,
    name: r.name,
    nameEn: r.nameEn ?? undefined,
    exchange: r.exchange,
    sectorTSE: r.sectorTSE,
    priceJpy: r.priceJpy,
    priceDate: r.priceDate,
    changePct: r.changePct,
    marketCapOku: r.marketCapOku,
    per: r.per,
    pbr: r.pbr,
    dividendYield: r.dividendYield,
  };
}

/**
 * 全銘柄(3,572 件)の軽量型を返す。stocks + companies の単一 JOIN。
 * 同一リクエスト内での重複呼び出しを React.cache で集約する。
 */
export const listStockBriefs = cache(
  async function listStockBriefs(): Promise<StockBrief[]> {
    const db = await getDb();
    const rows = await stockRepo.listAll(db);
    return rows.map(toBrief);
  },
);

export const getStockBrief = cache(
  async function getStockBrief(code: string): Promise<StockBrief | null> {
    const db = await getDb();
    const r = await stockRepo.findByCode(db, code);
    return r ? toBrief(r) : null;
  },
);

/**
 * 複数銘柄コードを 1 クエリで解決する。コード順に並んだ StockBrief 配列を返す。
 * blog/[slug] や stock 詳細ページの「関連銘柄チップ」のために使う。
 */
export const getStockBriefsByCodes = cache(
  async function getStockBriefsByCodes(codes: string[]): Promise<StockBrief[]> {
    if (codes.length === 0) return [];
    const db = await getDb();
    const rows = await stockRepo.listByCodes(db, codes);
    return rows.map(toBrief);
  },
);

/**
 * /stocks 一覧と /api/stocks ペジネーション用。
 * 業界 slug → 銘柄コードの解決は呼び出し側(industries.ts の subClusters)で行う。
 */
export async function listStockBriefsPaginated(opts: {
  codes?: string[];
  sortKey: stockRepo.StockSortKey;
  sortDir: stockRepo.StockSortDir;
  offset: number;
  limit: number;
}): Promise<StockBrief[]> {
  const db = await getDb();
  const rows = await stockRepo.listPaginated(db, opts);
  return rows.map(toBrief);
}
