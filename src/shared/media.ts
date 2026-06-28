/**
 * Server / Client 両方で使う、メディアキー → URL の解決ロジック。
 *
 *   "photo-xxxx"        → Unsplash CDN
 *   "articles/..."      → NEXT_PUBLIC_R2_PUBLIC_BASE_URL/key (R2 / MinIO)
 *   "http(s)://..." / "/"  → そのまま
 *
 * Server で詳細にパラメータ指定したい場合は server/media/storage.ts の
 * resolveMediaUrl を使う (両者は実装意図が同じ)。
 */

/** クライアント側からは NEXT_PUBLIC_ で公開された値を使う。 */
const PUBLIC_BASE_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
  process.env.R2_PUBLIC_BASE_URL ||
  ""
).replace(/\/$/, "");

export function resolveMediaSrc(
  key: string | null | undefined,
  opts?: { w?: number; h?: number },
): string | null {
  if (!key) return null;
  const v = key.trim();
  if (!v) return null;
  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/")
  ) {
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
  if (PUBLIC_BASE_URL) {
    return `${PUBLIC_BASE_URL}/${v}`;
  }
  // base url 未設定: そのまま key を返す (壊れたまま表示するよりは確認しやすい)
  return v;
}

/**
 * <Image unoptimized={...}> に渡す判定。
 * Next.js 16 は private IP (localhost / 127.0.0.1 / ::1) への upstream を
 * セキュリティ理由で拒否するため、ローカル MinIO の URL は最適化を経由させない。
 * 本番 R2 (kigyo-assets.cho-super.com 等の public DNS) は最適化対象のまま。
 */
export function shouldSkipImageOptimization(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith("http://[::1]") ||
    url.startsWith("http://0.0.0.0")
  );
}
