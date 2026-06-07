// Drizzle Kit の設定ファイル
// 「スキーマはどこ」「マイグレーションファイルはどこに出力」を指定

import type { Config } from "drizzle-kit";

export default {
  // スキーマファイルの場所
  schema: "./src/db/schema.ts",

  // マイグレーション（DB 変更履歴）の出力先
  out: "./drizzle",

  // D1 は SQLite ベース
  dialect: "sqlite",
} satisfies Config;
