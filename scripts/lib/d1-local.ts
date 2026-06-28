/**
 * ローカル D1(miniflare の SQLite ファイル)を better-sqlite3 で直接叩く。
 *
 * NOTE: 既存 scripts/lib/local-db.ts を re-export しているだけ。
 * Phase 5 で local-db.ts を完全削除し、これを唯一の入口にする。
 */
export {
  getLocalD1Path,
  getLocalDb,
  type LocalDb,
} from "./local-db.js";
