#!/usr/bin/env tsx
// 本番 Cloudflare D1 への差分同期スクリプト。
//
// 前提: 先に `pnpm db:refresh-csv` で scripts/seed/*.csv が最新化されていること
//       (Actions 上では fetch-id-seed → refresh-csv の順で実行される)。
//
// 使い方:
//   pnpm db:sync-remote              # 本番 D1 へ反映
//   pnpm db:sync-remote --dry-run    # SQL ファイルを tmp/ に生成するだけ
//
// 反映戦略:
//   - companies: 本番から SELECT → 差分のみ UPDATE / 新規のみ INSERT(DELETE しない)
//   - stocks:    本番から SELECT → 差分 UPSERT、CSV にない code は DELETE
//   - stock_prices_daily: 過去 31 日分を DELETE → CSV から該当範囲を INSERT
//   - overlay 系(sources/insight/factor/phase/valuation/industry 等): FK 逆順 DELETE → 順序 INSERT
//
// ブログ/管理者系(posts, post_tags, tags, admin_users, admin_sessions)は触らない。

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseCsv,
  csvRowsToObjects,
  parseIntOrNull,
  parseFloatOrNull,
  emptyToNull,
} from "./lib/csv.js";
import { sqlLit, sqlIdent, insertChunks } from "./lib/sqlEscape.js";
import { execRemoteJson, execRemoteFile } from "./lib/d1Remote.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");
const TMP_DIR = join(ROOT, "tmp/sync-remote");

const DRY_RUN = process.argv.includes("--dry-run");
const PRICE_HISTORY_DAYS = 31;

// ──────────────────────────────────────────────────
// CSV reader
// ──────────────────────────────────────────────────

function readCsv(name: string): Record<string, string>[] {
  const path = join(SEED_DIR, name);
  if (!existsSync(path)) {
    throw new Error(
      `CSV が見つかりません: ${path}\n先に pnpm db:refresh-csv を実行してください。`,
    );
  }
  return csvRowsToObjects(parseCsv(readFileSync(path, "utf8")));
}

// ──────────────────────────────────────────────────
// SQL ファイル書き出し + 実行ヘルパ
// ──────────────────────────────────────────────────

type SqlBundle = { name: string; statements: string[] };

function writeBundles(bundles: SqlBundle[]): string[] {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  const paths: string[] = [];
  for (const b of bundles) {
    if (b.statements.length === 0) continue;
    const p = join(TMP_DIR, `${b.name}.sql`);
    writeFileSync(p, b.statements.join("\n") + "\n");
    paths.push(p);
  }
  return paths;
}

function applyBundles(paths: string[]) {
  for (const p of paths) {
    console.log(`🚀 wrangler d1 execute --remote --file=${p}`);
    execRemoteFile(p);
  }
}

// ──────────────────────────────────────────────────
// 1) companies(差分 UPSERT、DELETE はしない)
// ──────────────────────────────────────────────────

type CompanyRow = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  one_liner: string | null;
  edinet_code: string | null;
  created_at: string;
  updated_at: string;
};

function loadCompaniesCsv(): CompanyRow[] {
  return readCsv("companies.csv").map((r) => ({
    id: parseIntOrNull(r.id)!,
    name: r.name,
    name_en: emptyToNull(r.name_en),
    description: emptyToNull(r.description),
    one_liner: emptyToNull(r.one_liner),
    edinet_code: emptyToNull(r.edinet_code),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

type RemoteCompanyRow = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  one_liner: string | null;
  edinet_code: string | null;
};

function fetchRemoteCompanies(): Map<number, RemoteCompanyRow> {
  const res = execRemoteJson<RemoteCompanyRow>(
    "SELECT id, name, name_en, description, one_liner, edinet_code FROM companies",
  );
  const rows = res[0]?.results ?? [];
  return new Map(rows.map((r) => [r.id, r]));
}

function companiesContentEqual(a: RemoteCompanyRow, b: CompanyRow): boolean {
  return (
    a.name === b.name &&
    (a.name_en ?? null) === b.name_en &&
    (a.description ?? null) === b.description &&
    (a.one_liner ?? null) === b.one_liner &&
    (a.edinet_code ?? null) === b.edinet_code
  );
}

function buildCompaniesSync(csv: CompanyRow[], remote: Map<number, RemoteCompanyRow>): string[] {
  const inserts: CompanyRow[] = [];
  const updates: CompanyRow[] = [];
  for (const c of csv) {
    const r = remote.get(c.id);
    if (r == null) {
      inserts.push(c);
    } else if (!companiesContentEqual(r, c)) {
      updates.push(c);
    }
  }
  console.log(
    `📊 companies: CSV ${csv.length} 件、INSERT ${inserts.length} / UPDATE ${updates.length} / DELETE 0(残置)`,
  );

  const stmts: string[] = [];
  if (inserts.length > 0) {
    stmts.push(
      ...insertChunks(
        "companies",
        ["id", "name", "name_en", "description", "one_liner", "edinet_code", "created_at", "updated_at"],
        inserts.map((c) => [
          c.id,
          c.name,
          c.name_en,
          c.description,
          c.one_liner,
          c.edinet_code,
          c.created_at,
          c.updated_at,
        ]),
      ),
    );
  }
  for (const c of updates) {
    stmts.push(
      `UPDATE ${sqlIdent("companies")} SET ${sqlIdent("name")}=${sqlLit(c.name)}, ${sqlIdent("name_en")}=${sqlLit(c.name_en)}, ${sqlIdent("description")}=${sqlLit(c.description)}, ${sqlIdent("one_liner")}=${sqlLit(c.one_liner)}, ${sqlIdent("edinet_code")}=${sqlLit(c.edinet_code)}, ${sqlIdent("updated_at")}=${sqlLit(c.updated_at)} WHERE ${sqlIdent("id")}=${sqlLit(c.id)};`,
    );
  }
  return stmts;
}

// ──────────────────────────────────────────────────
// 2) stocks(差分 UPSERT + DELETE)
// ──────────────────────────────────────────────────

type StockRow = {
  code: string;
  company_id: number;
  exchange: string;
  sector_tse: string;
  price_jpy: number | null;
  price_date: string | null;
  change_pct: number | null;
  market_cap_oku: number | null;
  per: number | null;
  pbr: number | null;
  dividend_yield: number | null;
  updated_at: string;
};

function loadStocksCsv(): StockRow[] {
  return readCsv("stocks.csv").map((r) => ({
    code: r.code,
    company_id: parseIntOrNull(r.company_id)!,
    exchange: r.exchange,
    sector_tse: r.sector_tse,
    price_jpy: parseFloatOrNull(r.price_jpy),
    price_date: emptyToNull(r.price_date),
    change_pct: parseFloatOrNull(r.change_pct),
    market_cap_oku: parseIntOrNull(r.market_cap_oku),
    per: parseFloatOrNull(r.per),
    pbr: parseFloatOrNull(r.pbr),
    dividend_yield: parseFloatOrNull(r.dividend_yield),
    updated_at: r.updated_at,
  }));
}

type RemoteStockRow = Omit<StockRow, "updated_at">;

function fetchRemoteStocks(): Map<string, RemoteStockRow> {
  const res = execRemoteJson<RemoteStockRow>(
    "SELECT code, company_id, exchange, sector_tse, price_jpy, price_date, change_pct, market_cap_oku, per, pbr, dividend_yield FROM stocks",
  );
  const rows = res[0]?.results ?? [];
  return new Map(rows.map((r) => [r.code, r]));
}

function stocksContentEqual(a: RemoteStockRow, b: StockRow): boolean {
  return (
    a.company_id === b.company_id &&
    a.exchange === b.exchange &&
    a.sector_tse === b.sector_tse &&
    (a.price_jpy ?? null) === b.price_jpy &&
    (a.price_date ?? null) === b.price_date &&
    (a.change_pct ?? null) === b.change_pct &&
    (a.market_cap_oku ?? null) === b.market_cap_oku &&
    (a.per ?? null) === b.per &&
    (a.pbr ?? null) === b.pbr &&
    (a.dividend_yield ?? null) === b.dividend_yield
  );
}

function buildStocksSync(csv: StockRow[], remote: Map<string, RemoteStockRow>): string[] {
  const csvCodes = new Set(csv.map((s) => s.code));
  const inserts: StockRow[] = [];
  const updates: StockRow[] = [];
  const deletes: string[] = [];
  for (const s of csv) {
    const r = remote.get(s.code);
    if (r == null) inserts.push(s);
    else if (!stocksContentEqual(r, s)) updates.push(s);
  }
  for (const code of remote.keys()) {
    if (!csvCodes.has(code)) deletes.push(code);
  }
  console.log(
    `📊 stocks: CSV ${csv.length} 件、INSERT ${inserts.length} / UPDATE ${updates.length} / DELETE ${deletes.length}`,
  );

  const stmts: string[] = [];
  if (deletes.length > 0) {
    // 巨大な IN 句は避け、500 件ずつ分割
    for (let i = 0; i < deletes.length; i += 500) {
      const slice = deletes.slice(i, i + 500);
      stmts.push(
        `DELETE FROM ${sqlIdent("stocks")} WHERE ${sqlIdent("code")} IN (${slice.map(sqlLit).join(",")});`,
      );
    }
  }
  if (inserts.length > 0) {
    stmts.push(
      ...insertChunks(
        "stocks",
        [
          "code",
          "company_id",
          "exchange",
          "sector_tse",
          "price_jpy",
          "price_date",
          "change_pct",
          "market_cap_oku",
          "per",
          "pbr",
          "dividend_yield",
          "updated_at",
        ],
        inserts.map((s) => [
          s.code,
          s.company_id,
          s.exchange,
          s.sector_tse,
          s.price_jpy,
          s.price_date,
          s.change_pct,
          s.market_cap_oku,
          s.per,
          s.pbr,
          s.dividend_yield,
          s.updated_at,
        ]),
        100,
      ),
    );
  }
  for (const s of updates) {
    stmts.push(
      `UPDATE ${sqlIdent("stocks")} SET ${sqlIdent("company_id")}=${sqlLit(s.company_id)}, ${sqlIdent("exchange")}=${sqlLit(s.exchange)}, ${sqlIdent("sector_tse")}=${sqlLit(s.sector_tse)}, ${sqlIdent("price_jpy")}=${sqlLit(s.price_jpy)}, ${sqlIdent("price_date")}=${sqlLit(s.price_date)}, ${sqlIdent("change_pct")}=${sqlLit(s.change_pct)}, ${sqlIdent("market_cap_oku")}=${sqlLit(s.market_cap_oku)}, ${sqlIdent("per")}=${sqlLit(s.per)}, ${sqlIdent("pbr")}=${sqlLit(s.pbr)}, ${sqlIdent("dividend_yield")}=${sqlLit(s.dividend_yield)}, ${sqlIdent("updated_at")}=${sqlLit(s.updated_at)} WHERE ${sqlIdent("code")}=${sqlLit(s.code)};`,
    );
  }
  return stmts;
}

// ──────────────────────────────────────────────────
// 3) stock_prices_daily(過去 31 日 DELETE + INSERT)
// ──────────────────────────────────────────────────

type PriceRow = {
  code: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  adj_close: number | null;
};

function loadPricesCsv(): PriceRow[] {
  return readCsv("stock_prices_daily.csv").map((r) => ({
    code: r.code,
    date: r.date,
    open: parseFloatOrNull(r.open),
    high: parseFloatOrNull(r.high),
    low: parseFloatOrNull(r.low),
    close: parseFloatOrNull(r.close)!,
    volume: parseIntOrNull(r.volume),
    adj_close: parseFloatOrNull(r.adj_close),
  }));
}

/**
 * 価格テーブルは件数が多いので複数 SQL ファイルに分割する。
 *   - bundles[0] には DELETE + 先頭 chunk
 *   - 以降は INSERT のみ
 * トランザクションが分かれても、先頭の DELETE で PK 重複を防止できる。
 */
function buildPricesBundles(csv: PriceRow[]): SqlBundle[] {
  console.log(`📊 stock_prices_daily: CSV ${csv.length} 件、過去 ${PRICE_HISTORY_DAYS} 日を入れ替え`);
  const cols = ["code", "date", "open", "high", "low", "close", "volume", "adj_close"];
  const rows = csv.map((p) => [
    p.code,
    p.date,
    p.open,
    p.high,
    p.low,
    p.close,
    p.volume,
    p.adj_close,
  ]);
  // 1 INSERT = 500 行、1 ファイル = 60 INSERT = 30,000 行
  const ROWS_PER_FILE = 30_000;
  const bundles: SqlBundle[] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_FILE) {
    const slice = rows.slice(i, i + ROWS_PER_FILE);
    const stmts: string[] = [];
    if (i === 0) {
      stmts.push(
        `DELETE FROM ${sqlIdent("stock_prices_daily")} WHERE ${sqlIdent("date")} >= date('now','-${PRICE_HISTORY_DAYS} day');`,
      );
    }
    stmts.push(...insertChunks("stock_prices_daily", cols, slice, 500));
    bundles.push({ name: `prices-${String(i / ROWS_PER_FILE + 1).padStart(2, "0")}`, statements: stmts });
  }
  if (bundles.length === 0) {
    // CSV が 0 行のときも、過去 31 日の DELETE は実施(古いゴミを除去)
    bundles.push({
      name: "prices-01",
      statements: [
        `DELETE FROM ${sqlIdent("stock_prices_daily")} WHERE ${sqlIdent("date")} >= date('now','-${PRICE_HISTORY_DAYS} day');`,
      ],
    });
  }
  return bundles;
}

// ──────────────────────────────────────────────────
// 4) overlay セット(FK 逆順 DELETE → 順序 INSERT)
// ──────────────────────────────────────────────────

type SourceRow = {
  id: number;
  doc: string;
  page: number | null;
  period: string | null;
  url: string | null;
};

function loadSourcesCsv(): SourceRow[] {
  return readCsv("sources.csv").map((r) => ({
    id: parseIntOrNull(r.id)!,
    doc: r.doc,
    page: parseIntOrNull(r.page),
    period: emptyToNull(r.period),
    url: emptyToNull(r.url),
  }));
}

function buildOverlayBundle(): SqlBundle {
  // FK の依存関係に基づき、子から親へ DELETE → 親から子へ INSERT。
  // companies / stocks / stock_prices_daily は overlay 対象外。
  // sources は overlay 対象だが、companies と違って overlay 内で完結する FK 親なので最後に INSERT。
  const stmts: string[] = [];

  // ─ DELETE(子 → 親) ─
  stmts.push(`DELETE FROM ${sqlIdent("valuation_sources")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_valuation_calls")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_factor_betas")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_phase_scores")};`);
  stmts.push(`DELETE FROM ${sqlIdent("insight_sources")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_insights")};`);
  stmts.push(`DELETE FROM ${sqlIdent("business_tags")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_segments")};`);
  stmts.push(`DELETE FROM ${sqlIdent("company_industry_clusters")};`);
  stmts.push(`DELETE FROM ${sqlIdent("industry_clusters")};`);
  stmts.push(`DELETE FROM ${sqlIdent("industries")};`);
  stmts.push(`DELETE FROM ${sqlIdent("sources")};`);
  // sqlite_sequence をリセットして、再 INSERT 時の AUTOINCREMENT を 1 から振り直す
  stmts.push(
    `DELETE FROM ${sqlIdent("sqlite_sequence")} WHERE name IN ('sources','industry_clusters','business_tags','company_segments','company_insights');`,
  );

  // ─ sources ─
  const sources = loadSourcesCsv();
  stmts.push(
    ...insertChunks(
      "sources",
      ["id", "doc", "page", "period", "url"],
      sources.map((s) => [s.id, s.doc, s.page, s.period, s.url]),
    ),
  );

  // ─ industries ─
  const industries = readCsv("industries.csv");
  stmts.push(
    ...insertChunks(
      "industries",
      [
        "slug",
        "name",
        "short_name",
        "description",
        "theme_2025_json",
        "market_scale_headline",
        "market_scale_growth",
        "market_scale_breakdown",
        "chain_columns_json",
        "competitive_structure_json",
        "key_kpis_json",
        "industry_insights_json",
      ],
      industries.map((r) => [
        r.slug,
        r.name,
        r.short_name,
        emptyToNull(r.description),
        emptyToNull(r.theme_2025_json),
        emptyToNull(r.market_scale_headline),
        emptyToNull(r.market_scale_growth),
        emptyToNull(r.market_scale_breakdown),
        emptyToNull(r.chain_columns_json),
        emptyToNull(r.competitive_structure_json),
        emptyToNull(r.key_kpis_json),
        emptyToNull(r.industry_insights_json),
      ]),
    ),
  );

  // ─ industry_clusters(CSV の id をそのまま入れる) ─
  const clusters = readCsv("industry_clusters.csv");
  stmts.push(
    ...insertChunks(
      "industry_clusters",
      ["id", "industry_slug", "key", "name", "role", "position"],
      clusters.map((r) => [
        parseIntOrNull(r.id)!,
        r.industry_slug,
        r.key,
        r.name,
        r.role,
        r.position,
      ]),
    ),
  );

  // ─ company_industry_clusters ─
  const compClusters = readCsv("company_industry_clusters.csv");
  stmts.push(
    ...insertChunks(
      "company_industry_clusters",
      ["company_id", "industry_cluster_id"],
      compClusters.map((r) => [
        parseIntOrNull(r.company_id)!,
        parseIntOrNull(r.industry_cluster_id)!,
      ]),
    ),
  );

  // ─ business_tags ─
  const tags = readCsv("business_tags.csv");
  stmts.push(
    ...insertChunks(
      "business_tags",
      ["company_id", "dimension", "value", "source_id"],
      tags.map((r) => [
        parseIntOrNull(r.company_id)!,
        r.dimension,
        r.value,
        parseIntOrNull(r.source_id),
      ]),
    ),
  );

  // ─ company_segments ─
  const segs = readCsv("company_segments.csv");
  stmts.push(
    ...insertChunks(
      "company_segments",
      ["company_id", "period", "name", "revenue_oku", "share", "operating_margin", "source_id"],
      segs.map((r) => [
        parseIntOrNull(r.company_id)!,
        r.period,
        r.name,
        parseFloatOrNull(r.revenue_oku),
        parseFloatOrNull(r.share),
        parseFloatOrNull(r.operating_margin),
        parseIntOrNull(r.source_id),
      ]),
    ),
  );

  // ─ company_insights + insight_sources ─
  // CSV の insight_temp_id を AUTOINCREMENT id として直接採用する(本番側を全件入れ替えなので OK)
  const insightCsv = readCsv("company_insights.csv");
  stmts.push(
    ...insertChunks(
      "company_insights",
      ["id", "company_id", "title", "lede", "body", "generated_at"],
      insightCsv.map((r) => [
        parseIntOrNull(r.insight_temp_id)!,
        parseIntOrNull(r.company_id)!,
        r.title,
        emptyToNull(r.lede),
        r.body,
        r.generated_at,
      ]),
    ),
  );
  const insightSrc = readCsv("insight_sources.csv");
  stmts.push(
    ...insertChunks(
      "insight_sources",
      ["insight_id", "source_id"],
      insightSrc.map((r) => [
        parseIntOrNull(r.insight_temp_id)!,
        parseIntOrNull(r.source_id)!,
      ]),
    ),
  );

  // ─ company_phase_scores ─
  const phases = readCsv("company_phase_scores.csv");
  stmts.push(
    ...insertChunks(
      "company_phase_scores",
      ["company_id", "launch", "expansion", "mature", "decline", "rationale", "updated_at"],
      phases.map((r) => [
        parseIntOrNull(r.company_id)!,
        parseFloatOrNull(r.launch)!,
        parseFloatOrNull(r.expansion)!,
        parseFloatOrNull(r.mature)!,
        parseFloatOrNull(r.decline)!,
        emptyToNull(r.rationale),
        r.updated_at,
      ]),
    ),
  );

  // ─ company_factor_betas ─
  const betas = readCsv("company_factor_betas.csv");
  stmts.push(
    ...insertChunks(
      "company_factor_betas",
      ["company_id", "usdjpy", "us10y", "oil", "sox", "china", "market", "size", "value", "momentum", "period"],
      betas.map((r) => [
        parseIntOrNull(r.company_id)!,
        parseFloatOrNull(r.usdjpy)!,
        parseFloatOrNull(r.us10y)!,
        parseFloatOrNull(r.oil)!,
        parseFloatOrNull(r.sox)!,
        parseFloatOrNull(r.china)!,
        parseFloatOrNull(r.market)!,
        parseFloatOrNull(r.size)!,
        parseFloatOrNull(r.value)!,
        parseFloatOrNull(r.momentum)!,
        emptyToNull(r.period),
      ]),
    ),
  );

  // ─ company_valuation_calls + valuation_sources ─
  const valuations = readCsv("company_valuation_calls.csv");
  stmts.push(
    ...insertChunks(
      "company_valuation_calls",
      ["company_id", "verdict", "score", "rationale", "updated_at"],
      valuations.map((r) => [
        parseIntOrNull(r.company_id)!,
        r.verdict,
        parseIntOrNull(r.score)!,
        emptyToNull(r.rationale),
        r.updated_at,
      ]),
    ),
  );
  const valuationSrc = readCsv("valuation_sources.csv");
  stmts.push(
    ...insertChunks(
      "valuation_sources",
      ["company_id", "source_id"],
      valuationSrc.map((r) => [
        parseIntOrNull(r.company_id)!,
        parseIntOrNull(r.source_id)!,
      ]),
    ),
  );

  return { name: "overlay", statements: stmts };
}

// ──────────────────────────────────────────────────
// 5) 検証 SELECT(件数しきい値)
// ──────────────────────────────────────────────────

function verifyCounts() {
  console.log("🔎 件数しきい値チェック...");
  const res = execRemoteJson<{ n: number }>(
    "SELECT COUNT(*) AS n FROM companies; SELECT COUNT(*) AS n FROM stocks; SELECT COUNT(*) AS n FROM stock_prices_daily;",
  );
  const counts = res.map((r) => r.results?.[0]?.n ?? 0);
  const [companies, stocks, prices] = counts;
  console.log(`   companies=${companies}, stocks=${stocks}, stock_prices_daily=${prices}`);

  const MIN_COMPANIES = 3000;
  const MIN_STOCKS = 3000;
  if (companies < MIN_COMPANIES) {
    throw new Error(`companies が ${MIN_COMPANIES} 件未満です: ${companies}`);
  }
  if (stocks < MIN_STOCKS) {
    throw new Error(`stocks が ${MIN_STOCKS} 件未満です: ${stocks}`);
  }
}

// ──────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "🧪 DRY RUN" : "🚀 本番 D1 へ反映");

  const csvCompanies = loadCompaniesCsv();
  const csvStocks = loadStocksCsv();
  const csvPrices = loadPricesCsv();

  // 差分対象テーブルは本番から SELECT
  const remoteCompanies = DRY_RUN
    ? new Map<number, RemoteCompanyRow>()
    : fetchRemoteCompanies();
  const remoteStocks = DRY_RUN
    ? new Map<string, RemoteStockRow>()
    : fetchRemoteStocks();

  const bundles: SqlBundle[] = [];

  const companiesStmts = buildCompaniesSync(csvCompanies, remoteCompanies);
  if (companiesStmts.length > 0) {
    bundles.push({ name: "companies", statements: companiesStmts });
  } else {
    console.log("📊 companies: 差分なし");
  }

  const stocksStmts = buildStocksSync(csvStocks, remoteStocks);
  if (stocksStmts.length > 0) {
    bundles.push({ name: "stocks", statements: stocksStmts });
  } else {
    console.log("📊 stocks: 差分なし");
  }

  bundles.push(...buildPricesBundles(csvPrices));
  bundles.push(buildOverlayBundle());

  const paths = writeBundles(bundles);
  console.log(`📝 SQL ファイル ${paths.length} 本を ${TMP_DIR} に書き出しました`);

  if (DRY_RUN) {
    console.log("🧪 --dry-run のため反映はスキップ");
    return;
  }

  applyBundles(paths);
  verifyCounts();
  console.log("✅ 本番 D1 への同期が完了しました");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
