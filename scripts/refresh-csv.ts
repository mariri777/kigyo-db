#!/usr/bin/env tsx
// CSV 生成スクリプト(オンライン実行が必要)。
//
// JPX 銘柄一覧 + Yahoo Finance 価格 + data.ts/industries.ts のオーバーレイ
// から scripts/seed/*.csv を全件再生成する。
//
// 使い方:
//   pnpm db:refresh-csv
//
// 生成される CSV(scripts/seed/ 配下):
//   companies.csv, stocks.csv, stock_prices_daily.csv,
//   sources.csv, industries.csv, industry_clusters.csv,
//   company_industry_clusters.csv, business_tags.csv,
//   company_segments.csv, company_insights.csv, insight_sources.csv,
//   company_phase_scores.csv, company_factor_betas.csv,
//   company_valuation_calls.csv, valuation_sources.csv
//
// 冪等性:
//   既存 companies.csv の id を保持する(JPX に残っている企業のみ)。
//   新規上場企業には max(id) + 1 から採番する。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchJpxExcel, parseJpxExcel, type JpxStock } from "./lib/jpx.js";
import { newYahoo, fetchQuotesAll, fetchChartsAll } from "./lib/yahoo.js";
import { buildCsv, parseCsv, csvRowsToObjects } from "./lib/csv.js";
import { loadDataTs, loadIndustriesTs } from "./lib/dataTsLoader.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");

const HISTORY_DAYS = 30;

async function main() {
  mkdirSync(SEED_DIR, { recursive: true });

  // ─── 1. JPX 取得 ─────────────────────────────────────
  console.log("⬇️  JPX 銘柄一覧を取得...");
  const jpxBuf = await fetchJpxExcel();
  const { stocks: jpxStocks, baseDate } = parseJpxExcel(jpxBuf);
  console.log(`   ${jpxStocks.length} 銘柄(内国株)、基準日 ${baseDate ?? "(不明)"}`);

  // ─── 2. data.ts / industries.ts 読み込み ───────────
  const dataMod = await loadDataTs();
  const industriesMod = await loadIndustriesTs();
  const overlayStocks = dataMod.stocks;
  const industries = industriesMod.industries;
  console.log(
    `📋 data.ts オーバーレイ ${overlayStocks.length} 銘柄 / industries.ts ${industries.length} 業界`,
  );

  // ─── 3. id 採番 ───────────────────────────────────
  //   優先度:
  //     1) 環境変数 ID_SEED_JSON で指定されたファイル(本番 D1 から吸い出した JSON)
  //     2) 既存 scripts/seed/companies.csv(ローカル開発のフォールバック)
  //
  //   sources も同様に、ID_SEED_JSON の sources 配列から (doc,page,period,url) を
  //   キーに既存 id を継承する(後述 7 節を参照)。
  const seedJsonPath = process.env.ID_SEED_JSON;
  type IdSeedJson = {
    companies?: { id: number; name: string }[];
    sources?: {
      id: number;
      doc: string;
      page: number | null;
      period: string | null;
      url: string | null;
    }[];
  };
  let idSeed: IdSeedJson | null = null;
  if (seedJsonPath) {
    if (!existsSync(seedJsonPath)) {
      throw new Error(`ID_SEED_JSON が指す JSON が見つかりません: ${seedJsonPath}`);
    }
    idSeed = JSON.parse(readFileSync(seedJsonPath, "utf8")) as IdSeedJson;
    console.log(
      `🔁 ID_SEED_JSON から companies ${idSeed.companies?.length ?? 0} 件 / sources ${idSeed.sources?.length ?? 0} 件の id を継承`,
    );
  }

  const existingCompaniesPath = join(SEED_DIR, "companies.csv");
  const existingIdByName = new Map<string, number>();
  let nextCompanyId = 1;
  if (idSeed?.companies && idSeed.companies.length > 0) {
    for (const c of idSeed.companies) {
      if (Number.isFinite(c.id)) {
        existingIdByName.set(c.name, c.id);
        if (c.id >= nextCompanyId) nextCompanyId = c.id + 1;
      }
    }
  } else if (existsSync(existingCompaniesPath)) {
    const rows = csvRowsToObjects(
      parseCsv(readFileSync(existingCompaniesPath, "utf8")),
    );
    for (const r of rows) {
      const id = Number(r.id);
      if (Number.isFinite(id)) {
        existingIdByName.set(r.name, id);
        if (id >= nextCompanyId) nextCompanyId = id + 1;
      }
    }
    console.log(
      `🔁 既存 companies.csv から ${existingIdByName.size} 件の id を継承`,
    );
  }

  // ─── 4. JPX 銘柄 → company レコードに変換 ─────────────
  const overlayByCode = new Map(overlayStocks.map((s) => [s.code, s]));
  type CompanyRow = {
    id: number;
    name: string;
    nameEn: string | null;
    description: string | null;
    oneLiner: string | null;
    edinetCode: string | null;
  };
  const companies: CompanyRow[] = [];
  const companyIdByCode = new Map<string, number>(); // stock.code → company.id

  for (const j of jpxStocks) {
    const ov = overlayByCode.get(j.code);
    let id = existingIdByName.get(j.name);
    if (id == null) {
      id = nextCompanyId++;
    }
    companies.push({
      id,
      name: j.name,
      nameEn: ov?.nameEn ?? null,
      description: ov?.description ?? null,
      oneLiner: ov?.oneLiner ?? null,
      edinetCode: null,
    });
    companyIdByCode.set(j.code, id);
  }
  // id 昇順で並べてコミット差分を安定化
  companies.sort((a, b) => a.id - b.id);

  // ─── 5. Yahoo quote 取得 ─────────────────────────────
  console.log(`📡 Yahoo quote(${jpxStocks.length} 銘柄)...`);
  const yf = newYahoo();
  const codes = jpxStocks.map((j) => j.code);
  const t0 = Date.now();
  const quotes = await fetchQuotesAll(yf, codes, {
    onProgress: (done, total, ok) => {
      process.stdout.write(`\r   ${done}/${total} バッチ・${ok} 銘柄取得済`);
    },
  });
  process.stdout.write(`\n   done in ${Date.now() - t0}ms\n`);

  // ─── 6. data.ts のオーバーレイ 68 銘柄だけ chart 取得 ──
  console.log(`📡 Yahoo chart(オーバーレイ ${overlayStocks.length} 銘柄、過去 ${HISTORY_DAYS} 日)...`);
  const overlayCodes = overlayStocks.map((s) => s.code);
  const t1 = Date.now();
  const charts = await fetchChartsAll(yf, overlayCodes, HISTORY_DAYS, {
    onProgress: (done, total, ok) => {
      process.stdout.write(`\r   ${done}/${total}・${ok} 件成功`);
    },
  });
  process.stdout.write(`\n   done in ${Date.now() - t1}ms\n`);

  // ─── 7. sources の uniq 採番(data.ts の Source オブジェクト全件を吸い上げ) ──
  // (doc, page, period, url) で uniq に。
  type SourceRow = {
    id: number;
    doc: string;
    page: number | null;
    period: string | null;
    url: string | null;
  };
  const sourceKey = (s: { doc: string; page?: number | null; period?: string | null; url?: string | null }) =>
    `${s.doc}|${s.page ?? ""}|${s.period ?? ""}|${s.url ?? ""}`;
  const sourceIdByKey = new Map<string, number>();
  const sources: SourceRow[] = [];
  let nextSourceId = 1;

  // id seed があれば、既存 sources の id を (doc,page,period,url) キーで継承し、
  // 新規分は max(seed.id)+1 から採番する。これで本番 D1 と source_id がズレない。
  if (idSeed?.sources && idSeed.sources.length > 0) {
    for (const s of idSeed.sources) {
      const k = sourceKey(s);
      sourceIdByKey.set(k, s.id);
      sources.push({
        id: s.id,
        doc: s.doc,
        page: s.page ?? null,
        period: s.period ?? null,
        url: s.url ?? null,
      });
      if (s.id >= nextSourceId) nextSourceId = s.id + 1;
    }
  }

  function ensureSourceId(s: {
    doc: string;
    page?: number;
    period?: string;
    url?: string;
  }): number {
    const k = sourceKey(s);
    let id = sourceIdByKey.get(k);
    if (id != null) return id;
    id = nextSourceId++;
    sources.push({
      id,
      doc: s.doc,
      page: s.page ?? null,
      period: s.period ?? null,
      url: s.url ?? null,
    });
    sourceIdByKey.set(k, id);
    return id;
  }

  // ─── 8. business_tags / segments / insights / valuation / phase / factor 用テーブル ──
  type BusinessTagRow = {
    companyId: number;
    dimension: string;
    value: string;
    sourceId: number | null;
  };
  type SegmentRow = {
    companyId: number;
    period: string;
    name: string;
    revenueOku: number | null;
    share: number | null;
    operatingMargin: number | null;
    sourceId: number | null;
  };
  type InsightRow = {
    insightTempId: number; // CSV ファイル内での id(後で AUTOINCREMENT に任せるなら別)
    companyId: number;
    title: string;
    lede: string | null;
    body: string;
    generatedAt: string;
  };
  type InsightSourceRow = { insightTempId: number; sourceId: number };
  type PhaseRow = {
    companyId: number;
    launch: number;
    expansion: number;
    mature: number;
    decline: number;
    rationale: string | null;
    updatedAt: string;
  };
  type FactorBetaRow = {
    companyId: number;
    usdjpy: number;
    us10y: number;
    oil: number;
    sox: number;
    china: number;
    market: number;
    size: number;
    value: number;
    momentum: number;
    period: string | null;
  };
  type ValuationRow = {
    companyId: number;
    verdict: string;
    score: number;
    rationale: string | null;
    updatedAt: string;
  };
  type ValuationSourceRow = { companyId: number; sourceId: number };

  const businessTags: BusinessTagRow[] = [];
  const segments: SegmentRow[] = [];
  const insights: InsightRow[] = [];
  const insightSources: InsightSourceRow[] = [];
  const phases: PhaseRow[] = [];
  const factorBetas: FactorBetaRow[] = [];
  const valuations: ValuationRow[] = [];
  const valuationSources: ValuationSourceRow[] = [];

  let insightTempId = 0;
  const generatedAtFallback = new Date().toISOString();

  for (const s of overlayStocks) {
    const companyId = companyIdByCode.get(s.code);
    if (companyId == null) {
      console.warn(`   ⚠️ overlay ${s.code} (${s.name}) は JPX にないためスキップ`);
      continue;
    }

    for (const t of s.tags) {
      businessTags.push({
        companyId,
        dimension: t.dimension,
        value: t.value,
        sourceId: ensureSourceId(t.source),
      });
    }

    for (const seg of s.segments) {
      segments.push({
        companyId,
        period: s.segmentsPeriod ?? "",
        name: seg.name,
        revenueOku: seg.revenueOku,
        share: seg.share,
        operatingMargin: seg.operatingMargin ?? null,
        sourceId: null, // セグメント単位の source は data.ts 上では未指定
      });
    }

    for (const ins of s.insights) {
      insightTempId += 1;
      insights.push({
        insightTempId,
        companyId,
        title: ins.title,
        lede: ins.lede ?? null,
        body: ins.body,
        generatedAt: ins.generatedAt ?? generatedAtFallback,
      });
      for (const c of ins.citations) {
        insightSources.push({
          insightTempId,
          sourceId: ensureSourceId(c),
        });
      }
    }

    // data.ts のモックオーバーレイは AI 生成 3 ブロック(phase/factor/valuation)を必ず持つ前提。
    // 万一欠けていたらその銘柄の該当行はスキップする。
    if (s.phaseScores) {
      phases.push({
        companyId,
        launch: s.phaseScores.launch,
        expansion: s.phaseScores.expansion,
        mature: s.phaseScores.mature,
        decline: s.phaseScores.decline,
        rationale: s.phaseRationale ?? null,
        updatedAt: generatedAtFallback,
      });
    }

    if (s.factorBetas) {
      factorBetas.push({
        companyId,
        usdjpy: s.factorBetas.usdjpy,
        us10y: s.factorBetas.us10y,
        oil: s.factorBetas.oil,
        sox: s.factorBetas.sox,
        china: s.factorBetas.china,
        market: s.factorBetas.market,
        size: s.factorBetas.size,
        value: s.factorBetas.value,
        momentum: s.factorBetas.momentum,
        period: s.factorPeriod ?? null,
      });
    }

    if (s.valuationCall) {
      valuations.push({
        companyId,
        verdict: s.valuationCall.verdict,
        score: s.valuationCall.score,
        rationale: s.valuationCall.rationale ?? null,
        updatedAt: generatedAtFallback,
      });
      for (const c of s.valuationCall.citations) {
        valuationSources.push({
          companyId,
          sourceId: ensureSourceId(c),
        });
      }
    }
  }

  // ─── 9. industries / industry_clusters / company_industry_clusters ──
  type IndustryRow = {
    slug: string;
    name: string;
    shortName: string;
    description: string;
    theme2025Json: string;
    marketScaleHeadline: string;
    marketScaleGrowth: string;
    marketScaleBreakdown: string;
    chainColumnsJson: string;
    competitiveStructureJson: string;
    keyKpisJson: string;
    industryInsightsJson: string;
  };
  type IndustryClusterRow = {
    id: number;
    industrySlug: string;
    key: string;
    name: string;
    role: string;
    position: string;
  };
  type CompanyClusterRow = {
    companyId: number;
    industryClusterId: number;
  };

  const industriesRows: IndustryRow[] = [];
  const clustersRows: IndustryClusterRow[] = [];
  const companyClusterRows: CompanyClusterRow[] = [];
  let clusterId = 0;

  for (const ind of industries) {
    industriesRows.push({
      slug: ind.slug,
      name: ind.name,
      shortName: ind.shortName,
      description: ind.description,
      theme2025Json: JSON.stringify(ind.theme2025),
      marketScaleHeadline: ind.marketScale.headline,
      marketScaleGrowth: ind.marketScale.growth,
      marketScaleBreakdown: ind.marketScale.breakdown,
      chainColumnsJson: JSON.stringify(ind.chainColumns),
      competitiveStructureJson: JSON.stringify(ind.competitiveStructure),
      keyKpisJson: JSON.stringify(ind.keyKpis),
      industryInsightsJson: JSON.stringify(ind.industryInsights),
    });

    for (const sub of ind.subClusters) {
      clusterId += 1;
      clustersRows.push({
        id: clusterId,
        industrySlug: ind.slug,
        key: sub.key,
        name: sub.name,
        role: sub.role,
        position: sub.position,
      });
      for (const code of sub.companyCodes) {
        const cid = companyIdByCode.get(code);
        if (cid == null) continue;
        companyClusterRows.push({
          companyId: cid,
          industryClusterId: clusterId,
        });
      }
    }
  }

  // ─── 10. stocks 行(JPX × Yahoo) ────────────────────
  type StockCsvRow = {
    code: string;
    companyId: number;
    exchange: string;
    sectorTSE: string;
    priceJpy: number | null;
    priceDate: string | null;
    changePct: number | null;
    marketCapOku: number | null;
    per: number | null;
    pbr: number | null;
    dividendYield: number | null;
    updatedAt: string;
  };
  const updatedAt = new Date().toISOString();
  const stockRows: StockCsvRow[] = [];
  for (const j of jpxStocks) {
    const q = quotes.get(j.code);
    stockRows.push({
      code: j.code,
      companyId: companyIdByCode.get(j.code)!,
      exchange: j.exchange,
      sectorTSE: j.sectorTSE,
      priceJpy: q?.priceJpy ?? null,
      priceDate: q?.priceDate ?? null,
      changePct: q?.changePct ?? null,
      marketCapOku: q?.marketCapOku ?? null,
      per: q?.per ?? null,
      pbr: q?.pbr ?? null,
      dividendYield: q?.dividendYield ?? null,
      updatedAt,
    });
  }

  // ─── 11. stock_prices_daily ───────────────────────
  type PriceCsvRow = {
    code: string;
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number;
    volume: number | null;
    adjClose: number | null;
  };
  const priceRows: PriceCsvRow[] = [];
  for (const [code, c] of charts) {
    for (const r of c.quotes) {
      if (r.close == null) continue;
      const date = (r.date instanceof Date ? r.date : new Date(r.date))
        .toISOString()
        .slice(0, 10);
      priceRows.push({
        code,
        date,
        open: r.open ?? null,
        high: r.high ?? null,
        low: r.low ?? null,
        close: r.close,
        volume: r.volume ?? null,
        adjClose: r.adjclose ?? null,
      });
    }
  }

  // ─── 12. CSV 書き出し ────────────────────────────────
  const createdAt = updatedAt;

  writeFileSync(
    join(SEED_DIR, "companies.csv"),
    buildCsv(
      ["id", "name", "name_en", "description", "one_liner", "edinet_code", "created_at", "updated_at"],
      companies.map((c) => [
        c.id,
        c.name,
        c.nameEn,
        c.description,
        c.oneLiner,
        c.edinetCode,
        createdAt,
        updatedAt,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "stocks.csv"),
    buildCsv(
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
      stockRows.map((s) => [
        s.code,
        s.companyId,
        s.exchange,
        s.sectorTSE,
        s.priceJpy,
        s.priceDate,
        s.changePct,
        s.marketCapOku,
        s.per,
        s.pbr,
        s.dividendYield,
        s.updatedAt,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "stock_prices_daily.csv"),
    buildCsv(
      ["code", "date", "open", "high", "low", "close", "volume", "adj_close"],
      priceRows.map((p) => [p.code, p.date, p.open, p.high, p.low, p.close, p.volume, p.adjClose]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "sources.csv"),
    buildCsv(
      ["id", "doc", "page", "period", "url"],
      sources.map((s) => [s.id, s.doc, s.page, s.period, s.url]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "industries.csv"),
    buildCsv(
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
      industriesRows.map((i) => [
        i.slug,
        i.name,
        i.shortName,
        i.description,
        i.theme2025Json,
        i.marketScaleHeadline,
        i.marketScaleGrowth,
        i.marketScaleBreakdown,
        i.chainColumnsJson,
        i.competitiveStructureJson,
        i.keyKpisJson,
        i.industryInsightsJson,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "industry_clusters.csv"),
    buildCsv(
      ["id", "industry_slug", "key", "name", "role", "position"],
      clustersRows.map((c) => [c.id, c.industrySlug, c.key, c.name, c.role, c.position]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "company_industry_clusters.csv"),
    buildCsv(
      ["company_id", "industry_cluster_id"],
      companyClusterRows.map((r) => [r.companyId, r.industryClusterId]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "business_tags.csv"),
    buildCsv(
      ["company_id", "dimension", "value", "source_id"],
      businessTags.map((b) => [b.companyId, b.dimension, b.value, b.sourceId]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "company_segments.csv"),
    buildCsv(
      [
        "company_id",
        "period",
        "name",
        "revenue_oku",
        "share",
        "operating_margin",
        "source_id",
      ],
      segments.map((s) => [
        s.companyId,
        s.period,
        s.name,
        s.revenueOku,
        s.share,
        s.operatingMargin,
        s.sourceId,
      ]),
    ),
  );

  // insight_temp_id は CSV 上での仮 id。seed 時に各 insight に AUTOINCREMENT id が振られるため、
  // insight_sources.csv も同じ仮 id で参照する。
  writeFileSync(
    join(SEED_DIR, "company_insights.csv"),
    buildCsv(
      ["insight_temp_id", "company_id", "title", "lede", "body", "generated_at"],
      insights.map((i) => [
        i.insightTempId,
        i.companyId,
        i.title,
        i.lede,
        i.body,
        i.generatedAt,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "insight_sources.csv"),
    buildCsv(
      ["insight_temp_id", "source_id"],
      insightSources.map((r) => [r.insightTempId, r.sourceId]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "company_phase_scores.csv"),
    buildCsv(
      [
        "company_id",
        "launch",
        "expansion",
        "mature",
        "decline",
        "rationale",
        "updated_at",
      ],
      phases.map((p) => [
        p.companyId,
        p.launch,
        p.expansion,
        p.mature,
        p.decline,
        p.rationale,
        p.updatedAt,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "company_factor_betas.csv"),
    buildCsv(
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
      factorBetas.map((f) => [
        f.companyId,
        f.usdjpy,
        f.us10y,
        f.oil,
        f.sox,
        f.china,
        f.market,
        f.size,
        f.value,
        f.momentum,
        f.period,
      ]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "company_valuation_calls.csv"),
    buildCsv(
      ["company_id", "verdict", "score", "rationale", "updated_at"],
      valuations.map((v) => [v.companyId, v.verdict, v.score, v.rationale, v.updatedAt]),
    ),
  );

  writeFileSync(
    join(SEED_DIR, "valuation_sources.csv"),
    buildCsv(
      ["company_id", "source_id"],
      valuationSources.map((v) => [v.companyId, v.sourceId]),
    ),
  );

  console.log("\n✅ CSV 生成完了:");
  console.log(`   companies            : ${companies.length}`);
  console.log(`   stocks               : ${stockRows.length}`);
  console.log(`   stock_prices_daily   : ${priceRows.length}`);
  console.log(`   sources              : ${sources.length}`);
  console.log(`   industries           : ${industriesRows.length}`);
  console.log(`   industry_clusters    : ${clustersRows.length}`);
  console.log(`   company_industry_clusters : ${companyClusterRows.length}`);
  console.log(`   business_tags        : ${businessTags.length}`);
  console.log(`   company_segments     : ${segments.length}`);
  console.log(`   company_insights     : ${insights.length}`);
  console.log(`   insight_sources      : ${insightSources.length}`);
  console.log(`   company_phase_scores : ${phases.length}`);
  console.log(`   company_factor_betas : ${factorBetas.length}`);
  console.log(`   company_valuation_calls : ${valuations.length}`);
  console.log(`   valuation_sources    : ${valuationSources.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
