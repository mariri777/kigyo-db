/**
 * scripts 用の env loader。dotenv 経由。
 *
 * 読み込み順序(先勝ち = 既存値を上書きしない):
 *   1. 既存 process.env ... CI/GH Actions secrets が最優先
 *   2. .env.local       ... ローカル開発者の秘匿値
 *   3. .env.production  ... コミット済み、非機密値(エンドポイント・バケット名等)
 *
 * pipeline.ts / wrangler 呼び出し前の早い段階で 1 回呼ぶ。副作用ベース。
 */
import { config as loadEnvFile } from "dotenv";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

let _loaded = false;

export function loadDotenv(): void {
  if (_loaded) return;
  _loaded = true;
  loadEnvFile({ path: join(ROOT, ".env.local"), override: false });
  loadEnvFile({ path: join(ROOT, ".env.production"), override: false });
}
