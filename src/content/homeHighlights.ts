/**
 * トップページの編集キュレーション部分のデータ。
 * ロジックではなく編集判断のかたまりなので、ページ本体と分けて保持する。
 */

export type FactorAnomaly = {
  code: string;
  name: string;
  factor: string;
  expected: string;
  actual: string;
  insight: string;
};

export const FACTOR_ANOMALIES: FactorAnomaly[] = [
  {
    code: "6857",
    name: "アドバンテスト",
    factor: "SOX（半導体株指数）",
    expected: "SOX 連動が前提（半導体株なので）",
    actual: "HBM テスト需要で SOX を上回る上昇",
    insight:
      "HBM 用テスト装置で世界シェア独占。SOX 全体が踊り場でも、AI 半導体（HBM）の単独テーマで個別上昇余地が残る。",
  },
  {
    code: "7203",
    name: "トヨタ",
    factor: "USD/JPY（ドル円）",
    expected: "円安で大幅上昇（典型的輸出企業）",
    actual: "海外現地生産の進展でベータは想定より低い",
    insight:
      "北米・アジアでの現地生産比率が高く、円安恩恵は教科書ほど直接的でない。逆に円高耐性は他社より強い。",
  },
  {
    code: "8058",
    name: "三菱商事",
    factor: "原油価格",
    expected: "原油安で業績悪化（資源商社）",
    actual: "非資源事業の拡大で原油感応度は低下傾向",
    insight:
      "ローソン（コンビニ）・電力・食品など非資源セグメントが収益の柱に。資源高への依存度が下がり、ディフェンシブ化。",
  },
];

export type CrossIndustryPair = {
  theme: string;
  aCode: string;
  aName: string;
  aIndustry: string;
  bCode: string;
  bName: string;
  bIndustry: string;
  reason: string;
};

export const CROSS_INDUSTRY_PAIRS: CrossIndustryPair[] = [
  {
    theme: "グローバルニッチで圧倒的シェア",
    aCode: "4063",
    aName: "信越化学",
    aIndustry: "化学",
    bCode: "4568",
    bName: "第一三共",
    bIndustry: "医薬",
    reason:
      "両社とも、特定領域（半導体ウェハ・ADC 抗体薬）で世界シェア圧倒的1位。価格決定権と長期 R&D 投資が、模倣困難性の源泉。",
  },
  {
    theme: "現場主義オペレーション卓越",
    aCode: "6902",
    aName: "デンソー",
    aIndustry: "自動車部品",
    bCode: "9983",
    bName: "ファーストリテイリング",
    bIndustry: "アパレル小売",
    reason:
      "片やトヨタ生産方式（JIT）の中核、片や SPA で垂直統合。業界は違えど「現場改善の徹底＋世界展開」という DNA が共通。",
  },
  {
    theme: "規制業種ディフェンシブ",
    aCode: "9432",
    aName: "NTT",
    aIndustry: "通信",
    bCode: "8766",
    bName: "東京海上",
    bIndustry: "損保",
    reason:
      "両社とも巨大装置産業の規制業種。参入障壁の高さ・長期契約による収益の安定性・配当成長が魅力。インフレ局面では料金転嫁力も。",
  },
];
