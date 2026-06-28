ALTER TABLE `forecasts` ADD COLUMN `issue_kind` text DEFAULT 'fixed-index' NOT NULL;
--> statement-breakpoint
ALTER TABLE `forecasts` ADD COLUMN `position` text;
--> statement-breakpoint
ALTER TABLE `forecasts` ADD COLUMN `yes_label` text;
--> statement-breakpoint
ALTER TABLE `forecasts` ADD COLUMN `no_label` text;
--> statement-breakpoint
ALTER TABLE `forecasts` ADD COLUMN `topic_slug` text;
--> statement-breakpoint
CREATE INDEX `idx_forecasts_issue_kind` ON `forecasts` (`issue_kind`);
--> statement-breakpoint
CREATE INDEX `idx_forecasts_topic_slug` ON `forecasts` (`topic_slug`);
