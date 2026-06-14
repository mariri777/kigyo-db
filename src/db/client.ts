import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Cloudflare D1 への Drizzle クライアントを取得する。
 *
 * wrangler.toml で `binding = "DB"` としているため env.DB に D1 が刺さる。
 * 型は src/env.d.ts で CloudflareEnv.DB を D1Database として宣言済み。
 *
 * next dev でも next.config.ts の initOpenNextCloudflareForDev() を経由して
 * miniflare のローカル D1 に接続される。
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export async function getDbAsync() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
