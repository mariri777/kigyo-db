#!/usr/bin/env tsx
// 冪等な seed スクリプト(オフライン実行)。
//
// 手順:
//   1) ローカル D1 SQLite ファイルを物理削除
//   2) wrangler d1 migrations apply --local で全マイグレーションを適用
//   3) scripts/seed/*.csv を読み、Drizzle ORM で順番に INSERT
//
// 何度実行しても同じ最終状態に収束する。ネット接続不要。
//
// 使い方:
//   npm run db:seed

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import {
  parseCsv,
  csvRowsToObjects,
  parseIntOrNull,
  parseFloatOrNull,
  emptyToNull,
} from "./lib/csv.js";
import * as schema from "../src/db/schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");
const D1_LOCAL_DIR = join(
  ROOT,
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
);
const D1_NAME = "cho-kigyo-db-database";

const INSERT_CHUNK = 500;

// ──────────────────────────────────────────────────
// ヘルパ
// ──────────────────────────────────────────────────

function readCsv(name: string): Record<string, string>[] {
  const path = join(SEED_DIR, name);
  if (!existsSync(path)) {
    throw new Error(`CSV が見つかりません: ${path}\n先に npm run db:refresh-csv を実行してください。`);
  }
  const text = readFileSync(path, "utf8");
  return csvRowsToObjects(parseCsv(text));
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ──────────────────────────────────────────────────
// 1) ローカル D1 ファイルを削除して再マイグレーション
// ──────────────────────────────────────────────────

function resetLocalD1() {
  if (existsSync(D1_LOCAL_DIR)) {
    rmSync(D1_LOCAL_DIR, { recursive: true, force: true });
    console.log(`🗑️  ${D1_LOCAL_DIR} を削除`);
  }
  console.log(`🚀 wrangler d1 migrations apply ${D1_NAME} --local`);
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "migrations", "apply", D1_NAME, "--local"],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`wrangler migrations apply failed: exit ${result.status}`);
  }
}

function findLocalD1File(): string {
  const entries = readdirSync(D1_LOCAL_DIR);
  for (const f of entries) {
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
  throw new Error(
    `companies テーブルを持つ D1 ファイルが見つかりません: ${D1_LOCAL_DIR}`,
  );
}

// ──────────────────────────────────────────────────
// 2) CSV 読み込み + INSERT
// ──────────────────────────────────────────────────

async function main() {
  resetLocalD1();

  const dbPath = findLocalD1File();
  const sizeKb = (statSync(dbPath).size / 1024).toFixed(1);
  console.log(`📂 ローカル D1: ${dbPath} (${sizeKb} KB)`);

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  const t0 = Date.now();

  // 全 INSERT を 1 トランザクションで実行(冪等性 + 速度)
  const tx = sqlite.transaction(() => {
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

    // ─ industry_clusters ─(CSV の id をそのまま入れる)
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

    // ─ companies ─(CSV の id をそのまま入れる)
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

    // ─ stock_prices_daily ─(件数が多いので 1000 件単位)
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
    for (const chunk of chunked(prices, 1000)) {
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

    // ─ company_insights + insight_sources ─
    // 仮 id (insight_temp_id) を実 id にマップ
    const insightCsv = readCsv("company_insights.csv");
    const tempIdToRealId = new Map<number, number>();
    for (const r of insightCsv) {
      const tempId = parseIntOrNull(r.insight_temp_id)!;
      const res = db
        .insert(schema.companyInsights)
        .values({
          companyId: parseIntOrNull(r.company_id)!,
          title: r.title,
          lede: emptyToNull(r.lede),
          body: r.body,
          generatedAt: r.generated_at,
        })
        .returning({ id: schema.companyInsights.id })
        .all();
      tempIdToRealId.set(tempId, res[0].id);
    }

    const insightSrc = readCsv("insight_sources.csv")
      .map((r) => {
        const tempId = parseIntOrNull(r.insight_temp_id)!;
        const realId = tempIdToRealId.get(tempId);
        if (realId == null) return null;
        return {
          insightId: realId,
          sourceId: parseIntOrNull(r.source_id)!,
        };
      })
      .filter((x): x is { insightId: number; sourceId: number } => x !== null);
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

    // ─ company_valuation_calls + valuation_sources ─
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
    const valuationSrc = readCsv("valuation_sources.csv").map((r) => ({
      companyId: parseIntOrNull(r.company_id)!,
      sourceId: parseIntOrNull(r.source_id)!,
    }));
    if (valuationSrc.length > 0) {
      for (const chunk of chunked(valuationSrc, INSERT_CHUNK)) {
        db.insert(schema.valuationSources).values(chunk).run();
      }
    }
  });

  tx();
  const elapsed = Date.now() - t0;

  // 検証用 COUNT
  const counts = {
    companies: (sqlite.prepare("SELECT COUNT(*) c FROM companies").get() as { c: number }).c,
    stocks: (sqlite.prepare("SELECT COUNT(*) c FROM stocks").get() as { c: number }).c,
    prices: (sqlite.prepare("SELECT COUNT(*) c FROM stock_prices_daily").get() as { c: number }).c,
    sources: (sqlite.prepare("SELECT COUNT(*) c FROM sources").get() as { c: number }).c,
    industries: (sqlite.prepare("SELECT COUNT(*) c FROM industries").get() as { c: number }).c,
    clusters: (sqlite.prepare("SELECT COUNT(*) c FROM industry_clusters").get() as { c: number }).c,
    tags: (sqlite.prepare("SELECT COUNT(*) c FROM business_tags").get() as { c: number }).c,
    insights: (sqlite.prepare("SELECT COUNT(*) c FROM company_insights").get() as { c: number }).c,
  };

  console.log(`\n✅ seed 完了 (${elapsed}ms)`);
  console.log(`   companies          : ${counts.companies}`);
  console.log(`   stocks             : ${counts.stocks}`);
  console.log(`   stock_prices_daily : ${counts.prices}`);
  console.log(`   sources            : ${counts.sources}`);
  console.log(`   industries         : ${counts.industries}`);
  console.log(`   industry_clusters  : ${counts.clusters}`);
  console.log(`   business_tags      : ${counts.tags}`);
  console.log(`   company_insights   : ${counts.insights}`);

  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
