/**
 * テクニカル指標の最小実装。yahoo-finance2 は返してくれないので自前計算する。
 *
 * いずれも closes は時系列の古い→新しい順を想定。
 * 計算に必要な本数が足りなければ null を返す。
 */

/** 単純移動平均 (SMA)。直近 window 本の平均 */
export function sma(closes: number[], window: number): number | null {
  if (closes.length < window) return null;
  let sum = 0;
  for (let i = closes.length - window; i < closes.length; i++) sum += closes[i];
  return sum / window;
}

/** RSI(Relative Strength Index)。直近 period 本の上昇平均 / 下落平均 */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

/** N 営業日前との変化率 (%)。 */
export function changePctOver(closes: number[], current: number, periods: number): number | null {
  if (closes.length < periods + 1) return null;
  const prev = closes[closes.length - 1 - periods];
  if (prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}
