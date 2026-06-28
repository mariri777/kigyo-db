CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_expires` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_user_id` ON `admin_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_admin_users_email` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `article_companies` (
	`article_id` integer NOT NULL,
	`code` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`article_id`, `code`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_article_companies_code` ON `article_companies` (`code`);--> statement-breakpoint
CREATE TABLE `article_industries` (
	`article_id` integer NOT NULL,
	`industry_slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`article_id`, `industry_slug`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_article_industries_slug` ON `article_industries` (`industry_slug`);--> statement-breakpoint
CREATE TABLE `article_tags` (
	`article_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`article_id`, `tag_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_article_tags_tag_id` ON `article_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`lede` text NOT NULL,
	`hero_image_key` text,
	`hero_image_alt` text,
	`hero_image_credit` text,
	`subject_kind` text NOT NULL,
	`subject_ref` text NOT NULL,
	`subject_name` text NOT NULL,
	`content_json` text NOT NULL,
	`content_html` text NOT NULL,
	`read_minutes` integer DEFAULT 3 NOT NULL,
	`actions_json` text DEFAULT '[]' NOT NULL,
	`category_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`scheduled_at` text,
	`author_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`author_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_articles_slug` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_articles_status_published_at` ON `articles` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_articles_category` ON `articles` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_articles_subject` ON `articles` (`subject_kind`,`subject_ref`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`edinet_code` text,
	`description` text,
	`one_liner` text,
	`founded` text,
	`listed` text,
	`headquarters` text,
	`ceo_name` text,
	`website` text,
	`employees_consolidated` integer,
	`logo_color` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_companies_edinet_code` ON `companies` (`edinet_code`);--> statement-breakpoint
CREATE TABLE `company_ai_brief` (
	`company_id` integer PRIMARY KEY NOT NULL,
	`summary` text,
	`valuation_rationale` text,
	`stock_trend_analysis` text,
	`stock_trend_factors_json` text,
	`analyst_summary` text,
	`technical_comment` text,
	`positioning_headline` text,
	`positioning_analysis` text,
	`positioning_strengths_json` text,
	`positioning_challenges_json` text,
	`owner_activism_json` text,
	`generated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `company_industries` (
	`company_id` integer NOT NULL,
	`industry_slug` text NOT NULL,
	PRIMARY KEY(`company_id`, `industry_slug`),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`industry_slug`) REFERENCES `industries`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_company_industries_industry_slug` ON `company_industries` (`industry_slug`);--> statement-breakpoint
CREATE TABLE `dividends` (
	`company_id` integer NOT NULL,
	`fy` text NOT NULL,
	`amount` real,
	`ex_date` text,
	`record_date` text,
	`pay_date` text,
	PRIMARY KEY(`company_id`, `fy`),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `edinet_docs` (
	`doc_id` text PRIMARY KEY NOT NULL,
	`edinet_code` text NOT NULL,
	`sec_code` text,
	`doc_type_code` text NOT NULL,
	`period_start` text,
	`period_end` text,
	`submit_date` text NOT NULL,
	`fetch_status` text NOT NULL,
	`failed_reason` text,
	`r2_zip_key` text,
	`r2_xbrl_key` text,
	`discovered_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_edinet_docs_fetch_status` ON `edinet_docs` (`fetch_status`);--> statement-breakpoint
CREATE INDEX `idx_edinet_docs_sec_code` ON `edinet_docs` (`sec_code`,`doc_type_code`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`scope` text NOT NULL,
	`scope_ref` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`occurs_at` text,
	`impact` text,
	`direction` text,
	`source_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_scope` ON `events` (`scope`,`scope_ref`,`kind`);--> statement-breakpoint
CREATE INDEX `idx_events_occurs_at` ON `events` (`occurs_at`);--> statement-breakpoint
CREATE TABLE `financials_annual` (
	`company_id` integer NOT NULL,
	`fy` text NOT NULL,
	`revenue_oku` integer,
	`operating_profit_oku` integer,
	`operating_margin` real,
	`net_profit_oku` integer,
	`eps` real,
	PRIMARY KEY(`company_id`, `fy`),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `financials_quarterly` (
	`company_id` integer NOT NULL,
	`period` text NOT NULL,
	`revenue_oku` integer,
	`op_profit_oku` integer,
	`op_margin` real,
	`net_profit_oku` integer,
	`highlights_json` text,
	PRIMARY KEY(`company_id`, `period`),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `industries` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`description` text,
	`insights_json` text
);
--> statement-breakpoint
CREATE TABLE `market_brief` (
	`date` text PRIMARY KEY NOT NULL,
	`lede` text,
	`bullets_json` text,
	`watch_themes_json` text,
	`indices_json` text,
	`generated_at` text
);
--> statement-breakpoint
CREATE TABLE `prediction_shifts` (
	`prediction_id` integer NOT NULL,
	`at` text NOT NULL,
	`probability` integer NOT NULL,
	`reason` text,
	PRIMARY KEY(`prediction_id`, `at`),
	FOREIGN KEY (`prediction_id`) REFERENCES `predictions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`category` text NOT NULL,
	`question` text NOT NULL,
	`pick_label` text NOT NULL,
	`no_label` text NOT NULL,
	`probability` integer NOT NULL,
	`rationale` text,
	`resolve_at` text NOT NULL,
	`status` text DEFAULT 'soon' NOT NULL,
	`outcome` text,
	`outcome_at` text,
	`volume` text,
	`voters` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_predictions_status` ON `predictions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_predictions_code` ON `predictions` (`code`);--> statement-breakpoint
CREATE INDEX `idx_predictions_resolve_at` ON `predictions` (`resolve_at`);--> statement-breakpoint
CREATE TABLE `stock_prices_daily` (
	`code` text NOT NULL,
	`date` text NOT NULL,
	`open` real,
	`high` real,
	`low` real,
	`close` real NOT NULL,
	`volume` integer,
	PRIMARY KEY(`code`, `date`),
	FOREIGN KEY (`code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stock_prices_daily_date` ON `stock_prices_daily` (`date`);--> statement-breakpoint
CREATE TABLE `stock_snapshot` (
	`code` text PRIMARY KEY NOT NULL,
	`price_jpy` real,
	`price_date` text,
	`change_1d_pct` real,
	`change_1m_pct` real,
	`change_1y_pct` real,
	`market_cap_oku` integer,
	`market_cap_tier` text,
	`per` real,
	`per_forecast` real,
	`pbr` real,
	`psr` real,
	`ev_ebitda` real,
	`peg` real,
	`roe` real,
	`dividend_yield` real,
	`dividend_annual` real,
	`dividend_payout_ratio` real,
	`total_return_yield` real,
	`ma_25` real,
	`ma_75` real,
	`ma_200` real,
	`high_52w` real,
	`low_52w` real,
	`rsi_14` real,
	`avg_volume_3m` text,
	`credit_buy` text,
	`credit_sell` text,
	`credit_ratio` real,
	`price_history_json` text,
	`foreign_ownership` real,
	`individual_ownership` real,
	`stable_ownership` real,
	`latest_revenue_oku` integer,
	`latest_op_profit_oku` integer,
	`latest_op_margin` real,
	`target_consensus` integer,
	`target_high` integer,
	`target_low` integer,
	`analyst_buy` integer,
	`analyst_hold` integer,
	`analyst_sell` integer,
	`valuation_verdict` text,
	`valuation_score` integer,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`code` text PRIMARY KEY NOT NULL,
	`company_id` integer NOT NULL,
	`exchange` text NOT NULL,
	`sector_tse` text NOT NULL,
	`index_membership` text,
	`listed_shares` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stocks_company_id` ON `stocks` (`company_id`);--> statement-breakpoint
CREATE TABLE `story_decks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`source_note` text,
	`published_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_story_decks_company` ON `story_decks` (`company_id`);--> statement-breakpoint
CREATE TABLE `story_slides` (
	`deck_id` integer NOT NULL,
	`n` integer NOT NULL,
	`era` text,
	`year` text,
	`title` text NOT NULL,
	`lead` text,
	`body` text,
	`image` text,
	`highlight` text,
	PRIMARY KEY(`deck_id`, `n`),
	FOREIGN KEY (`deck_id`) REFERENCES `story_decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_tags_slug` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `top_shareholders` (
	`company_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`name` text NOT NULL,
	`share_pct` real,
	`holder_type` text,
	`as_of` text,
	PRIMARY KEY(`company_id`, `rank`),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
