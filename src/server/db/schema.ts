/**
 * 超!企業DB v2 D1 スキーマ。
 *
 * 設計詳細は docs/data-design.md / docs/data-pipeline.md を参照。
 * 3 原則:
 *   1. 読み出しを軽く — stock_snapshot に詳細ページの派生値を全部詰める
 *   2. 書き込みは頻度別に分離 — 日次/週次/月次/四半期/編集/イベント駆動
 *   3. イベントは 1 本に集約 (events)、予測だけ独立
 */
import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────────────────
// A. 企業マスタ層
// ─────────────────────────────────────────────────────────

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  /** EDINET コード (例: "E02144" トヨタ) */
  edinetCode: text("edinet_code"),
  description: text("description"),
  oneLiner: text("one_liner"),
  /** 設立日 "1937-08-28" */
  founded: text("founded"),
  /** 上場日 "1949-05" */
  listed: text("listed"),
  headquarters: text("headquarters"),
  ceoName: text("ceo_name"),
  website: text("website"),
  employeesConsolidated: integer("employees_consolidated"),
  /** ロゴカラー "#e60012" */
  logoColor: text("logo_color"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  uqEdinet: uniqueIndex("uq_companies_edinet_code").on(t.edinetCode),
}));

export const stocks = sqliteTable("stocks", {
  /** 証券コード 4桁 "7203" */
  code: text("code").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  /** プライム / スタンダード / グロース */
  exchange: text("exchange", { enum: ["Prime", "Standard", "Growth"] }).notNull(),
  /** JPX 33業種 */
  sectorTse: text("sector_tse").notNull(),
  /** 指数組入 CSV: "TOPIX,JPX400,N225" */
  indexMembership: text("index_membership"),
  /** 発行済株式数 (千株単位) */
  listedShares: integer("listed_shares"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  idxCompanyId: index("idx_stocks_company_id").on(t.companyId),
}));

// ─────────────────────────────────────────────────────────
// B. 価格時系列層 (日次cron、31日窓)
// ─────────────────────────────────────────────────────────

export const stockPricesDaily = sqliteTable("stock_prices_daily", {
  code: text("code")
    .notNull()
    .references(() => stocks.code, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  open: real("open"),
  high: real("high"),
  low: real("low"),
  close: real("close").notNull(),
  volume: integer("volume"),
}, (t) => ({
  pk: primaryKey({ columns: [t.code, t.date] }),
  idxDate: index("idx_stock_prices_daily_date").on(t.date),
}));

// ─────────────────────────────────────────────────────────
// C. 銘柄スナップショット層 — 詳細ページの派生値を全部詰める
// ─────────────────────────────────────────────────────────

export const stockSnapshot = sqliteTable("stock_snapshot", {
  code: text("code")
    .primaryKey()
    .references(() => stocks.code, { onDelete: "cascade" }),

  // 価格
  priceJpy: real("price_jpy"),
  priceDate: text("price_date"),
  change1dPct: real("change_1d_pct"),
  change1mPct: real("change_1m_pct"),
  change1yPct: real("change_1y_pct"),

  // 時価総額・バリュエーション
  marketCapOku: integer("market_cap_oku"),
  /** "メガ" / "大型" / "中型" / "小型" */
  marketCapTier: text("market_cap_tier"),
  per: real("per"),
  perForecast: real("per_forecast"),
  pbr: real("pbr"),
  psr: real("psr"),
  evEbitda: real("ev_ebitda"),
  peg: real("peg"),
  roe: real("roe"),

  // 配当 (現在値)
  dividendYield: real("dividend_yield"),
  dividendAnnual: real("dividend_annual"),
  dividendPayoutRatio: real("dividend_payout_ratio"),
  totalReturnYield: real("total_return_yield"),

  // テクニカル
  ma25: real("ma_25"),
  ma75: real("ma_75"),
  ma200: real("ma_200"),
  high52w: real("high_52w"),
  low52w: real("low_52w"),
  rsi14: real("rsi_14"),
  /** "28.6M" 表示用 */
  avgVolume3m: text("avg_volume_3m"),
  creditBuy: text("credit_buy"),
  creditSell: text("credit_sell"),
  creditRatio: real("credit_ratio"),

  // チャート用 90日 OHLC ダウンサンプル
  priceHistoryJson: text("price_history_json"),

  // 株主構成サマリ
  foreignOwnership: real("foreign_ownership"),
  individualOwnership: real("individual_ownership"),
  stableOwnership: real("stable_ownership"),

  // 業績スナップ (最新期)
  latestRevenueOku: integer("latest_revenue_oku"),
  latestOpProfitOku: integer("latest_op_profit_oku"),
  latestOpMargin: real("latest_op_margin"),

  // AI 目標株価 (アナリスト系の代替)
  targetConsensus: integer("target_consensus"),
  targetHigh: integer("target_high"),
  targetLow: integer("target_low"),
  analystBuy: integer("analyst_buy"),
  analystHold: integer("analyst_hold"),
  analystSell: integer("analyst_sell"),

  // AI バリュエーション評価
  valuationVerdict: text("valuation_verdict", {
    enum: ["割安", "ほぼ妥当", "やや割高", "割高"],
  }),
  valuationScore: integer("valuation_score"), // 0-100

  updatedAt: text("updated_at").notNull(),
});

// ─────────────────────────────────────────────────────────
// D. 決算層 (四半期決算トリガー)
// ─────────────────────────────────────────────────────────

export const financialsAnnual = sqliteTable("financials_annual", {
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  /** "2025/3" */
  fy: text("fy").notNull(),
  revenueOku: integer("revenue_oku"),
  operatingProfitOku: integer("operating_profit_oku"),
  operatingMargin: real("operating_margin"),
  netProfitOku: integer("net_profit_oku"),
  eps: real("eps"),
}, (t) => ({
  pk: primaryKey({ columns: [t.companyId, t.fy] }),
}));

export const financialsQuarterly = sqliteTable("financials_quarterly", {
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  /** "2025Q3" */
  period: text("period").notNull(),
  revenueOku: integer("revenue_oku"),
  opProfitOku: integer("op_profit_oku"),
  opMargin: real("op_margin"),
  netProfitOku: integer("net_profit_oku"),
  /** JSON 配列 (4 項目) */
  highlightsJson: text("highlights_json"),
}, (t) => ({
  pk: primaryKey({ columns: [t.companyId, t.period] }),
}));

export const dividends = sqliteTable("dividends", {
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  fy: text("fy").notNull(),
  amount: real("amount"),
  exDate: text("ex_date"),
  recordDate: text("record_date"),
  payDate: text("pay_date"),
}, (t) => ({
  pk: primaryKey({ columns: [t.companyId, t.fy] }),
}));

// ─────────────────────────────────────────────────────────
// E. AI 生成層
// ─────────────────────────────────────────────────────────

export const companyAiBrief = sqliteTable("company_ai_brief", {
  companyId: integer("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  summary: text("summary"),
  valuationRationale: text("valuation_rationale"),
  stockTrendAnalysis: text("stock_trend_analysis"),
  stockTrendFactorsJson: text("stock_trend_factors_json"),
  analystSummary: text("analyst_summary"),
  technicalComment: text("technical_comment"),
  positioningHeadline: text("positioning_headline"),
  positioningAnalysis: text("positioning_analysis"),
  positioningStrengthsJson: text("positioning_strengths_json"),
  positioningChallengesJson: text("positioning_challenges_json"),
  ownerActivismJson: text("owner_activism_json"),
  generatedAt: text("generated_at"),
});

export const marketBrief = sqliteTable("market_brief", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  lede: text("lede"),
  bulletsJson: text("bullets_json"),
  watchThemesJson: text("watch_themes_json"),
  indicesJson: text("indices_json"),
  generatedAt: text("generated_at"),
});

/**
 * 主要指数のスナップショット。Yahoo Finance から日次取得。
 * v2 トップの市場サマリと ai-market-brief の入力に使う。
 */
export const marketIndices = sqliteTable("market_indices", {
  /** Yahoo シンボル "^N225" / "^TOPX" / "JPY=X" / "^SOX" */
  symbol: text("symbol").primaryKey(),
  /** 表示名 "日経平均" "TOPIX" "USD/JPY" "SOX 指数" */
  name: text("name").notNull(),
  /** 表示順 (小さいほど先頭) */
  displayOrder: integer("display_order").notNull().default(0),
  /** 直近値 */
  value: real("value"),
  /** 前日終値 */
  previousClose: real("previous_close"),
  /** 騰落 % */
  change1dPct: real("change_1d_pct"),
  /** 騰落 絶対値 */
  change1dAbs: real("change_1d_abs"),
  /** 値の参照日 YYYY-MM-DD */
  asOf: text("as_of"),
  updatedAt: text("updated_at"),
});

/**
 * v2 トップの「本日のハイライト」用テーブル。
 *
 * 既存テーブル (stockSnapshot, financialsQuarterly, dividends, events) から
 * derive-highlights タスクが日次で抽出 → 上書き保存する派生データ。
 *
 * 編集記事との紐付け (relatedArticleSlug) は手動キュレーションで埋めるか、
 * subject_code 一致の最新記事を自動で当てる。
 */
export const homepageHighlights = sqliteTable("homepage_highlights", {
  id: text("id").primaryKey(),
  /** 抽出ロジック分類 */
  kind: text("kind", {
    enum: ["earnings_brief", "price_anomaly", "indicator_shift", "dividend_shift"],
  }).notNull(),
  /** 主役 ("company" / "industry" / "theme" / "metric") */
  subjectKind: text("subject_kind").notNull(),
  /** 銘柄コード (subjectKind=company のとき) */
  subjectCode: text("subject_code"),
  /** 表示名 (企業名 / 業界名 / テーマ名) */
  subjectName: text("subject_name").notNull(),
  /** 一行サマリ */
  oneLiner: text("one_liner").notNull(),
  /** 主要指標ラベル "出来高/平均" "純利益" 等 */
  keyMetricLabel: text("key_metric_label").notNull(),
  /** 主要指標値 "×3.2" "¥5.7T" 等 */
  keyMetricValue: text("key_metric_value").notNull(),
  /** +/- /中立 */
  keyMetricPositive: integer("key_metric_positive"), // 1 / 0 / NULL
  /** どのテーブル/ロジック由来か (透明性表示用) */
  source: text("source").notNull(),
  /** 表示用時刻 "17:02" */
  publishedAt: text("published_at").notNull(),
  /** 並び替え用 ISO8601 */
  publishedAtIso: text("published_at_iso").notNull(),
  /** 紐付け編集記事の slug (NULLなら未紐付け) */
  relatedArticleSlug: text("related_article_slug"),
  /** スコア (大きいほど上位表示)。同日内の表示順制御に使う */
  score: real("score").notNull().default(0),
  /** 値の参照日 YYYY-MM-DD (古いハイライトを掃除するため) */
  asOf: text("as_of").notNull(),
}, (t) => ({
  idxAsOfScore: index("idx_homepage_highlights_asof_score").on(t.asOf, t.score),
}));

// ─────────────────────────────────────────────────────────
// F. 業界層 (大幅簡素化)
// ─────────────────────────────────────────────────────────

export const industries = sqliteTable("industries", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description"),
  insightsJson: text("insights_json"),
  /** 業界ページ・hero の背景に使う Unsplash 写真 ID (例: photo-1559136555-9303baea8ebd) */
  heroImageId: text("hero_image_id"),
});

export const companyIndustries = sqliteTable("company_industries", {
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  industrySlug: text("industry_slug")
    .notNull()
    .references(() => industries.slug, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.companyId, t.industrySlug] }),
  idxIndustrySlug: index("idx_company_industries_industry_slug").on(t.industrySlug),
}));

// ─────────────────────────────────────────────────────────
// G. ブログ層 (現状維持)
// ─────────────────────────────────────────────────────────

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  uqEmail: uniqueIndex("uq_admin_users_email").on(t.email),
}));

export const adminSessions = sqliteTable("admin_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
}, (t) => ({
  idxExpires: index("idx_admin_sessions_expires").on(t.expiresAt),
  idxUserId: index("idx_admin_sessions_user_id").on(t.userId),
}));

/**
 * パスワードリセット用 1 回限りトークン。
 * id 列は生トークンの SHA-256 hex を保存(DB が漏れてもメール本文に出した
 * 生トークンと照合できない)。期限切れ・使用済みは usedAt が NULL かどうかで判別。
 */
export const adminPasswordResets = sqliteTable("admin_password_resets", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
}, (t) => ({
  idxUser: index("idx_admin_password_resets_user").on(t.userId),
  idxExpires: index("idx_admin_password_resets_expires").on(t.expiresAt),
}));

// ─── 記事カテゴリ (decoding-earnings / industry-overview / theme-dive / primer) ───

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => ({
  uqSlug: uniqueIndex("uq_categories_slug").on(t.slug),
}));

// ─── 記事 (articles) ──────────────────────────────────
//   v2 の記事フォーマット (Block[] JSON + 派生 HTML キャッシュ)
//   subject: 主役 (company/industry/theme/metric) を 1 つ
//   actions: 末尾「この記事のあとに」の 3 リンク
//   image: hero サムネ (R2/MinIO のオブジェクトキー)
//
//   標準準拠フィールド: id / slug (unique) / title / lede / status /
//     published_at / scheduled_at / created_at / updated_at / author

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  lede: text("lede").notNull(),

  // Hero 画像 (MinIO/R2 のキー、不要なら null)
  heroImageKey: text("hero_image_key"),
  heroImageAlt: text("hero_image_alt"),
  heroImageCredit: text("hero_image_credit"),

  // 主役 (1記事1つ)
  subjectKind: text("subject_kind", {
    enum: ["company", "industry", "theme", "metric"],
  }).notNull(),
  /** company: 銘柄コード / industry/theme/metric: slug */
  subjectRef: text("subject_ref").notNull(),
  /** 一覧で都度 join しないための非正規化キャッシュ */
  subjectName: text("subject_name").notNull(),

  // 本文 (Tiptap JSON) + 派生 HTML
  contentJson: text("content_json").notNull(),
  contentHtml: text("content_html").notNull(),

  readMinutes: integer("read_minutes").notNull().default(3),

  // 末尾アクション 3 つ (JSON: [{label, hint?, href, iconKey}, ...] 最大3)
  actionsJson: text("actions_json").notNull().default("[]"),

  // カテゴリ (1記事1カテゴリ)
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),

  // 公開状態
  status: text("status", { enum: ["draft", "published", "scheduled", "archived"] })
    .notNull()
    .default("draft"),
  publishedAt: text("published_at"),
  scheduledAt: text("scheduled_at"),

  // 著者
  authorId: integer("author_id").references(() => adminUsers.id, {
    onDelete: "set null",
  }),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  uqSlug: uniqueIndex("uq_articles_slug").on(t.slug),
  idxStatusPublished: index("idx_articles_status_published_at").on(t.status, t.publishedAt),
  idxCategory: index("idx_articles_category").on(t.categoryId),
  idxSubject: index("idx_articles_subject").on(t.subjectKind, t.subjectRef),
}));

// ─── タグ ──────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => ({
  uqSlug: uniqueIndex("uq_tags_slug").on(t.slug),
}));

export const articleTags = sqliteTable("article_tags", {
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.tagId] }),
  idxTagId: index("idx_article_tags_tag_id").on(t.tagId),
}));

// ─── 記事 ↔ 銘柄 ──────────────────────────────────────
//   関連企業として記事末尾サイド・本文中ticker に出す

export const articleCompanies = sqliteTable("article_companies", {
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  /** 銘柄コード ("9984" など) */
  code: text("code").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.code] }),
  idxCode: index("idx_article_companies_code").on(t.code),
}));

// ─── 記事 ↔ 業界 ──────────────────────────────────────

export const articleIndustries = sqliteTable("article_industries", {
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  industrySlug: text("industry_slug").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.industrySlug] }),
  idxIndustry: index("idx_article_industries_slug").on(t.industrySlug),
}));

// ─────────────────────────────────────────────────────────
// H. イベント層 (汎用)
// ─────────────────────────────────────────────────────────

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", {
    enum: [
      "catalyst",
      "risk",
      "disclosure",
      "theme_signal",
      "buyback",
      "earnings_event",
      "guidance_revision",
    ],
  }).notNull(),
  scope: text("scope", { enum: ["company", "industry", "market"] }).notNull(),
  /** scope に応じて company_id (文字列化) / industry_slug / "JP" */
  scopeRef: text("scope_ref").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  /** "2026年Q2" or YYYY-MM-DD */
  occursAt: text("occurs_at"),
  impact: text("impact", { enum: ["強", "中", "弱"] }),
  direction: text("direction", { enum: ["up", "down"] }),
  sourceUrl: text("source_url"),
  createdAt: text("created_at").notNull(),
}, (t) => ({
  idxScope: index("idx_events_scope").on(t.scope, t.scopeRef, t.kind),
  idxOccursAt: index("idx_events_occurs_at").on(t.occursAt),
}));

// ─────────────────────────────────────────────────────────
// I. 予測層 (独立)
// ─────────────────────────────────────────────────────────

export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").references(() => stocks.code, { onDelete: "cascade" }),
  category: text("category").notNull(),
  question: text("question").notNull(),
  pickLabel: text("pick_label").notNull(),
  noLabel: text("no_label").notNull(),
  probability: integer("probability").notNull(),
  rationale: text("rationale"),
  resolveAt: text("resolve_at").notNull(),
  status: text("status", { enum: ["live", "soon", "resolved"] })
    .notNull()
    .default("soon"),
  outcome: text("outcome", { enum: ["yes", "no"] }),
  outcomeAt: text("outcome_at"),
  /** "¥1.2M" 表示用 */
  volume: text("volume"),
  voters: integer("voters").notNull().default(0),
  createdAt: text("created_at").notNull(),
}, (t) => ({
  idxStatus: index("idx_predictions_status").on(t.status),
  idxCode: index("idx_predictions_code").on(t.code),
  idxResolveAt: index("idx_predictions_resolve_at").on(t.resolveAt),
  uqNatural: uniqueIndex("uq_predictions_natural").on(t.category, t.resolveAt, t.question),
}));

export const predictionShifts = sqliteTable("prediction_shifts", {
  predictionId: integer("prediction_id")
    .notNull()
    .references(() => predictions.id, { onDelete: "cascade" }),
  /** YYYY-MM-DDTHH:MM */
  at: text("at").notNull(),
  probability: integer("probability").notNull(),
  reason: text("reason"),
}, (t) => ({
  pk: primaryKey({ columns: [t.predictionId, t.at] }),
}));

// ─────────────────────────────────────────────────────────
// J. ストーリー層 (沿革紙芝居)
// ─────────────────────────────────────────────────────────

export const storyDecks = sqliteTable("story_decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  sourceNote: text("source_note"),
  publishedAt: text("published_at"),
}, (t) => ({
  idxCompany: index("idx_story_decks_company").on(t.companyId),
}));

export const storySlides = sqliteTable("story_slides", {
  deckId: integer("deck_id")
    .notNull()
    .references(() => storyDecks.id, { onDelete: "cascade" }),
  n: integer("n").notNull(),
  era: text("era"),
  year: text("year"),
  title: text("title").notNull(),
  lead: text("lead"),
  body: text("body"),
  /** Unsplash photo ID */
  image: text("image"),
  highlight: text("highlight"),
}, (t) => ({
  pk: primaryKey({ columns: [t.deckId, t.n] }),
}));

// ─────────────────────────────────────────────────────────
// K. 株主構成
// ─────────────────────────────────────────────────────────

export const topShareholders = sqliteTable("top_shareholders", {
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  name: text("name").notNull(),
  sharePct: real("share_pct"),
  /** "信託口/法人(グループ)/法人(生保)/外国機関" */
  holderType: text("holder_type"),
  /** "2025-03-31" */
  asOf: text("as_of"),
}, (t) => ({
  pk: primaryKey({ columns: [t.companyId, t.rank] }),
}));

// ─────────────────────────────────────────────────────────
// I-2. AI 予測 (stock) 層
// ─────────────────────────────────────────────────────────
//
// 旧 predictions / prediction_shifts は短命の polymarket 風 widget だった。
// こちらは「1 予測 = しっかり読める分析記事」として stock 化する。
//
// テーブル分離の意図:
//   - forecasts        : 1 予測 = 1 行 (見出し・確率・解決状態など 1 行で取れるサマリ)
//   - forecast_takes   : 予測本文を「視点 (macro / technical / sentiment / bull / bear / contrarian)」
//                        ごとの段落として可変ボリュームで持つ
//   - forecast_scenarios: ベース / 強気 / 弱気の 3 シナリオ。価格帯と確率と一行ノート
//   - forecast_shifts  : 6h 毎の確率推移。スパークライン用
//
// 同一性キーは (target_symbol, resolve_at)。1 つの (指数, 解決時刻) に対して必ず最新の 1 行のみ。

export const forecasts = sqliteTable("forecasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** "^GSPC" / "^N225" / 個別銘柄なら "7203.T" など */
  targetSymbol: text("target_symbol").notNull(),
  /** 表示名 "S&P 500" */
  targetName: text("target_name").notNull(),
  /** "global-index" / "jp-stock" / "fx" / "commodity" */
  targetKind: text("target_kind", {
    enum: ["global-index", "jp-stock", "fx", "commodity"],
  })
    .notNull()
    .default("global-index"),
  /** 個別銘柄予測のとき、stocks.code を持つ (任意) */
  stockCode: text("stock_code").references(() => stocks.code, { onDelete: "set null" }),
  /** "next-session" (翌営業日) / "1w" / "1m" など */
  horizon: text("horizon", { enum: ["next-session", "1w", "1m"] })
    .notNull()
    .default("next-session"),
  /** "翌営業日の S&P 500 終値は前日比プラスか?" */
  question: text("question").notNull(),
  /** ヒーローで使う短い結論 (12〜26 字)。例「テクニカル復調で上方バイアス」 */
  headline: text("headline").notNull(),
  /** リード 1〜2 文。140〜220 字 */
  lede: text("lede").notNull(),
  /** YES (= 上がる) 側の確率 0-100 */
  probability: integer("probability").notNull(),
  /** "low" / "med" / "high" — AI が自信度をつける */
  confidence: text("confidence", { enum: ["low", "med", "high"] }).notNull().default("med"),
  /** 解決時刻 ISO 8601 例 "2026-06-29T05:00:00+09:00" */
  resolveAt: text("resolve_at").notNull(),
  /** 観測スナップショット時の価格 (= 予測時の前日終値) */
  referencePrice: real("reference_price"),
  /**
   * 固定指数 vs AI スクラッチ
   *   - "fixed-index": S&P 500 / 日経平均 など、こちらでテーマを定義した予測
   *   - "ai-scratch":  AI がその日に立てた旬な Issue。target_symbol は topic_slug を入れる
   */
  issueKind: text("issue_kind", { enum: ["fixed-index", "ai-scratch"] })
    .notNull()
    .default("fixed-index"),
  /** AI が取ったポジション。Polymarket 風 Yes/No 二択を強制 */
  position: text("position", { enum: ["yes", "no"] }),
  /** Yes 側の自然語ラベル "プラス" / "152円超え" / "実施する" */
  yesLabel: text("yes_label"),
  /** No 側の自然語ラベル */
  noLabel: text("no_label"),
  /** スクラッチ Issue の自然キー (例 "boj-hike-2026-07")。固定指数は null */
  topicSlug: text("topic_slug"),
  /** "live" 公開中 / "resolved" 解決済 / "archived" 非表示 */
  status: text("status", { enum: ["live", "resolved", "archived"] })
    .notNull()
    .default("live"),
  /** 解決後: "up" / "down" / "flat" */
  outcome: text("outcome", { enum: ["up", "down", "flat"] }),
  /** 解決後の終値 */
  outcomePrice: real("outcome_price"),
  outcomeAt: text("outcome_at"),
  /** 一行のおまけコメント (任意) */
  closingNote: text("closing_note"),
  generatedAt: text("generated_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  uqNatural: uniqueIndex("uq_forecasts_natural").on(t.targetSymbol, t.resolveAt),
  idxStatus: index("idx_forecasts_status").on(t.status),
  idxResolveAt: index("idx_forecasts_resolve_at").on(t.resolveAt),
  idxTargetKind: index("idx_forecasts_target_kind").on(t.targetKind),
  idxStockCode: index("idx_forecasts_stock_code").on(t.stockCode),
}));

export const forecastTakes = sqliteTable("forecast_takes", {
  forecastId: integer("forecast_id")
    .notNull()
    .references(() => forecasts.id, { onDelete: "cascade" }),
  /**
   * macro/technical/sentiment は必須の 3 視点。
   * bull/bear/contrarian は補強。
   * keyData は数字ピックアップ ("VIX 13.2" 等)。
   */
  kind: text("kind", {
    enum: [
      "macro",
      "technical",
      "sentiment",
      "bull",
      "bear",
      "contrarian",
      "key-data",
    ],
  }).notNull(),
  /** UI 表示順 0,1,2,... 同一 kind が複数あるときの順序 */
  position: integer("position").notNull().default(0),
  /** "FOMC ハト派的シグナル" — 15〜30 字 */
  heading: text("heading").notNull(),
  /** 本文 140〜400 字。読み物として読めるボリュームを持たせる */
  body: text("body").notNull(),
  /** バイアス: "up" / "down" / "neutral" — body の方向性タグ */
  bias: text("bias", { enum: ["up", "down", "neutral"] }).notNull().default("neutral"),
}, (t) => ({
  pk: primaryKey({ columns: [t.forecastId, t.kind, t.position] }),
  idxForecast: index("idx_forecast_takes_forecast").on(t.forecastId),
}));

export const forecastScenarios = sqliteTable("forecast_scenarios", {
  forecastId: integer("forecast_id")
    .notNull()
    .references(() => forecasts.id, { onDelete: "cascade" }),
  /**
   * "base" / "bull" / "bear" — 指数系の方向性シナリオ
   * "yes-case" / "no-case" — AI スクラッチ Issue (Yes/No 二項) 用
   */
  kind: text("kind", {
    enum: ["base", "bull", "bear", "yes-case", "no-case"],
  }).notNull(),
  /** "もみ合い" 等の短いラベル */
  label: text("label").notNull(),
  /** このシナリオの想定確率 0-100 */
  probability: integer("probability").notNull(),
  /** 想定価格帯 下限 */
  priceLow: real("price_low"),
  /** 想定価格帯 上限 */
  priceHigh: real("price_high"),
  /** 1〜2 文の説明 80〜180 字 */
  note: text("note").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.forecastId, t.kind] }),
}));

export const forecastShifts = sqliteTable("forecast_shifts", {
  forecastId: integer("forecast_id")
    .notNull()
    .references(() => forecasts.id, { onDelete: "cascade" }),
  /** YYYY-MM-DDTHH:MM */
  at: text("at").notNull(),
  probability: integer("probability").notNull(),
  /** その時点での一言メモ (任意)。AI が「VIX 急騰で弱気」等 */
  reason: text("reason"),
}, (t) => ({
  pk: primaryKey({ columns: [t.forecastId, t.at] }),
  idxForecastAt: index("idx_forecast_shifts_at").on(t.forecastId, t.at),
}));

// ─────────────────────────────────────────────────────────
// L. EDINET パイプライン管理 (data-pipeline.md 参照)
// ─────────────────────────────────────────────────────────

export const edinetDocs = sqliteTable("edinet_docs", {
  /** EDINET docID "S100Y8NY" */
  docId: text("doc_id").primaryKey(),
  edinetCode: text("edinet_code").notNull(),
  /** 上場銘柄なら 5桁の証券コード "72030" */
  secCode: text("sec_code"),
  /** "120"=有報 / "140"=四半期 / "160"=半期 */
  docTypeCode: text("doc_type_code").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  submitDate: text("submit_date").notNull(),
  fetchStatus: text("fetch_status", {
    enum: ["discovered", "parsed", "failed"],
  }).notNull(),
  failedReason: text("failed_reason"),
  discoveredAt: text("discovered_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => ({
  idxFetchStatus: index("idx_edinet_docs_fetch_status").on(t.fetchStatus),
  idxSecCode: index("idx_edinet_docs_sec_code").on(t.secCode, t.docTypeCode),
}));
