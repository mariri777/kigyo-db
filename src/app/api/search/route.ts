// SearchBox(client component)が起動・入力ごとに叩く検索 API。
//
// 設計意図:
//   - 旧実装は layout.tsx で 3,572 銘柄の検索インデックスを HTML に直埋めしていた
//     (gzip 後 30-40KB が全ページに乗る、Worker CPU の浪費)。
//   - 都度検索方式に切り替えてインデックスを HTML から完全に剥がす。
//   - SearchBox 側で 200ms debounce + AbortController を入れて、
//     キー入力ごとの過剰リクエストを抑える。
//
// キャッシュ:
//   - 同じ q の結果は Workers Cache API(Cloudflare の PoP キャッシュ)で
//     5 分間共有する。Cache-Control ヘッダだけでは Workers のレスポンスは
//     自動キャッシュされないので、withEdgeCache で明示的に保存する。
//   - 1 日(86400 秒)は stale-while-revalidate として古い結果を返しつつ
//     裏で更新する。価格は検索結果に含まれないため十分新鮮。

import { getDb } from "@/server/db/client";
import { search as searchStocks, type SearchHit } from "@/server/repo/stockRepo";
import { withEdgeCache } from "@/server/cache";

// D1 へ毎リクエストアクセスするため、build 時の static 生成は不可
export const dynamic = "force-dynamic";

const MAX_QUERY_LEN = 64;
const RESULT_LIMIT = 12;
const CACHE_TTL_SEC = 300;

export async function GET(request: Request): Promise<Response> {
  return withEdgeCache(
    request,
    async () => {
      const url = new URL(request.url);
      const raw = url.searchParams.get("q") ?? "";
      const q = raw.trim().slice(0, MAX_QUERY_LEN);
      if (q.length === 0) {
        return Response.json({ results: [] satisfies SearchHit[] });
      }
      const db = await getDb();
      const results = await searchStocks(db, q, RESULT_LIMIT);
      return Response.json({ results });
    },
    CACHE_TTL_SEC,
  );
}
