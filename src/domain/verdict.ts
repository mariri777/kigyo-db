import type { ValuationCall } from "./types";

/**
 * 規範的判断ラベルの順序とスタイル。
 * 元の同名定数 (StockTable / CompareView / screens / stocks 各所) から振る舞いを一切変えずに集約。
 */

export const VERDICTS: ValuationCall["verdict"][] = [
  "割安",
  "ほぼ妥当",
  "やや割高",
  "割高",
];

/** テーブル・チップ用: 角丸チップで使うクラス。 */
export const VERDICT_STYLE: Record<ValuationCall["verdict"], string> = {
  割安: "text-positive bg-positive/10 border-positive/30",
  ほぼ妥当: "text-foreground bg-foreground/10 border-foreground/30",
  やや割高: "text-negative/80 bg-negative/5 border-negative/30",
  割高: "text-negative bg-negative/10 border-negative/30",
};

/**
 * 大きな評価カード用 (stocks/[code] page で使われていたもの)。
 * Tailwind の opacity 表記が若干異なるため、テーブル用とは別関数で残す。
 */
export function verdictBlockClass(v: ValuationCall["verdict"]): string {
  switch (v) {
    case "割安":
      return "text-positive border-positive/40 bg-positive/10";
    case "ほぼ妥当":
      return "text-accent border-accent/40 bg-accent/10";
    case "やや割高":
      return "text-negative/80 border-negative/40 bg-negative/5";
    case "割高":
      return "text-negative border-negative/40 bg-negative/10";
  }
}
