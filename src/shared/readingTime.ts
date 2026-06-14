/**
 * HTML 本文から読了目安(分)を推定する。server / client 双方から呼ぶ。
 * 600 字/分(日本語の標準読書速度の中央値)で換算し、最低 1 分。
 */
const CHAR_PER_MIN = 600;

export function estimateReadingMin(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) return 1;
  return Math.max(1, Math.round(text.length / CHAR_PER_MIN));
}
