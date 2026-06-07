CREATE TABLE `stocks` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_jpy` real NOT NULL,
	`market_cap_oku` integer NOT NULL,
	`description` text NOT NULL
);
