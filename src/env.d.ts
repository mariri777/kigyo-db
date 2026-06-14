// Cloudflare bindings の型補強。
// wrangler types で env.d.ts を再生成しても良いが、現状は手書きで最小限を宣言。

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }

  // Cloudflare Workers の Cache API。標準 CacheStorage には default プロパティが
  // ないため、Workers ランタイム固有の拡張として宣言する。
  // https://developers.cloudflare.com/workers/runtime-apis/cache/
  interface CacheStorage {
    readonly default: Cache;
  }
}

export {};
