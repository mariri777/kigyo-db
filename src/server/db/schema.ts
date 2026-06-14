import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * 全体構造:
 *   companies(企業マスタ)── 1:N ─ stocks(銘柄、価格スナップショット込)
 *                          ─ 1:N ─ business_tags / company_segments / company_insights / etc.
 *   stocks ─ 1:N ─ stock_prices_daily(OHLCV 履歴)
 *   industries ─ 1:N ─ industry_clusters ─ N:N ─ companies (company_industry_clusters)
 *   sources(引用元の共有マスタ)を業績・タグ・insight・valuation から FK 参照
 *
 * data.ts(モック 68 銘柄)は seed 元としてのみ残し、UI は将来 DB を読む。
 */

// ─────────────────────────────────────────────────────────
// 企業 / 銘柄 / 価格
// ─────────────────────────────────────────────────────────

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  oneLiner: text("one_liner"),
  /** 有報・XBRL 連携のための EDINET コード(将来用、現状は NULL) */
  edinetCode: text("edinet_code"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const stocks = sqliteTable(
  "stocks",
  {
    code: text("code").primaryKey(), // 4桁(例: "7203")
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    exchange: text("exchange", { enum: ["Prime", "Standard", "Growth"] }).notNull(),
    /** JPX 33業種区分(例: "輸送用機器") */
    sectorTSE: text("sector_tse").notNull(),

    // 価格スナップショット(Yahoo Finance から日次更新)
    priceJpy: real("price_jpy"),
    priceDate: text("price_date"), // YYYY-MM-DD
    changePct: real("change_pct"),
    marketCapOku: integer("market_cap_oku"),
    per: real("per"),
    pbr: real("pbr"),
    dividendYield: real("dividend_yield"),

    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    idxCompanyId: index("idx_stocks_company_id").on(t.companyId),
  }),
);

export const stockPricesDaily = sqliteTable(
  "stock_prices_daily",
  {
    code: text("code")
      .notNull()
      .references(() => stocks.code, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    open: real("open"),
    high: real("high"),
    low: real("low"),
    close: real("close").notNull(),
    volume: integer("volume"),
    adjClose: real("adj_close"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.code, t.date] }),
    idxDate: index("idx_stock_prices_daily_date").on(t.date),
  }),
);

// ─────────────────────────────────────────────────────────
// 出典(共有マスタ)
// ─────────────────────────────────────────────────────────

export const sources = sqliteTable(
  "sources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    doc: text("doc").notNull(),
    page: integer("page"),
    period: text("period"),
    url: text("url"),
  },
  (t) => ({
    uqDocPagePeriod: uniqueIndex("uq_sources_doc_page_period").on(
      t.doc,
      t.page,
      t.period,
    ),
  }),
);

// ─────────────────────────────────────────────────────────
// 業界・クラスタ
// ─────────────────────────────────────────────────────────

export const industries = sqliteTable("industries", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description"),
  /** JSON 配列文字列 — テーマ羅列(例: ["AI 半導体・HBM 需要拡大", ...]) */
  theme2025Json: text("theme_2025_json"),
  /** marketScale.headline */
  marketScaleHeadline: text("market_scale_headline"),
  marketScaleGrowth: text("market_scale_growth"),
  marketScaleBreakdown: text("market_scale_breakdown"),
  /** 業界マップ 3 列構成(UI レイアウト用) */
  chainColumnsJson: text("chain_columns_json"),
  /** 業界別の差異が大きいので JSON のまま保持 */
  competitiveStructureJson: text("competitive_structure_json"),
  keyKpisJson: text("key_kpis_json"),
  industryInsightsJson: text("industry_insights_json"),
});

export const industryClusters = sqliteTable(
  "industry_clusters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    industrySlug: text("industry_slug")
      .notNull()
      .references(() => industries.slug, { onDelete: "cascade" }),
    /** クラスタの一意キー(例: "front-end-equipment") */
    key: text("key").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    /** バリューチェーン位置(例: "前工程", "材料") */
    position: text("position").notNull(),
  },
  (t) => ({
    uqIndustryKey: uniqueIndex("uq_industry_clusters_industry_key").on(
      t.industrySlug,
      t.key,
    ),
  }),
);

export const companyIndustryClusters = sqliteTable(
  "company_industry_clusters",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    industryClusterId: integer("industry_cluster_id")
      .notNull()
      .references(() => industryClusters.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.industryClusterId] }),
    idxCluster: index("idx_company_industry_clusters_cluster").on(
      t.industryClusterId,
    ),
  }),
);

// ─────────────────────────────────────────────────────────
// 事業タグ(6 次元)
// ─────────────────────────────────────────────────────────

export const businessTags = sqliteTable(
  "business_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    dimension: text("dimension", {
      enum: [
        "product",
        "customer",
        "channel",
        "revenue_model",
        "value_chain",
        "geography",
      ],
    }).notNull(),
    value: text("value").notNull(),
    sourceId: integer("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    idxCompanyDim: index("idx_business_tags_company_dimension").on(
      t.companyId,
      t.dimension,
    ),
  }),
);

// ─────────────────────────────────────────────────────────
// セグメント・業績(時系列)
// ─────────────────────────────────────────────────────────

export const companySegments = sqliteTable(
  "company_segments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // 例: "2025/3"
    name: text("name").notNull(),
    revenueOku: real("revenue_oku"),
    share: real("share"),
    operatingMargin: real("operating_margin"),
    sourceId: integer("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    uqCompanyPeriodName: uniqueIndex(
      "uq_company_segments_company_period_name",
    ).on(t.companyId, t.period, t.name),
  }),
);

/**
 * 業績の四半期スナップショット。
 * スキーマだけ用意し、seed では入れない(将来 EDINET 連携で蓄積していく前提)。
 */
export const companyFinancialsQuarterly = sqliteTable(
  "company_financials_quarterly",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    revenueOku: real("revenue_oku"),
    operatingProfitOku: real("operating_profit_oku"),
    operatingMargin: real("operating_margin"),
    roe: real("roe"),
    revenueGrowth3y: real("revenue_growth_3y"),
    sourceId: integer("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.period] }),
  }),
);

// ─────────────────────────────────────────────────────────
// AI 生成データ
// ─────────────────────────────────────────────────────────

export const companyInsights = sqliteTable(
  "company_insights",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    lede: text("lede"),
    body: text("body").notNull(),
    generatedAt: text("generated_at").notNull(),
  },
  (t) => ({
    idxCompany: index("idx_company_insights_company").on(t.companyId),
  }),
);

export const insightSources = sqliteTable(
  "insight_sources",
  {
    insightId: integer("insight_id")
      .notNull()
      .references(() => companyInsights.id, { onDelete: "cascade" }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.insightId, t.sourceId] }),
  }),
);

export const companyPhaseScores = sqliteTable("company_phase_scores", {
  companyId: integer("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  launch: real("launch").notNull(),
  expansion: real("expansion").notNull(),
  mature: real("mature").notNull(),
  decline: real("decline").notNull(),
  rationale: text("rationale"),
  updatedAt: text("updated_at").notNull(),
});

export const companyFactorBetas = sqliteTable("company_factor_betas", {
  companyId: integer("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  usdjpy: real("usdjpy").notNull(),
  us10y: real("us10y").notNull(),
  oil: real("oil").notNull(),
  sox: real("sox").notNull(),
  china: real("china").notNull(),
  market: real("market").notNull(),
  size: real("size").notNull(),
  value: real("value").notNull(),
  momentum: real("momentum").notNull(),
  period: text("period"),
});

export const companyValuationCalls = sqliteTable("company_valuation_calls", {
  companyId: integer("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  verdict: text("verdict", {
    enum: ["割安", "ほぼ妥当", "やや割高", "割高"],
  }).notNull(),
  score: integer("score").notNull(),
  rationale: text("rationale"),
  updatedAt: text("updated_at").notNull(),
});

export const valuationSources = sqliteTable(
  "valuation_sources",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companyValuationCalls.companyId, {
        onDelete: "cascade",
      }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.sourceId] }),
  }),
);
