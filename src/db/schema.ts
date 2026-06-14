import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

/**
 * stocks: 銘柄テーブル。
 * 現在は実験用の最小列のみ。実データ移行時に Stock 型 (lib/types.ts) と整合するよう拡張する。
 */
export const stocks = sqliteTable("stocks", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  priceJpy: real("price_jpy").notNull(),
  marketCapOku: integer("market_cap_oku").notNull(),
  description: text("description").notNull(),
});
