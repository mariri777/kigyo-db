/**
 * Stock を構成する型の定義。
 * Industry / Post / Prediction / Theme などの型は、それぞれデータと同居している
 * `lib/industries.ts` `lib/posts.ts` `lib/predictions.ts` `lib/themes.ts` 側を参照する。
 */

/** 引用元。定量データと AI 生成コンテンツの両方で必須。 */
export type Source = {
  doc: string;
  page?: number;
  period?: string;
  url?: string;
};

/** A 軸: 事業・収益モデルのタグ次元。 */
export type TagDimension =
  | "product"
  | "customer"
  | "channel"
  | "revenue_model"
  | "value_chain"
  | "geography";

export type BusinessTag = {
  dimension: TagDimension;
  value: string;
  source: Source;
};

export type Segment = {
  name: string;
  revenueOku: number;
  share: number;
  operatingMargin?: number;
};

/** C 軸: 成長フェーズの連続スコア (業界内正規化済み)。 */
export type PhaseScores = {
  launch: number;
  expansion: number;
  mature: number;
  decline: number;
};

/** D 軸: ファクター感応度ベータ (時系列回帰の出力)。 */
export type FactorBetas = {
  usdjpy: number;
  us10y: number;
  oil: number;
  sox: number;
  china: number;
  market: number;
  size: number;
  value: number;
  momentum: number;
};

export type Insight = {
  title: string;
  /** 1-2 行で見える要旨。要約だけ知りたい方はここだけ読んで OK */
  lede?: string;
  /** 展開で出る詳細分析 */
  body: string;
  citations: Source[];
  generatedAt: string;
};

export type ValuationCall = {
  verdict: "割安" | "ほぼ妥当" | "やや割高" | "割高";
  score: number;
  rationale: string;
  citations: Source[];
};

export type Stock = {
  code: string;
  name: string;
  nameEn?: string;
  exchange: "Prime" | "Standard" | "Growth";
  tier: 1 | 2 | 3;
  sectorTSE: string;
  industryCluster: string;

  priceJpy: number;
  priceDate: string;
  changePct: number;
  marketCapOku: number;
  per: number;
  pbr: number;
  dividendYield: number;
  roe: number;
  operatingMargin: number;
  revenueGrowth3y: number;

  description: string;
  oneLiner: string;
  tags: BusinessTag[];
  segments: Segment[];
  segmentsPeriod: string;

  phaseScores: PhaseScores;
  phaseRationale: string;

  factorBetas: FactorBetas;
  factorPeriod: string;

  insights: Insight[];
  valuationCall: ValuationCall;
};

export type SimilarStock = {
  stock: Stock;
  score: number;
  reason: string;
};
