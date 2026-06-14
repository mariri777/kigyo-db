/**
 * 表示用フォーマッタの集約。
 * 振る舞いを変えないため、既存の `.toFixed(1)` などの呼び出しと完全に同じ出力になる薄いラッパに留める。
 */

export const formatPrice = (jpy: number): string => `¥${jpy.toLocaleString()}`;

export const formatOku = (oku: number): string => `${oku.toLocaleString()}億円`;

export const formatTrillionFromOku = (oku: number): string =>
  `${(oku / 10000).toFixed(1)} 兆円`;

export const formatPer = (per: number): string => `${per.toFixed(1)} 倍`;

export const formatPbr = (pbr: number): string => `${pbr.toFixed(2)} 倍`;

export const formatPct1 = (pct: number): string => `${pct.toFixed(1)}%`;

export const formatPct2 = (pct: number): string => `${pct.toFixed(2)}%`;

export const formatBeta = (beta: number): string => beta.toFixed(2);

export const formatSignedPct1 = (pct: number): string =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

export const formatSignedPct2 = (pct: number): string =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

export const formatPctInt = (pct: number): string => `${pct.toFixed(0)}%`;

/** 日付文字列 (YYYY-MM-DD) を "YYYY年M月D日" へ。タイムゾーンは JST 固定。 */
export function formatJaDate(d: string): string {
  const date = new Date(`${d}T00:00:00+09:00`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** ISO 文字列を "YYYY/MM/DD" へ。 */
export function formatIsoSlashDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** ISO 文字列を "MM/DD HH:MM" へ。 */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

/** ISO 文字列を "HH:MM:SS" へ。 */
export function formatTimeHms(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
}

/** PredictionListItem 用の "M/D HH:MM" 表記。formatShortDateTime と異なり 0 パディングなし。 */
export function formatPredictionEventDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}
