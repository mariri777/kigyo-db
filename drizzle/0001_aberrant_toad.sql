CREATE TABLE `homepage_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`subject_kind` text NOT NULL,
	`subject_code` text,
	`subject_name` text NOT NULL,
	`one_liner` text NOT NULL,
	`key_metric_label` text NOT NULL,
	`key_metric_value` text NOT NULL,
	`key_metric_positive` integer,
	`source` text NOT NULL,
	`published_at` text NOT NULL,
	`published_at_iso` text NOT NULL,
	`related_article_slug` text,
	`score` real DEFAULT 0 NOT NULL,
	`as_of` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_homepage_highlights_asof_score` ON `homepage_highlights` (`as_of`,`score`);--> statement-breakpoint
CREATE TABLE `market_indices` (
	`symbol` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`value` real,
	`previous_close` real,
	`change_1d_pct` real,
	`change_1d_abs` real,
	`as_of` text,
	`updated_at` text
);
