import "server-only";

/**
 * Cloudflare Workers の Cache API を使った route handler 用エッジキャッシュヘルパ。
 *
 * 背景:
 *   Workers が `return new Response(...)` で直接生成したレスポンスは、Cache-Control
 *   ヘッダを付けただけでは Cloudflare CDN に自動キャッシュされない。
 *   `caches.default.put(request, response)` を明示的に呼ぶ必要がある。
 *
 * 使い方:
 *   export async function GET(request: Request) {
 *     return withEdgeCache(request, async () => {
 *       const data = await heavyQuery();
 *       return Response.json(data);
 *     }, 300);  // 300 秒キャッシュ
 *   }
 *
 *   - 第 1 引数の Request の URL がキャッシュキー(クエリパラメータも含む)
 *   - HIT 時はオリジンを呼ばずキャッシュをそのまま返す
 *   - MISS 時はオリジン関数を実行し、結果に Cache-Control ヘッダを付与して
 *     caches.default に書き込む
 *   - GET 以外と Cache-Control が private を含むレスポンスはキャッシュしない
 */
export async function withEdgeCache(
  request: Request,
  origin: () => Promise<Response>,
  sMaxageSec: number,
  swrSec = 86400,
): Promise<Response> {
  if (request.method !== "GET") return origin();

  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    // x-cache: HIT を付けて識別しやすくする
    const headers = new Headers(cached.headers);
    headers.set("x-cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  }

  const fresh = await origin();
  if (!fresh.ok) return fresh;

  // クローンしてキャッシュに保存(本体は呼び出し側に返す)
  const cacheable = fresh.clone();
  const headers = new Headers(cacheable.headers);
  headers.set(
    "Cache-Control",
    `public, s-maxage=${sMaxageSec}, stale-while-revalidate=${swrSec}`,
  );
  headers.set("x-cache", "MISS");

  const toStore = new Response(cacheable.body, {
    status: cacheable.status,
    headers,
  });
  // 書き込みは fire-and-forget(レスポンス遅延を増やさない)
  void cache.put(cacheKey, toStore.clone());

  return toStore;
}
