-- 銘柄マスタを拡張し、日次価格履歴テーブルを追加するマイグレーション。
-- 0000 マイグレーション時点の stocks(code/name/price_jpy/market_cap_oku/description) を作り直す。
-- description は data.ts 側で持つため DB からは外す。

DROP TABLE IF EXISTS `stocks`;

CREATE TABLE `stocks` (
  `code` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `name_en` text,
  `exchange` text NOT NULL,
  `sector_tse` text NOT NULL,
  `industry_cluster` text NOT NULL,
  `price_jpy` real,
  `price_date` text,
  `change_pct` real,
  `market_cap_oku` integer,
  `per` real,
  `pbr` real,
  `dividend_yield` real,
  `updated_at` text NOT NULL
);

CREATE TABLE `stock_prices_daily` (
  `code` text NOT NULL,
  `date` text NOT NULL,
  `open` real,
  `high` real,
  `low` real,
  `close` real NOT NULL,
  `volume` integer,
  `adj_close` real,
  PRIMARY KEY(`code`, `date`),
  FOREIGN KEY (`code`) REFERENCES `stocks`(`code`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_stock_prices_daily_date` ON `stock_prices_daily` (`date`);
