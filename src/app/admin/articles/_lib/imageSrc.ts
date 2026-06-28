/**
 * 画像 URL の正規化。
 *   - "photo-xxxx" のような Unsplash photo ID を https://images.unsplash.com/photo-xxxx?... に展開
 *   - "https://" / "http://" / "/" で始まるならそのまま使う
 *   - 空文字はそのまま (呼び出し側で空チェック)
 */
export function normalizeImageSrc(input: string, w = 1200): string {
  const v = input.trim();
  if (!v) return v;
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
      w: String(w),
      q: "75",
    });
    return `https://images.unsplash.com/${v}?${params.toString()}`;
  }
  return v;
}
