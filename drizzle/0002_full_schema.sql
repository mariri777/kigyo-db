-- 全テーブルを drop して、企業/銘柄/業界/AI 生成データの正規化スキーマで再構築する。
-- seed (npm run db:seed) で参照する正規スキーマ。CSV から全件投入される前提。

DROP TABLE IF EXISTS `valuation_sources`;
DROP TABLE IF EXISTS `company_valuation_calls`;
DROP TABLE IF EXISTS `company_factor_betas`;
DROP TABLE IF EXISTS `company_phase_scores`;
DROP TABLE IF EXISTS `insight_sources`;
DROP TABLE IF EXISTS `company_insights`;
DROP TABLE IF EXISTS `company_financials_quarterly`;
DROP TABLE IF EXISTS `company_segments`;
DROP TABLE IF EXISTS `business_tags`;
DROP TABLE IF EXISTS `company_industry_clusters`;
DROP TABLE IF EXISTS `industry_clusters`;
DROP TABLE IF EXISTS `industries`;
DROP TABLE IF EXISTS `sources`;
DROP TABLE IF EXISTS `stock_prices_daily`;
DROP TABLE IF EXISTS `stocks`;
DROP TABLE IF EXISTS `companies`;

-- ─── companies / stocks / prices ─────────────────────────

CREATE TABLE `companies` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `name_en` text,
  `description` text,
  `one_liner` text,
  `edinet_code` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `stocks` (
  `code` text PRIMARY KEY NOT NULL,
  `company_id` integer NOT NULL,
  `exchange` text NOT NULL,
  `sector_tse` text NOT NULL,
  `price_jpy` real,
  `price_date` text,
  `change_pct` real,
  `market_cap_oku` integer,
  `per` real,
  `pbr` real,
  `dividend_yield` real,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_stocks_company_id` ON `stocks` (`company_id`);

CREATE TABLE `stock_prices_daily` (
  `code` text NOT NULL,
  `date` text NOT NULL,
  `open` real,
  `high` real,
  `low` real,
  `close` real NOT NULL,
  `volume` integer,
  `adj_close` real,
  PRIMARY KEY (`code`, `date`),
  FOREIGN KEY (`code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_stock_prices_daily_date` ON `stock_prices_daily` (`date`);

-- ─── sources(出典) ─────────────────────────────────────

CREATE TABLE `sources` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `doc` text NOT NULL,
  `page` integer,
  `period` text,
  `url` text
);

CREATE UNIQUE INDEX `uq_sources_doc_page_period`
  ON `sources` (`doc`, `page`, `period`);

-- ─── 業界 / クラスタ ───────────────────────────────────

CREATE TABLE `industries` (
  `slug` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `short_name` text NOT NULL,
  `description` text,
  `theme_2025_json` text,
  `market_scale_headline` text,
  `market_scale_growth` text,
  `market_scale_breakdown` text,
  `chain_columns_json` text,
  `competitive_structure_json` text,
  `key_kpis_json` text,
  `industry_insights_json` text
);

CREATE TABLE `industry_clusters` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `industry_slug` text NOT NULL,
  `key` text NOT NULL,
  `name` text NOT NULL,
  `role` text NOT NULL,
  `position` text NOT NULL,
  FOREIGN KEY (`industry_slug`) REFERENCES `industries`(`slug`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `uq_industry_clusters_industry_key`
  ON `industry_clusters` (`industry_slug`, `key`);

CREATE TABLE `company_industry_clusters` (
  `company_id` integer NOT NULL,
  `industry_cluster_id` integer NOT NULL,
  PRIMARY KEY (`company_id`, `industry_cluster_id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`industry_cluster_id`) REFERENCES `industry_clusters`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_company_industry_clusters_cluster`
  ON `company_industry_clusters` (`industry_cluster_id`);

-- ─── 事業タグ ────────────────────────────────────────────

CREATE TABLE `business_tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` integer NOT NULL,
  `dimension` text NOT NULL,
  `value` text NOT NULL,
  `source_id` integer,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `idx_business_tags_company_dimension`
  ON `business_tags` (`company_id`, `dimension`);

-- ─── セグメント / 業績 ──────────────────────────────────

CREATE TABLE `company_segments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` integer NOT NULL,
  `period` text NOT NULL,
  `name` text NOT NULL,
  `revenue_oku` real,
  `share` real,
  `operating_margin` real,
  `source_id` integer,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `uq_company_segments_company_period_name`
  ON `company_segments` (`company_id`, `period`, `name`);

CREATE TABLE `company_financials_quarterly` (
  `company_id` integer NOT NULL,
  `period` text NOT NULL,
  `revenue_oku` real,
  `operating_profit_oku` real,
  `operating_margin` real,
  `roe` real,
  `revenue_growth_3y` real,
  `source_id` integer,
  PRIMARY KEY (`company_id`, `period`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE set null
);

-- ─── AI 生成データ ──────────────────────────────────────

CREATE TABLE `company_insights` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` integer NOT NULL,
  `title` text NOT NULL,
  `lede` text,
  `body` text NOT NULL,
  `generated_at` text NOT NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_company_insights_company` ON `company_insights` (`company_id`);

CREATE TABLE `insight_sources` (
  `insight_id` integer NOT NULL,
  `source_id` integer NOT NULL,
  PRIMARY KEY (`insight_id`, `source_id`),
  FOREIGN KEY (`insight_id`) REFERENCES `company_insights`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `company_phase_scores` (
  `company_id` integer PRIMARY KEY NOT NULL,
  `launch` real NOT NULL,
  `expansion` real NOT NULL,
  `mature` real NOT NULL,
  `decline` real NOT NULL,
  `rationale` text,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `company_factor_betas` (
  `company_id` integer PRIMARY KEY NOT NULL,
  `usdjpy` real NOT NULL,
  `us10y` real NOT NULL,
  `oil` real NOT NULL,
  `sox` real NOT NULL,
  `china` real NOT NULL,
  `market` real NOT NULL,
  `size` real NOT NULL,
  `value` real NOT NULL,
  `momentum` real NOT NULL,
  `period` text,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `company_valuation_calls` (
  `company_id` integer PRIMARY KEY NOT NULL,
  `verdict` text NOT NULL,
  `score` integer NOT NULL,
  `rationale` text,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `valuation_sources` (
  `company_id` integer NOT NULL,
  `source_id` integer NOT NULL,
  PRIMARY KEY (`company_id`, `source_id`),
  FOREIGN KEY (`company_id`) REFERENCES `company_valuation_calls`(`company_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade
);
