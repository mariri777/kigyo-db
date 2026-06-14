/**
 * Stock 系の型定義。
 *
 * - StockBrief: 全銘柄(3,572 件)で取れる軽量型。stocks + companies.name の JOIN で完結。
 * - Stock:      詳細型。オーバーレイ済(AI 生成データ・タグ・セグメントを持つ)銘柄向け。
 *
 * 設計方針:
 *  価格・指標・AI 生成データは未取得状態を `null` で表現する。
 *  0 で埋めて「0 なら未取得」と暗黙ルールを作らず、UI 側で null を見て「—」を出す。
 */

export type Exchange = "Prime" | "Standard" | "Growth";
export type Verdict = "割安" | "ほぼ妥当" | "やや割高" | "割高";

export type Source = {
  doc: string;
  page?: number;
  period?: string;
  url?: string;
};

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

export type PhaseScores = {
  launch: number;
  expansion: number;
  mature: number;
  decline: number;
};

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
  lede?: string;
  body: string;
  citations: Source[];
  generatedAt: string;
};

export type ValuationCall = {
  verdict: Verdict;
  score: number;
  rationale: string;
  citations: Source[];
};

/** 全銘柄共通の軽量型。価格・指標は Yahoo Finance 未収録銘柄では null。 */
export type StockBrief = {
  code: string;
  name: string;
  nameEn?: string;
  exchange: Exchange;
  sectorTSE: string;

  priceJpy: number | null;
  priceDate: string | null;
  changePct: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
};

/**
 * 詳細型。AI 生成データ(phase/factor/valuation/insights)とタグ・セグメントを持ち得る。
 * オーバーレイが無い銘柄では tags=[], segments=[], insights=[], phaseScores=null,
 * factorBetas=null, valuationCall=null になる。UI は null を「データ未取得」と表示する。
 */
export type Stock = StockBrief & {
  tier: 1 | 2 | 3;
  description: string;
  oneLiner: string;
  industryCluster: string;

  /** 財務時系列は seed されていない。将来 EDINET 連携で埋める。 */
  roe: number | null;
  operatingMargin: number | null;
  revenueGrowth3y: number | null;

  tags: BusinessTag[];
  segments: Segment[];
  segmentsPeriod: string | null;

  phaseScores: PhaseScores | null;
  phaseRationale: string | null;

  factorBetas: FactorBetas | null;
  factorPeriod: string | null;

  insights: Insight[];
  valuationCall: ValuationCall | null;
};

export type SimilarStock = {
  stock: Stock;
  score: number;
  reason: string;
};
