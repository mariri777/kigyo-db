import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Cloudflare D1 への Drizzle クライアントを取得する。
 *
 * wrangler.toml で `binding = "DB"` としているため env.DB に D1 が刺さる。
 * 型は wrangler types で env.d.ts を生成すれば消えるが、現状は @ts-expect-error で受ける。
 */
export function getDb() {
  const { env } = getCloudflareContext();
  // @ts-expect-error env.DB は wrangler types を再生成すると D1Database 型で解決される
  return drizzle(env.DB, { schema });
}
