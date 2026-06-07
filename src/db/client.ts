// Drizzle のクライアントを作る関数
// Cloudflare の環境（env）から D1 を取り出して、Drizzle で包む

import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Drizzle クライアントを取得する
 *
 * 使い方：
 *   const db = getDb();
 *   const all = await db.select().from(schema.stocks);
 *
 * env.DB は wrangler.toml で binding = "DB" にしたものが入ってくる
 */
export function getDb() {
  const { env } = getCloudflareContext();
  // env.DB は型上 D1Database として認識される
  // @ts-expect-error 型は wrangler types で生成すれば消えるが、今は省略
  return drizzle(env.DB, { schema });
}
