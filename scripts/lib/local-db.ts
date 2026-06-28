/**
 * ローカル D1 (miniflare の SQLite ファイル) を better-sqlite3 で直接叩く。
 * server-only な src/server/db/client.ts は Cloudflare context が必須なので scripts からは使えない。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../../src/server/db/schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const D1_LOCAL_DIR = join(ROOT, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
const D1_NAME = "cho-kigyo-db-database";

export type LocalDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * miniflare の D1 SQLite ファイルパスを返す。なければ作る (wrangler を一度起動して空 DB を作成)。
 */
export function getLocalD1Path(): string {
  if (!existsSync(D1_LOCAL_DIR)) {
    mkdirSync(D1_LOCAL_DIR, { recursive: true });
  }
  // miniflare は最初のローカル起動時に <ハッシュ>.sqlite を生成する。
  // ここでは既存ファイルを探し、なければ wrangler を 1 回呼んで生成させる。
  const found = findSqliteFile();
  if (found) return found;

  // wrangler を 1 度叩いてファイルを生成
  console.log("ローカル D1 ファイルが見つからないので migrations apply で生成します...");
  spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "migrations", "apply", D1_NAME, "--local"],
    { stdio: "inherit" },
  );
  const created = findSqliteFile();
  if (!created) {
    throw new Error(`ローカル D1 ファイル生成に失敗 (${D1_LOCAL_DIR})`);
  }
  return created;
}

function findSqliteFile(): string | undefined {
  if (!existsSync(D1_LOCAL_DIR)) return undefined;
  const files = readdirSync(D1_LOCAL_DIR).filter((f) => f.endsWith(".sqlite"));
  if (files.length === 0) return undefined;
  // 最も新しい .sqlite を返す
  return files
    .map((f) => ({ f, t: statSync(join(D1_LOCAL_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .map((x) => join(D1_LOCAL_DIR, x.f))[0];
}

let _db: LocalDb | undefined;

export function getLocalDb(): LocalDb {
  if (_db) return _db;
  const dbPath = getLocalD1Path();
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  _db = drizzle(sqlite, { schema });
  return _db;
}
