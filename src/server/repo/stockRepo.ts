import "server-only";

import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";
import type { Exchange } from "@/domain/types";

/**
 * stocks + companies の JOIN 1 本。価格・指標は null 許容のまま返す。
 * 上位レイヤー(usecase)が domain 型へマッピングする。
 */
export type StockRow = {
  code: string;
  companyId: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  oneLiner: string | null;
  exchange: Exchange;
  sectorTSE: string;
  priceJpy: number | null;
  priceDate: string | null;
  changePct: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
};

const SELECT_COLUMNS = {
  code: s.stocks.code,
  companyId: s.stocks.companyId,
  name: s.companies.name,
  nameEn: s.companies.nameEn,
  description: s.companies.description,
  oneLiner: s.companies.oneLiner,
  exchange: s.stocks.exchange,
  sectorTSE: s.stocks.sectorTSE,
  priceJpy: s.stocks.priceJpy,
  priceDate: s.stocks.priceDate,
  changePct: s.stocks.changePct,
  marketCapOku: s.stocks.marketCapOku,
  per: s.stocks.per,
  pbr: s.stocks.pbr,
  dividendYield: s.stocks.dividendYield,
} as const;

export async function listAll(db: Db): Promise<StockRow[]> {
  return (await db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))) as StockRow[];
}

export async function findByCode(db: Db, code: string): Promise<StockRow | null> {
  const rows = (await db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .where(eq(s.stocks.code, code))
    .limit(1)) as StockRow[];
  return rows[0] ?? null;
}

export async function listByCompanyIds(
  db: Db,
  companyIds: number[],
): Promise<StockRow[]> {
  if (companyIds.length === 0) return [];
  return (await db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .where(inArray(s.stocks.companyId, companyIds))) as StockRow[];
}
