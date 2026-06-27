import type { PredictionEventType } from "@/content/predictions";

const FULL: Record<PredictionEventType, string> = {
  earnings: "Earnings / 決算",
  disclosure: "Disclosure / 適時開示",
  macro: "Macro / マクロ",
  news: "News / ニュース",
};

const SHORT: Record<PredictionEventType, string> = {
  earnings: "Earnings",
  disclosure: "Disclosure",
  macro: "Macro",
  news: "News",
};

const JA: Record<PredictionEventType, string> = {
  earnings: "決算",
  disclosure: "適時開示",
  macro: "マクロ",
  news: "ニュース",
};

/** 予測カード用のフルラベル (`"Earnings / 決算"` 形式)。 */
export const eventLabelFull = (t: PredictionEventType): string => FULL[t];

/** リストアイテム用の英語短ラベル。 */
export const eventLabelShort = (t: PredictionEventType): string => SHORT[t];

/** 答え合わせダッシュボード用の日本語短ラベル。未知の値は素通し。 */
export function eventLabelJa(t: string): string {
  return (JA as Record<string, string>)[t] ?? t;
}
