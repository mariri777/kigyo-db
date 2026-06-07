import type { Stock } from "./types";

export type StockYearData = {
  period: string;
  revenueOku: number;
  operatingProfitOku: number;
  operatingMargin: number;
};

export type HistorySummary = {
  years: StockYearData[];
  revenueGrowthPct: number;
  marginChangePp: number;
  startRevenue: number;
  endRevenue: number;
  startMargin: number;
  endMargin: number;
};

const CURRENT_YEAR = 2025;
const YEARS = 5;

/**
 * 決定的擬似ランダム関数。SSG セーフ（同じ入力で同じ出力）。
 * 銘柄コードと年とインデックスを混ぜて、再現可能なジッターを生成。
 */
function deterministicJitter(code: string, year: number, kind: number): number {
  const seed = parseInt(code, 10) * 1e7 + year * 17 + kind * 313;
  // Math.sin で -1〜1 の値を作り、ジッターレンジを返す
  return Math.sin(seed * 0.0001);
}

/**
 * 銘柄の 5 年業績履歴を、現状値と 3 年 CAGR から決定的に生成する。
 * 本番では EDINET XBRL から実データを取得する想定。
 */
export function getStockHistory(stock: Stock): HistorySummary {
  const currentRevenue = stock.segments.reduce((s, seg) => s + seg.revenueOku, 0) || 1;
  const cagrPct = stock.revenueGrowth3y;
  const cagr = 1 + cagrPct / 100;

  const years: StockYearData[] = [];
  for (let i = YEARS - 1; i >= 0; i--) {
    const year = CURRENT_YEAR - i;
    // 売上：現在値から逆算（古い年ほど小さい or 大きい）
    const revenueBase = currentRevenue / Math.pow(cagr, i);
    // ジッター ±5%（決定的）
    const jitter = deterministicJitter(stock.code, year, 0) * 0.05;
    const revenue = revenueBase * (1 + jitter);

    // 営業利益率：基本は現在値、古い年ほど少し低めに blend（成長過程の表現）
    const targetMargin = stock.operatingMargin;
    const olderMarginBlend = targetMargin > 5 ? targetMargin * 0.85 : targetMargin - 2;
    const blendFactor = i / (YEARS - 1); // 0 = 現在年、1 = 5年前
    const baseMargin = targetMargin * (1 - blendFactor) + olderMarginBlend * blendFactor;
    // ジッター ±1.5pp
    const marginJitter = deterministicJitter(stock.code, year, 1) * 1.5;
    const margin = baseMargin + marginJitter;

    const operatingProfit = (revenue * margin) / 100;

    years.push({
      period: `${year}/3`,
      revenueOku: Math.round(revenue),
      operatingProfitOku: Math.round(operatingProfit),
      operatingMargin: Math.round(margin * 10) / 10,
    });
  }

  const start = years[0];
  const end = years[years.length - 1];
  const revenueGrowthPct = ((end.revenueOku - start.revenueOku) / start.revenueOku) * 100;
  const marginChangePp = end.operatingMargin - start.operatingMargin;

  return {
    years,
    revenueGrowthPct: Math.round(revenueGrowthPct * 10) / 10,
    marginChangePp: Math.round(marginChangePp * 10) / 10,
    startRevenue: start.revenueOku,
    endRevenue: end.revenueOku,
    startMargin: start.operatingMargin,
    endMargin: end.operatingMargin,
  };
}
