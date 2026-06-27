#!/usr/bin/env tsx
// 本番 Cloudflare D1 を 1 コマンドで最新化するエントリ。
//
//   1. 本番 D1 から id seed を SELECT(companies の name→id、sources の key→id)
//   2. JPX 銘柄一覧 + Yahoo Finance を取得し、data.ts overlay と合わせて全テーブルの
//      行を JS オブジェクトとして組み立てる(scripts/lib/buildRows.ts)
//   3. 本番 D1 から差分対象テーブル(companies / stocks)を SELECT し、INSERT/UPDATE/DELETE を判定
//   4. テーブル単位で SQL ファイルを tmp/sync-remote/*.sql に書き出す
//   5. wrangler d1 execute --remote --file=... で順次反映
//   6. 件数しきい値チェック
//
// 使い方:
//   pnpm db:refresh                 # 本番 D1 へ反映
//   pnpm db:refresh -- --dry-run    # SQL を tmp/ に書き出すだけ(本番に触らない)
//   pnpm db:refresh -- --skip-fetch # CSV 経由が無いので no-op(将来用)
//
// blog/admin 系(posts, post_tags, tags, admin_users, admin_sessions)はスコープ外。

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAllRows,
  emptyIdSeed,
  fetchExternal,
  overlayCodes,
  sourceKey,
  summarize,
  type AllRows,
  type CompanyRow,
  type IdSeed,
  type StockRow,
} from "./lib/buildRows.js";
import { execRemoteFile, execRemoteJson } from "./lib/d1Remote.js";
import { insertChunks, sqlIdent, sqlLit } from "./lib/sqlEscape.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TMP_DIR = join(ROOT, "tmp/sync-remote");

const DRY_RUN = process.argv.includes("--dry-run");
const PRICE_HISTORY_DAYS = 31;
const MIN_COMPANIES = 3000;
const MIN_STOCKS = 3000;

// ──────────────────────────────────────────────────
// id seed 取得
// ──────────────────────────────────────────────────

async function fetchIdSeed(): Promise<IdSeed> {
  if (DRY_RUN) {
    // dry-run でも本番から取りに行きたければ別フラグを切れば良いが、デフォルトでは空 seed で差分を最大化する
    console.log("🧪 DRY RUN: id seed を空で扱う(全行が INSERT 扱いになる)");
    return emptyIdSeed();
  }
  console.log("⬇️  本番 D1 から id seed を取得...");
  const companiesRes = execRemoteJson<{ id: number; name: string }>(
    "SELECT id, name FROM companies",
  );
  const sourcesRes = execRemoteJson<{
    id: number;
    doc: string;
    page: number | null;
    period: string | null;
    url: string | null;
  }>("SELECT id, doc, page, period, url FROM sources");
  const companies = companiesRes[0]?.results ?? [];
  const sources = sourcesRes[0]?.results ?? [];
  console.log(`   companies ${companies.length} / sources ${sources.length}`);
  return {
    companyIdByName: new Map(companies.map((c) => [c.name, c.id])),
    sourceIdByKey: new Map(sources.map((s) => [sourceKey(s), s.id])),
  };
}

// ──────────────────────────────────────────────────
// 差分対象テーブル(companies / stocks)を本番から SELECT
// ──────────────────────────────────────────────────

type RemoteCompanyRow = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  one_liner: string | null;
  edinet_code: string | null;
};

type RemoteStockRow = {
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
};

function fetchRemoteCompanies(): Map<number, RemoteCompanyRow> {
  if (DRY_RUN) return new Map();
  const res = execRemoteJson<RemoteCompanyRow>(
    "SELECT id, name, name_en, description, one_liner, edinet_code FROM companies",
  );
  return new Map((res[0]?.results ?? []).map((r) => [r.id, r]));
}

function fetchRemoteStocks(): Map<string, RemoteStockRow> {
  if (DRY_RUN) return new Map();
  const res = execRemoteJson<RemoteStockRow>(
    "SELECT code, company_id, exchange, sector_tse, price_jpy, price_date, change_pct, market_cap_oku, per, pbr, dividend_yield FROM stocks",
  );
  return new Map((res[0]?.results ?? []).map((r) => [r.code, r]));
}

// ──────────────────────────────────────────────────
// SQL ファイル束ね + 実行
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
// テーブル別 差分→SQL 変換
// ──────────────────────────────────────────────────

const COMPANY_DIFF_COLS = [
  "name",
  "name_en",
  "description",
  "one_liner",
  "edinet_code",
] as const;

function companiesEqual(a: RemoteCompanyRow, b: CompanyRow): boolean {
  for (const k of COMPANY_DIFF_COLS) {
    if ((a[k] ?? null) !== (b[k] ?? null)) return false;
  }
  return true;
}

function buildCompaniesSql(
  csv: CompanyRow[],
  remote: Map<number, RemoteCompanyRow>,
): string[] {
  const inserts: CompanyRow[] = [];
  const updates: CompanyRow[] = [];
  for (const c of csv) {
    const r = remote.get(c.id);
    if (r == null) inserts.push(c);
    else if (!companiesEqual(r, c)) updates.push(c);
  }
  console.log(
    `📊 companies: 入力 ${csv.length} 件、INSERT ${inserts.length} / UPDATE ${updates.length} / DELETE 0(残置)`,
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
    const sets = [
      `${sqlIdent("name")}=${sqlLit(c.name)}`,
      `${sqlIdent("name_en")}=${sqlLit(c.name_en)}`,
      `${sqlIdent("description")}=${sqlLit(c.description)}`,
      `${sqlIdent("one_liner")}=${sqlLit(c.one_liner)}`,
      `${sqlIdent("edinet_code")}=${sqlLit(c.edinet_code)}`,
      `${sqlIdent("updated_at")}=${sqlLit(c.updated_at)}`,
    ].join(", ");
    stmts.push(
      `UPDATE ${sqlIdent("companies")} SET ${sets} WHERE ${sqlIdent("id")}=${sqlLit(c.id)};`,
    );
  }
  return stmts;
}

const STOCK_DIFF_COLS = [
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
] as const;

function stocksEqual(a: RemoteStockRow, b: StockRow): boolean {
  for (const k of STOCK_DIFF_COLS) {
    if ((a[k] ?? null) !== (b[k] ?? null)) return false;
  }
  return true;
}

function buildStocksSql(
  csv: StockRow[],
  remote: Map<string, RemoteStockRow>,
): string[] {
  const csvCodes = new Set(csv.map((s) => s.code));
  const inserts: StockRow[] = [];
  const updates: StockRow[] = [];
  const deletes: string[] = [];
  for (const s of csv) {
    const r = remote.get(s.code);
    if (r == null) inserts.push(s);
    else if (!stocksEqual(r, s)) updates.push(s);
  }
  for (const code of remote.keys()) {
    if (!csvCodes.has(code)) deletes.push(code);
  }
  console.log(
    `📊 stocks: 入力 ${csv.length} 件、INSERT ${inserts.length} / UPDATE ${updates.length} / DELETE ${deletes.length}`,
  );

  const stmts: string[] = [];
  for (let i = 0; i < deletes.length; i += 500) {
    const slice = deletes.slice(i, i + 500);
    stmts.push(
      `DELETE FROM ${sqlIdent("stocks")} WHERE ${sqlIdent("code")} IN (${slice.map(sqlLit).join(",")});`,
    );
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
    const sets = [
      `${sqlIdent("company_id")}=${sqlLit(s.company_id)}`,
      `${sqlIdent("exchange")}=${sqlLit(s.exchange)}`,
      `${sqlIdent("sector_tse")}=${sqlLit(s.sector_tse)}`,
      `${sqlIdent("price_jpy")}=${sqlLit(s.price_jpy)}`,
      `${sqlIdent("price_date")}=${sqlLit(s.price_date)}`,
      `${sqlIdent("change_pct")}=${sqlLit(s.change_pct)}`,
      `${sqlIdent("market_cap_oku")}=${sqlLit(s.market_cap_oku)}`,
      `${sqlIdent("per")}=${sqlLit(s.per)}`,
      `${sqlIdent("pbr")}=${sqlLit(s.pbr)}`,
      `${sqlIdent("dividend_yield")}=${sqlLit(s.dividend_yield)}`,
      `${sqlIdent("updated_at")}=${sqlLit(s.updated_at)}`,
    ].join(", ");
    stmts.push(
      `UPDATE ${sqlIdent("stocks")} SET ${sets} WHERE ${sqlIdent("code")}=${sqlLit(s.code)};`,
    );
  }
  return stmts;
}

// stock_prices_daily: 過去 31 日 DELETE → 全件 INSERT(3 万行/ファイルに分割)
function buildPricesBundles(rows: AllRows["stock_prices_daily"]): SqlBundle[] {
  console.log(
    `📊 stock_prices_daily: 入力 ${rows.length} 件、過去 ${PRICE_HISTORY_DAYS} 日を入れ替え`,
  );
  const cols = ["code", "date", "open", "high", "low", "close", "volume", "adj_close"];
  const values = rows.map((p) => [
    p.code,
    p.date,
    p.open,
    p.high,
    p.low,
    p.close,
    p.volume,
    p.adj_close,
  ]);
  const ROWS_PER_FILE = 30_000;
  const bundles: SqlBundle[] = [];
  for (let i = 0; i < values.length; i += ROWS_PER_FILE) {
    const slice = values.slice(i, i + ROWS_PER_FILE);
    const stmts: string[] = [];
    if (i === 0) {
      stmts.push(
        `DELETE FROM ${sqlIdent("stock_prices_daily")} WHERE ${sqlIdent("date")} >= date('now','-${PRICE_HISTORY_DAYS} day');`,
      );
    }
    stmts.push(...insertChunks("stock_prices_daily", cols, slice, 500));
    bundles.push({
      name: `prices-${String(i / ROWS_PER_FILE + 1).padStart(2, "0")}`,
      statements: stmts,
    });
  }
  if (bundles.length === 0) {
    bundles.push({
      name: "prices-01",
      statements: [
        `DELETE FROM ${sqlIdent("stock_prices_daily")} WHERE ${sqlIdent("date")} >= date('now','-${PRICE_HISTORY_DAYS} day');`,
      ],
    });
  }
  return bundles;
}

// overlay セット: FK 逆順 DELETE → 順方向 INSERT を 1 ファイル(原子操作)に
function buildOverlayBundle(rows: AllRows): SqlBundle {
  const stmts: string[] = [];

  // DELETE(子 → 親)
  for (const t of [
    "valuation_sources",
    "company_valuation_calls",
    "company_factor_betas",
    "company_phase_scores",
    "insight_sources",
    "company_insights",
    "business_tags",
    "company_segments",
    "company_industry_clusters",
    "industry_clusters",
    "industries",
    "sources",
  ]) {
    stmts.push(`DELETE FROM ${sqlIdent(t)};`);
  }
  // AUTOINCREMENT カウンタをリセット(再 INSERT で id 1 から振り直し)
  stmts.push(
    `DELETE FROM ${sqlIdent("sqlite_sequence")} WHERE name IN ('sources','industry_clusters','business_tags','company_segments','company_insights');`,
  );

  // INSERT(親 → 子)
  stmts.push(
    ...insertChunks(
      "sources",
      ["id", "doc", "page", "period", "url"],
      rows.sources.map((s) => [s.id, s.doc, s.page, s.period, s.url]),
    ),
  );

  // industries: 1 行/INSERT(JSON カラムが数十 KB に膨らみ得るため)
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
      rows.industries.map((r) => [
        r.slug,
        r.name,
        r.short_name,
        r.description,
        r.theme_2025_json,
        r.market_scale_headline,
        r.market_scale_growth,
        r.market_scale_breakdown,
        r.chain_columns_json,
        r.competitive_structure_json,
        r.key_kpis_json,
        r.industry_insights_json,
      ]),
      1,
    ),
  );

  stmts.push(
    ...insertChunks(
      "industry_clusters",
      ["id", "industry_slug", "key", "name", "role", "position"],
      rows.industry_clusters.map((r) => [
        r.id,
        r.industry_slug,
        r.key,
        r.name,
        r.role,
        r.position,
      ]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "company_industry_clusters",
      ["company_id", "industry_cluster_id"],
      rows.company_industry_clusters.map((r) => [r.company_id, r.industry_cluster_id]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "business_tags",
      ["company_id", "dimension", "value", "source_id"],
      rows.business_tags.map((r) => [r.company_id, r.dimension, r.value, r.source_id]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "company_segments",
      [
        "company_id",
        "period",
        "name",
        "revenue_oku",
        "share",
        "operating_margin",
        "source_id",
      ],
      rows.company_segments.map((r) => [
        r.company_id,
        r.period,
        r.name,
        r.revenue_oku,
        r.share,
        r.operating_margin,
        r.source_id,
      ]),
    ),
  );

  // company_insights: body が長文なので 20 行/INSERT
  stmts.push(
    ...insertChunks(
      "company_insights",
      ["id", "company_id", "title", "lede", "body", "generated_at"],
      rows.company_insights.map((r) => [
        r.id,
        r.company_id,
        r.title,
        r.lede,
        r.body,
        r.generated_at,
      ]),
      20,
    ),
  );

  stmts.push(
    ...insertChunks(
      "insight_sources",
      ["insight_id", "source_id"],
      rows.insight_sources.map((r) => [r.insight_id, r.source_id]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "company_phase_scores",
      [
        "company_id",
        "launch",
        "expansion",
        "mature",
        "decline",
        "rationale",
        "updated_at",
      ],
      rows.company_phase_scores.map((r) => [
        r.company_id,
        r.launch,
        r.expansion,
        r.mature,
        r.decline,
        r.rationale,
        r.updated_at,
      ]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "company_factor_betas",
      [
        "company_id",
        "usdjpy",
        "us10y",
        "oil",
        "sox",
        "china",
        "market",
        "size",
        "value",
        "momentum",
        "period",
      ],
      rows.company_factor_betas.map((r) => [
        r.company_id,
        r.usdjpy,
        r.us10y,
        r.oil,
        r.sox,
        r.china,
        r.market,
        r.size,
        r.value,
        r.momentum,
        r.period,
      ]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "company_valuation_calls",
      ["company_id", "verdict", "score", "rationale", "updated_at"],
      rows.company_valuation_calls.map((r) => [
        r.company_id,
        r.verdict,
        r.score,
        r.rationale,
        r.updated_at,
      ]),
    ),
  );

  stmts.push(
    ...insertChunks(
      "valuation_sources",
      ["company_id", "source_id"],
      rows.valuation_sources.map((r) => [r.company_id, r.source_id]),
    ),
  );

  return { name: "overlay", statements: stmts };
}

// ──────────────────────────────────────────────────
// 件数しきい値チェック
// ──────────────────────────────────────────────────

function verifyCounts() {
  console.log("🔎 件数しきい値チェック...");
  const res = execRemoteJson<{ n: number }>(
    "SELECT COUNT(*) AS n FROM companies; SELECT COUNT(*) AS n FROM stocks; SELECT COUNT(*) AS n FROM stock_prices_daily;",
  );
  const [companies, stocks, prices] = res.map((r) => r.results?.[0]?.n ?? 0);
  console.log(`   companies=${companies}, stocks=${stocks}, stock_prices_daily=${prices}`);
  if (companies < MIN_COMPANIES) {
    throw new Error(`companies が ${MIN_COMPANIES} 件未満: ${companies}`);
  }
  if (stocks < MIN_STOCKS) {
    throw new Error(`stocks が ${MIN_STOCKS} 件未満: ${stocks}`);
  }
}

// ──────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "🧪 DRY RUN(本番には書き込まない)" : "🚀 本番 D1 へ反映");

  const idSeed = await fetchIdSeed();

  const chartCodes = await overlayCodes();
  const external = await fetchExternal({ chartCodes });
  if (existsSync("/dev/stdout")) process.stdout.write("\n");

  const rows = await buildAllRows(external, idSeed);
  console.log(`✅ 行組み立て完了:\n   ${summarize(rows)}`);

  const remoteCompanies = fetchRemoteCompanies();
  const remoteStocks = fetchRemoteStocks();

  const bundles: SqlBundle[] = [];

  const companiesStmts = buildCompaniesSql(rows.companies, remoteCompanies);
  if (companiesStmts.length > 0) {
    bundles.push({ name: "companies", statements: companiesStmts });
  } else {
    console.log("📊 companies: 差分なし");
  }

  const stocksStmts = buildStocksSql(rows.stocks, remoteStocks);
  if (stocksStmts.length > 0) {
    bundles.push({ name: "stocks", statements: stocksStmts });
  } else {
    console.log("📊 stocks: 差分なし");
  }

  bundles.push(...buildPricesBundles(rows.stock_prices_daily));
  bundles.push(buildOverlayBundle(rows));

  const paths = writeBundles(bundles);
  console.log(`📝 SQL ファイル ${paths.length} 本を ${TMP_DIR} に書き出し`);

  if (DRY_RUN) {
    console.log("🧪 DRY RUN のため反映はスキップ");
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
