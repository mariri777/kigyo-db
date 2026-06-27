#!/usr/bin/env tsx
// ローカル D1 を初期化するスクリプト(オフライン完結)。
//
// 1) .wrangler/state 下のローカル SQLite ファイルを inode 維持で全テーブル DROP
// 2) drizzle/*.sql を順に流して再作成
// 3) scripts/seed/*.csv を Drizzle で一括 INSERT(企業 / 銘柄 / 価格 / overlay)
// 4) admin_users はハードコード 1 名だけ投入(管理画面ログイン用)
// 5) blog (posts, post_tags, tags) は空のまま(管理画面から手で作る)
//
// CSV は手動で `pnpm db:snapshot` を叩いた最後のスナップショットを使う。
// 古くて良い(本番 D1 は cron で常に最新化される)。
//
// 使い方:
//   pnpm db:seed-local

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../src/server/db/schema.js";
import {
  csvRowsToObjects,
  emptyToNull,
  parseCsv,
  parseFloatOrNull,
  parseIntOrNull,
} from "./lib/csv.js";
import { pbkdf2HashSyncForSeed } from "./lib/passwordSeed.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");
const D1_LOCAL_DIR = join(
  ROOT,
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
);
const D1_NAME = "cho-kigyo-db-database";
const INSERT_CHUNK = 500;
const PRICE_INSERT_CHUNK = 1000;

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password0";

// ──────────────────────────────────────────────────
// CSV ヘルパ
// ──────────────────────────────────────────────────

function readCsv(name: string): Record<string, string>[] {
  const path = join(SEED_DIR, name);
  if (!existsSync(path)) {
    throw new Error(
      `CSV が見つかりません: ${path}\n先に pnpm db:snapshot で seed スナップショットを生成してください。`,
    );
  }
  return csvRowsToObjects(parseCsv(readFileSync(path, "utf8")));
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ──────────────────────────────────────────────────
// ローカル D1 ファイルを inode 維持でリセット
//
// 旧 inode を miniflare が掴んだまま新ファイルが作られると
// SQLITE_CANTOPEN になる。そのため rm せず、開いた接続から
// 全テーブル DROP → drizzle/*.sql を再投入する。
// 真の初回(ファイル未作成)だけ wrangler migrations apply に委譲。
// ──────────────────────────────────────────────────

function loadMigrationSql(): string[] {
  const migrationsDir = join(ROOT, "drizzle");
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(migrationsDir, f), "utf8"));
}

function findLocalD1File(): string | null {
  if (!existsSync(D1_LOCAL_DIR)) return null;
  for (const f of readdirSync(D1_LOCAL_DIR)) {
    if (!f.endsWith(".sqlite") || f === "metadata.sqlite") continue;
    const path = join(D1_LOCAL_DIR, f);
    const db = new Database(path, { readonly: true });
    try {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((r) => (r as { name: string }).name);
      if (tables.includes("companies")) return path;
    } finally {
      db.close();
    }
  }
  return null;
}

function resetLocalD1Inplace(dbPath: string) {
  const sqlite = new Database(dbPath);
  try {
    sqlite.pragma("foreign_keys = OFF");
    const tableNames = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%' AND name NOT LIKE '_cf_%'",
      )
      .all()
      .map((r) => (r as { name: string }).name);
    const tx = sqlite.transaction(() => {
      for (const name of tableNames) {
        sqlite.exec(`DROP TABLE IF EXISTS \`${name}\``);
      }
      for (const sql of loadMigrationSql()) {
        sqlite.exec(sql);
      }
    });
    tx();
    sqlite.pragma("foreign_keys = ON");
    console.log("🧹 既存テーブルを DROP → drizzle/*.sql で再作成 (inode 維持)");
  } finally {
    sqlite.close();
  }
}

function prepareLocalD1(): string {
  mkdirSync(D1_LOCAL_DIR, { recursive: true });
  const existing = findLocalD1File();
  if (existing) {
    resetLocalD1Inplace(existing);
    return existing;
  }
  // 真の初回のみ wrangler に作らせる
  console.log(`🚀 wrangler d1 migrations apply ${D1_NAME} --local`);
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "migrations", "apply", D1_NAME, "--local"],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`wrangler migrations apply failed: exit ${result.status}`);
  }
  const created = findLocalD1File();
  if (!created) {
    throw new Error(`companies テーブルを持つ D1 ファイルが見つかりません: ${D1_LOCAL_DIR}`);
  }
  return created;
}

// ──────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────

function main() {
  const dbPath = prepareLocalD1();
  const sizeKb = (statSync(dbPath).size / 1024).toFixed(1);
  console.log(`📂 ローカル D1: ${dbPath} (${sizeKb} KB)`);

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  const now = new Date().toISOString();
  const t0 = Date.now();

  sqlite.transaction(() => {
    // ─ sources ─
    const sources = readCsv("sources.csv").map((r) => ({
      id: parseIntOrNull(r.id)!,
      doc: r.doc,
      page: parseIntOrNull(r.page),
      period: emptyToNull(r.period),
      url: emptyToNull(r.url),
    }));
    for (const chunk of chunked(sources, INSERT_CHUNK)) {
      db.insert(schema.sources).values(chunk).run();
    }

    // ─ industries ─
    const industries = readCsv("industries.csv").map((r) => ({
      slug: r.slug,
      name: r.name,
      shortName: r.short_name,
      description: emptyToNull(r.description),
      theme2025Json: emptyToNull(r.theme_2025_json),
      marketScaleHeadline: emptyToNull(r.market_scale_headline),
      marketScaleGrowth: emptyToNull(r.market_scale_growth),
      marketScaleBreakdown: emptyToNull(r.market_scale_breakdown),
      chainColumnsJson: emptyToNull(r.chain_columns_json),
      competitiveStructureJson: emptyToNull(r.competitive_structure_json),
      keyKpisJson: emptyToNull(r.key_kpis_json),
      industryInsightsJson: emptyToNull(r.industry_insights_json),
    }));
    for (const chunk of chunked(industries, INSERT_CHUNK)) {
      db.insert(schema.industries).values(chunk).run();
    }

    // ─ industry_clusters ─
    const clusters = readCsv("industry_clusters.csv").map((r) => ({
      id: parseIntOrNull(r.id)!,
      industrySlug: r.industry_slug,
      key: r.key,
      name: r.name,
      role: r.role,
      position: r.position,
    }));
    for (const chunk of chunked(clusters, INSERT_CHUNK)) {
      db.insert(schema.industryClusters).values(chunk).run();
    }

    // ─ companies ─
    const companies = readCsv("companies.csv").map((r) => ({
      id: parseIntOrNull(r.id)!,
      name: r.name,
      nameEn: emptyToNull(r.name_en),
      description: emptyToNull(r.description),
      oneLiner: emptyToNull(r.one_liner),
      edinetCode: emptyToNull(r.edinet_code),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    for (const chunk of chunked(companies, INSERT_CHUNK)) {
      db.insert(schema.companies).values(chunk).run();
    }

    // ─ stocks ─
    const stocks = readCsv("stocks.csv").map((r) => ({
      code: r.code,
      companyId: parseIntOrNull(r.company_id)!,
      exchange: r.exchange as "Prime" | "Standard" | "Growth",
      sectorTSE: r.sector_tse,
      priceJpy: parseFloatOrNull(r.price_jpy),
      priceDate: emptyToNull(r.price_date),
      changePct: parseFloatOrNull(r.change_pct),
      marketCapOku: parseIntOrNull(r.market_cap_oku),
      per: parseFloatOrNull(r.per),
      pbr: parseFloatOrNull(r.pbr),
      dividendYield: parseFloatOrNull(r.dividend_yield),
      updatedAt: r.updated_at,
    }));
    for (const chunk of chunked(stocks, INSERT_CHUNK)) {
      db.insert(schema.stocks).values(chunk).run();
    }

    // ─ stock_prices_daily(行数が多い) ─
    const prices = readCsv("stock_prices_daily.csv").map((r) => ({
      code: r.code,
      date: r.date,
      open: parseFloatOrNull(r.open),
      high: parseFloatOrNull(r.high),
      low: parseFloatOrNull(r.low),
      close: parseFloatOrNull(r.close)!,
      volume: parseIntOrNull(r.volume),
      adjClose: parseFloatOrNull(r.adj_close),
    }));
    for (const chunk of chunked(prices, PRICE_INSERT_CHUNK)) {
      db.insert(schema.stockPricesDaily).values(chunk).run();
    }

    // ─ company_industry_clusters ─
    const compClusters = readCsv("company_industry_clusters.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      industryClusterId: parseIntOrNull(r.industry_cluster_id)!,
    }));
    if (compClusters.length > 0) {
      for (const chunk of chunked(compClusters, INSERT_CHUNK)) {
        db.insert(schema.companyIndustryClusters).values(chunk).run();
      }
    }

    // ─ business_tags ─
    const tags = readCsv("business_tags.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      dimension: r.dimension as
        | "product"
        | "customer"
        | "channel"
        | "revenue_model"
        | "value_chain"
        | "geography",
      value: r.value,
      sourceId: parseIntOrNull(r.source_id),
    }));
    if (tags.length > 0) {
      for (const chunk of chunked(tags, INSERT_CHUNK)) {
        db.insert(schema.businessTags).values(chunk).run();
      }
    }

    // ─ company_segments ─
    const segs = readCsv("company_segments.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      period: r.period,
      name: r.name,
      revenueOku: parseFloatOrNull(r.revenue_oku),
      share: parseFloatOrNull(r.share),
      operatingMargin: parseFloatOrNull(r.operating_margin),
      sourceId: parseIntOrNull(r.source_id),
    }));
    if (segs.length > 0) {
      for (const chunk of chunked(segs, INSERT_CHUNK)) {
        db.insert(schema.companySegments).values(chunk).run();
      }
    }

    // ─ company_insights(id を CSV から明示) ─
    const insights = readCsv("company_insights.csv").map((r) => ({
      id: parseIntOrNull(r.id)!,
      companyId: parseIntOrNull(r.company_id)!,
      title: r.title,
      lede: emptyToNull(r.lede),
      body: r.body,
      generatedAt: r.generated_at,
    }));
    if (insights.length > 0) {
      for (const chunk of chunked(insights, INSERT_CHUNK)) {
        db.insert(schema.companyInsights).values(chunk).run();
      }
    }

    // ─ insight_sources ─
    const insightSrc = readCsv("insight_sources.csv").map((r) => ({
      insightId: parseIntOrNull(r.insight_id)!,
      sourceId: parseIntOrNull(r.source_id)!,
    }));
    if (insightSrc.length > 0) {
      for (const chunk of chunked(insightSrc, INSERT_CHUNK)) {
        db.insert(schema.insightSources).values(chunk).run();
      }
    }

    // ─ company_phase_scores ─
    const phases = readCsv("company_phase_scores.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      launch: parseFloatOrNull(r.launch)!,
      expansion: parseFloatOrNull(r.expansion)!,
      mature: parseFloatOrNull(r.mature)!,
      decline: parseFloatOrNull(r.decline)!,
      rationale: emptyToNull(r.rationale),
      updatedAt: r.updated_at,
    }));
    if (phases.length > 0) {
      for (const chunk of chunked(phases, INSERT_CHUNK)) {
        db.insert(schema.companyPhaseScores).values(chunk).run();
      }
    }

    // ─ company_factor_betas ─
    const betas = readCsv("company_factor_betas.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      usdjpy: parseFloatOrNull(r.usdjpy)!,
      us10y: parseFloatOrNull(r.us10y)!,
      oil: parseFloatOrNull(r.oil)!,
      sox: parseFloatOrNull(r.sox)!,
      china: parseFloatOrNull(r.china)!,
      market: parseFloatOrNull(r.market)!,
      size: parseFloatOrNull(r.size)!,
      value: parseFloatOrNull(r.value)!,
      momentum: parseFloatOrNull(r.momentum)!,
      period: emptyToNull(r.period),
    }));
    if (betas.length > 0) {
      for (const chunk of chunked(betas, INSERT_CHUNK)) {
        db.insert(schema.companyFactorBetas).values(chunk).run();
      }
    }

    // ─ company_valuation_calls ─
    const valuations = readCsv("company_valuation_calls.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      verdict: r.verdict as "割安" | "ほぼ妥当" | "やや割高" | "割高",
      score: parseIntOrNull(r.score)!,
      rationale: emptyToNull(r.rationale),
      updatedAt: r.updated_at,
    }));
    if (valuations.length > 0) {
      for (const chunk of chunked(valuations, INSERT_CHUNK)) {
        db.insert(schema.companyValuationCalls).values(chunk).run();
      }
    }

    // ─ valuation_sources ─
    const valuationSrc = readCsv("valuation_sources.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      sourceId: parseIntOrNull(r.source_id)!,
    }));
    if (valuationSrc.length > 0) {
      for (const chunk of chunked(valuationSrc, INSERT_CHUNK)) {
        db.insert(schema.valuationSources).values(chunk).run();
      }
    }

    // ─ admin_users(ハードコード 1 名) ─
    //
    // 管理画面ログイン用の初期管理者。本番運用では /admin/account から
    // 必ず変更すること。パスワードハッシュは決定論的(固定 salt)に生成され、
    // CSV を介さず seed のたびに同じハッシュが書き込まれる。
    const { hashB64, saltB64, iterations } = pbkdf2HashSyncForSeed(ADMIN_PASSWORD);
    db.insert(schema.adminUsers)
      .values({
        email: ADMIN_EMAIL,
        name: "Admin",
        passwordHash: hashB64,
        passwordSalt: saltB64,
        passwordIterations: iterations,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // posts / tags / post_tags は空のまま(管理画面から手で作る)
  })();

  // 検証
  const counts = {
    companies: countOf(sqlite, "companies"),
    stocks: countOf(sqlite, "stocks"),
    prices: countOf(sqlite, "stock_prices_daily"),
    sources: countOf(sqlite, "sources"),
    industries: countOf(sqlite, "industries"),
    clusters: countOf(sqlite, "industry_clusters"),
    tags: countOf(sqlite, "business_tags"),
    insights: countOf(sqlite, "company_insights"),
    adminUsers: countOf(sqlite, "admin_users"),
  };
  sqlite.close();

  console.log(`✅ seed 完了 (${Date.now() - t0}ms):`);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`   ${k.padEnd(11)}: ${v}`);
  }
  console.log(`   admin login : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

function countOf(sqlite: Database.Database, table: string): number {
  return (sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
