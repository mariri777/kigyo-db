/**
 * Stock 系の型定義。
 *
 * StockBrief は全銘柄(3,572 件)で取れる軽量型 — stocks テーブル単独 + companies.name の JOIN で完結。
 * Stock は詳細フィールド(insights/tags/segments/valuation 等)を含む詳細型 — オーバーレイ済の銘柄でのみ完全に取れる。
 *
 * 一覧・比較・スクリーン・業界マップは StockBrief を使い、銘柄詳細ページのみ Stock を使う。
 *
 * Industry / Post / Theme などの型は、それぞれデータと同居している
 * `lib/industries.ts` `lib/posts.ts` `lib/themes.ts` 側を参照する。
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

/**
 * 全銘柄(3,572 件)で取れる軽量型。
 * stocks テーブル + companies.name の JOIN で完結。
 *
 * 価格系フィールドは Yahoo 未収録の銘柄では 0 になる(リポジトリ層で COALESCE)。
 * UI 側で `priceJpy === 0` の場合は「データ未取得」と扱える。
 */
export type StockBrief = {
  code: string;
  name: string;
  nameEn?: string;
  exchange: "Prime" | "Standard" | "Growth";
  sectorTSE: string;

  priceJpy: number;
  priceDate: string;
  changePct: number;
  marketCapOku: number;
  per: number;
  pbr: number;
  dividendYield: number;
};

/**
 * 詳細型。data.ts オーバーレイがある銘柄でのみ完全に取れる。
 * 銘柄詳細ページ (/stocks/[code]) と類似銘柄計算 (similarity) で使う。
 */
export type Stock = StockBrief & {
  /** Tier 1〜3。data.ts オーバーレイで定義されたもののみ。デフォルトは 3。 */
  tier: 1 | 2 | 3;

  description: string;
  oneLiner: string;
  /** 業界内クラスタ名(例: 「半導体前工程装置」)。オーバーレイ無しの銘柄は sectorTSE と同じ。 */
  industryCluster: string;

  /** 財務指標。オーバーレイがない銘柄は 0。 */
  roe: number;
  operatingMargin: number;
  revenueGrowth3y: number;

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
