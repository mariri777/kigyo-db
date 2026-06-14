import "server-only";

/**
 * D1(Cloudflare の SQLite)は prepared statement あたりのバインド変数を 100 個までしか
 * 受け付けない。101 件以上を `inArray(col, ids)` に渡すと
 * `D1_ERROR: Failed to parse body as JSON, got: Error: internal error`
 * が返る。
 *
 * 回避策として、id 配列を 80 件ずつチャンクに分け、各チャンクで並列にクエリを
 * 発行して結果を結合する。クエリは複数発行されるが Promise.all で並列なので
 * 体感の遅延は 1 発と同じ。
 *
 * SQL を hack しないので Drizzle の型は壊れず、将来 Postgres に移行しても無修正。
 */

const D1_PARAM_LIMIT = 100;
/** バインド変数は id 用以外にも消費される(WHERE 句の他カラム等)ので少し余裕を取る */
export const DEFAULT_IN_CHUNK = 80;

export function chunked<T>(arr: T[], size = DEFAULT_IN_CHUNK): T[][] {
  if (size <= 0 || size > D1_PARAM_LIMIT) {
    throw new Error(`chunk size must be in (0, ${D1_PARAM_LIMIT}], got ${size}`);
  }
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * 「id 配列を渡して行集合を取る」クエリを D1 のパラメータ上限を超えないように
 * チャンクに分けて並列発行する小さなヘルパ。
 *
 * @example
 *   const rows = await chunkedFetch(ids, (chunk) =>
 *     db.select().from(s.tags).where(inArray(s.tags.companyId, chunk))
 *   );
 */
export async function chunkedFetch<TId extends string | number, TRow>(
  ids: TId[],
  fetcher: (chunk: TId[]) => Promise<TRow[]>,
  chunkSize: number = DEFAULT_IN_CHUNK,
): Promise<TRow[]> {
  if (ids.length === 0) return [];
  if (ids.length <= chunkSize) return fetcher(ids);
  const chunks = chunked(ids, chunkSize);
  const results = await Promise.all(chunks.map(fetcher));
  return results.flat();
}
