import type { Stock } from "./types";
import { stocks } from "./data";

/**
 * 業界横断ファンネル（スクリーン）の定義。
 * 各スクリーンは銘柄を選別する predicate と並び替えロジックを持つ。
 * ロングテール SEO（「割安銘柄」「高配当銘柄」等）の捕捉と、ユーザーの切り口別探索を両立する。
 */
export type Screen = {
  slug: string;
  /** ページタイトル */
  title: string;
  /** カードや一覧で使う短いタイトル */
  shortTitle: string;
  /** イントロ説明 */
  description: string;
  /** 抽出方法（透明性 + SEO） */
  methodology: string;
  /** SEO 用 meta description（短く） */
  metaDescription: string;
  /** 強調表示するカラム（テーブルで太字＋色付け） */
  emphasis: "per" | "pbr" | "dividendYield" | "roe" | "operatingMargin" | "revenueGrowth3y" | "expansion" | "valuationScore";
  /** 抽出 predicate（true で対象） */
  filter: (s: Stock) => boolean;
  /** ソート（昇順／降順） */
  sort: (a: Stock, b: Stock) => number;
};

export const screens: Screen[] = [
  {
    slug: "undervalued",
    title: "割安銘柄一覧",
    shortTitle: "割安銘柄",
    description:
      "規範的判断で「割安」と判定された銘柄。同業他社や過去水準との比較で、相対的に株価が抑制されている可能性のある企業群。",
    methodology:
      "本サイトの規範的判断ロジック（同業他社平均・過去 5 年平均との PER 比較＋成長フェーズ調整）で「割安」と判定された銘柄を抽出。割安度スコア（0–100）の高い順に並べています。判断基準の詳細は編集方針をご覧ください。",
    metaDescription:
      "東証上場の割安銘柄一覧。PER・PBR の同業比較と成長フェーズ調整で抽出。半導体・医薬品の主要企業を網羅。",
    emphasis: "valuationScore",
    filter: (s) => s.valuationCall.verdict === "割安",
    sort: (a, b) => b.valuationCall.score - a.valuationCall.score,
  },
  {
    slug: "high-dividend",
    title: "高配当銘柄一覧",
    shortTitle: "高配当銘柄",
    description:
      "配当利回り 3.0% 以上の銘柄。インカム狙いの中長期投資先候補。配当の継続性は事業の安定度と密接に関連します。",
    methodology:
      "予想配当利回り 3.0% 以上を抽出条件として、配当利回りの高い順に並べています。配当の継続性は別途、事業フェーズと利益率の安定性を併せて確認することを推奨します。",
    metaDescription:
      "配当利回り 3% 以上の高配当銘柄一覧。インカム狙いの投資先候補。事業フェーズと利益安定性も併記。",
    emphasis: "dividendYield",
    filter: (s) => s.dividendYield >= 3.0,
    sort: (a, b) => b.dividendYield - a.dividendYield,
  },
  {
    slug: "high-roe",
    title: "高 ROE 銘柄一覧",
    shortTitle: "高ROE銘柄",
    description:
      "ROE（自己資本利益率）15% 以上の銘柄。株主資本を効率よく利益に変換している優良企業群。グローバルでも 15% 超は優秀水準。",
    methodology:
      "ROE 15% 以上を抽出条件として、ROE の高い順に並べています。ROE は分子（純利益）の質が重要で、一時要因による嵩上げや過剰レバレッジによる嵩上げに注意する必要があります。",
    metaDescription:
      "ROE 15% 以上の高 ROE 銘柄一覧。株主資本を効率よく利益化している優良企業。営業利益率と併記。",
    emphasis: "roe",
    filter: (s) => s.roe >= 15,
    sort: (a, b) => b.roe - a.roe,
  },
  {
    slug: "expansion-phase",
    title: "拡大期の銘柄一覧",
    shortTitle: "拡大期銘柄",
    description:
      "成長フェーズで「拡大期」スコアが高い銘柄。売上成長と利益拡大が両立し、投資のリターンが乗りやすい局面にある企業群。",
    methodology:
      "成長フェーズスコア（売上成長率・利益率安定性・設備投資/減価償却比率の業界内正規化値）で「拡大期」スコア 50 以上を抽出。拡大期スコアの高い順に並べています。",
    metaDescription:
      "拡大期フェーズの銘柄一覧。売上成長と利益拡大が両立し、投資リターンが乗りやすい局面の企業群。",
    emphasis: "expansion",
    filter: (s) => s.phaseScores.expansion >= 50,
    sort: (a, b) => b.phaseScores.expansion - a.phaseScores.expansion,
  },
  {
    slug: "high-margin",
    title: "高営業利益率銘柄一覧",
    shortTitle: "高利益率銘柄",
    description:
      "営業利益率 20% 以上の銘柄。本業の収益性が極めて高く、価格決定力・コスト構造・差別化のいずれかで強みを持つ企業群。",
    methodology:
      "営業利益率 20% 以上を抽出条件として、利益率の高い順に並べています。一般に 15% 以上で優良、30% 以上は卓越した水準。継続性は競争環境の変化に依存します。",
    metaDescription:
      "営業利益率 20% 以上の高収益銘柄一覧。価格決定力・コスト構造・差別化の強い企業群。",
    emphasis: "operatingMargin",
    filter: (s) => s.operatingMargin >= 20,
    sort: (a, b) => b.operatingMargin - a.operatingMargin,
  },
  {
    slug: "high-growth",
    title: "高成長銘柄一覧",
    shortTitle: "高成長銘柄",
    description:
      "売上 3 年 CAGR（年平均成長率）10% 以上の銘柄。市場拡大の波に乗っている、または独自のシェア拡大を実現している企業群。",
    methodology:
      "売上 3 年 CAGR 10% 以上を抽出条件として、成長率の高い順に並べています。一時要因（M&A、為替効果）の影響を含む数値のため、オーガニックな成長を別途確認することを推奨します。",
    metaDescription:
      "売上 3 年 CAGR 10% 以上の高成長銘柄一覧。市場拡大やシェア拡大で売上が伸びている企業群。",
    emphasis: "revenueGrowth3y",
    filter: (s) => s.revenueGrowth3y >= 10,
    sort: (a, b) => b.revenueGrowth3y - a.revenueGrowth3y,
  },
  {
    slug: "low-per",
    title: "低 PER 銘柄一覧",
    shortTitle: "低PER銘柄",
    description:
      "PER（株価収益率）15 倍以下の銘柄。利益に対して株価が抑制されている水準。割安候補だが、市場が低 PER を許容する理由（成長鈍化、構造リスク等）の確認が重要。",
    methodology:
      "PER 15 倍以下を抽出条件として、PER の低い順に並べています。PER だけで割安判定をするのは危険で、必ず ROE・成長率・規範的判断と併せて確認することを推奨します。",
    metaDescription:
      "PER 15 倍以下の低 PER 銘柄一覧。利益に対して株価が抑制されている企業群。ROE・成長率と併記。",
    emphasis: "per",
    filter: (s) => s.per <= 15,
    sort: (a, b) => a.per - b.per,
  },
];

export function getScreen(slug: string): Screen | undefined {
  return screens.find((s) => s.slug === slug);
}

export function applyScreen(screen: Screen): Stock[] {
  return [...stocks].filter(screen.filter).sort(screen.sort);
}

export function screenStockCount(screen: Screen): number {
  return stocks.filter(screen.filter).length;
}
