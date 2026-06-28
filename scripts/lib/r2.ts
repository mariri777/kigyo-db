/**
 * R2 抽象。
 * ローカル試走時は tmp/edinet-raw/ をファイルシステム上の擬似 R2 として扱う。
 * 本番では S3 互換 API 経由で Cloudflare R2 に put/get する (実装は後フェーズ)。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_ROOT = path.join(__dirname, "../../tmp/edinet-raw");

export type R2Target = "local" | "remote";

export type R2Client = {
  put(key: string, data: Uint8Array | ArrayBuffer | Buffer): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  /** デバッグ用 */
  localPath?(key: string): string;
};

export function createR2Client(target: R2Target): R2Client {
  if (target === "local") {
    return {
      async put(key, data) {
        const full = path.join(LOCAL_ROOT, key);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, Buffer.from(data as ArrayBuffer));
      },
      async get(key) {
        const full = path.join(LOCAL_ROOT, key);
        return new Uint8Array(await fs.readFile(full));
      },
      async exists(key) {
        try {
          await fs.access(path.join(LOCAL_ROOT, key));
          return true;
        } catch {
          return false;
        }
      },
      localPath(key) {
        return path.join(LOCAL_ROOT, key);
      },
    };
  }

  // remote 実装は将来追加 (Cloudflare R2 S3 互換)
  throw new Error("R2 remote target は未実装 (将来 Cloudflare R2 S3 互換で実装予定)");
}
