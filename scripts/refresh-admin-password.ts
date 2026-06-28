#!/usr/bin/env tsx
/**
 * admin_users のパスワードを 100,000 iter で UPDATE する。
 * Workers の WebCrypto は >100000 iter を受け付けないため、200000 で seed された
 * 既存ハッシュは検証時に NotSupportedError を投げる。本スクリプトで再ハッシュする。
 *
 * デフォルトは admin@example.com / password0(README の初期値)。
 */
import { eq } from "drizzle-orm";

import { adminUsers } from "../src/server/db/schema.js";
import { getLocalDb } from "./lib/d1-local.js";
import { pbkdf2HashSyncForSeed } from "./lib/passwordSeed.js";

const TARGET_EMAIL = "admin@example.com";
const NEW_PASSWORD = "password0";

async function main(): Promise<void> {
  const db = getLocalDb();
  const { hashB64, saltB64, iterations } = pbkdf2HashSyncForSeed(NEW_PASSWORD);
  const now = new Date().toISOString();
  const res = await db
    .update(adminUsers)
    .set({
      passwordHash: hashB64,
      passwordSalt: saltB64,
      passwordIterations: iterations,
      updatedAt: now,
    })
    .where(eq(adminUsers.email, TARGET_EMAIL))
    .run();
  console.log(
    `✅ ${TARGET_EMAIL} を iter=${iterations} で更新 (changes=${(res as { changes?: number }).changes ?? "?"})`,
  );
}

main();
