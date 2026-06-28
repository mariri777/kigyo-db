#!/usr/bin/env tsx
/**
 * ローカル D1 の主要テーブルを scripts/seed/snapshots/<table>.json に書き出す。
 *
 * 目的: pnpm db:seed-local で .wrangler/state を rm されたあとも、
 *       fetch / AI で苦労して埋めたデータが消えないようにする。
 *       次回 seed-local 後に db-restore で復元する。
 *
 * 対象は「自前で取得 or 生成した」もの。JPX マスタは含めない(再取得が安いため)。
 *
 *   pnpm tsx scripts/db-snapshot.ts            # 全テーブル書き出し
 *   pnpm tsx scripts/db-snapshot.ts companies  # 特定テーブルのみ
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getLocalSqlite } from "./lib/local-db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "scripts/seed/snapshots");

/**
 * 永続化対象テーブル。順番は依存関係順(restore 時の FK 制約用)。
 *
 * 「自分で取得/生成して二度と取り直したくない」ものだけを入れる。
 *   - companies / stocks: seed-local が JPX から再取得するので除外
 *   - admin_users / admin_sessions / articles / categories / tags 系: 別管理
 *   - industries / company_industries: AI で再付与可能だが、手で直したい時のため残す
 */
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

function dumpTable(db: ReturnType<typeof getLocalSqlite>, table: string): unknown[] {
  return db.prepare(`SELECT * FROM ${table}`).all() as unknown[];
}

async function main() {
  const target = process.argv[2];
  const db = getLocalSqlite();
  mkdirSync(OUT_DIR, { recursive: true });

  const tables = target ? [target] : TABLES;
  const summary: Array<{ table: string; rows: number; path: string }> = [];

  for (const t of tables) {
    let rows: unknown[];
    try {
      rows = dumpTable(db, t);
    } catch (e) {
      console.warn(`! skip ${t}: ${(e as Error).message}`);
      continue;
    }
    const path = join(OUT_DIR, `${t}.json`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(rows, null, 2));
    summary.push({ table: t, rows: rows.length, path });
    console.log(`  ✓ ${t.padEnd(28)} ${rows.length} 行 → ${path.replace(ROOT + "/", "")}`);
  }

  console.log(`\n📦 ${summary.length} テーブル / ${summary.reduce((a, b) => a + b.rows, 0)} 行を保存`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
