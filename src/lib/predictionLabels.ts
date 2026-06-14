import type { Prediction } from "./predictions";

type EventType = Prediction["eventType"];

/** 予測カード用のフルラベル ("Earnings / 決算" 形式)。 */
export function eventLabelFull(t: EventType): string {
  switch (t) {
    case "earnings":
      return "Earnings / 決算";
    case "disclosure":
      return "Disclosure / 適時開示";
    case "macro":
      return "Macro / マクロ";
    case "news":
      return "News / ニュース";
  }
}

/** リストアイテム用の英語短ラベル。 */
export function eventLabelShort(t: EventType): string {
  switch (t) {
    case "earnings":
      return "Earnings";
    case "disclosure":
      return "Disclosure";
    case "macro":
      return "Macro";
    case "news":
      return "News";
  }
}

/** 答え合わせダッシュボード用の日本語短ラベル。 */
export function eventLabelJa(t: string): string {
  switch (t) {
    case "earnings":
      return "決算";
    case "disclosure":
      return "適時開示";
    case "macro":
      return "マクロ";
    case "news":
      return "ニュース";
    default:
      return t;
  }
}
