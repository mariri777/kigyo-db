import type { StockBrief } from "./types";

/**
 * 業界横断ファンネル(スクリーン)の定義。
 * 全 3,572 銘柄(StockBrief)を対象に、PER/配当利回り/時価総額など stocks テーブルで取れるフィールドで抽出する。
 *
 * Note: 旧スクリーン(割安判定/拡大期/高 ROE/高利益率/高成長)は AI 生成データ・財務時系列を必要としていたため、
 *       全銘柄対応の seed が整うまで一時的に削除している。
 *       将来 company_financials_quarterly が seed されたら復活する。
 */
export type Screen = {
  slug: string;
  /** ページタイトル */
  title: string;
  /** カードや一覧で使う短いタイトル */
  shortTitle: string;
  /** イントロ説明 */
  description: string;
  /** 抽出方法(透明性 + SEO) */
  methodology: string;
  /** SEO 用 meta description(短く) */
  metaDescription: string;
  /** 強調表示するカラム */
  emphasis: "per" | "pbr" | "dividendYield" | "marketCap";
  /** 抽出 predicate(true で対象) */
  filter: (s: StockBrief) => boolean;
  /** ソート(昇順/降順) */
  sort: (a: StockBrief, b: StockBrief) => number;
};

export const screens: Screen[] = [
  {
    slug: "high-dividend",
    title: "高配当銘柄一覧",
    shortTitle: "高配当銘柄",
    description:
      "配当利回り 3.0% 以上の銘柄。インカム狙いの中長期投資先候補。配当の継続性は事業の安定度と密接に関連します。",
    methodology:
      "予想配当利回り 3.0% 以上を抽出条件として、配当利回りの高い順に並べています。配当の継続性は別途、事業フェーズと利益率の安定性を併せて確認することを推奨します。",
    metaDescription:
      "配当利回り 3% 以上の高配当銘柄一覧。インカム狙いの投資先候補。",
    emphasis: "dividendYield",
    filter: (s) => s.dividendYield >= 3.0,
    sort: (a, b) => b.dividendYield - a.dividendYield,
  },
  {
    slug: "low-per",
    title: "低 PER 銘柄一覧",
    shortTitle: "低PER銘柄",
    description:
      "PER(株価収益率)15 倍以下の銘柄。利益に対して株価が抑制されている水準。割安候補だが、市場が低 PER を許容する理由(成長鈍化、構造リスク等)の確認が重要。",
    methodology:
      "PER 15 倍以下を抽出条件として、PER の低い順に並べています。PER だけで割安判定をするのは危険で、必ず ROE・成長率・規範的判断と併せて確認することを推奨します。",
    metaDescription:
      "PER 15 倍以下の低 PER 銘柄一覧。利益に対して株価が抑制されている企業群。",
    emphasis: "per",
    filter: (s) => s.per > 0 && s.per <= 15,
    sort: (a, b) => a.per - b.per,
  },
  {
    slug: "low-pbr",
    title: "低 PBR 銘柄一覧",
    shortTitle: "低PBR銘柄",
    description:
      "PBR(株価純資産倍率)1.0 倍以下の銘柄。簿価ベースで割安水準にある企業群。PBR 1.0 倍割れは資本効率の見直し対象になりやすい。",
    methodology:
      "PBR 1.0 倍以下を抽出条件として、PBR の低い順に並べています。PBR 1.0 倍割れは資本効率(ROE)・成長性と併せて確認することが重要です。",
    metaDescription:
      "PBR 1.0 倍以下の低 PBR 銘柄一覧。簿価ベースで割安水準の企業群。",
    emphasis: "pbr",
    filter: (s) => s.pbr > 0 && s.pbr <= 1.0,
    sort: (a, b) => a.pbr - b.pbr,
  },
  {
    slug: "mega-cap",
    title: "大型株一覧",
    shortTitle: "大型株",
    description:
      "時価総額 1 兆円以上の銘柄。日本を代表する大型企業群。流動性が高く、機関投資家のポートフォリオに組み込まれやすい。",
    methodology:
      "時価総額 10,000 億円(1 兆円)以上を抽出条件として、時価総額の大きい順に並べています。",
    metaDescription:
      "時価総額 1 兆円以上の日本の大型株一覧。",
    emphasis: "marketCap",
    filter: (s) => s.marketCapOku >= 10000,
    sort: (a, b) => b.marketCapOku - a.marketCapOku,
  },
];

export function getScreen(slug: string): Screen | undefined {
  return screens.find((s) => s.slug === slug);
}

/** 与えられた全銘柄から filter + sort を適用する。 */
export function applyScreen(screen: Screen, all: StockBrief[]): StockBrief[] {
  return [...all].filter(screen.filter).sort(screen.sort);
}

export function screenStockCount(screen: Screen, all: StockBrief[]): number {
  return all.filter(screen.filter).length;
}
