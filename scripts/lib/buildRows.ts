// 企業 DB の全テーブルを「JS オブジェクト配列」として組み立てる純粋関数群。
//
// 入力: JPX 銘柄一覧 + Yahoo 価格 + Yahoo チャート + data.ts overlay + industries.ts + id seed
// 出力: 各テーブルの行配列(Drizzle スキーマと同じカラム名で型付け)
//
// この層は本番 D1 への差分同期(scripts/refresh-d1.ts)とローカル D1 の初期投入
// (scripts/seed-local.ts)の両方から再利用される。
// 副作用なし(I/O を一切行わない)ので unit test しやすい。

import type { ChartResultArray } from "yahoo-finance2/modules/chart";

import { fetchJpxExcel, parseJpxExcel, type JpxStock } from "./jpx.js";
import {
  newYahoo,
  fetchQuotesAll,
  fetchChartsAll,
  type QuoteSnapshot,
} from "./yahoo.js";
import { loadDataTs, loadIndustriesTs } from "./dataTsLoader.js";

const PRICE_HISTORY_DAYS = 30;

// ──────────────────────────────────────────────────
// テーブル別の行型(Drizzle スキーマの命名に合わせる)
// ──────────────────────────────────────────────────

export type CompanyRow = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  one_liner: string | null;
  edinet_code: string | null;
  created_at: string;
  updated_at: string;
};

export type StockRow = {
  code: string;
  company_id: number;
  exchange: "Prime" | "Standard" | "Growth";
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

export type StockPriceDailyRow = {
  code: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  adj_close: number | null;
};

export type SourceRow = {
  id: number;
  doc: string;
  page: number | null;
  period: string | null;
  url: string | null;
};

export type IndustryRow = {
  slug: string;
  name: string;
  short_name: string;
  description: string | null;
  theme_2025_json: string | null;
  market_scale_headline: string | null;
  market_scale_growth: string | null;
  market_scale_breakdown: string | null;
  chain_columns_json: string | null;
  competitive_structure_json: string | null;
  key_kpis_json: string | null;
  industry_insights_json: string | null;
};

export type IndustryClusterRow = {
  id: number;
  industry_slug: string;
  key: string;
  name: string;
  role: string;
  position: string;
};

export type CompanyIndustryClusterRow = {
  company_id: number;
  industry_cluster_id: number;
};

export type BusinessTagRow = {
  company_id: number;
  dimension:
    | "product"
    | "customer"
    | "channel"
    | "revenue_model"
    | "value_chain"
    | "geography";
  value: string;
  source_id: number | null;
};

export type CompanySegmentRow = {
  company_id: number;
  period: string;
  name: string;
  revenue_oku: number | null;
  share: number | null;
  operating_margin: number | null;
  source_id: number | null;
};

export type CompanyInsightRow = {
  // CSV 経由のときの insight_temp_id をそのまま AUTOINCREMENT id として採用する。
  // overlay は毎回 DROP & INSERT なので、id を採番して FK 子の insight_sources と
  // 同じ id で繋ぐだけで整合する。
  id: number;
  company_id: number;
  title: string;
  lede: string | null;
  body: string;
  generated_at: string;
};

export type InsightSourceRow = { insight_id: number; source_id: number };

export type CompanyPhaseScoreRow = {
  company_id: number;
  launch: number;
  expansion: number;
  mature: number;
  decline: number;
  rationale: string | null;
  updated_at: string;
};

export type CompanyFactorBetaRow = {
  company_id: number;
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

export type CompanyValuationCallRow = {
  company_id: number;
  verdict: "割安" | "ほぼ妥当" | "やや割高" | "割高";
  score: number;
  rationale: string | null;
  updated_at: string;
};

export type ValuationSourceRow = { company_id: number; source_id: number };

// ──────────────────────────────────────────────────
// id seed(本番 D1 から SELECT した結果。差分同期で id を保つために使う)
// ──────────────────────────────────────────────────

export type IdSeed = {
  /** name → id のマップ。空 Map の場合は新規採番される。 */
  companyIdByName: Map<string, number>;
  /** (doc,page,period,url) のキー → id のマップ。 */
  sourceIdByKey: Map<string, number>;
};

export function emptyIdSeed(): IdSeed {
  return { companyIdByName: new Map(), sourceIdByKey: new Map() };
}

export const sourceKey = (s: {
  doc: string;
  page?: number | null;
  period?: string | null;
  url?: string | null;
}) => `${s.doc}|${s.page ?? ""}|${s.period ?? ""}|${s.url ?? ""}`;

// ──────────────────────────────────────────────────
// 外部データ取得(I/O はここに閉じ込める)
// ──────────────────────────────────────────────────

export type FetchedExternal = {
  jpxStocks: JpxStock[];
  jpxBaseDate: string | null;
  quotes: Map<string, QuoteSnapshot>;
  charts: Map<string, ChartResultArray>;
};

export async function fetchExternal(opts?: {
  /** Yahoo chart を取得する銘柄コード(data.ts overlay の 68 銘柄ぶんだけ取れば十分)。 */
  chartCodes?: string[];
  historyDays?: number;
  onProgress?: (label: string, done: number, total: number) => void;
}): Promise<FetchedExternal> {
  const historyDays = opts?.historyDays ?? PRICE_HISTORY_DAYS;
  const onProgress = opts?.onProgress;

  console.log("⬇️  JPX 銘柄一覧を取得...");
  const jpxBuf = await fetchJpxExcel();
  const { stocks: jpxStocks, baseDate } = parseJpxExcel(jpxBuf);
  console.log(`   ${jpxStocks.length} 銘柄(内国株)、基準日 ${baseDate ?? "(不明)"}`);

  console.log(`📡 Yahoo quote(${jpxStocks.length} 銘柄)...`);
  const yf = newYahoo();
  const codes = jpxStocks.map((j) => j.code);
  const t0 = Date.now();
  const quotes = await fetchQuotesAll(yf, codes, {
    onProgress: (done, total, ok) => {
      onProgress?.("yahoo-quote", done, total);
      process.stdout.write(`\r   ${done}/${total} バッチ・${ok} 銘柄取得済`);
    },
  });
  process.stdout.write(`\n   done in ${Date.now() - t0}ms\n`);

  const chartCodes = opts?.chartCodes ?? [];
  console.log(`📡 Yahoo chart(${chartCodes.length} 銘柄、過去 ${historyDays} 日)...`);
  const t1 = Date.now();
  const charts = await fetchChartsAll(yf, chartCodes, historyDays, {
    onProgress: (done, total, ok) => {
      onProgress?.("yahoo-chart", done, total);
      process.stdout.write(`\r   ${done}/${total}・${ok} 件成功`);
    },
  });
  process.stdout.write(`\n   done in ${Date.now() - t1}ms\n`);

  return { jpxStocks, jpxBaseDate: baseDate, quotes, charts };
}

// ──────────────────────────────────────────────────
// 全テーブルの行を組み立て
// ──────────────────────────────────────────────────

export type AllRows = {
  companies: CompanyRow[];
  stocks: StockRow[];
  stock_prices_daily: StockPriceDailyRow[];
  sources: SourceRow[];
  industries: IndustryRow[];
  industry_clusters: IndustryClusterRow[];
  company_industry_clusters: CompanyIndustryClusterRow[];
  business_tags: BusinessTagRow[];
  company_segments: CompanySegmentRow[];
  company_insights: CompanyInsightRow[];
  insight_sources: InsightSourceRow[];
  company_phase_scores: CompanyPhaseScoreRow[];
  company_factor_betas: CompanyFactorBetaRow[];
  company_valuation_calls: CompanyValuationCallRow[];
  valuation_sources: ValuationSourceRow[];
};

export async function buildAllRows(
  external: FetchedExternal,
  idSeed: IdSeed = emptyIdSeed(),
): Promise<AllRows> {
  const { jpxStocks, quotes, charts } = external;

  const dataMod = await loadDataTs();
  const industriesMod = await loadIndustriesTs();
  const overlayStocks = dataMod.stocks;
  const industries = industriesMod.industries;
  console.log(
    `📋 data.ts overlay ${overlayStocks.length} 銘柄 / industries.ts ${industries.length} 業界`,
  );

  const now = new Date().toISOString();

  // ─ companies: id seed を尊重しつつ、未知の name には max+1 で新規採番 ─
  let nextCompanyId = 1;
  for (const id of idSeed.companyIdByName.values()) {
    if (id >= nextCompanyId) nextCompanyId = id + 1;
  }
  const overlayByCode = new Map(overlayStocks.map((s) => [s.code, s]));
  const companyIdByCode = new Map<string, number>();
  const companies: CompanyRow[] = [];
  for (const j of jpxStocks) {
    const ov = overlayByCode.get(j.code);
    let id = idSeed.companyIdByName.get(j.name);
    if (id == null) id = nextCompanyId++;
    companies.push({
      id,
      name: j.name,
      name_en: ov?.nameEn ?? null,
      description: ov?.description ?? null,
      one_liner: ov?.oneLiner ?? null,
      edinet_code: null,
      created_at: now,
      updated_at: now,
    });
    companyIdByCode.set(j.code, id);
  }
  companies.sort((a, b) => a.id - b.id);

  // ─ sources: id seed を継承し、未知のキーには max+1 で新規採番 ─
  const sources: SourceRow[] = [];
  const sourceIdByKey = new Map(idSeed.sourceIdByKey);
  let nextSourceId = 1;
  for (const id of idSeed.sourceIdByKey.values()) {
    if (id >= nextSourceId) nextSourceId = id + 1;
  }
  const ensureSourceId = (s: {
    doc: string;
    page?: number;
    period?: string;
    url?: string;
  }): number => {
    const k = sourceKey(s);
    const existing = sourceIdByKey.get(k);
    if (existing != null) return existing;
    const id = nextSourceId++;
    sourceIdByKey.set(k, id);
    sources.push({
      id,
      doc: s.doc,
      page: s.page ?? null,
      period: s.period ?? null,
      url: s.url ?? null,
    });
    return id;
  };
  // id seed の sources も全て出力に含める(本番 D1 と一致させるため)
  for (const [k, id] of idSeed.sourceIdByKey) {
    if (sources.find((s) => s.id === id)) continue;
    // id seed には key しかないので、parts を逆引きする
    const [doc, pageStr, period, url] = k.split("|");
    sources.push({
      id,
      doc,
      page: pageStr === "" ? null : Number(pageStr),
      period: period === "" ? null : period,
      url: url === "" ? null : url,
    });
  }

  // ─ overlay 由来テーブル(business_tags / segments / insights / phase / factor / valuation) ─
  const businessTags: BusinessTagRow[] = [];
  const companySegments: CompanySegmentRow[] = [];
  const companyInsights: CompanyInsightRow[] = [];
  const insightSources: InsightSourceRow[] = [];
  const companyPhaseScores: CompanyPhaseScoreRow[] = [];
  const companyFactorBetas: CompanyFactorBetaRow[] = [];
  const companyValuationCalls: CompanyValuationCallRow[] = [];
  const valuationSources: ValuationSourceRow[] = [];
  let insightId = 0;

  for (const s of overlayStocks) {
    const cid = companyIdByCode.get(s.code);
    if (cid == null) {
      console.warn(`   ⚠️ overlay ${s.code} (${s.name}) は JPX に存在しないためスキップ`);
      continue;
    }
    for (const t of s.tags) {
      businessTags.push({
        company_id: cid,
        dimension: t.dimension,
        value: t.value,
        source_id: ensureSourceId(t.source),
      });
    }
    for (const seg of s.segments) {
      companySegments.push({
        company_id: cid,
        period: s.segmentsPeriod ?? "",
        name: seg.name,
        revenue_oku: seg.revenueOku,
        share: seg.share,
        operating_margin: seg.operatingMargin ?? null,
        source_id: null,
      });
    }
    for (const ins of s.insights) {
      insightId += 1;
      companyInsights.push({
        id: insightId,
        company_id: cid,
        title: ins.title,
        lede: ins.lede ?? null,
        body: ins.body,
        generated_at: ins.generatedAt ?? now,
      });
      for (const c of ins.citations) {
        insightSources.push({ insight_id: insightId, source_id: ensureSourceId(c) });
      }
    }
    if (s.phaseScores) {
      companyPhaseScores.push({
        company_id: cid,
        launch: s.phaseScores.launch,
        expansion: s.phaseScores.expansion,
        mature: s.phaseScores.mature,
        decline: s.phaseScores.decline,
        rationale: s.phaseRationale ?? null,
        updated_at: now,
      });
    }
    if (s.factorBetas) {
      companyFactorBetas.push({
        company_id: cid,
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
      companyValuationCalls.push({
        company_id: cid,
        verdict: s.valuationCall.verdict,
        score: s.valuationCall.score,
        rationale: s.valuationCall.rationale ?? null,
        updated_at: now,
      });
      for (const c of s.valuationCall.citations) {
        valuationSources.push({ company_id: cid, source_id: ensureSourceId(c) });
      }
    }
  }

  // ─ industries / industry_clusters / company_industry_clusters ─
  const industriesRows: IndustryRow[] = [];
  const clustersRows: IndustryClusterRow[] = [];
  const companyClusterRows: CompanyIndustryClusterRow[] = [];
  let clusterId = 0;
  for (const ind of industries) {
    industriesRows.push({
      slug: ind.slug,
      name: ind.name,
      short_name: ind.shortName,
      description: ind.description,
      theme_2025_json: JSON.stringify(ind.theme2025),
      market_scale_headline: ind.marketScale.headline,
      market_scale_growth: ind.marketScale.growth,
      market_scale_breakdown: ind.marketScale.breakdown,
      chain_columns_json: JSON.stringify(ind.chainColumns),
      competitive_structure_json: JSON.stringify(ind.competitiveStructure),
      key_kpis_json: JSON.stringify(ind.keyKpis),
      industry_insights_json: JSON.stringify(ind.industryInsights),
    });
    for (const sub of ind.subClusters) {
      clusterId += 1;
      clustersRows.push({
        id: clusterId,
        industry_slug: ind.slug,
        key: sub.key,
        name: sub.name,
        role: sub.role,
        position: sub.position,
      });
      for (const code of sub.companyCodes) {
        const cid = companyIdByCode.get(code);
        if (cid == null) continue;
        companyClusterRows.push({
          company_id: cid,
          industry_cluster_id: clusterId,
        });
      }
    }
  }

  // ─ stocks: JPX × Yahoo quote ─
  const stocks: StockRow[] = jpxStocks.map((j) => {
    const q = quotes.get(j.code);
    return {
      code: j.code,
      company_id: companyIdByCode.get(j.code)!,
      exchange: j.exchange,
      sector_tse: j.sectorTSE,
      price_jpy: q?.priceJpy ?? null,
      price_date: q?.priceDate ?? null,
      change_pct: q?.changePct ?? null,
      market_cap_oku: q?.marketCapOku ?? null,
      per: q?.per ?? null,
      pbr: q?.pbr ?? null,
      dividend_yield: q?.dividendYield ?? null,
      updated_at: now,
    };
  });

  // ─ stock_prices_daily: Yahoo chart ─
  const stockPricesDaily: StockPriceDailyRow[] = [];
  for (const [code, c] of charts) {
    for (const r of c.quotes) {
      if (r.close == null) continue;
      const date = (r.date instanceof Date ? r.date : new Date(r.date))
        .toISOString()
        .slice(0, 10);
      stockPricesDaily.push({
        code,
        date,
        open: r.open ?? null,
        high: r.high ?? null,
        low: r.low ?? null,
        close: r.close,
        volume: r.volume ?? null,
        adj_close: r.adjclose ?? null,
      });
    }
  }

  return {
    companies,
    stocks,
    stock_prices_daily: stockPricesDaily,
    sources,
    industries: industriesRows,
    industry_clusters: clustersRows,
    company_industry_clusters: companyClusterRows,
    business_tags: businessTags,
    company_segments: companySegments,
    company_insights: companyInsights,
    insight_sources: insightSources,
    company_phase_scores: companyPhaseScores,
    company_factor_betas: companyFactorBetas,
    company_valuation_calls: companyValuationCalls,
    valuation_sources: valuationSources,
  };
}

/** data.ts overlay の銘柄コード一覧(chart 取得対象)。 */
export async function overlayCodes(): Promise<string[]> {
  const dataMod = await loadDataTs();
  return dataMod.stocks.map((s) => s.code);
}

export function summarize(rows: AllRows): string {
  return [
    `companies                : ${rows.companies.length}`,
    `stocks                   : ${rows.stocks.length}`,
    `stock_prices_daily       : ${rows.stock_prices_daily.length}`,
    `sources                  : ${rows.sources.length}`,
    `industries               : ${rows.industries.length}`,
    `industry_clusters        : ${rows.industry_clusters.length}`,
    `company_industry_clusters: ${rows.company_industry_clusters.length}`,
    `business_tags            : ${rows.business_tags.length}`,
    `company_segments         : ${rows.company_segments.length}`,
    `company_insights         : ${rows.company_insights.length}`,
    `insight_sources          : ${rows.insight_sources.length}`,
    `company_phase_scores     : ${rows.company_phase_scores.length}`,
    `company_factor_betas     : ${rows.company_factor_betas.length}`,
    `company_valuation_calls  : ${rows.company_valuation_calls.length}`,
    `valuation_sources        : ${rows.valuation_sources.length}`,
  ].join("\n   ");
}
