/**
 * EDINET XBRL のタグマッピング表。
 *
 * 「画面で見せる値」 → 会計基準別 (日本基準 / IFRS / 米国基準) のタグ。
 * 初期実装は有報 (jpcrp030000-asr-*) を主対象。
 *
 * 注意: XBRL では同じタグが context 別 (当期 / 前期 / 連結 / 個別 / 予想) に複数現れる。
 * このマッピング表は「どのタグを引くか」だけを管理し、context の解釈は parser 側で行う。
 */

export type AccountingStandard = "JapanGAAP" | "IFRS" | "USGAAP";

export type ConsolidatedFlag = "consolidated" | "nonconsolidated";

/**
 * 1 つの財務指標について、会計基準別にタグ候補を保持する。
 * parser は AccountingStandardsDEI を読んで該当列を引く。
 */
export type FinancialMetricSpec = {
  /** 内部で使う一意キー */
  key: string;
  /** 人間向けのラベル (ログ・デバッグ用) */
  label: string;
  /** 日本基準 (jppfs/jpcrp) */
  japanGaap: string[];
  /** IFRS (jpigp/jpcrp) */
  ifrs: string[];
  /** 米国基準 (jpcrp 一部) — 当面 fallback */
  usGaap?: string[];
};

/**
 * 有報「経営指標等の推移」(SummaryOfBusinessResults) 系のタグ。
 * 1 有報に 5 期分が同梱されているので、年次 10 年テーブルが一気に埋まる。
 */
export const SUMMARY_METRICS: FinancialMetricSpec[] = [
  {
    key: "revenue",
    label: "売上高",
    japanGaap: [
      "jpcrp_cor:NetSalesSummaryOfBusinessResults",
      "jpcrp_cor:RevenueSummaryOfBusinessResults",
    ],
    ifrs: [
      "jpcrp_cor:RevenueIFRSSummaryOfBusinessResults",
      "jpcrp_cor:NetSalesIFRSSummaryOfBusinessResults",
    ],
  },
  {
    key: "ordinaryIncome",
    label: "経常利益",
    japanGaap: ["jpcrp_cor:OrdinaryIncomeLossSummaryOfBusinessResults"],
    ifrs: [],
  },
  {
    key: "netProfit",
    label: "親会社株主に帰属する当期純利益",
    japanGaap: [
      "jpcrp_cor:ProfitLossAttributableToOwnersOfParentSummaryOfBusinessResults",
      "jpcrp_cor:NetIncomeLossSummaryOfBusinessResults",
    ],
    ifrs: [
      "jpcrp_cor:ProfitLossAttributableToOwnersOfParentIFRSSummaryOfBusinessResults",
    ],
  },
  {
    key: "eps",
    label: "1株当たり当期純利益 (EPS)",
    japanGaap: [
      "jpcrp_cor:BasicEarningsLossPerShareSummaryOfBusinessResults",
    ],
    ifrs: [
      "jpcrp_cor:BasicEarningsLossPerShareIFRSSummaryOfBusinessResults",
    ],
  },
  {
    key: "dividendPerShare",
    label: "1株当たり配当",
    japanGaap: [
      "jpcrp_cor:DividendPaidPerShareSummaryOfBusinessResults",
    ],
    ifrs: [
      "jpcrp_cor:DividendPaidPerShareSummaryOfBusinessResults",
    ],
  },
  {
    key: "employees",
    label: "従業員数 (連結)",
    japanGaap: [
      "jpcrp_cor:NumberOfEmployees",
    ],
    ifrs: [
      "jpcrp_cor:NumberOfEmployees",
    ],
  },
];

/**
 * 損益計算書 (P/L) 本表のタグ。営業利益などはここから引く必要がある
 * (Summary は売上高・経常・純利益 + EPS + 配当しか持たない)。
 */
export const PL_METRICS: FinancialMetricSpec[] = [
  {
    key: "operatingProfit",
    label: "営業利益",
    japanGaap: ["jppfs_cor:OperatingIncome"],
    ifrs: ["jpigp_cor:OperatingProfitLossIFRS"],
  },
];

/**
 * Instant 系 (期末時点値) のタグ。Summary と違って「当期末の 1 数値」だけを引く。
 *
 * 発行済株式数は Yahoo の marketCap が一部銘柄で壊れている (株式分割サイレント
 * 未反映) のを回避するため、自前で listed_shares × price で時価総額を算出するのに使う。
 * 自己株式を差し引きたい場合は別途 TotalNumberOfSharesHeldTreasurySharesEtc を追加検討。
 */
export const INSTANT_METRICS: FinancialMetricSpec[] = [
  {
    key: "issuedShares",
    label: "発行済株式総数",
    japanGaap: ["jpcrp_cor:TotalNumberOfIssuedSharesSummaryOfBusinessResults"],
    ifrs: ["jpcrp_cor:TotalNumberOfIssuedSharesSummaryOfBusinessResults"],
  },
];

/**
 * DEI (Document and Entity Information) — 書類自体のメタ
 */
export const DEI_TAGS = {
  filerName: "jpdei_cor:FilerNameInJapaneseDEI",
  edinetCode: "jpdei_cor:EDINETCodeDEI",
  secCode: "jpdei_cor:SecurityCodeDEI",
  fyStart: "jpdei_cor:CurrentFiscalYearStartDateDEI",
  fyEnd: "jpdei_cor:CurrentFiscalYearEndDateDEI",
  accountingStandards: "jpdei_cor:AccountingStandardsDEI",
} as const;

/**
 * 表紙 (Cover Page) と 沿革 (CompanyHistoryTextBlock) からの会社メタ抽出用タグ。
 *
 * 注意:
 *  - 各項目は「最初にヒットした候補」を採用する (parser 側のロジック)
 *  - 実際の EDINET XBRL では設立日・上場日・URL 専用のタグが存在しない/常に空 のことが多い。
 *    その場合は CompanyHistoryTextBlock の HTML から正規表現で抽出を試み、駄目なら null。
 */
export const COVER_META_TAGS = {
  /** 社名 (例: "トヨタ自動車株式会社") */
  companyNameJa: [
    "jpcrp_cor:CompanyNameCoverPage",
    "jpdei_cor:FilerNameInJapaneseDEI",
  ],
  /** 代表者 (例: "取締役副社長 宮崎 洋一") */
  ceoName: [
    "jpcrp_cor:TitleAndNameOfRepresentativeCoverPage",
    "jpcrp_cor:NameRepresentativeCoverPage",
  ],
  /** 本社所在地 (例: "愛知県豊田市トヨタ町１番地") */
  headquarters: [
    "jpcrp_cor:AddressOfRegisteredHeadquarterCoverPage",
    "jpcrp_cor:FilerHeadquartersAddressCoverPage",
  ],
  /** 設立年月日 (専用タグ。多くの企業で空) */
  founded: [
    "jpcrp_cor:DateOfEstablishmentCoverPage",
  ],
  /** 上場日 (専用タグ。ほぼ存在しない) */
  listed: [
    "jpcrp_cor:DateOfListingCoverPage",
    "jpcrp_cor:DateOfListedSharesCoverPage",
  ],
  /** 会社 URL (専用タグ。ほぼ存在しない) */
  website: [
    "jpcrp_cor:CompanyWebsiteURLCoverPage",
  ],
  /** 沿革 (HTML 入り TextBlock。設立日・上場日が表形式で書かれていることがある) */
  companyHistory: [
    "jpcrp_cor:CompanyHistoryTextBlock",
  ],
} as const;

/**
 * AccountingStandardsDEI の値 → AccountingStandard 列挙への変換
 */
export function parseAccountingStandard(raw: string | undefined): AccountingStandard {
  if (!raw) return "JapanGAAP";
  const v = raw.toLowerCase();
  if (v.includes("ifrs")) return "IFRS";
  if (v.includes("us") || v.includes("usgaap") || v.includes("usGaap")) return "USGAAP";
  return "JapanGAAP";
}

/**
 * 与えられた指標の「会計基準別タグ候補リスト」を返す。
 */
export function tagsFor(
  spec: FinancialMetricSpec,
  std: AccountingStandard,
): string[] {
  if (std === "IFRS") return spec.ifrs;
  if (std === "USGAAP") return spec.usGaap ?? spec.japanGaap;
  return spec.japanGaap;
}
