#!/usr/bin/env tsx
/**
 * scripts/seed/snapshots/<table>.json をローカル D1 に投入する。
 *
 * pnpm db:seed-local 直後に呼ぶことで、fetch/AI で苦労して埋めたデータを
 * 再ダウンロード/再生成せずに復元できる。
 *
 * 既存行は INSERT OR REPLACE で上書き。投入順は依存関係順(FK 制約用)。
 *
 *   pnpm tsx scripts/db-restore.ts             # 全テーブル復元
 *   pnpm tsx scripts/db-restore.ts companies   # 特定テーブルのみ
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getLocalSqlite } from "./lib/local-db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IN_DIR = join(ROOT, "scripts/seed/snapshots");

// db-snapshot.ts と同じ並び(依存関係順)
const TABLES = [
  "industries",
  "company_industries",
  "stock_snapshot",
  "stock_prices_daily",
  "financials_annual",
  "financials_quarterly",
  "dividends",
  "top_shareholders",
  "company_ai_brief",
  "story_decks",
  "story_slides",
  "market_indices",
  "market_brief",
  "homepage_highlights",
  "predictions",
  "prediction_shifts",
  "events",
  "edinet_docs",
];

const CHUNK = 200;

function restoreTable(
  db: ReturnType<typeof getLocalSqlite>,
  table: string,
  rows: Record<string, unknown>[],
): number {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => "?").join(",");
  const colList = cols.map((c) => `"${c}"`).join(",");
  const sql = `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  const insertMany = db.transaction((chunk: Record<string, unknown>[]) => {
    for (const r of chunk) stmt.run(cols.map((c) => r[c] ?? null));
  });
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    insertMany(chunk);
    written += chunk.length;
  }
  return written;
}

async function main() {
  const target = process.argv[2];
  const db = getLocalSqlite();

  const tables = target ? [target] : TABLES;
  let totalRows = 0;
  let totalTables = 0;

  for (const t of tables) {
    const path = join(IN_DIR, `${t}.json`);
    if (!existsSync(path)) {
      console.log(`  - ${t.padEnd(28)} スナップショット無し、skip`);
      continue;
    }
    const rows = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>[];
    try {
      const n = restoreTable(db, t, rows);
      console.log(`  ✓ ${t.padEnd(28)} ${n} 行 restore`);
      totalRows += n;
      totalTables += 1;
    } catch (e) {
      console.error(`  ✗ ${t}: ${(e as Error).message}`);
    }
  }

  console.log(`\n♻️  ${totalTables} テーブル / ${totalRows} 行を復元`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
