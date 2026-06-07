// データベースの設計図（スキーマ）
// 実験用なので最小限の 5 列だけ

import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

/**
 * stocks（銘柄）テーブル
 *
 * Excel で例えると：
 *  シート名 = stocks
 *  A 列：code（銘柄コード、文字、これが主キー）
 *  B 列：name（銘柄名、文字）
 *  C 列：price_jpy（株価、小数）
 *  D 列：market_cap_oku（時価総額（億円）、整数）
 *  E 列：description（説明、文字）
 */
export const stocks = sqliteTable("stocks", {
  // 主キー（primaryKey）= この列で一意に識別。同じ値は 2 つ入らない
  code: text("code").primaryKey(),

  // notNull() = 空欄を許さない
  name: text("name").notNull(),

  // real = 小数（JavaScript の number に相当）
  priceJpy: real("price_jpy").notNull(),

  // integer = 整数
  marketCapOku: integer("market_cap_oku").notNull(),

  // 説明は長い文章になることがあるので notNull だけ
  description: text("description").notNull(),
});
