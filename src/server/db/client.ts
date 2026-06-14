import "server-only";

import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Cloudflare D1 への Drizzle クライアントを取得する。
 *
 * 必ず async モードで取得する: prerender 時にも安全に動作する。
 * 同期 `getCloudflareContext()` は prerender 中の RSC で失敗するため使わない。
 *
 * wrangler.toml で `binding = "DB"`、型は env.d.ts で D1Database 宣言済み。
 * next dev でも next.config.ts の `initOpenNextCloudflareForDev()` 経由で
 * miniflare のローカル D1 に接続される。
 */
export type Db = ReturnType<typeof drizzle<typeof schema>>;

export async function getDb(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
