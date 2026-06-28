#!/usr/bin/env tsx
/**
 * scripts/seed/snapshots/<table>.{csv,json} をローカル D1 に投入する。
 *
 * pnpm db:seed-local 直後に呼ぶことで、fetch/AI で苦労して埋めたデータを
 * 再ダウンロード/再生成せずに復元する。
 *
 * 形式は拡張子で自動判定 (db-snapshot.ts と対をなす)。
 * 既存行は INSERT OR REPLACE で上書き。投入順は依存関係順 (FK 制約用)。
 *
 *   pnpm db:restore                    # 全テーブル復元
 *   pnpm db:restore stock_snapshot     # 特定テーブルのみ
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { csvToRows } from "./lib/csv.js";
import { getLocalSqlite } from "./lib/local-db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IN_DIR = join(ROOT, "scripts/seed/snapshots");

// db-snapshot.ts と同じ依存関係順
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

function loadRows(table: string): Record<string, unknown>[] | null {
  // 拡張子で自動判定
  for (const ext of ["csv", "json"] as const) {
    const path = join(IN_DIR, `${table}.${ext}`);
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    if (ext === "csv") return csvToRows(raw) as Record<string, unknown>[];
    return JSON.parse(raw) as Record<string, unknown>[];
  }
  return null;
}

function restoreTable(
  db: ReturnType<typeof getLocalSqlite>,
  table: string,
  rows: Record<string, unknown>[],
): number {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => "?").join(",");
  const colList = cols.map((c) => `"${c}"`).join(",");
  const stmt = db.prepare(`INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`);
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
    const rows = loadRows(t);
    if (rows == null) {
      console.log(`  - ${t.padEnd(28)} スナップショット無し、skip`);
      continue;
    }
    try {
      const n = restoreTable(db, t, rows);
      console.log(`  ✓ ${t.padEnd(28)} ${String(n).padStart(6)} 行 restore`);
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
