// ─────────────────────────────────────────────────────────
// マーケット数値 (モック)
//
// 記事カード/サイドダッシュボードで使う「動いている数字」。
// 実運用ではWebSocketや日次バッチで更新するが、ここではstatic。
// ─────────────────────────────────────────────────────────

export type Quote = {
  /** 銘柄コード or 指数slug */
  key: string;
  name: string;
  /** 現在値 (フォーマット済み表示文字列) */
  value: string;
  /** 前日比 (例: "+0.8%") */
  change: string;
  positive: boolean;
  /** 直近14ポイントのスパークライン (相対値でOK) */
  spark: readonly number[];
};

// 主役 (記事カードに貼り付ける生数値)
//   キーは Post.subject.code もしくは slug
export const quotes: Record<string, Quote> = {
  "9984": {
    key: "9984",
    name: "ソフトバンクG",
    value: "¥12,140",
    change: "+0.8%",
    positive: true,
    spark: [120.1, 119.8, 120.5, 121.2, 120.7, 121.0, 121.4, 121.0, 121.3, 121.5, 121.2, 121.4, 121.4, 121.4],
  },
  "8058": {
    key: "8058",
    name: "三菱商事",
    value: "¥3,212",
    change: "-0.4%",
    positive: false,
    spark: [32.5, 32.3, 32.4, 32.2, 32.4, 32.1, 32.3, 32.2, 32.0, 32.2, 32.1, 32.2, 32.1, 32.12],
  },
  "8035": {
    key: "8035",
    name: "東京エレクトロン",
    value: "¥38,420",
    change: "+3.4%",
    positive: true,
    spark: [371, 372, 370, 374, 376, 378, 380, 379, 381, 383, 382, 384, 384, 384.2],
  },
  "6594": {
    key: "6594",
    name: "ニデック",
    value: "¥3,210",
    change: "-1.2%",
    positive: false,
    spark: [32.5, 32.6, 32.4, 32.5, 32.3, 32.2, 32.0, 32.1, 32.0, 31.9, 32.0, 32.1, 32.1, 32.10],
  },
  // 業界 / テーマ / 指標は集計値で表示
  "trading-house": {
    key: "trading-house",
    name: "総合商社 (業界)",
    value: "+0.3%",
    change: "週間 -1.2%",
    positive: true,
    spark: [100, 100.2, 100.1, 99.8, 99.6, 99.5, 99.7, 99.9, 100.1, 100.3, 100.2, 100.4, 100.3, 100.3],
  },
  semiconductor: {
    key: "semiconductor",
    name: "半導体 (テーマ)",
    value: "+3.8%",
    change: "週間 +6.2%",
    positive: true,
    spark: [100, 100.4, 100.8, 101.2, 101.8, 102.5, 103.1, 103.6, 104.0, 104.5, 104.8, 105.2, 105.5, 105.8],
  },
  "payout-ratio": {
    key: "payout-ratio",
    name: "東証 配当性向中央値",
    value: "31.2%",
    change: "前年 28.4%",
    positive: true,
    spark: [28.4, 28.6, 28.8, 29.0, 29.3, 29.7, 30.0, 30.3, 30.6, 30.8, 31.0, 31.1, 31.2, 31.2],
  },
};

// 公開後の騰落 (記事公開時点〜現在)
//   slug → 騰落
export const postPerformance: Record<string, { change: string; positive: boolean }> = {
  "softbank-ai-quality": { change: "+2.3%", positive: true },
  "trading-house-q1-overview": { change: "-0.6%", positive: false },
  "hbm-process-supplier-share": { change: "+5.4%", positive: true },
  "payout-ratio-primer": { change: "+0.4%", positive: true },
  "nidec-post-nagamori": { change: "+1.1%", positive: true },
};

// 主要指数 (ダッシュボード用)
export const indices: Quote[] = [
  {
    key: "n225",
    name: "日経平均",
    value: "42,318.47",
    change: "+1.24%",
    positive: true,
    spark: [418, 417, 419, 420, 421, 419, 422, 423, 421, 422, 423, 422, 423, 423.18],
  },
  {
    key: "topix",
    name: "TOPIX",
    value: "2,983.12",
    change: "+0.87%",
    positive: true,
    spark: [296, 295, 296, 297, 296, 297, 298, 297, 298, 298, 298, 298, 298, 298.31],
  },
  {
    key: "sox",
    name: "SOX指数",
    value: "5,624.91",
    change: "+2.18%",
    positive: true,
    spark: [550, 552, 555, 558, 555, 558, 562, 560, 562, 560, 561, 562, 562, 562.49],
  },
  {
    key: "usdjpy",
    name: "USD/JPY",
    value: "152.18",
    change: "-0.41%",
    positive: false,
    spark: [152.7, 152.6, 152.8, 152.7, 152.5, 152.4, 152.3, 152.4, 152.3, 152.2, 152.3, 152.2, 152.2, 152.18],
  },
];

// 今動いている主役 (ダッシュボード「動いている主役」用)
//   絶対値の|change|が大きい順 (モック)
export const movers: Quote[] = [
  quotes["8035"], // +3.4%
  quotes.semiconductor, // +3.8%
  quotes["9984"], // +0.8%
  quotes["6594"], // -1.2%
];
