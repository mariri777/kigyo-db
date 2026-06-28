/**
 * /articles 詳細ページ用のサーバサイドデータ取得。
 * - 銘柄コードリストから TickerSnapshot を作る
 */
import "server-only";

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  companies,
  stocks,
  stockSnapshot,
} from "@/server/db/schema";
import type { TickerSnapshot } from "./contentRenderer";

export async function loadTickerSnapshots(
  codes: string[],
): Promise<Record<string, TickerSnapshot>> {
  if (codes.length === 0) return {};
  const db = await getDb();
  const rows = await db
    .select({
      code: stocks.code,
      name: companies.name,
      logoColor: companies.logoColor,
      priceJpy: stockSnapshot.priceJpy,
      changePct: stockSnapshot.change1dPct,
      marketCapOku: stockSnapshot.marketCapOku,
      per: stockSnapshot.per,
    })
    .from(stocks)
    .innerJoin(companies, eq(stocks.companyId, companies.id))
    .leftJoin(stockSnapshot, eq(stockSnapshot.code, stocks.code))
    .where(inArray(stocks.code, codes))
    .all();

  const map: Record<string, TickerSnapshot> = {};
  for (const r of rows) {
    map[r.code] = {
      code: r.code,
      name: r.name,
      href: `/stocks/${r.code}`,
      initial: r.name.slice(0, 1),
      logoColor: r.logoColor ?? "#404040",
      priceAtPublish: r.priceJpy != null ? `¥${r.priceJpy.toLocaleString()}` : null,
      changeAtPublish:
        r.changePct != null
          ? `${r.changePct >= 0 ? "+" : ""}${r.changePct.toFixed(1)}%`
          : null,
      positive: r.changePct != null ? r.changePct >= 0 : null,
      marketCap: fmtOku(r.marketCapOku),
      per: r.per != null ? `${r.per.toFixed(1)}倍` : null,
      note: null,
    };
  }
  return map;
}

function fmtOku(oku: number | null): string | null {
  if (oku == null) return null;
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆円`;
  return `${oku.toLocaleString()}億円`;
}
