CREATE TABLE `forecasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_symbol` text NOT NULL,
	`target_name` text NOT NULL,
	`target_kind` text DEFAULT 'global-index' NOT NULL,
	`stock_code` text,
	`horizon` text DEFAULT 'next-session' NOT NULL,
	`question` text NOT NULL,
	`headline` text NOT NULL,
	`lede` text NOT NULL,
	`probability` integer NOT NULL,
	`confidence` text DEFAULT 'med' NOT NULL,
	`resolve_at` text NOT NULL,
	`reference_price` real,
	`status` text DEFAULT 'live' NOT NULL,
	`outcome` text,
	`outcome_price` real,
	`outcome_at` text,
	`closing_note` text,
	`generated_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_forecasts_natural` ON `forecasts` (`target_symbol`,`resolve_at`);
--> statement-breakpoint
CREATE INDEX `idx_forecasts_status` ON `forecasts` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_forecasts_resolve_at` ON `forecasts` (`resolve_at`);
--> statement-breakpoint
CREATE INDEX `idx_forecasts_target_kind` ON `forecasts` (`target_kind`);
--> statement-breakpoint
CREATE INDEX `idx_forecasts_stock_code` ON `forecasts` (`stock_code`);
--> statement-breakpoint
CREATE TABLE `forecast_takes` (
	`forecast_id` integer NOT NULL,
	`kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`heading` text NOT NULL,
	`body` text NOT NULL,
	`bias` text DEFAULT 'neutral' NOT NULL,
	PRIMARY KEY (`forecast_id`, `kind`, `position`),
	FOREIGN KEY (`forecast_id`) REFERENCES `forecasts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_forecast_takes_forecast` ON `forecast_takes` (`forecast_id`);
--> statement-breakpoint
CREATE TABLE `forecast_scenarios` (
	`forecast_id` integer NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`probability` integer NOT NULL,
	`price_low` real,
	`price_high` real,
	`note` text NOT NULL,
	PRIMARY KEY (`forecast_id`, `kind`),
	FOREIGN KEY (`forecast_id`) REFERENCES `forecasts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forecast_shifts` (
	`forecast_id` integer NOT NULL,
	`at` text NOT NULL,
	`probability` integer NOT NULL,
	`reason` text,
	PRIMARY KEY (`forecast_id`, `at`),
	FOREIGN KEY (`forecast_id`) REFERENCES `forecasts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_forecast_shifts_at` ON `forecast_shifts` (`forecast_id`,`at`);
