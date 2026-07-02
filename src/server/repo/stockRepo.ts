import "server-only";

import { desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { chunkedFetch } from "@/server/db/helpers";
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
  sectorTSE: s.stocks.sectorTse,
  priceJpy: s.stockSnapshot.priceJpy,
  priceDate: s.stockSnapshot.priceDate,
  changePct: s.stockSnapshot.change1dPct,
  marketCapOku: s.stockSnapshot.marketCapOku,
  per: s.stockSnapshot.per,
  pbr: s.stockSnapshot.pbr,
  dividendYield: s.stockSnapshot.dividendYield,
} as const;

export async function listAll(db: Db): Promise<StockRow[]> {
  return (await db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))) as StockRow[];
}

export async function findByCode(db: Db, code: string): Promise<StockRow | null> {
  const rows = (await db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))
    .where(eq(s.stocks.code, code))
    .limit(1)) as StockRow[];
  return rows[0] ?? null;
}

export async function listByCompanyIds(
  db: Db,
  companyIds: number[],
): Promise<StockRow[]> {
  return chunkedFetch(companyIds, (chunk) =>
    db
      .select(SELECT_COLUMNS)
      .from(s.stocks)
      .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
      .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))
      .where(inArray(s.stocks.companyId, chunk)) as unknown as Promise<StockRow[]>,
  );
}

/**
 * 銘柄コードの配列から StockRow[] を一括取得する。
 * D1 のパラメータ上限を避けるため chunkedFetch を経由する。
 * 並び順は code の渡された順を保証する。
 */
export async function listByCodes(
  db: Db,
  codes: string[],
): Promise<StockRow[]> {
  if (codes.length === 0) return [];
  const rows = await chunkedFetch(codes, (chunk) =>
    db
      .select(SELECT_COLUMNS)
      .from(s.stocks)
      .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
      .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))
      .where(inArray(s.stocks.code, chunk)) as unknown as Promise<StockRow[]>,
  );
  // 呼び出し側で order が壊れないように、引数の codes 順に整列する
  const map = new Map(rows.map((r) => [r.code, r]));
  return codes
    .map((c) => map.get(c))
    .filter((r): r is StockRow => r != null);
}

/**
 * /stocks 一覧のページネーション付き取得。
 *
 * 仕様:
 *  - companyIds による業界フィルタ(undefined なら全件対象)
 *  - sort はホワイトリスト方式で SQL に渡す(キー名で異常値を弾く)
 *  - 価格・PER 等は NULL を最後尾に回すため `IS NULL` で並べ替え軸を補正
 */
export type StockSortKey =
  | "code"
  | "priceJpy"
  | "marketCapOku"
  | "per"
  | "pbr"
  | "dividendYield";
export type StockSortDir = "asc" | "desc";

const SORT_COLUMN = {
  code: s.stocks.code,
  priceJpy: s.stockSnapshot.priceJpy,
  marketCapOku: s.stockSnapshot.marketCapOku,
  per: s.stockSnapshot.per,
  pbr: s.stockSnapshot.pbr,
  dividendYield: s.stockSnapshot.dividendYield,
} as const satisfies Record<StockSortKey, unknown>;

export async function listPaginated(
  db: Db,
  opts: {
    /** 銘柄コードによる絞り込み。undefined なら全件対象。 */
    codes?: string[];
    sortKey: StockSortKey;
    sortDir: StockSortDir;
    offset: number;
    limit: number;
  },
): Promise<StockRow[]> {
  const col = SORT_COLUMN[opts.sortKey];
  const nullsLastExpr = sql`${col} IS NULL`;
  const directionExpr =
    opts.sortDir === "asc" ? sql`${col} asc` : sql`${col} desc`;

  const baseQuery = db
    .select(SELECT_COLUMNS)
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))
    .orderBy(nullsLastExpr, directionExpr)
    .limit(opts.limit)
    .offset(opts.offset);

  if (opts.codes && opts.codes.length > 0) {
    // codes は最大数十件想定(業界フィルタ後の銘柄)。D1 の 100 パラメータ
    // 上限内で十分捌けるためチャンク化は不要。
    return (await baseQuery.where(
      inArray(s.stocks.code, opts.codes),
    )) as StockRow[];
  }
  return (await baseQuery) as StockRow[];
}

/**
 * SearchBox 用の軽量検索。
 *  - 銘柄コード: 前方一致(`q%`)
 *  - 企業名(和)/英名/業種: 部分一致(`%q%`)
 *  - 大文字小文字を無視するため LOWER 比較
 *  - 必要なカラムだけ返して payload を最小化
 *  - 件数上限はデフォルト 12 件。CDN にキャッシュさせる前提なので軽量。
 */
export type SearchHit = {
  code: string;
  name: string;
  nameEn: string | null;
  sectorTSE: string;
};

export async function search(
  db: Db,
  query: string,
  limit = 12,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const lower = q.toLowerCase();
  const partial = `%${lower}%`;
  const prefix = `${lower}%`;

  // 関連度ランク: 小さいほど上位。
  //   0: 証券コード完全一致
  //   1: 証券コード前方一致
  //   2: 社名(和/英)前方一致
  //   3: それ以外の部分一致(業種ヒットなど)
  const codeLower = sql`lower(${s.stocks.code})`;
  const nameLower = sql`lower(${s.companies.name})`;
  const nameEnLower = sql`lower(${s.companies.nameEn})`;
  const rank = sql<number>`
    case
      when ${codeLower} = ${lower} then 0
      when ${codeLower} like ${prefix} then 1
      when ${nameLower} like ${prefix} or ${nameEnLower} like ${prefix} then 2
      else 3
    end
  `;

  const rows = await db
    .select({
      code: s.stocks.code,
      name: s.companies.name,
      nameEn: s.companies.nameEn,
      sectorTSE: s.stocks.sectorTse,
    })
    .from(s.stocks)
    .innerJoin(s.companies, eq(s.companies.id, s.stocks.companyId))
    .leftJoin(s.stockSnapshot, eq(s.stockSnapshot.code, s.stocks.code))
    .where(
      or(
        like(codeLower, prefix),
        like(nameLower, partial),
        like(nameEnLower, partial),
        like(sql`lower(${s.stocks.sectorTse})`, partial),
      ),
    )
    // 関連度 → 同ランク内は時価総額降順(NULL は末尾)
    .orderBy(rank, sql`${s.stockSnapshot.marketCapOku} is null`, desc(s.stockSnapshot.marketCapOku))
    .limit(limit);
  return rows;
}
