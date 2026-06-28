ALTER TABLE `forecasts` ADD `issue_kind` text DEFAULT 'fixed-index' NOT NULL;--> statement-breakpoint
ALTER TABLE `forecasts` ADD `position` text;--> statement-breakpoint
ALTER TABLE `forecasts` ADD `yes_label` text;--> statement-breakpoint
ALTER TABLE `forecasts` ADD `no_label` text;--> statement-breakpoint
ALTER TABLE `forecasts` ADD `topic_slug` text;--> statement-breakpoint
ALTER TABLE `edinet_docs` DROP COLUMN `r2_zip_key`;--> statement-breakpoint
ALTER TABLE `edinet_docs` DROP COLUMN `r2_xbrl_key`;