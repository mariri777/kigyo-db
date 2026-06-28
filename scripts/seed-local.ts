#!/usr/bin/env tsx
/**
 * ローカル D1 を新スキーマで初期化する。
 *
 * フロー:
 *   1. .wrangler/state/v3/d1/ を rm -rf (旧 SQLite を完全破棄)
 *   2. wrangler d1 migrations apply --local (新 0000_*.sql 適用)
 *   3. JPX 上場一覧から companies + stocks を投入
 *   4. admin_users にデフォルトアカウントを 1 つ作成
 *
 * 価格・財務・AI 生成は EDINET / Yahoo Finance パイプラインで後追い。
 *
 * 使い方:
 *   pnpm db:seed-local
 *   pnpm db:seed-local --no-fetch    # JPX を取りに行かず空のままにする (CI 等)
 */
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getLocalDb, getLocalD1Path } from "./lib/local-db.js";
import { fetchJpxExcel, parseJpxExcel } from "./lib/jpx.js";
import { pbkdf2HashSyncForSeed } from "./lib/passwordSeed.js";
import {
  adminUsers,
  categories,
  companies,
  stocks,
} from "../src/server/db/schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const D1_LOCAL_ROOT = join(ROOT, ".wrangler/state/v3/d1");
const D1_NAME = "cho-kigyo-db-database";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password0";

const INSERT_CHUNK = 200;

function parseArgs(argv: string[]): { fetch: boolean } {
  let fetch = true;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--no-fetch") fetch = false;
  }
  return { fetch };
}

async function main() {
  const { fetch: shouldFetch } = parseArgs(process.argv);

  // ── 1. 既存ローカル D1 を完全破棄 ──
  if (existsSync(D1_LOCAL_ROOT)) {
    console.log(`既存ローカル D1 を削除: ${D1_LOCAL_ROOT}`);
    rmSync(D1_LOCAL_ROOT, { recursive: true, force: true });
  }

  // ── 2. migrations apply ──
  console.log("wrangler d1 migrations apply --local");
  const r = spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "migrations", "apply", D1_NAME, "--local"],
    { stdio: "inherit", cwd: ROOT },
  );
  if (r.status !== 0) {
    throw new Error(`migrations apply 失敗 (exit=${r.status})`);
  }

  // ── 3. D1 パスを確定 (better-sqlite3 で読みに行く) ──
  const dbPath = getLocalD1Path();
  console.log(`ローカル D1: ${dbPath}\n`);
  const db = getLocalDb();

  // ── 4. 管理者ユーザー投入 ──
  const adminCreds = pbkdf2HashSyncForSeed(ADMIN_PASSWORD);
  const now = new Date().toISOString();
  db.insert(adminUsers)
    .values({
      email: ADMIN_EMAIL,
      name: "管理者",
      passwordHash: adminCreds.hashB64,
      passwordSalt: adminCreds.saltB64,
      passwordIterations: adminCreds.iterations,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log(`管理者ユーザー作成: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // ── 4.5. 記事カテゴリ ──
  const categoryRows = [
    { slug: "earnings", name: "決算解釈", sortOrder: 1 },
    { slug: "industry_overview", name: "業界俯瞰", sortOrder: 2 },
    { slug: "theme_dive", name: "テーマ深掘り", sortOrder: 3 },
    { slug: "primer", name: "プライマー", sortOrder: 4 },
  ];
  for (const c of categoryRows) {
    db.insert(categories).values(c).run();
  }
  console.log(`記事カテゴリを ${categoryRows.length} 件投入`);

  if (!shouldFetch) {
    console.log("\n--no-fetch 指定のため JPX 取得をスキップ。終了。");
    return;
  }

  // ── 5. JPX 上場一覧を取得 → companies + stocks ──
  console.log("\nJPX 上場一覧を取得...");
  const buf = await fetchJpxExcel();
  const { stocks: jpxStocks, baseDate } = parseJpxExcel(buf);
  console.log(`  取得: ${jpxStocks.length} 銘柄, baseDate=${baseDate}`);

  // companies を投入 (name 重複は許容、id は autoincrement)
  // stocks は code が PK
  const nowIso = new Date().toISOString();

  // companies INSERT (chunked)
  const companyRows = jpxStocks.map((s) => ({
    name: s.name,
    nameEn: null,
    edinetCode: null,
    description: null,
    oneLiner: null,
    founded: null,
    listed: null,
    headquarters: null,
    ceoName: null,
    website: null,
    employeesConsolidated: null,
    logoColor: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));

  console.log(`\ncompanies を ${companyRows.length} 件投入...`);
  for (let i = 0; i < companyRows.length; i += INSERT_CHUNK) {
    db.insert(companies)
      .values(companyRows.slice(i, i + INSERT_CHUNK))
      .run();
  }

  // companies の id を name から逆引き (順序保持の前提)
  const inserted = db.select().from(companies).all();
  const idByName = new Map<string, number>();
  for (const c of inserted) idByName.set(c.name, c.id);

  // stocks INSERT
  const stockRows = jpxStocks
    .map((s) => {
      const companyId = idByName.get(s.name);
      if (companyId == null) return null;
      return {
        code: s.code,
        companyId,
        exchange: s.exchange,
        sectorTse: s.sectorTSE,
        indexMembership: null,
        listedShares: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    })
    .filter((r): r is Exclude<typeof r, null> => r != null);

  console.log(`stocks を ${stockRows.length} 件投入...`);
  for (let i = 0; i < stockRows.length; i += INSERT_CHUNK) {
    db.insert(stocks)
      .values(stockRows.slice(i, i + INSERT_CHUNK))
      .run();
  }

  console.log(`\n✅ seed 完了: companies=${inserted.length}, stocks=${stockRows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
