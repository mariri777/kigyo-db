import type { FactorBetas, PhaseScores, Stock, ValuationCall } from "./types";

export type ComparisonObservation = {
  key: string;
  category: "業界" | "評価" | "指標" | "成長フェーズ" | "ファクター";
  headline: string;
  detail: string;
};

const VERDICT_ORDER: ValuationCall["verdict"][] = ["割安", "ほぼ妥当", "やや割高", "割高"];

function pctDiff(a: number, b: number) {
  if (b === 0) return Infinity;
  return ((a - b) / Math.abs(b)) * 100;
}

function findMaxMin<T>(
  items: T[],
  selector: (t: T) => number
): { max: T; min: T; maxVal: number; minVal: number } {
  let max = items[0],
    min = items[0],
    maxVal = selector(items[0]),
    minVal = selector(items[0]);
  for (const item of items) {
    const v = selector(item);
    if (v > maxVal) {
      max = item;
      maxVal = v;
    }
    if (v < minVal) {
      min = item;
      minVal = v;
    }
  }
  return { max, min, maxVal, minVal };
}

/**
 * 比較対象銘柄から「違い」の観察を決定的に抽出する。
 * AI 呼び出しなし、純粋なロジック。
 */
export function analyzeComparison(stocks: Stock[]): ComparisonObservation[] {
  if (stocks.length < 2) return [];
  const out: ComparisonObservation[] = [];

  // 業界の共通性
  const clusters = new Set(stocks.map((s) => s.industryCluster));
  if (clusters.size === 1) {
    out.push({
      key: "industry-same",
      category: "業界",
      headline: "全社が同じ業界クラスタ",
      detail: `${stocks.length} 社すべてが「${[...clusters][0]}」に属するため、事業構造の差は同業他社の中での位置取りの差として読めます。`,
    });
  } else {
    out.push({
      key: "industry-diverse",
      category: "業界",
      headline: `${clusters.size} つの異なる業界クラスタ`,
      detail: `${[...clusters].join("、")}が並びます。異業界間の比較なので、PER などの絶対値より、業界内の相対位置・成長フェーズ・リスクプロファイルでの対比が意味を持ちます。`,
    });
  }

  // 規範的判断のレンジ
  const verdicts = stocks.map((s) => s.valuationCall.verdict);
  const uniqueVerdicts = new Set(verdicts);
  if (uniqueVerdicts.size >= 2) {
    const scoreSorted = [...stocks].sort(
      (a, b) => b.valuationCall.score - a.valuationCall.score
    );
    const highest = scoreSorted[0];
    const lowest = scoreSorted[scoreSorted.length - 1];
    out.push({
      key: "verdict-spread",
      category: "評価",
      headline: `規範的判断が分かれる：${[...uniqueVerdicts].join("／")}`,
      detail: `割安度スコアでは ${highest.name}（${highest.valuationCall.score}）が最も割安寄り、${lowest.name}（${lowest.valuationCall.score}）が最もプレミアム寄り。それぞれの根拠を比べて、どちらの議論に説得力があるかを判断する材料に。`,
    });
  } else {
    out.push({
      key: "verdict-aligned",
      category: "評価",
      headline: `全社が「${verdicts[0]}」判定`,
      detail: `規範的判断は一致しています。同じ評価圏内での選別は、配当・成長期待・リスクプロファイルの違いで決めることになります。`,
    });
  }

  // PER の差
  const per = findMaxMin(stocks, (s) => s.per);
  if (per.maxVal / per.minVal >= 1.5) {
    out.push({
      key: "per-spread",
      category: "指標",
      headline: "PER のレンジが大きい",
      detail: `最高 ${per.max.name}（${per.max.per.toFixed(1)} 倍）と最低 ${per.min.name}（${per.min.per.toFixed(1)} 倍）で ${(per.maxVal / per.minVal).toFixed(1)} 倍の差。高 PER は成長期待を、低 PER は割安水準または成長鈍化を反映している可能性があります。`,
    });
  }

  // 配当利回りの差
  const div = findMaxMin(stocks, (s) => s.dividendYield);
  if (div.maxVal - div.minVal >= 2.0) {
    out.push({
      key: "dividend-spread",
      category: "指標",
      headline: "配当利回りに大きな差",
      detail: `${div.max.name}（${div.max.dividendYield.toFixed(1)}%）と ${div.min.name}（${div.min.dividendYield.toFixed(1)}%）。${div.max.name} は配当重視のインカム狙い、${div.min.name} は内部留保による成長投資型と読めます。`,
    });
  }

  // ROE の差
  const roe = findMaxMin(stocks, (s) => s.roe);
  if (roe.maxVal - roe.minVal >= 10) {
    out.push({
      key: "roe-spread",
      category: "指標",
      headline: "ROE（資本効率）の差",
      detail: `${roe.max.name} は ROE ${roe.max.roe.toFixed(1)}% と高水準、${roe.min.name} は ${roe.min.roe.toFixed(1)}% にとどまる。同じ事業に投じても生み出すリターンが ${(roe.maxVal - roe.minVal).toFixed(1)}pt 違う計算になります。`,
    });
  }

  // 成長フェーズの違い
  const dominantPhase = (p: PhaseScores) => {
    const entries: [string, number][] = [
      ["ローンチ期", p.launch],
      ["拡大期", p.expansion],
      ["成熟期", p.mature],
      ["衰退期", p.decline],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };
  const phases = stocks.map((s) => ({ stock: s, phase: dominantPhase(s.phaseScores) }));
  const uniquePhases = new Set(phases.map((p) => p.phase));
  if (uniquePhases.size >= 2) {
    out.push({
      key: "phase-diverse",
      category: "成長フェーズ",
      headline: `成長フェーズが分かれる：${[...uniquePhases].join("／")}`,
      detail: `${phases.map((p) => `${p.stock.name}は${p.phase}寄り`).join("、")}。同じ業界でもフェーズが違うと業績ドライバが大きく変わります。`,
    });
  } else {
    out.push({
      key: "phase-aligned",
      category: "成長フェーズ",
      headline: `全社が${phases[0].phase}寄り`,
      detail: `成長フェーズは概ね揃っています。フェーズ内の優劣は、利益率の質と次の成長ドライバの確度で決まることが多い。`,
    });
  }

  // 売上成長率の差
  const growth = findMaxMin(stocks, (s) => s.revenueGrowth3y);
  if (growth.maxVal - growth.minVal >= 10) {
    out.push({
      key: "growth-spread",
      category: "指標",
      headline: "売上成長率の格差",
      detail: `${growth.max.name}（3 年 CAGR ${growth.max.revenueGrowth3y >= 0 ? "+" : ""}${growth.max.revenueGrowth3y.toFixed(1)}%）と ${growth.min.name}（${growth.min.revenueGrowth3y >= 0 ? "+" : ""}${growth.min.revenueGrowth3y.toFixed(1)}%）。市場の織り込みは成長率に強く反応するため、PER の差の主因のひとつになっている可能性があります。`,
    });
  }

  // ファクター感応度の特徴
  const factorLabels: { key: keyof FactorBetas; ja: string }[] = [
    { key: "sox", ja: "SOX" },
    { key: "usdjpy", ja: "ドル円" },
    { key: "us10y", ja: "米 10 年金利" },
    { key: "china", ja: "中国経済" },
    { key: "value", ja: "バリュー" },
    { key: "momentum", ja: "モメンタム" },
  ];
  for (const f of factorLabels) {
    const fm = findMaxMin(stocks, (s) => s.factorBetas[f.key]);
    if (fm.maxVal - fm.minVal >= 0.8) {
      out.push({
        key: `factor-${f.key}`,
        category: "ファクター",
        headline: `${f.ja} への感応度に差`,
        detail: `${fm.max.name}（${fm.max.factorBetas[f.key].toFixed(2)}）と ${fm.min.name}（${fm.min.factorBetas[f.key].toFixed(2)}）で ${(fm.maxVal - fm.minVal).toFixed(2)} の差。${f.ja} が動いたときの株価反応が逆方向、または大幅に異なります。`,
      });
      // 1 ファクターだけで十分なので break しない（複数特徴を見せる）
      if (out.filter((o) => o.category === "ファクター").length >= 3) break;
    }
  }

  return out;
}

export function verdictSortIndex(v: ValuationCall["verdict"]): number {
  return VERDICT_ORDER.indexOf(v);
}
