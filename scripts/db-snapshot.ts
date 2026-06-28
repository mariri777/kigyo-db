#!/usr/bin/env tsx
/**
 * ローカル D1 の主要テーブルを scripts/seed/snapshots/<table>.{csv,json} に書き出す。
 *
 * 目的: pnpm db:seed-local で .wrangler/state を rm されたあとも、
 *       fetch / AI で苦労して埋めたデータが消えないようにする。
 *       次回 seed-local 後に db-restore で復元する。
 *
 * テーブルごとの形式 (TABLES の format で宣言):
 *   - csv:  全カラムが string / number / null の単純な表。
 *           stock_prices_daily(89k 行)など大量行のテーブルはこちらでサイズ削減。
 *   - json: *_json カラム(配列・オブジェクト文字列)を含むテーブルは JSON のまま。
 *           CSV にすると引用エスケープが複雑になるため。
 *
 *   pnpm db:snapshot                    # 全テーブル書き出し
 *   pnpm db:snapshot stock_snapshot     # 特定テーブルのみ
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { rowsToCsv, type CsvRow } from "./lib/csv.js";
import { getLocalSqlite } from "./lib/local-db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "scripts/seed/snapshots");

type Format = "csv" | "json";

/**
 * 永続化対象テーブル。順番は依存関係順(restore 時の FK 制約用)。
 *
 * 「自分で取得/生成して二度と取り直したくない」ものだけを入れる。
 *   - companies / stocks: seed-local が JPX から再取得するので除外
 *   - admin_users / admin_sessions / articles / categories / tags 系: 別管理
 */
const TABLES: ReadonlyArray<{ name: string; format: Format }> = [
  { name: "industries", format: "json" },           // insights_json
  { name: "company_industries", format: "csv" },
  { name: "stock_snapshot", format: "csv" },         // 3500 行 × 数値中心
  { name: "stock_prices_daily", format: "csv" },     // 90k 行、最も大きい
  { name: "financials_annual", format: "csv" },
  { name: "financials_quarterly", format: "json" },  // highlights_json
  { name: "dividends", format: "csv" },
  { name: "top_shareholders", format: "csv" },
  { name: "company_ai_brief", format: "json" },      // 各種 *_json
  { name: "story_decks", format: "csv" },
  { name: "story_slides", format: "csv" },
  { name: "market_indices", format: "csv" },
  { name: "market_brief", format: "json" },          // bullets_json / watch_themes_json
  { name: "homepage_highlights", format: "csv" },
  { name: "predictions", format: "json" },           // rationale (JSON)
  { name: "prediction_shifts", format: "csv" },
  { name: "events", format: "csv" },
  { name: "edinet_docs", format: "csv" },
];

function dumpTable(db: ReturnType<typeof getLocalSqlite>, table: string): Record<string, unknown>[] {
  return db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
}

function writeJson(path: string, rows: unknown[]): void {
  writeFileSync(path, JSON.stringify(rows, null, 2));
}

function writeCsv(path: string, rows: Record<string, unknown>[]): void {
  // unknown を csv が扱える string|number|null に narrow する。
  // boolean は 0/1、それ以外の object は JSON.stringify を最後の砦に。
  const normalized: CsvRow[] = rows.map((r) => {
    const out: CsvRow = {};
    for (const [k, v] of Object.entries(r)) {
      if (v == null) out[k] = null;
      else if (typeof v === "number" || typeof v === "string") out[k] = v;
      else if (typeof v === "boolean") out[k] = v ? 1 : 0;
      else out[k] = JSON.stringify(v);
    }
    return out;
  });
  writeFileSync(path, rowsToCsv(normalized));
}

async function main() {
  const target = process.argv[2];
  const db = getLocalSqlite();
  mkdirSync(OUT_DIR, { recursive: true });

  const tables = target ? TABLES.filter((t) => t.name === target) : TABLES;
  if (tables.length === 0) {
    console.error(`未知のテーブル: ${target}. 利用可能: ${TABLES.map((t) => t.name).join(",")}`);
    process.exit(1);
  }

  let totalRows = 0;
  let writtenTables = 0;

  for (const { name, format } of tables) {
    let rows: Record<string, unknown>[];
    try {
      rows = dumpTable(db, name);
    } catch (e) {
      console.warn(`  ! skip ${name}: ${(e as Error).message}`);
      continue;
    }
    const path = join(OUT_DIR, `${name}.${format}`);
    const rel = path.replace(ROOT + "/", "");

    // 0 行のテーブルはファイルを作らない(空ファイルは git ノイズになるだけ)。
    if (rows.length === 0) {
      console.log(`  - ${name.padEnd(28)}      0 行 (skip)`);
      continue;
    }

    mkdirSync(dirname(path), { recursive: true });
    if (format === "csv") writeCsv(path, rows);
    else writeJson(path, rows);
    console.log(`  ✓ ${name.padEnd(28)} ${String(rows.length).padStart(6)} 行 → ${rel}`);
    totalRows += rows.length;
    writtenTables += 1;
  }

  console.log(`\n📦 ${writtenTables} テーブル / ${totalRows} 行を保存`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
