import "server-only";

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

/** 全銘柄(3,572 件)の軽量型を返す。1 クエリ。 */
export async function listStockBriefs(): Promise<StockBrief[]> {
  const db = await getDb();
  const rows = await stockRepo.listAll(db);
  return rows.map(toBrief);
}

export async function getStockBrief(code: string): Promise<StockBrief | null> {
  const db = await getDb();
  const r = await stockRepo.findByCode(db, code);
  return r ? toBrief(r) : null;
}
