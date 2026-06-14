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
//   - 同じ q の結果は CDN エッジで 5 分間共有(s-maxage=300)。
//   - stale-while-revalidate=86400 で 1 日は古い結果を返しつつ裏で更新。
//   - 価格は検索結果に含めないので、5 分粒度で十分。

import { getDb } from "@/server/db/client";
import { search as searchStocks, type SearchHit } from "@/server/repo/stockRepo";

// D1 へ毎リクエストアクセスするため、build 時の static 生成は不可
export const dynamic = "force-dynamic";

const MAX_QUERY_LEN = 64;
const RESULT_LIMIT = 12;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q") ?? "";
  const q = raw.trim().slice(0, MAX_QUERY_LEN);

  if (q.length === 0) {
    return Response.json(
      { results: [] satisfies SearchHit[] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      },
    );
  }

  const db = await getDb();
  const results = await searchStocks(db, q, RESULT_LIMIT);

  return Response.json(
    { results },
    {
      headers: {
        // 同じ q は CDN で 5 分共有、1 日は古い結果を返しつつ裏で再取得
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
