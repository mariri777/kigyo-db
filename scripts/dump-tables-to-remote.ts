#!/usr/bin/env tsx
/**
 * ローカル D1 (SQLite) の指定テーブルを SELECT し、本番 D1 に INSERT で流す
 * 初期データセットアップ専用スクリプト。
 *
 *   pnpm tsx scripts/dump-tables-to-remote.ts [table1 table2 ...]
 *
 * 引数を省略すると DEFAULT_TABLES を流す(v2 公開に必要な確定データ)。
 *
 * 動作:
 *   1. 各テーブルを SELECT * (PRAGMA table_info で列順を取る)
 *   2. local/tmp/dump-remote/<table>.sql に
 *        DELETE FROM "<table>";
 *        INSERT INTO "<table>" (cols) VALUES (...), (...), ...;  (100 行ずつ)
 *      を書く
 *   3. wrangler d1 execute --remote --file=<path> で順次投入
 *
 * 設計上の意思決定:
 *   - DELETE で truncate しているので、本番に手動で入れた行は消える。
 *     v2 初期投入のための片道スクリプト。継続運用には pipeline sync を使う。
 *   - 外部キー制約があるテーブルは parent → child の順序で流す必要があるので
 *     DEFAULT_TABLES の順序を守ること。
 *   - chunkSize 100 は D1 の単一 statement 上限とトランザクションサイズの妥協点。
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { execRemoteFile } from "./lib/d1-remote.js";
import { tmpPath } from "./lib/lake.js";
import { getLocalSqlite } from "./lib/local-db.js";
import { insertChunks, sqlIdent } from "./lib/sql-escape.js";

/**
 * 流すテーブルの順序。外部キー依存順:
 *   companies → stocks → stock_snapshot / stock_prices_daily / financials_* / dividends / top_shareholders / company_industries
 *   industries(独立)→ company_industries(industries 必須)
 *   admin_users → categories → articles → article_*
 *   homepage_highlights / market_indices / market_brief / events / story_decks → story_slides
 *   edinet_docs(独立)
 */
const DEFAULT_TABLES = [
  // 企業マスタ
  "companies",
  "stocks",
  // 価格・スナップショット
  "stock_snapshot",
  "stock_prices_daily",
  // 業績・配当・株主
  "financials_annual",
  "financials_quarterly",
  "dividends",
  "top_shareholders",
  // 業界マッピング
  "industries",
  "company_industries",
  // ストーリー
  "story_decks",
  "story_slides",
  // 市場
  "market_indices",
  // ハイライト派生
  "homepage_highlights",
  // イベント
  "events",
  // 管理者・カテゴリ・記事
  "admin_users",
  "categories",
  "articles",
  "article_companies",
  "article_industries",
  "tags",
  "article_tags",
  // EDINET 管理
  "edinet_docs",
  // AI 生成(brief)
  "company_ai_brief",
  "market_brief",
  // 予測
  "predictions",
  "prediction_shifts",
];

type PragmaInfo = { name: string; type: string };

function listColumns(table: string): string[] {
  const db = getLocalSqlite();
  const rows = db.prepare(`PRAGMA table_info(${sqlIdent(table)})`).all() as PragmaInfo[];
  return rows.map((r) => r.name);
}

function selectAll(table: string): Record<string, unknown>[] {
  const db = getLocalSqlite();
  return db.prepare(`SELECT * FROM ${sqlIdent(table)}`).all() as Record<string, unknown>[];
}

function buildDumpSql(table: string): string[] {
  const cols = listColumns(table);
  if (cols.length === 0) {
    throw new Error(`PRAGMA table_info が空: ${table}`);
  }
  const rows = selectAll(table);
  const stmts: string[] = [];
  stmts.push(`DELETE FROM ${sqlIdent(table)};`);
  if (rows.length === 0) return stmts;

  const rowsAsArr = rows.map((r) => cols.map((c) => r[c]));
  stmts.push(...insertChunks(table, cols, rowsAsArr, 100));
  return stmts;
}

function main(): void {
  const argv = process.argv.slice(2);
  const tables = argv.length > 0 ? argv : DEFAULT_TABLES;

  const outDir = tmpPath("dump-remote");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  console.log(`==> dump ${tables.length} テーブルをローカル → 本番 D1 へ\n`);

  const sqlFiles: string[] = [];
  for (const t of tables) {
    const stmts = buildDumpSql(t);
    const path = `${outDir}/${t}.sql`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, stmts.join("\n") + "\n");
    sqlFiles.push(path);
    console.log(`    ${t.padEnd(28)} ${(stmts.length - 1).toString().padStart(4)} INSERT 文 → ${path}`);
  }

  console.log(`\n==> wrangler に投入 (本番 D1)`);
  for (const p of sqlFiles) {
    console.log(`    🚀 ${p}`);
    execRemoteFile(p);
  }

  console.log("\n==> 完了");
}

main();
