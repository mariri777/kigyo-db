/**
 * メディアストレージ抽象。
 * 本番は Cloudflare R2、開発は MinIO (どちらも S3 互換) を同じ SDK で叩く。
 *
 * 環境変数:
 *   R2_BUCKET, R2_ENDPOINT, R2_REGION, R2_PUBLIC_BASE_URL
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (secret)
 *
 * 保存される key の規約:
 *   articles/{yyyy}/{mm}/{uuid}.{ext}
 *
 * DB には key だけ保存し、公開時は R2_PUBLIC_BASE_URL/key を組み立てる。
 */
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const env = process.env;

function required(name: string): string {
  const v = env[name];
  if (!v) {
    throw new Error(
      `[media] required env var "${name}" is missing. Check .env.development / wrangler secret list`,
    );
  }
  return v;
}

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: env.R2_REGION || "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
    // MinIO は path-style 必須。R2 は path-style/virtual hosted 両対応なので両環境で path-style を選ぶ。
    forcePathStyle: true,
  });
  return _client;
}

/** バケット名 */
export function getBucket(): string {
  return required("R2_BUCKET");
}

/** 公開ベース URL (末尾スラッシュなし) */
export function getPublicBaseUrl(): string {
  return required("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
}

/**
 * オブジェクトを put して key を返す。
 *
 * @param key   "articles/2026/06/abc123.jpg" のような相対 key
 * @param body  Buffer / Uint8Array / Blob
 * @param contentType  例: "image/jpeg"
 */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; url: string }> {
  await client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: `${getPublicBaseUrl()}/${key}` };
}

/** オブジェクトを削除 (差し替え時のクリーンアップ用) */
export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}

/**
 * key → 公開 URL を組み立てる。
 *   - key が "articles/..." 形式: R2_PUBLIC_BASE_URL/key
 *   - key が "https://..." or "http://" or "/" 始まり: そのまま (互換)
 *   - key が "photo-..." (Unsplash photo id): Unsplash CDN に展開
 */
export function resolveMediaUrl(
  key: string | null | undefined,
  opts?: { w?: number; h?: number },
): string | null {
  if (!key) return null;
  const v = key.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) {
    return v;
  }
  if (v.startsWith("photo-")) {
    const params = new URLSearchParams({
      auto: "format",
      fit: "crop",
      w: String(opts?.w ?? 1200),
      q: "75",
    });
    if (opts?.h) params.set("h", String(opts.h));
    return `https://images.unsplash.com/${v}?${params.toString()}`;
  }
  return `${getPublicBaseUrl()}/${v}`;
}

/** key 生成: articles/yyyy/mm/{uuid}.{ext} */
export function generateMediaKey(
  prefix: string,
  filename: string,
): string {
  const ext = extractExt(filename);
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  return `${prefix}/${yyyy}/${mm}/${uuid}${ext ? `.${ext}` : ""}`;
}

function extractExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename
    .slice(i + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
}
