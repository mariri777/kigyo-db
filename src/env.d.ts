// Cloudflare bindings の型補強。
// wrangler types で env.d.ts を再生成しても良いが、現状は手書きで最小限を宣言。

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export {};
