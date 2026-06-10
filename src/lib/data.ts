import type { Stock } from "./types";

// 半導体クラスタ Tier 1 のモックデータ。
// 数値は設計プロトタイプ用の代表的なオーダー感で、実データではない。
// 本番では EDINET XBRL / J-Quants / IR クローラーから決定的に取得する。

const SRC_2025FY_TKEM = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 8 };
const SRC_2025FY_ADV = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 12 };
const SRC_2025_LSRTEC = { doc: "2025年6月期 通期決算説明会資料", period: "2025/6", page: 7 };
const SRC_2025FY_DISCO = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 9 };
const SRC_2025FY_SCREEN = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 11 };
const SRC_2025FY_ROHM = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 14 };
const SRC_2025FY_SCNX = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 6 };
const SRC_2025FY_SHIN = { doc: "2025年3月期 統合報告書", period: "2025/3", page: 22 };
const SRC_2025FY_FRTC = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 10 };
const SRC_2025FY_ANRT = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 13 };

// 半導体クラスタ拡張（2026-06 追加分）の出典
const SRC_2025FY_RENESAS = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 10 };
const SRC_2025FY_SUMCO = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 8 };
const SRC_2025FY_HOYA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 12 };
const SRC_2025FY_KOKUSAI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 9 };
const SRC_2025FY_IBIDEN = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 11 };
const SRC_2025FY_ACCRETECH = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 10 };
const SRC_2025FY_TOK = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 9 };
const SRC_2025FY_RESONAC = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 14 };

// 医薬品クラスタ用の出典
const SRC_2025FY_TAKEDA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 22 };
const SRC_2025FY_DAIICHI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 18 };
const SRC_2025FY_ASTELLAS = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 15 };
const SRC_2025FY_EISAI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 17 };
const SRC_2025FY_CHUGAI = { doc: "2024年12月期 通期決算説明会資料", period: "2024/12", page: 14 };
const SRC_2025FY_SHIONOGI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 16 };
const SRC_2025FY_TERUMO = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 20 };
const SRC_2025FY_FUJIFILM = { doc: "2025年3月期 統合報告書", period: "2025/3", page: 32 };

// SaaS クラスタ用の出典
const SRC_2025FY_SANSAN = { doc: "2025年5月期 通期決算説明会資料", period: "2025/5", page: 14 };
const SRC_2025FY_MF = { doc: "2025年11月期 通期決算説明会資料", period: "2025/11", page: 12 };
const SRC_2025FY_FREEE = { doc: "2025年6月期 通期決算説明会資料", period: "2025/6", page: 16 };
const SRC_2025FY_RAKUS = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 11 };
const SRC_2025FY_HENNGE = { doc: "2025年9月期 通期決算説明会資料", period: "2025/9", page: 9 };
const SRC_2025FY_KAONAVI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 10 };
const SRC_2025FY_KUBELL = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 13 };

// 自動車クラスタ用の出典
const SRC_2025FY_TOYOTA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 24 };
const SRC_2025FY_HONDA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 21 };
const SRC_2025FY_NISSAN = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 19 };
const SRC_2025FY_SUZUKI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 17 };
const SRC_2025FY_SUBARU = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 16 };
const SRC_2025FY_MAZDA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 15 };
const SRC_2025FY_DENSO = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 22 };
const SRC_2025FY_AISIN = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 18 };

// 総合商社クラスタ用の出典
const SRC_2025FY_MITSUBISHI_C = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 28 };
const SRC_2025FY_MITSUI_C = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 26 };
const SRC_2025FY_ITOCHU = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 25 };
const SRC_2025FY_SUMITOMO_C = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 23 };
const SRC_2025FY_MARUBENI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 22 };

// 金融クラスタ用の出典
const SRC_2025FY_MUFG = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 32 };
const SRC_2025FY_SMFG = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 28 };
const SRC_2025FY_MIZUHO = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 25 };
const SRC_2025FY_NOMURA = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 21 };
const SRC_2025FY_TOKIO = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 24 };
const SRC_2025FY_MSAD = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 20 };

// 不動産クラスタ用の出典
const SRC_2025FY_MITSUI_F = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 26 };
const SRC_2025FY_MEC = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 24 };
const SRC_2025FY_SUMITOMO_F = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 22 };
const SRC_2025FY_DAIWA_H = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 28 };
const SRC_2025FY_SEKISUI_H = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 25 };

// 通信クラスタ用の出典
const SRC_2025FY_NTT = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 30 };
const SRC_2025FY_KDDI = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 26 };
const SRC_2025FY_SBG = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 32 };
const SRC_2025FY_RAKUTEN = { doc: "2025年12月期 通期決算説明会資料", period: "2025/12", page: 24 };

// 化学・素材クラスタ用の出典
const SRC_2025FY_MITSUBISHI_CHEM = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 22 };
const SRC_2025FY_SUMITOMO_CHEM = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 18 };
const SRC_2025FY_TORAY = { doc: "2025年3月期 通期決算説明会資料", period: "2025/3", page: 20 };

// 外食・小売クラスタ用の出典
const SRC_2025FY_AEON = { doc: "2026年2月期 通期決算説明会資料", period: "2026/2", page: 18 };
const SRC_2025FY_SEVEN = { doc: "2026年2月期 通期決算説明会資料", period: "2026/2", page: 22 };
const SRC_2025FY_FASTRTL = { doc: "2025年8月期 通期決算説明会資料", period: "2025/8", page: 24 };
const SRC_2025FY_FLC = { doc: "2025年9月期 通期決算説明会資料", period: "2025/9", page: 16 };
const SRC_2025FY_SHIMAMURA = { doc: "2026年2月期 通期決算説明会資料", period: "2026/2", page: 14 };

export const stocks: Stock[] = [
  {
    code: "8035",
    name: "東京エレクトロン",
    nameEn: "Tokyo Electron",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体前工程装置",
    priceJpy: 28450,
    priceDate: "2026-05-26",
    changePct: 1.34,
    marketCapOku: 134200,
    per: 22.8,
    pbr: 6.4,
    dividendYield: 1.9,
    roe: 28.7,
    operatingMargin: 27.5,
    revenueGrowth3y: 9.2,
    description:
      "半導体製造装置（前工程）大手。コータ／デベロッパで圧倒的世界シェア、エッチング・成膜でも世界 2 位級。EUV 普及・GAA 構造移行・先端パッケージ拡大で構造的追い風。",
    oneLiner:
      "半導体を作る『装置』を作っている世界トップ企業の一つ。AI 半導体・スマホ・自動車向け半導体すべての製造工場に装置を納めており、業績は半導体投資のサイクルで大きく上下する。",
    tags: [
      { dimension: "product", value: "半導体製造装置（コータ／デベロッパ）", source: SRC_2025FY_TKEM },
      { dimension: "product", value: "半導体製造装置（エッチング）", source: SRC_2025FY_TKEM },
      { dimension: "product", value: "半導体製造装置（成膜）", source: SRC_2025FY_TKEM },
      { dimension: "customer", value: "ロジック大手ファウンドリ（TSMC, Samsung, Intel）", source: SRC_2025FY_TKEM },
      { dimension: "customer", value: "DRAM 大手", source: SRC_2025FY_TKEM },
      { dimension: "customer", value: "NAND 大手", source: SRC_2025FY_TKEM },
      { dimension: "channel", value: "直販・現地法人サービス網", source: SRC_2025FY_TKEM },
      { dimension: "revenue_model", value: "装置売り切り＋フィールドソリューション（保守・部品）", source: SRC_2025FY_TKEM },
      { dimension: "value_chain", value: "WFE（前工程）装置", source: SRC_2025FY_TKEM },
      { dimension: "geography", value: "中国 40%・台湾 17%・韓国 16%・北米 12%・日本 8%", source: SRC_2025FY_TKEM },
    ],
    segments: [
      { name: "SPE（半導体製造装置）", revenueOku: 22100, share: 92.0, operatingMargin: 28.4 },
      { name: "FPD（液晶製造装置）", revenueOku: 1920, share: 8.0, operatingMargin: 11.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 5, expansion: 72, mature: 28, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +9.2%、営業利益率 27% 台で高水準安定。EUV／GAA／HBM 投資循環を踏まえ拡大期色が濃いが、装置サイクルのピーク懸念が成熟期スコアを押し上げ。",
    factorBetas: {
      usdjpy: 0.78,
      us10y: -0.42,
      oil: 0.05,
      sox: 1.32,
      china: 0.61,
      market: 1.18,
      size: -0.31,
      value: -0.55,
      momentum: 0.42,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "EUV 後の Hi-NA 装置採用タイミングは TEL のシェアを再構成しうる",
        body:
          "ASML の Hi-NA EUV 普及局面では、塗布／現像とエッチングの精度要求が一段引き上がる。TEL は EUV 対応コータ／デベロッパで独占的地位を持つ一方、Hi-NA 世代の認定タイミング次第で 2027 年以降の機種別利益率が大きく変わる。決算説明会では Hi-NA 対応の言及が浅く、投資家認識との温度差が大きい。",
        citations: [SRC_2025FY_TKEM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国売上構成の質的変化：レガシー装置から先端へのミックス変化が利益率を変える",
        body:
          "中国売上比率 40% の絶対値はメディアでも頻出論点だが、ミックスの議論は浅い。レガシーノード向け装置（成膜・洗浄）と先端ロジック向け装置で粗利率が 10pt 以上違う。米輸出規制のさらなる強化が先端比率を引き下げる場合、売上維持でも利益率は段階的に低下しうる。",
        citations: [SRC_2025FY_TKEM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "フィールドソリューション売上の構造化が遅れているリスク",
        body:
          "AMAT・ラムが装置設置ベースに対するサービス売上比率を明示開示しているのに対し、TEL は装置販売と一体運用の説明にとどまる。装置サイクル下降局面でサービス収益の安定性がどこまで効くかが見えにくく、ピーク懸念が割安修正を阻害している可能性。",
        citations: [SRC_2025FY_TKEM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 52,
      rationale:
        "PER 22.8 倍は WFE 平均 24 倍と概ね同水準、過去 5 年平均 25 倍に対しては 9% 下回るがピーク利益局面を踏まえれば違和感はない。ROE 28.7% / 営業利益率 27.5% という収益性を勘案すると、現株価は同業比でディスカウントとは言い切れず、ややプレミアム圏。",
      citations: [SRC_2025FY_TKEM],
    },
  },
  {
    code: "6857",
    name: "アドバンテスト",
    nameEn: "Advantest",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体テスト装置",
    priceJpy: 9820,
    priceDate: "2026-05-26",
    changePct: 2.18,
    marketCapOku: 72300,
    per: 38.4,
    pbr: 9.8,
    dividendYield: 0.6,
    roe: 27.4,
    operatingMargin: 31.2,
    revenueGrowth3y: 22.6,
    description:
      "半導体テスタ世界 2 強の一角。SoC テスタで圧倒的シェア、AI 半導体（GPU・HBM）テスト需要で構造的追い風。HBM テスト機需要が業績ドライバ。",
    oneLiner:
      "出来上がった半導体を検査して良品・不良を判定する『テスト装置』の世界 2 強の一角。AI 半導体（GPU・HBM）のテスト需要拡大で過去数年売上が急成長中。",
    tags: [
      { dimension: "product", value: "SoC テスタ", source: SRC_2025FY_ADV },
      { dimension: "product", value: "メモリテスタ（DRAM/HBM 含む）", source: SRC_2025FY_ADV },
      { dimension: "customer", value: "ファウンドリ（TSMC 等）", source: SRC_2025FY_ADV },
      { dimension: "customer", value: "OSAT", source: SRC_2025FY_ADV },
      { dimension: "customer", value: "IDM・ファブレス（NVIDIA, AMD 等）", source: SRC_2025FY_ADV },
      { dimension: "channel", value: "直販・サービス網", source: SRC_2025FY_ADV },
      { dimension: "revenue_model", value: "装置売り切り＋アプリケーション／メンテ", source: SRC_2025FY_ADV },
      { dimension: "value_chain", value: "後工程テスト装置", source: SRC_2025FY_ADV },
      { dimension: "geography", value: "台湾 36%・中国 19%・韓国 15%・北米 13%・日本 6%", source: SRC_2025FY_ADV },
    ],
    segments: [
      { name: "半導体・部品テストシステム", revenueOku: 6420, share: 86.0, operatingMargin: 33.1 },
      { name: "メカトロニクス関連", revenueOku: 720, share: 9.6, operatingMargin: 18.4 },
      { name: "サービス・その他", revenueOku: 330, share: 4.4, operatingMargin: 22.7 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 14, expansion: 86, mature: 10, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +22.6% は半導体製造装置平均を大きく上回る。AI 半導体／HBM 投資の構造的追い風で拡大期色が極めて強い。",
    factorBetas: {
      usdjpy: 0.62,
      us10y: -0.71,
      oil: 0.03,
      sox: 1.84,
      china: 0.42,
      market: 1.42,
      size: -0.18,
      value: -1.12,
      momentum: 0.88,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "HBM テスト機売上の前提崩壊リスクが市場予想に織り込まれていない",
        body:
          "HBM3E から HBM4 への世代交代でテスト工程が長時間化し、テスタ需要が増える前提が市場に広く共有されている。しかし HBM 製造各社の独自テスト内製化や、KGSD（Known Good Stacked Die）テスト方式の変化が起きると、テスタ需要の伸びは線形には乗らない。決算説明会ではこの点への言及が薄い。",
        citations: [SRC_2025FY_ADV],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "テラダイン依存構造に変化、競合再編リスク",
        body:
          "後工程テスタは長年テラダインとの 2 強寡占で安定推移してきたが、Cohu・中国系新興プレイヤーの先端領域参入が静かに進む。アドバンテストの SoC テスタシェア優位がいつまで保てるか、競合分析の更新が必要。",
        citations: [SRC_2025FY_ADV],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 38 倍の前提：成長持続年数の感応度を可視化する必要",
        body:
          "PER 38 倍は SOX 平均 28 倍を大きく上回る。AI 半導体投資が 2027 年以降も継続する前提が崩れた場合の感応度が高く、現在の株価は『投資サイクルが少なくとも 3 年は減速しない』ことを織り込んでいる。下方サプライズ局面でのドローダウン耐性が中期テーマ。",
        citations: [SRC_2025FY_ADV],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 28,
      rationale:
        "PER 38.4 倍は SOX 平均 28 倍を 37% 上回り、過去 5 年平均 31 倍と比較しても 24% 高い。ROE 27.4% / 売上成長 22.6% の質を勘案しても、AI 投資ピークアウトリスクを織り込まないバリュエーション水準。",
      citations: [SRC_2025FY_ADV],
    },
  },
  {
    code: "6920",
    name: "レーザーテック",
    nameEn: "Lasertec",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体マスク／検査装置",
    priceJpy: 18250,
    priceDate: "2026-05-26",
    changePct: -1.62,
    marketCapOku: 17200,
    per: 31.6,
    pbr: 8.2,
    dividendYield: 1.0,
    roe: 28.3,
    operatingMargin: 34.6,
    revenueGrowth3y: 18.9,
    description:
      "EUV マスクブランクス／パターンマスク検査装置で世界シェアほぼ独占。極めて狭いニッチで圧倒的地位。受注／売上のラグが大きく、業績変動性が高い。",
    oneLiner:
      "半導体の『設計図（マスク）』に欠陥がないかを検査する装置で、世界シェアほぼ独占。EUV という最新の半導体製造方式で必須の装置を、極めて狭い領域で圧倒的シェアで提供している。",
    tags: [
      { dimension: "product", value: "EUV マスクブランクス検査装置", source: SRC_2025_LSRTEC },
      { dimension: "product", value: "EUV パターンマスク検査装置", source: SRC_2025_LSRTEC },
      { dimension: "product", value: "ウェハ検査装置", source: SRC_2025_LSRTEC },
      { dimension: "customer", value: "EUV マスクブランクスメーカー（HOYA, AGC 等）", source: SRC_2025_LSRTEC },
      { dimension: "customer", value: "ロジック先端ファウンドリ", source: SRC_2025_LSRTEC },
      { dimension: "channel", value: "直販", source: SRC_2025_LSRTEC },
      { dimension: "revenue_model", value: "装置売り切り（高単価・長納期）", source: SRC_2025_LSRTEC },
      { dimension: "value_chain", value: "前工程マスク検査", source: SRC_2025_LSRTEC },
      { dimension: "geography", value: "台湾 51%・韓国 18%・日本 12%・北米 11%", source: SRC_2025_LSRTEC },
    ],
    segments: [
      { name: "検査・測定装置", revenueOku: 2410, share: 96.0, operatingMargin: 35.4 },
      { name: "サービス・その他", revenueOku: 100, share: 4.0, operatingMargin: 22.1 },
    ],
    segmentsPeriod: "2025/6",
    phaseScores: { launch: 22, expansion: 78, mature: 16, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +18.9%、営業利益率 34% 台と高水準。EUV 普及局面の独占受益で拡大期色が強いが、受注変動性の大きさが特徴。",
    factorBetas: {
      usdjpy: 0.41,
      us10y: -0.92,
      oil: 0.02,
      sox: 1.51,
      china: 0.18,
      market: 1.06,
      size: 0.08,
      value: -1.34,
      momentum: 0.61,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "受注残の質：保守・更新比率と新規容量増設比率の開示粒度が粗い",
        body:
          "受注残は明示開示されているが、内訳が『先端ロジック向け新規ライン分』『既存顧客の更新分』『マスクブランクスメーカー向け』で見えていない。Hi-NA 世代対応で大幅再投資が必要になる場合と、既存装置の延命が進む場合で 2027 年以降の業績は大きく分かれる。",
        citations: [SRC_2025_LSRTEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "競合不在のニッチ性が、逆に新規参入の経済合理性を変えるしきい値に近づいている",
        body:
          "粗利率 60% 超のニッチを長年独占しているが、KLA や ASML 子会社からの参入観測がしきい値を超え始める水準にある。中期的な競合参入リスクの感度分析が IR から不足している。",
        citations: [SRC_2025_LSRTEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国向けセールスの『規制裏側』エクスポージャー",
        body:
          "中国売上比率は表面上低いが、台湾・韓国経由で中国系顧客に最終納入される構造がどの程度あるかは IR で明らかにされていない。間接エクスポージャーが規制強化局面で表面化するリスクがある。",
        citations: [SRC_2025_LSRTEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 32,
      rationale:
        "PER 31.6 倍は同業精密検査装置平均 22 倍を 44% 上回る。寡占ニッチの正当なプレミアムを認めても、過去 5 年の業績変動率（標準偏差）を考慮した調整後 PER は依然として高水準。",
      citations: [SRC_2025_LSRTEC],
    },
  },
  {
    code: "6146",
    name: "ディスコ",
    nameEn: "Disco",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "機械",
    industryCluster: "半導体後工程装置",
    priceJpy: 42100,
    priceDate: "2026-05-26",
    changePct: 0.84,
    marketCapOku: 45200,
    per: 27.8,
    pbr: 7.9,
    dividendYield: 1.6,
    roe: 32.4,
    operatingMargin: 38.1,
    revenueGrowth3y: 14.3,
    description:
      "ダイサ・グラインダ世界トップ。先端パッケージ（CoWoS, HBM）需要拡大で構造受益。消耗品（ブレード）が安定収益源。",
    oneLiner:
      "半導体を切り出す『ダイサ』と削る『グラインダ』で世界トップ。装置だけでなく刃（消耗品）も売れ続けるビジネスモデルで、営業利益率が 38% と極めて高い。",
    tags: [
      { dimension: "product", value: "ダイシングソー", source: SRC_2025FY_DISCO },
      { dimension: "product", value: "グラインダ（ウェハ薄化）", source: SRC_2025FY_DISCO },
      { dimension: "product", value: "ブレード・ホイール（消耗品）", source: SRC_2025FY_DISCO },
      { dimension: "customer", value: "OSAT", source: SRC_2025FY_DISCO },
      { dimension: "customer", value: "IDM 後工程", source: SRC_2025FY_DISCO },
      { dimension: "customer", value: "ファウンドリ後工程（CoWoS 等）", source: SRC_2025FY_DISCO },
      { dimension: "channel", value: "直販・現地サービス網", source: SRC_2025FY_DISCO },
      { dimension: "revenue_model", value: "装置売り切り＋消耗品（リカーリング比率 30% 強）", source: SRC_2025FY_DISCO },
      { dimension: "value_chain", value: "後工程ダイシング・薄化", source: SRC_2025FY_DISCO },
      { dimension: "geography", value: "台湾 31%・中国 24%・韓国 14%・日本 11%・北米 12%", source: SRC_2025FY_DISCO },
    ],
    segments: [
      { name: "精密加工装置", revenueOku: 2410, share: 67.0 },
      { name: "精密加工ツール", revenueOku: 1140, share: 32.0 },
      { name: "その他", revenueOku: 40, share: 1.0 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 4, expansion: 74, mature: 32, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +14.3%、営業利益率 38% 台と高水準安定。CoWoS／HBM 後工程拡大で拡大期色強いが、ブレード消耗品の安定性が成熟期スコアを押し上げ。",
    factorBetas: {
      usdjpy: 0.71,
      us10y: -0.54,
      oil: 0.04,
      sox: 1.41,
      china: 0.54,
      market: 1.22,
      size: -0.21,
      value: -0.84,
      momentum: 0.58,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ブレード（消耗品）売上の循環性は装置売上ほど高くないが、開示粒度が粗い",
        body:
          "ブレード売上比率は 30% 強だが、稼働ベースのリカーリング構造の堅さが定量的に示されていない。装置サイクル下降局面でも稼働ベースが維持されればブレード売上は安定する仮説の検証材料が不足。",
        citations: [SRC_2025FY_DISCO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "CoWoS 後工程の他社参入リスク：TEL・AMAT のハイブリッドボンディング装置参入の波及",
        body:
          "CoWoS 後工程はディスコの薄化・ダイシング装置と他社のハイブリッドボンディング装置を組み合わせて構築される。後工程の組み合わせが変わると、ディスコの装置占有領域も影響を受けうるが、IR ではこの可能性への言及が浅い。",
        citations: [SRC_2025FY_DISCO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "営業利益率 38% は WFE 業界比でも極端、これを支える構造的要因の特定が必要",
        body:
          "WFE 業界平均営業利益率 25–28% に対し、ディスコは 38% 超。装置と消耗品の組み合わせモデルが理由とされるが、これを定量分解した IR 説明が不足。利益率の持続性に対する投資家認識のずれが残っている。",
        citations: [SRC_2025FY_DISCO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 48,
      rationale:
        "PER 27.8 倍は WFE 平均 24 倍を 16% 上回るが、営業利益率 38% / ROE 32% の収益性プレミアムを勘案すれば違和感はない水準。過去 5 年平均 29 倍をやや下回り、フェアバリュー圏。",
      citations: [SRC_2025FY_DISCO],
    },
  },
  {
    code: "7735",
    name: "SCREEN ホールディングス",
    nameEn: "SCREEN Holdings",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体洗浄装置",
    priceJpy: 15240,
    priceDate: "2026-05-26",
    changePct: 1.12,
    marketCapOku: 14800,
    per: 14.8,
    pbr: 3.4,
    dividendYield: 2.4,
    roe: 24.6,
    operatingMargin: 18.4,
    revenueGrowth3y: 11.8,
    description:
      "枚葉式洗浄装置で世界シェア圧倒的（50% 超）。先端ノード（5nm 以下）洗浄工程増加で構造受益。TEL／AMAT に比べ PER 低位。",
    oneLiner:
      "半導体を作る工程の中で『洗浄』装置を作る世界トップ企業（シェア 50% 超）。前工程装置の中では PER が低く割安に見えるが、印刷・液晶など非半導体事業の存在が連結評価を押し下げている可能性。",
    tags: [
      { dimension: "product", value: "枚葉式洗浄装置", source: SRC_2025FY_SCREEN },
      { dimension: "product", value: "バッチ式洗浄装置", source: SRC_2025FY_SCREEN },
      { dimension: "product", value: "プリント基板関連装置", source: SRC_2025FY_SCREEN },
      { dimension: "customer", value: "ロジックファウンドリ", source: SRC_2025FY_SCREEN },
      { dimension: "customer", value: "メモリ大手", source: SRC_2025FY_SCREEN },
      { dimension: "channel", value: "直販・現地法人サービス網", source: SRC_2025FY_SCREEN },
      { dimension: "revenue_model", value: "装置売り切り＋保守", source: SRC_2025FY_SCREEN },
      { dimension: "value_chain", value: "前工程洗浄", source: SRC_2025FY_SCREEN },
      { dimension: "geography", value: "中国 34%・台湾 24%・韓国 14%・北米 13%・日本 10%", source: SRC_2025FY_SCREEN },
    ],
    segments: [
      { name: "半導体製造装置（SPE）", revenueOku: 4520, share: 78.0, operatingMargin: 21.8 },
      { name: "グラフィックアーツ", revenueOku: 580, share: 10.0, operatingMargin: 10.4 },
      { name: "プリント基板関連", revenueOku: 470, share: 8.1, operatingMargin: 8.2 },
      { name: "FPD 製造装置", revenueOku: 230, share: 4.0, operatingMargin: 5.1 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 2, expansion: 64, mature: 38, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +11.8%、営業利益率 18% 台。半導体セグメントは拡大期だが、非半導体セグメントの低収益性が混合し成熟期寄り。",
    factorBetas: {
      usdjpy: 0.82,
      us10y: -0.31,
      oil: 0.08,
      sox: 1.21,
      china: 0.74,
      market: 1.14,
      size: 0.04,
      value: -0.31,
      momentum: 0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "PER 14.8 倍の低位放置：非半導体セグメントが評価を引き下げているか",
        body:
          "半導体セグメント単体の利益率は WFE 平均水準だが、PER は同業より 30% 以上低い。非半導体（FPD、印刷、グラフィックアーツ）の構造的低収益性が連結評価を圧迫している可能性。セグメント整理やカーブアウトの IR 議論が浅い。",
        citations: [SRC_2025FY_SCREEN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "枚葉式洗浄シェア 50% 超の防衛：先端ノードでの極小欠陥洗浄要求への対応",
        body:
          "1nm 世代以降の洗浄工程はパーティクル除去のしきい値が桁違いになる。SCREEN の現行プラットフォームの対応可能性と、ラム・TEL の参入余地の議論が IR から不足している。",
        citations: [SRC_2025FY_SCREEN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国売上 34% の構成：レガシー比率と先端比率の見えなさ",
        body:
          "中国売上の中で、規制対象になりやすい先端ノード向けがどの程度を占めるか開示が薄い。輸出規制強化局面のシミュレーション材料が投資家に不足している。",
        citations: [SRC_2025FY_SCREEN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 76,
      rationale:
        "PER 14.8 倍は WFE 平均 24 倍を 38% 下回る。営業利益率 18% は同業比やや低位だが、ROE 24.6% / 配当利回り 2.4% を加味すれば割安水準。非半導体セグメントの整理が進めば再評価余地あり。",
      citations: [SRC_2025FY_SCREEN],
    },
  },
  {
    code: "6963",
    name: "ローム",
    nameEn: "ROHM",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "パワー半導体",
    priceJpy: 1820,
    priceDate: "2026-05-26",
    changePct: -2.41,
    marketCapOku: 6800,
    per: 28.4,
    pbr: 0.84,
    dividendYield: 4.4,
    roe: 3.1,
    operatingMargin: 2.8,
    revenueGrowth3y: -3.4,
    description:
      "パワー半導体・LSI 大手。SiC（炭化珪素）パワー半導体への大型投資中で短期収益悪化。中長期では EV／産業向け需要拡大で構造受益期待。",
    oneLiner:
      "電気を変換する半導体（パワー半導体）を作る老舗。SiC という新素材の工場に大型投資中で短期は利益が圧迫されているが、EV 普及で長期の追い風が期待される。PBR 0.84 倍で解散価値を下回る水準。",
    tags: [
      { dimension: "product", value: "SiC パワー半導体", source: SRC_2025FY_ROHM },
      { dimension: "product", value: "Si パワー半導体（IGBT, MOSFET）", source: SRC_2025FY_ROHM },
      { dimension: "product", value: "アナログ IC・LSI", source: SRC_2025FY_ROHM },
      { dimension: "product", value: "ディスクリート（ダイオード等）", source: SRC_2025FY_ROHM },
      { dimension: "customer", value: "自動車（EV メーカー）", source: SRC_2025FY_ROHM },
      { dimension: "customer", value: "産業機器メーカー", source: SRC_2025FY_ROHM },
      { dimension: "customer", value: "民生機器", source: SRC_2025FY_ROHM },
      { dimension: "channel", value: "直販＋商社", source: SRC_2025FY_ROHM },
      { dimension: "revenue_model", value: "デバイス売り切り（長期契約・LTAあり）", source: SRC_2025FY_ROHM },
      { dimension: "value_chain", value: "IDM（垂直統合）", source: SRC_2025FY_ROHM },
      { dimension: "geography", value: "中国 32%・日本 27%・北米 14%・欧州 13%", source: SRC_2025FY_ROHM },
    ],
    segments: [
      { name: "LSI", revenueOku: 1740, share: 38.0, operatingMargin: 4.1 },
      { name: "半導体素子", revenueOku: 2240, share: 49.0, operatingMargin: 3.2 },
      { name: "モジュール", revenueOku: 410, share: 9.0, operatingMargin: 1.4 },
      { name: "その他", revenueOku: 180, share: 4.0 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 38, expansion: 22, mature: 48, decline: 18 },
    phaseRationale:
      "売上 3 年 CAGR -3.4%、営業利益率 2.8% と低水準。SiC 投資負荷で短期は衰退期色も混じるが、SiC 立ち上げが成功すれば拡大期へ移行する境界銘柄。",
    factorBetas: {
      usdjpy: 0.34,
      us10y: 0.18,
      oil: 0.12,
      sox: 0.71,
      china: 0.62,
      market: 0.94,
      size: 0.22,
      value: 0.71,
      momentum: -0.41,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "SiC 設備投資の減価償却負担がいつから売上で吸収されるか、中計の前提が見えにくい",
        body:
          "宮崎・福岡の SiC 工場稼働開始で減価償却費が増加しているが、SiC 売上の立ち上がり前提（顧客採用ラインの確定状況、車載 LTA の数量・価格条件）が中計開示で粗い。2027 年度を境に営業利益率がどう推移するかの感応度が高い。",
        citations: [SRC_2025FY_ROHM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "SiC 競合（ST・インフィニオン・WolfSpeed）との価格競争激化の織り込み",
        body:
          "SiC ウェハ価格は 2024–2025 年で 20–30% 下落、デバイス価格も追随。ロームの SiC 採算がこれをどこまで吸収できるかの定量議論が IR から不足。",
        citations: [SRC_2025FY_ROHM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PBR 0.84 倍と東芝デバイス&ストレージとの再編観測：合弁の本気度がどこまであるか",
        body:
          "東芝デバイス&ストレージとの SiC 製造合弁が継続するなか、PBR が 1 倍を割る水準で放置されている。M&A・再編シナリオの議論が IR では極めて慎重で、投資家との温度差がある。",
        citations: [SRC_2025FY_ROHM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 71,
      rationale:
        "PBR 0.84 倍は半導体セクター平均 4 倍を大きく下回り、解散価値以下水準。短期収益は悪化しているが、SiC 立ち上げに成功した場合の利益拡大余地と配当利回り 4.4% を勘案すれば下値抵抗感あり。",
      citations: [SRC_2025FY_ROHM],
    },
  },
  {
    code: "6526",
    name: "ソシオネクスト",
    nameEn: "Socionext",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体ファブレス",
    priceJpy: 3210,
    priceDate: "2026-05-26",
    changePct: 0.31,
    marketCapOku: 2200,
    per: 21.4,
    pbr: 2.8,
    dividendYield: 1.2,
    roe: 14.1,
    operatingMargin: 9.4,
    revenueGrowth3y: 16.2,
    description:
      "カスタム SoC（システムオンチップ）設計の国内最大ファブレス。データセンタ／自動車向けカスタム ASIC で受注堅調。富士通とパナソニックの半導体事業統合が出自。",
    oneLiner:
      "他社専用の半導体を『設計だけ』請け負うファブレス国内最大手。データセンタ・自動車向けカスタム ASIC で成長中。米国大手 Broadcom・Marvell に規模で大きく劣るが、国内ニーズに集中する戦略。",
    tags: [
      { dimension: "product", value: "カスタム SoC", source: SRC_2025FY_SCNX },
      { dimension: "product", value: "ASIC 設計サービス", source: SRC_2025FY_SCNX },
      { dimension: "customer", value: "データセンタ事業者", source: SRC_2025FY_SCNX },
      { dimension: "customer", value: "自動車 OEM・Tier1", source: SRC_2025FY_SCNX },
      { dimension: "customer", value: "ネットワーク機器メーカー", source: SRC_2025FY_SCNX },
      { dimension: "channel", value: "直販（コンサル型営業）", source: SRC_2025FY_SCNX },
      { dimension: "revenue_model", value: "NRE（設計受託）＋量産マスク後ロイヤルティ", source: SRC_2025FY_SCNX },
      { dimension: "value_chain", value: "ファブレス（設計のみ、製造は TSMC 等委託）", source: SRC_2025FY_SCNX },
      { dimension: "geography", value: "日本 42%・北米 38%・中国 12%・欧州 8%", source: SRC_2025FY_SCNX },
    ],
    segments: [{ name: "カスタム SoC・ASIC", revenueOku: 2240, share: 100, operatingMargin: 9.4 }],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 28, expansion: 72, mature: 14, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +16.2%、データセンタ向けカスタム ASIC が成長ドライバ。NRE フェーズから量産ロイヤルティへの移行で利益率改善余地大きい。",
    factorBetas: {
      usdjpy: 0.51,
      us10y: -0.61,
      oil: 0.03,
      sox: 1.61,
      china: 0.31,
      market: 1.31,
      size: 0.41,
      value: -1.21,
      momentum: 0.51,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Broadcom・Marvell 型のカスタム ASIC ビジネスモデル：日本企業として競合できるか",
        body:
          "Broadcom・Marvell はハイパースケーラー向けカスタム ASIC で爆発的な成長。ソシオネクストは規模で 1 桁以上劣位だが、自動車・国内データセンタという比較優位領域がある。グローバル競合との比較分析が IR から不足。",
        citations: [SRC_2025FY_SCNX],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "NRE 売上の繰延圧迫リスク：プロジェクト遅延が利益圧迫に直結する構造",
        body:
          "NRE（非経常エンジニアリング費）売上は顧客プロジェクトのマイルストーンに連動。データセンタ顧客のプロジェクト遅延が短期業績を大きく動かす構造で、四半期業績ブレ要因となる。",
        citations: [SRC_2025FY_SCNX],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "量産ロイヤルティ比率の開示粒度：将来の収益安定性を示す核指標が見えない",
        body:
          "ファブレス事業の本質的価値は『NRE 後の量産ロイヤルティ』にあるが、現在の売上構成での比率と将来見通しが粗く開示されている。投資家が中長期収益性を測れない状態。",
        citations: [SRC_2025FY_SCNX],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 55,
      rationale:
        "PER 21.4 倍はファブレス国内平均 22 倍と同水準。ROE 14% / 営業利益率 9% は同業比やや低位だが、量産ロイヤルティ拡大局面では利益率改善余地。下値・上値ともに限定的なフェアバリュー圏。",
      citations: [SRC_2025FY_SCNX],
    },
  },
  {
    code: "4063",
    name: "信越化学工業",
    nameEn: "Shin-Etsu Chemical",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "化学",
    industryCluster: "半導体材料（シリコンウェハ）",
    priceJpy: 5840,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 117500,
    per: 17.4,
    pbr: 1.94,
    dividendYield: 2.4,
    roe: 12.6,
    operatingMargin: 28.4,
    revenueGrowth3y: 3.1,
    description:
      "300mm シリコンウェハ世界トップ。塩ビ事業（米国）も世界トップで現金創出力が極めて高い。PVC 市況循環と半導体ウェハ需要の両エンジン構造。",
    oneLiner:
      "半導体の素材『シリコンウェハ』で世界シェアトップ。同時に米国で塩化ビニル（PVC）でも世界トップを持つ二面性企業で、半導体だけ見ても評価が難しい構造。営業利益の 40% 弱は PVC で稼ぐ。",
    tags: [
      { dimension: "product", value: "300mm シリコンウェハ", source: SRC_2025FY_SHIN },
      { dimension: "product", value: "塩化ビニル（PVC）", source: SRC_2025FY_SHIN },
      { dimension: "product", value: "フォトレジスト", source: SRC_2025FY_SHIN },
      { dimension: "product", value: "希土類磁石", source: SRC_2025FY_SHIN },
      { dimension: "product", value: "シリコーン", source: SRC_2025FY_SHIN },
      { dimension: "customer", value: "ロジック／メモリ大手", source: SRC_2025FY_SHIN },
      { dimension: "customer", value: "建築・建材（PVC）", source: SRC_2025FY_SHIN },
      { dimension: "channel", value: "直販・商社", source: SRC_2025FY_SHIN },
      { dimension: "revenue_model", value: "素材／部品売り切り（長期契約あり）", source: SRC_2025FY_SHIN },
      { dimension: "value_chain", value: "半導体材料・化学素材", source: SRC_2025FY_SHIN },
      { dimension: "geography", value: "北米 32%・日本 24%・アジア 28%・欧州 11%", source: SRC_2025FY_SHIN },
    ],
    segments: [
      { name: "電子材料", revenueOku: 5980, share: 36.0, operatingMargin: 31.4 },
      { name: "生活環境基盤材料（PVC等）", revenueOku: 6440, share: 39.0, operatingMargin: 28.1 },
      { name: "機能材料", revenueOku: 2480, share: 15.0, operatingMargin: 22.4 },
      { name: "加工・商事・技術サービス他", revenueOku: 1640, share: 10.0, operatingMargin: 14.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 28, mature: 84, decline: 12 },
    phaseRationale:
      "売上 3 年 CAGR +3.1%、営業利益率 28% 台で高水準安定。成熟期色が強く、PVC 市況によるブレが大きい。シリコンウェハは構造的成長領域だが連結への寄与は限定的。",
    factorBetas: {
      usdjpy: 0.61,
      us10y: 0.21,
      oil: 0.24,
      sox: 0.72,
      china: 0.34,
      market: 0.91,
      size: -0.41,
      value: 0.32,
      momentum: 0.08,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "シリコンウェハの世代交代：450mm 議論再燃の可能性と設備投資負担",
        body:
          "300mm ウェハが長期主流である前提が業界共通認識だが、AI 半導体需要急増で 450mm 移行議論が水面下で再燃する可能性。移行が現実化した場合、信越とサムコの設備投資負担が桁違いになる。IR ではこのシナリオへの言及がない。",
        citations: [SRC_2025FY_SHIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PVC 事業のキャッシュフロー依存：脱炭素規制強化シナリオが過小評価されているか",
        body:
          "営業利益の 40% 弱を稼ぐ PVC 事業は北米シェールガス価格優位に支えられているが、北米脱炭素政策・カーボン税導入で利益構造が変わるリスクが IR で過小評価されている可能性。",
        citations: [SRC_2025FY_SHIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "フォトレジストの先端 EUV シェア：JSR・TOK との競争の見えにくさ",
        body:
          "EUV レジストは JSR・TOK が先行する中、信越のシェアと先端ノード採用状況が IR では断片的にしか開示されない。電子材料セグメント内の構造分解が投資家視点で不足。",
        citations: [SRC_2025FY_SHIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 58,
      rationale:
        "PER 17.4 倍は素材セクター平均 16 倍と概ね同水準。営業利益率 28% / ROE 12.6% の安定性を勘案すれば違和感のないフェアバリュー圏。シリコンウェハ単体評価では割安、PVC 循環で総合的に妥当。",
      citations: [SRC_2025FY_SHIN],
    },
  },
  {
    code: "6890",
    name: "フェローテックホールディングス",
    nameEn: "Ferrotec Holdings",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "半導体製造装置部材",
    priceJpy: 3340,
    priceDate: "2026-05-26",
    changePct: -1.21,
    marketCapOku: 1480,
    per: 12.4,
    pbr: 1.84,
    dividendYield: 1.8,
    roe: 16.4,
    operatingMargin: 14.2,
    revenueGrowth3y: 19.8,
    description:
      "半導体製造装置の真空シール・サセプタ・石英製品で世界シェア上位。中国子会社（USCi）の上場で資金調達余力大。中国市場における半導体製造装置部材の現地調達ニーズを取り込み。",
    oneLiner:
      "半導体製造装置の中身に組み込まれる『部材』（真空シール、石英、サセプタなど）を作る企業。売上の 64% が中国向けで、米中対立の中で独自ポジションを取っている。PER 12 倍と割安水準。",
    tags: [
      { dimension: "product", value: "磁性流体真空シール", source: SRC_2025FY_FRTC },
      { dimension: "product", value: "石英・セラミックス製品", source: SRC_2025FY_FRTC },
      { dimension: "product", value: "シリコンパーツ・サセプタ", source: SRC_2025FY_FRTC },
      { dimension: "product", value: "シリコンウェハ（小口径）", source: SRC_2025FY_FRTC },
      { dimension: "customer", value: "半導体製造装置メーカー（AMAT, TEL, ラム等）", source: SRC_2025FY_FRTC },
      { dimension: "customer", value: "中国系半導体メーカー", source: SRC_2025FY_FRTC },
      { dimension: "channel", value: "直販", source: SRC_2025FY_FRTC },
      { dimension: "revenue_model", value: "部材売り切り（量産ベース）", source: SRC_2025FY_FRTC },
      { dimension: "value_chain", value: "半導体製造装置部材", source: SRC_2025FY_FRTC },
      { dimension: "geography", value: "中国 64%・日本 18%・北米 11%・その他 7%", source: SRC_2025FY_FRTC },
    ],
    segments: [
      { name: "半導体等装置関連事業", revenueOku: 1280, share: 64.0, operatingMargin: 17.4 },
      { name: "電子デバイス事業", revenueOku: 580, share: 29.0, operatingMargin: 11.2 },
      { name: "その他", revenueOku: 140, share: 7.0, operatingMargin: 4.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 82, mature: 14, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +19.8%、中国半導体投資の現地調達需要を取り込み拡大。営業利益率は装置メーカー比やや低位だが上昇基調。",
    factorBetas: {
      usdjpy: 0.41,
      us10y: -0.18,
      oil: 0.06,
      sox: 1.04,
      china: 1.42,
      market: 1.08,
      size: 0.62,
      value: -0.21,
      momentum: 0.31,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "中国売上比率 64% の独自構造：規制強化シナリオでの感応度",
        body:
          "中国半導体投資の現地調達需要に乗る独自ポジションだが、米中対立激化で米系装置メーカー（AMAT・ラム）への部材供給と中国系メーカー向け供給の両立が困難になるシナリオが存在する。両エクスポージャーの感応度が IR で十分整理されていない。",
        citations: [SRC_2025FY_FRTC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国子会社 USCi 上場後の本体への利益配分構造",
        body:
          "中国子会社の現地上場で資金調達余力は増したが、本体への利益還流ルートと配当方針の透明度が低い。連結利益への寄与度がどう変化するかの議論が IR から不足。",
        citations: [SRC_2025FY_FRTC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 12.4 倍：中国エクスポージャーへの市場ディスカウントが妥当かどうか",
        body:
          "売上成長 19.8% に対して PER 12 倍は同業比でディスカウント水準。中国エクスポージャーリスクのディスカウントが過剰か、合理か、市場参加者で評価が分かれている。",
        citations: [SRC_2025FY_FRTC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 68,
      rationale:
        "PER 12.4 倍は WFE 部材銘柄平均 18 倍を 31% 下回り、売上成長 19.8% を勘案すればディスカウント水準。中国エクスポージャーリスクのディスカウントを認めても下値抵抗感あり。",
      citations: [SRC_2025FY_FRTC],
    },
  },
  {
    code: "6754",
    name: "アンリツ",
    nameEn: "Anritsu",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "通信計測器・半導体計測",
    priceJpy: 1280,
    priceDate: "2026-05-26",
    changePct: 1.84,
    marketCapOku: 1820,
    per: 19.8,
    pbr: 2.1,
    dividendYield: 3.1,
    roe: 11.4,
    operatingMargin: 12.8,
    revenueGrowth3y: 4.2,
    description:
      "通信計測器（5G/6G 試験機）グローバル大手。半導体テスト関連は周辺領域だが、AI 半導体／HBM 信号品質試験で間接受益。PIM／光測定器で世界トップシェア。",
    oneLiner:
      "通信機器のテスト装置（5G/6G の電波品質を測る機械）で世界大手。AI 半導体の高速通信試験で半導体テストにも食い込みつつあるが、5G から 6G への踊り場で業績は足踏み中。",
    tags: [
      { dimension: "product", value: "5G/6G モバイル通信計測器", source: SRC_2025FY_ANRT },
      { dimension: "product", value: "光・高速通信計測器", source: SRC_2025FY_ANRT },
      { dimension: "product", value: "半導体信号品質試験機", source: SRC_2025FY_ANRT },
      { dimension: "product", value: "PIM テスタ（基地局向け）", source: SRC_2025FY_ANRT },
      { dimension: "customer", value: "通信機器メーカー", source: SRC_2025FY_ANRT },
      { dimension: "customer", value: "半導体メーカー（信号品質試験）", source: SRC_2025FY_ANRT },
      { dimension: "customer", value: "通信キャリア", source: SRC_2025FY_ANRT },
      { dimension: "channel", value: "直販・代理店", source: SRC_2025FY_ANRT },
      { dimension: "revenue_model", value: "計測器売り切り＋保守・校正", source: SRC_2025FY_ANRT },
      { dimension: "value_chain", value: "通信・半導体計測", source: SRC_2025FY_ANRT },
      { dimension: "geography", value: "北米 28%・日本 24%・中国 17%・欧州 14%・その他アジア 17%", source: SRC_2025FY_ANRT },
    ],
    segments: [
      { name: "通信計測", revenueOku: 920, share: 64.0, operatingMargin: 16.8 },
      { name: "PQA（食品安全等）", revenueOku: 310, share: 22.0, operatingMargin: 8.4 },
      { name: "環境計測・他", revenueOku: 200, share: 14.0, operatingMargin: 6.1 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 10, expansion: 42, mature: 58, decline: 12 },
    phaseRationale:
      "売上 3 年 CAGR +4.2%、5G 投資ピークアウト後の通信投資減速で成熟期色が強い。6G 立ち上がり待ちの踊り場局面。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: -0.31,
      oil: 0.04,
      sox: 0.84,
      china: 0.42,
      market: 0.91,
      size: 0.31,
      value: 0.04,
      momentum: -0.08,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "AI 半導体高速 I/O 試験：通信計測器が半導体テストの周辺領域を取り込みつつある",
        body:
          "GPU・HBM・光トランシーバー向け高速信号試験はアドバンテスト型のロジックテスタとは別に、通信計測器系の測定機が活躍する領域。アンリツがこの領域でアドバンテストと競合補完する関係性が IR で十分整理されていない。",
        citations: [SRC_2025FY_ANRT],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "5G から 6G 投資への踊り場長期化リスク",
        body:
          "5G 設備投資はピークアウト、6G の本格立ち上がりは 2028 年以降と見られる。踊り場期間の業績低空飛行が長期化するリスクが市場で過小評価されている。",
        citations: [SRC_2025FY_ANRT],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PQA（食品安全）事業の連結評価圧迫",
        body:
          "PQA セグメントは安定収益源だが営業利益率 8% 台で計測事業の利益率を引き下げる。カーブアウトや事業再編の議論が IR から不足。",
        citations: [SRC_2025FY_ANRT],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 51,
      rationale:
        "PER 19.8 倍は計測器セクター平均 18 倍とほぼ同水準。配当利回り 3.1% / ROE 11% を勘案すればフェアバリュー圏。6G 投資の本格化が織り込み始まれば上方修正余地。",
      citations: [SRC_2025FY_ANRT],
    },
  },

  // ===== 医薬品クラスタ =====
  {
    code: "6723",
    name: "ルネサスエレクトロニクス",
    nameEn: "Renesas Electronics",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "車載半導体（IDM）",
    priceJpy: 1950,
    priceDate: "2026-05-26",
    changePct: -0.82,
    marketCapOku: 37800,
    per: 14.2,
    pbr: 1.8,
    dividendYield: 1.4,
    roe: 12.6,
    operatingMargin: 24.8,
    revenueGrowth3y: 1.8,
    description:
      "車載マイコン（MCU）世界首位級の IDM（設計から製造まで一貫）。自動車・産業向けが二本柱。Dialog・Altium 買収でアナログ・設計ツールへ領域拡大。車載半導体の在庫調整の出口が目先の焦点。",
    oneLiner:
      "クルマの頭脳『マイコン』で世界トップ級。エンジン制御から EV のバッテリー管理まで、自動車 1 台に何十個も載る半導体を、設計から製造まで一貫して手がける日本最大の半導体メーカーの一つ。",
    tags: [
      { dimension: "product", value: "車載マイコン（MCU）", source: SRC_2025FY_RENESAS },
      { dimension: "product", value: "SoC・アナログ・パワーマネジメント IC", source: SRC_2025FY_RENESAS },
      { dimension: "customer", value: "自動車 Tier1（デンソー・ボッシュ等）", source: SRC_2025FY_RENESAS },
      { dimension: "customer", value: "産業機器・インフラ・IoT", source: SRC_2025FY_RENESAS },
      { dimension: "channel", value: "代理店＋大口直販", source: SRC_2025FY_RENESAS },
      { dimension: "revenue_model", value: "デバイス売り切り（IDM 一貫生産）", source: SRC_2025FY_RENESAS },
      { dimension: "value_chain", value: "設計〜前工程製造（IDM）", source: SRC_2025FY_RENESAS },
      { dimension: "geography", value: "中国 23%・日本 21%・欧州 18%・北米 16%", source: SRC_2025FY_RENESAS },
    ],
    segments: [
      { name: "自動車向け", revenueOku: 7300, share: 50.5, operatingMargin: 28.1 },
      { name: "産業・インフラ・IoT", revenueOku: 6100, share: 42.2, operatingMargin: 22.4 },
      { name: "その他", revenueOku: 1050, share: 7.3, operatingMargin: 8.0 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 6, expansion: 38, mature: 58, decline: 8 },
    phaseRationale:
      "車載半導体の在庫調整局面で売上 3 年 CAGR +1.8% と足踏み。EV・ADAS の長期トレンドは拡大要因だが、足元の数字は成熟期色が濃い。在庫調整の出口で拡大スコアが戻るかが分岐点。",
    factorBetas: {
      usdjpy: 0.55,
      us10y: -0.35,
      oil: 0.02,
      sox: 1.21,
      china: 0.48,
      market: 1.15,
      size: -0.22,
      value: 0.18,
      momentum: 0.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "車載在庫調整の『出口』はディストリビューター在庫より Tier1 直販比率に先に出る",
        body:
          "車載半導体の回復シグナルとして市場はディストリビューター在庫週数を追うが、ルネサスは Tier1 への直販比率が高く、回復局面では直販受注の戻りが先行する構造。販路別の受注開示が四半期ごとに揃っておらず、回復の初動を市場が遅れて織り込む可能性がある。",
        citations: [SRC_2025FY_RENESAS],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "Dialog・Altium 買収のクロスセル効果が IR で定量化されていない",
        body:
          "アナログ（Dialog）と設計ツール（Altium）の買収により『MCU＋アナログ＋設計環境』のセット提案が可能になったが、クロスセルによる追加売上・解約率の変化が開示されていない。買収額合計 1 兆円超に対する回収進捗を検証する材料が不足しており、のれん減損リスクの評価が難しい。",
        citations: [SRC_2025FY_RENESAS],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "中国ローカル MCU の台頭は民生から車載へ、単価下落の時間差侵食",
        body:
          "中国の MCU 新興勢は民生・家電向けで急速にシェアを取り、単価下落が先行している。32bit 車載 MCU は認証障壁が高く即座の代替は起きないが、中国系 OEM の現地調達方針が強まると、中国売上 23% の構成が単価・数量の両面で侵食されるリスクが中期的に積み上がる。",
        citations: [SRC_2025FY_RENESAS],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 64,
      rationale:
        "PER 14.2 倍は車載半導体グローバル大手（NXP・インフィニオンの 17–18 倍）に対して約 2 割のディスカウント。在庫調整の出口が見え始める局面では見直し余地が大きい。ただし車載依存度の高さと買収のれんの重さが恒常的なディスカウント要因として残る。",
      citations: [SRC_2025FY_RENESAS],
    },
  },
  {
    code: "3436",
    name: "SUMCO",
    nameEn: "SUMCO",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "金属製品",
    industryCluster: "半導体材料（ウェハ）",
    priceJpy: 1180,
    priceDate: "2026-05-26",
    changePct: 1.05,
    marketCapOku: 4150,
    per: 19.6,
    pbr: 0.74,
    dividendYield: 2.3,
    roe: 3.8,
    operatingMargin: 8.4,
    revenueGrowth3y: -3.2,
    description:
      "300mm シリコンウェハ世界 2 位。信越化学と日本勢 2 社で世界シェア 5 割超の寡占。ウェハ市況サイクルの底で PBR 1 倍割れ、AI 半導体向け先端ウェハ需要の回復タイミングが焦点。",
    oneLiner:
      "半導体の『土台』になる円盤＝シリコンウェハの専業メーカーで世界 2 位。半導体そのものではなく、半導体を作るための素材を供給する。市況の波をまともに受けるが、寡占構造は強固。",
    tags: [
      { dimension: "product", value: "300mm シリコンウェハ", source: SRC_2025FY_SUMCO },
      { dimension: "product", value: "200mm 以下ウェハ", source: SRC_2025FY_SUMCO },
      { dimension: "customer", value: "ロジックファウンドリ（TSMC 等）", source: SRC_2025FY_SUMCO },
      { dimension: "customer", value: "メモリ大手（サムスン・SK・マイクロン）", source: SRC_2025FY_SUMCO },
      { dimension: "channel", value: "長期契約（LTA）中心の直販", source: SRC_2025FY_SUMCO },
      { dimension: "revenue_model", value: "素材量産（市況・数量連動）", source: SRC_2025FY_SUMCO },
      { dimension: "value_chain", value: "最上流素材（ウェハ）", source: SRC_2025FY_SUMCO },
      { dimension: "geography", value: "台湾 28%・日本 22%・韓国 18%・中国 14%", source: SRC_2025FY_SUMCO },
    ],
    segments: [
      { name: "高純度シリコンウェハ", revenueOku: 4250, share: 100.0, operatingMargin: 8.4 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 3, expansion: 26, mature: 60, decline: 11 },
    phaseRationale:
      "ウェハ市況の調整が長期化し売上 3 年 CAGR −3.2%。顧客側のウェハ在庫消化が一巡した後の AI 向け先端ウェハ回復が拡大スコアの源泉だが、現時点では成熟・調整局面の色が濃い。",
    factorBetas: {
      usdjpy: 0.41,
      us10y: -0.28,
      oil: 0.08,
      sox: 1.05,
      china: 0.55,
      market: 1.08,
      size: 0.34,
      value: 0.62,
      momentum: -0.31,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "PBR 0.7 倍は『九州新工場の償却先行』をどこまで織り込んだ水準か",
        body:
          "佐賀・伊万里の 300mm 新工場投資は減価償却が利益に先行して乗る構造で、市況底とのダブルパンチが現在の低 ROE の主因。償却負担のピークアウト時期と市況回復が重なる場合、利益の戻りは市場予想より急になる。設備投資の回収カーブの開示が粗く、ここに認識ギャップがある。",
        citations: [SRC_2025FY_SUMCO],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "LTA（長期契約）の価格改定が 2026–27 年に集中、スポット価格との乖離が表面化する",
        body:
          "コロナ後の逼迫期に締結した LTA の更改時期が 2026–27 年に集中する。足元のスポットウェハ価格は LTA 価格を下回っており、更改時の価格リセットが売上単価を段階的に押し下げるリスクがある。一方で AI 向け先端ウェハ（エピ付き）はプレミアム維持の余地があり、ミックス開示の充実が評価の鍵。",
        citations: [SRC_2025FY_SUMCO],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "中国ウェハメーカーの 300mm 量産は『レガシー専用』のうちに収まるか",
        body:
          "中国勢の 300mm ウェハ量産能力は急拡大しているが、品質要求の緩い成熟ノード向けに留まる。問題は中国国内ファブの装置・材料国産化方針により、SUMCO の中国売上 14% が構造的に置き換わるシナリオ。先端用途での参入障壁（欠陥密度・平坦度）は依然高いが、レガシー側の数量喪失は価格競争を激化させる。",
        citations: [SRC_2025FY_SUMCO],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 71,
      rationale:
        "PBR 0.74 倍は過去 10 年レンジ（0.7–2.5 倍）の下限近辺。世界シェア 2 位の寡占的地位と AI 先端ウェハの回復余地を考慮すると、サイクル底値圏の割安水準と判断。ただし回復時期の不確実性が高く、LTA 更改の価格リセットが重なると見直しが遅れる『忍耐が必要な割安』。",
      citations: [SRC_2025FY_SUMCO],
    },
  },
  {
    code: "7741",
    name: "HOYA",
    nameEn: "HOYA",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "精密機器",
    industryCluster: "マスクブランクス／精密ガラス",
    priceJpy: 19850,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 68500,
    per: 35.8,
    pbr: 7.2,
    dividendYield: 0.8,
    roe: 21.4,
    operatingMargin: 27.9,
    revenueGrowth3y: 8.6,
    description:
      "EUV マスクブランクスでほぼ独占、HDD 用ガラス基板でも世界首位。メガネレンズ・コンタクト・内視鏡のライフケア事業が利益の安定基盤。『半導体×ヘルスケア』の二刀流ポートフォリオ。",
    oneLiner:
      "半導体の設計図の『原版（マスクブランクス）』でほぼ独占。その一方でメガネレンズやコンタクトレンズでも世界大手という、ハイテクと生活用品の二刀流企業。安定と成長を 1 社で併せ持つ。",
    tags: [
      { dimension: "product", value: "EUV マスクブランクス", source: SRC_2025FY_HOYA },
      { dimension: "product", value: "HDD 用ガラス基板", source: SRC_2025FY_HOYA },
      { dimension: "product", value: "メガネレンズ・コンタクトレンズ", source: SRC_2025FY_HOYA },
      { dimension: "product", value: "医療用内視鏡", source: SRC_2025FY_HOYA },
      { dimension: "customer", value: "フォトマスクメーカー・先端ファウンドリ", source: SRC_2025FY_HOYA },
      { dimension: "customer", value: "眼鏡店・医療機関・一般消費者", source: SRC_2025FY_HOYA },
      { dimension: "revenue_model", value: "独占素材＋消費財リカーリングの複合", source: SRC_2025FY_HOYA },
      { dimension: "value_chain", value: "マスク原版（最上流材料）", source: SRC_2025FY_HOYA },
      { dimension: "geography", value: "海外売上比率 約 75%", source: SRC_2025FY_HOYA },
    ],
    segments: [
      { name: "ライフケア（メガネ・コンタクト・内視鏡）", revenueOku: 5150, share: 60.2, operatingMargin: 22.8 },
      { name: "情報・通信（ブランクス・HDD 基板・半導体）", revenueOku: 3400, share: 39.8, operatingMargin: 38.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 54, mature: 44, decline: 2 },
    phaseRationale:
      "EUV 世代進行と HDD（ニアライン向け）回復で情報・通信が拡大、ライフケアは人口動態に乗る安定成長。ポートフォリオ全体では拡大寄りの安定成長で、振れ幅は半導体専業より小さい。",
    factorBetas: {
      usdjpy: 0.46,
      us10y: -0.38,
      oil: 0.01,
      sox: 0.72,
      china: 0.18,
      market: 0.92,
      size: -0.41,
      value: -0.66,
      momentum: 0.35,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "EUV ブランクス独占の持続性：AGC の追い上げと『歩留まり格差』の実態",
        body:
          "EUV マスクブランクスは HOYA がほぼ独占し AGC が第 2 供給者の地位を狙う構図が続く。参入障壁の本体は低欠陥率の歩留まりにあり、Hi-NA 世代では要求がさらに上がるため格差はむしろ開く可能性がある。一方で顧客側（ファウンドリ・マスクメーカー）はデュアルソース化圧力を強めており、独占利益率の天井が政策的に抑えられるリスクは残る。",
        citations: [SRC_2025FY_HOYA],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "複合企業ディスカウントの逆転：ライフケアの安定が半導体価値をプレミアム化している",
        body:
          "通常、複合企業はディスカウント評価されるが、HOYA はライフケアの安定キャッシュフローが半導体側の変動を吸収するため、半導体専業よりも高い PER を許容されてきた。この『逆コングロマリットプレミアム』は金利上昇局面で剥落しやすく、PER 35 倍の持続条件としてライフケアの利益率維持が思いのほか重要。",
        citations: [SRC_2025FY_HOYA],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "HDD ガラス基板はニアライン HDD 投資の遅行受益、SSD 代替論の再燃が逆風",
        body:
          "データセンタのニアラインストレージ投資回復で HDD 用ガラス基板の数量が戻る局面。ただし QLC SSD の大容量化・価格下落が想定より速い場合、HDD の中期需要曲線そのものが下振れる。基板はガラス比率上昇（アルミからの置換）という独自ドライバを持つため、HDD 台数減少とガラス化進行の綱引きの開示が不足している。",
        citations: [SRC_2025FY_HOYA],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 31,
      rationale:
        "PER 35.8 倍は精密機器セクター平均 24 倍を大きく上回る。EUV ブランクス独占とライフケアの安定性を織り込んだクオリティプレミアムであり不合理な水準ではないが、金利上昇局面ではプレミアム剥落のリスクがあり、新規に入るには分の悪い価格帯。",
      citations: [SRC_2025FY_HOYA],
    },
  },
  {
    code: "6525",
    name: "KOKUSAI ELECTRIC",
    nameEn: "KOKUSAI ELECTRIC",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "電気機器",
    industryCluster: "半導体前工程装置",
    priceJpy: 2680,
    priceDate: "2026-05-26",
    changePct: 2.95,
    marketCapOku: 12300,
    per: 19.2,
    pbr: 3.9,
    dividendYield: 1.5,
    roe: 21.8,
    operatingMargin: 22.4,
    revenueGrowth3y: 15.3,
    description:
      "成膜装置（バッチ式 ALD/CVD）の専業大手。旧日立国際電気の装置部門が KKR 傘下を経て 2023 年に再上場。メモリ（NAND・DRAM）投資との連動が強く、TEL・ラムリサーチと競合。中国売上比率の高さが特徴。",
    oneLiner:
      "半導体の表面に極薄の膜を何層も積み上げる『成膜装置』の専業メーカー。NAND や DRAM などメモリ半導体の工場投資が増えると業績が伸びる、メモリ連動色の強い装置株。",
    tags: [
      { dimension: "product", value: "バッチ式成膜装置（ALD/CVD）", source: SRC_2025FY_KOKUSAI },
      { dimension: "product", value: "トリートメント装置", source: SRC_2025FY_KOKUSAI },
      { dimension: "customer", value: "メモリ大手（サムスン・SK・キオクシア）", source: SRC_2025FY_KOKUSAI },
      { dimension: "customer", value: "ロジックファウンドリ・中国成熟ノード", source: SRC_2025FY_KOKUSAI },
      { dimension: "channel", value: "直販・サービス網", source: SRC_2025FY_KOKUSAI },
      { dimension: "revenue_model", value: "装置売り切り＋サービス", source: SRC_2025FY_KOKUSAI },
      { dimension: "value_chain", value: "前工程（成膜）装置", source: SRC_2025FY_KOKUSAI },
      { dimension: "geography", value: "中国 35%・韓国 22%・台湾 18%・日本 12%", source: SRC_2025FY_KOKUSAI },
    ],
    segments: [
      { name: "成膜装置", revenueOku: 2540, share: 84.7, operatingMargin: 24.6 },
      { name: "サービス", revenueOku: 460, share: 15.3, operatingMargin: 18.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 12, expansion: 72, mature: 22, decline: 0 },
    phaseRationale:
      "NAND の積層数増加と DRAM 微細化で成膜工程数が構造的に増えるトレンドに乗り、売上 3 年 CAGR +15.3% で拡大期色が強い。一方、中国売上比率の高さが規制リスクとして拡大シナリオの不確実性を高めている。",
    factorBetas: {
      usdjpy: 0.58,
      us10y: -0.44,
      oil: 0.04,
      sox: 1.48,
      china: 0.72,
      market: 1.25,
      size: 0.12,
      value: -0.38,
      momentum: 0.51,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "中国売上 35% の規制感応度は TEL より一段高い構造",
        body:
          "バッチ式成膜装置は中国の成熟ノード投資との親和性が高く、中国売上比率が WFE 大手の中でも突出している。米輸出規制の適用範囲が成熟ノード向け装置まで拡大するシナリオでは、売上への直撃度が TEL・SCREEN より大きい。規制ニュースに対する株価ベータの高さはこの構造の反映であり、中国比率の段階的な引き下げ計画の有無が中期評価を分ける。",
        citations: [SRC_2025FY_KOKUSAI],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "NAND 300 層超で成膜工程は線形以上に増えるが、単価競争も同時に始まる",
        body:
          "NAND の積層数が 300 層を超える世代では成膜・エッチングの工程数が非線形に増加し、装置需要の構造的拡大が見込まれる。ただし高アスペクト比成膜ではラムリサーチが対抗装置を強化しており、寡占が崩れると数量増を単価下落が相殺する展開もありうる。受注の数量・単価分解の開示が乏しく、成長の質を外部から検証しにくい。",
        citations: [SRC_2025FY_KOKUSAI],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "KKR 売出し後の需給オーバーハングは解消したか：浮動株比率の変化を追う",
        body:
          "再上場後、旧親会社系ファンドの段階的売出しが株価の上値を抑えてきた経緯がある。売出しの完了状況と浮動株比率の変化は、ファンダメンタルズと無関係に株価のレンジを決める要因として残る。指数組入れ（TOPIX ウェイト見直し等）のイベントと重なるタイミングが需給の転換点になりやすい。",
        citations: [SRC_2025FY_KOKUSAI],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 49,
      rationale:
        "PER 19.2 倍は国内装置セクター平均 22 倍をやや下回る。メモリ投資回復の恩恵は業績にまだ完全には乗っていないが、中国売上比率の高さによる規制リスクディスカウントを考慮すると、現水準は概ね妥当圏。規制リスクの顕在化と回復の綱引き。",
      citations: [SRC_2025FY_KOKUSAI],
    },
  },
  {
    code: "4062",
    name: "イビデン",
    nameEn: "Ibiden",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "電気機器",
    industryCluster: "パッケージ基板",
    priceJpy: 5420,
    priceDate: "2026-05-26",
    changePct: 1.78,
    marketCapOku: 7650,
    per: 27.6,
    pbr: 1.7,
    dividendYield: 0.7,
    roe: 6.4,
    operatingMargin: 10.2,
    revenueGrowth3y: 2.4,
    description:
      "IC パッケージ基板（FC-BGA）の世界大手。インテル向けで成長し、AI サーバー（GPU）向けが急拡大中。大型化・多層化する AI 向け基板への先行投資（岐阜の新工場群）の回収局面が焦点。",
    oneLiner:
      "半導体チップと電子基板をつなぐ『パッケージ基板』の世界大手。AI 半導体はチップが巨大なぶん基板も大型で複雑になるため、その追い風を受ける。岐阜の工場群で大型投資を実行中。",
    tags: [
      { dimension: "product", value: "IC パッケージ基板（FC-BGA）", source: SRC_2025FY_IBIDEN },
      { dimension: "product", value: "セラミック製品（DPF・SiC 部材）", source: SRC_2025FY_IBIDEN },
      { dimension: "customer", value: "米大手ロジック（インテル等）", source: SRC_2025FY_IBIDEN },
      { dimension: "customer", value: "AI 半導体ファブレス・ファウンドリ", source: SRC_2025FY_IBIDEN },
      { dimension: "channel", value: "直販（認定ベース長期取引）", source: SRC_2025FY_IBIDEN },
      { dimension: "revenue_model", value: "受託量産（顧客認定型）", source: SRC_2025FY_IBIDEN },
      { dimension: "value_chain", value: "後工程材料（パッケージ基板）", source: SRC_2025FY_IBIDEN },
      { dimension: "geography", value: "北米 45%・アジア 30%・日本 18%", source: SRC_2025FY_IBIDEN },
    ],
    segments: [
      { name: "電子（パッケージ基板）", revenueOku: 2150, share: 52.4, operatingMargin: 14.8 },
      { name: "セラミック", revenueOku: 1250, share: 30.5, operatingMargin: 9.2 },
      { name: "その他", revenueOku: 700, share: 17.1, operatingMargin: 3.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 18, expansion: 62, mature: 28, decline: 4 },
    phaseRationale:
      "AI サーバー向け FC-BGA の需要急増に対し、新工場立ち上げの減価償却が利益に先行。売上 3 年 CAGR +2.4% と見かけは低いが、中身は PC 向け退潮と AI 向け急成長の入れ替わりで、ミックスは拡大期に転換中。",
    factorBetas: {
      usdjpy: 0.49,
      us10y: -0.41,
      oil: 0.06,
      sox: 1.36,
      china: 0.31,
      market: 1.21,
      size: 0.18,
      value: 0.05,
      momentum: 0.44,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "『インテル依存』からの脱却度合いが開示から読み取れない",
        body:
          "イビデンの FC-BGA はインテル向けで育った歴史があり、同社の設備投資計画の振れに業績が振り回されてきた。AI 向け顧客（GPU・カスタム ASIC 勢）への多角化が進んでいるとされるが、顧客別構成の開示はなく、脱インテル依存の進捗を外部から定量検証できない。インテルのファウンドリ戦略迷走が続く中、この開示不足はディスカウント要因。",
        citations: [SRC_2025FY_IBIDEN],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "減価償却ピークと AI 基板単価の交点：2027 年の利益カーブが評価の分水嶺",
        body:
          "河間・大野の新工場償却が 2026–27 年にピークを迎える一方、AI 向け大型基板は単価が従来品の数倍。償却負担を単価ミックスが上回る交点がいつ来るかで、PER の見え方が劇的に変わる。会社計画は保守的な償却前提を置いている可能性があり、上振れ余地と下振れ材料（歩留まり立ち上げ遅延）が同居する。",
        citations: [SRC_2025FY_IBIDEN],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "ガラスコア基板への技術転換は中期の地殻変動リスク",
        body:
          "業界ではビルドアップ樹脂基板からガラスコア基板への転換ロードマップが語られ始めている。ガラス化が本格化すると、既存の樹脂基板での競争優位（微細配線・多層化技術）の一部がリセットされ、ガラス加工に強い新規参入者（や HOYA・AGC のような素材勢）との競争構造に変わりうる。イビデンのガラスコア対応の開発進捗は IR でほぼ語られていない。",
        citations: [SRC_2025FY_IBIDEN],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 45,
      rationale:
        "PER 27.6 倍は償却先行で利益が圧縮された局面の数字であり、見かけほど割高ではない。AI 基板の量産歩留まりが想定通りに立ち上がれば 2027 年利益ベースの PER は大きく低下するが、その実現確度に賭ける投資であり、現水準は期待と リスクが拮抗する妥当圏。",
      citations: [SRC_2025FY_IBIDEN],
    },
  },
  {
    code: "7729",
    name: "東京精密",
    nameEn: "ACCRETECH (Tokyo Seimitsu)",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "精密機器",
    industryCluster: "半導体後工程装置／計測",
    priceJpy: 9250,
    priceDate: "2026-05-26",
    changePct: 0.65,
    marketCapOku: 3850,
    per: 18.4,
    pbr: 2.5,
    dividendYield: 2.1,
    roe: 14.2,
    operatingMargin: 17.8,
    revenueGrowth3y: 7.4,
    description:
      "ウェハプローバ世界首位。ダイシング・研削など後工程装置と、三次元座標測定機の精密計測の二本柱。HBM・チップレット化でウェハレベルテスト工程が増える構造変化の受益者。",
    oneLiner:
      "半導体を切り分ける前に、ウェハのまま検査するための装置『プローバ』で世界首位。テスタ（アドバンテスト）とセットで使われる装置で、AI 半導体のテスト強化の恩恵を受ける。精密測定機器も手がける。",
    tags: [
      { dimension: "product", value: "ウェハプローバ", source: SRC_2025FY_ACCRETECH },
      { dimension: "product", value: "ダイシングマシン・研削装置", source: SRC_2025FY_ACCRETECH },
      { dimension: "product", value: "三次元座標測定機", source: SRC_2025FY_ACCRETECH },
      { dimension: "customer", value: "OSAT・IDM・ファウンドリ", source: SRC_2025FY_ACCRETECH },
      { dimension: "customer", value: "自動車・機械メーカー（計測機器）", source: SRC_2025FY_ACCRETECH },
      { dimension: "channel", value: "直販", source: SRC_2025FY_ACCRETECH },
      { dimension: "revenue_model", value: "装置売り切り＋消耗部品・保守", source: SRC_2025FY_ACCRETECH },
      { dimension: "value_chain", value: "後工程（テスト・加工）装置", source: SRC_2025FY_ACCRETECH },
      { dimension: "geography", value: "中国 30%・日本 25%・台湾 15%・韓国 12%", source: SRC_2025FY_ACCRETECH },
    ],
    segments: [
      { name: "半導体製造装置", revenueOku: 1180, share: 78.7, operatingMargin: 19.4 },
      { name: "計測機器", revenueOku: 320, share: 21.3, operatingMargin: 12.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 56, mature: 34, decline: 2 },
    phaseRationale:
      "HBM・チップレット化で『切る前に検査する』ウェハレベルテストの工程数が増加し、プローバ需要は構造的に拡大。計測機器は安定収益だが景気連動で、全体では拡大寄りのバランス型。",
    factorBetas: {
      usdjpy: 0.52,
      us10y: -0.31,
      oil: 0.03,
      sox: 1.27,
      china: 0.44,
      market: 1.12,
      size: 0.41,
      value: 0.21,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "プローバは『テスタの影』で語られるが、HBM の KGD 要求で独自の成長カーブを持つ",
        body:
          "市場はテスト需要をアドバンテストのテスタ売上で代理観測するが、HBM のような積層デバイスでは KGD（Known Good Die：積層前の良品保証）要求が強まり、プローバの稼働工程はテスタとは別の伸び方をする。プローバ首位の東京精密はこの構造変化の直接受益者だが、時価総額が小さく証券会社のカバレッジも薄いため、織り込みが遅行しやすい。",
        citations: [SRC_2025FY_ACCRETECH],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "ディスコとの比較で見える『消耗品比率』の差が利益率の質の差",
        body:
          "同じ後工程装置でも、ディスコはブレード等の消耗品が収益の安定層を形成するのに対し、東京精密は装置売り切りの比重が高く、サイクル下降局面の利益率耐性で見劣りする。営業利益率 17.8% 対ディスコ 38% の差は技術力だけでなくビジネスモデル構造の差であり、消耗品・サービス比率を高める施策の有無が長期評価の論点。",
        citations: [SRC_2025FY_ACCRETECH],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "計測機器事業の分離価値：コングロマリットディスカウントか相互補完か",
        body:
          "三次元測定機は国内では高シェアだが半導体装置とのシナジーは限定的で、SOTP（部門別評価）では分離した方が高く評価される可能性がある。一方で半導体不況期に計測が下支えしてきた歴史も事実。アクティビストの保有が観測される局面では事業ポートフォリオ再編が株価材料になりやすい。",
        citations: [SRC_2025FY_ACCRETECH],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 55,
      rationale:
        "PER 18.4 倍は装置セクター平均を下回り、計測機器の安定性を含めれば実質的なディスカウント。プローバの構造成長（HBM・KGD）が市場に再評価されれば見直し余地があり、妥当圏の中ではやや割安寄り。小型株ゆえの流動性ディスカウントが残る点は留意。",
      citations: [SRC_2025FY_ACCRETECH],
    },
  },
  {
    code: "4186",
    name: "東京応化工業",
    nameEn: "Tokyo Ohka Kogyo",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "化学",
    industryCluster: "半導体材料（レジスト）",
    priceJpy: 4350,
    priceDate: "2026-05-26",
    changePct: -0.55,
    marketCapOku: 5300,
    per: 22.1,
    pbr: 2.3,
    dividendYield: 1.6,
    roe: 10.8,
    operatingMargin: 16.4,
    revenueGrowth3y: 8.2,
    description:
      "フォトレジスト世界首位級。EUV レジストで先行するメーカーの一つ。装置と異なり製造のたびに消費される材料のため、ウェハ投入量に連動する安定性の高い収益構造を持つ。",
    oneLiner:
      "半導体の回路を『焼き付ける』ときに使う感光材＝フォトレジストで世界トップ級。装置と違って製造のたびに消費される材料なので、半導体の生産量が増えるほど売れ続ける消耗品ビジネス。",
    tags: [
      { dimension: "product", value: "フォトレジスト（EUV/ArF/KrF）", source: SRC_2025FY_TOK },
      { dimension: "product", value: "高純度化学薬品", source: SRC_2025FY_TOK },
      { dimension: "customer", value: "先端ファウンドリ・メモリ大手", source: SRC_2025FY_TOK },
      { dimension: "channel", value: "直販（顧客認定ベース）", source: SRC_2025FY_TOK },
      { dimension: "revenue_model", value: "消耗材料（ウェハ投入数量連動）", source: SRC_2025FY_TOK },
      { dimension: "value_chain", value: "前工程材料（感光材）", source: SRC_2025FY_TOK },
      { dimension: "geography", value: "海外売上比率 約 8 割（台湾・韓国・北米）", source: SRC_2025FY_TOK },
    ],
    segments: [
      { name: "材料事業", revenueOku: 1950, share: 95.1, operatingMargin: 17.2 },
      { name: "装置事業", revenueOku: 100, share: 4.9, operatingMargin: 4.0 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 8, expansion: 52, mature: 42, decline: 2 },
    phaseRationale:
      "ウェハ投入量の増加に連動する消耗材ビジネスで、EUV 採用ノードの拡大が単価ミックスを改善。装置のような受注の振れがなく、安定拡大型のプロファイル。",
    factorBetas: {
      usdjpy: 0.38,
      us10y: -0.22,
      oil: 0.05,
      sox: 0.94,
      china: 0.38,
      market: 0.95,
      size: 0.28,
      value: 0.31,
      momentum: 0.08,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "EUV レジストの次の戦争は『メタル系・乾式』への世代交代で再戦になる",
        body:
          "化学増幅型レジストで築いた現在の地位は、メタルオキサイドレジスト（Inpria 系）やラムリサーチの乾式レジスト（dry resist）が Hi-NA 世代で採用された場合に再戦を強いられる。TOK は次世代材料の開発状況をほぼ開示しておらず、現行 EUV レジストの優位が次世代に持ち越せるかは外部から判断できない。材料の世代交代は装置より静かに、しかし不可逆に起きる。",
        citations: [SRC_2025FY_TOK],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "『装置と同じサイクル株』扱いされるバリュエーションの歪み",
        body:
          "レジストはウェハ投入量（生産量）連動であり、設備投資（WFE）連動の装置株より業績の振れが小さい。それにもかかわらず株価は SOX 指数と高相関で売買され、装置株と同じ振幅で動く傾向がある。この『ビジネスモデルと株価ボラティリティの不一致』は、装置株の調整局面でレジスト株を仕込む逆張り機会の源泉になってきた。",
        citations: [SRC_2025FY_TOK],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "JSR 非公開化後、『残された上場レジスト大手』としての希少性と再編可能性",
        body:
          "レジスト世界大手の一角だった JSR が産業革新投資機構（JIC）傘下で非公開化されたことで、レジスト専業に近い上場大手は TOK・信越（事業の一部）に絞られた。国策ファンドによる材料産業の再編が続くシナリオでは、TOK 自身が再編の対象（買収プレミアム）になる可能性が市場で意識されやすく、下値を支える要因として機能している。",
        citations: [SRC_2025FY_TOK],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 53,
      rationale:
        "PER 22.1 倍は化学セクター平均より高いが、半導体数量に連動する消耗材の安定性と EUV ミックス改善を考慮すれば妥当。素材株の中では希少な『半導体生産量への純粋プレー』であり、装置株調整局面での相対的な耐性が価値。",
      citations: [SRC_2025FY_TOK],
    },
  },
  {
    code: "4004",
    name: "レゾナック・ホールディングス",
    nameEn: "Resonac",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "化学",
    industryCluster: "半導体後工程材料",
    priceJpy: 3620,
    priceDate: "2026-05-26",
    changePct: 0.89,
    marketCapOku: 6850,
    per: 16.8,
    pbr: 1.2,
    dividendYield: 1.8,
    roe: 7.2,
    operatingMargin: 6.8,
    revenueGrowth3y: 3.1,
    description:
      "旧昭和電工＋日立化成。CMP スラリー・封止材・銅張積層板など半導体後工程材料で世界トップ群。石化など市況事業を抱える複合化学から『半導体材料会社』への転換途上で、ポートフォリオ再編が評価の鍵。",
    oneLiner:
      "半導体を仕上げる工程で使う材料（研磨剤・封止材など）の世界的大手。昭和電工と日立化成が合併してできた会社で、化学コンビナートも持つ。『総合化学から半導体材料会社へ』変身中の企業。",
    tags: [
      { dimension: "product", value: "後工程材料（CMP スラリー・封止材）", source: SRC_2025FY_RESONAC },
      { dimension: "product", value: "銅張積層板・感光性フィルム", source: SRC_2025FY_RESONAC },
      { dimension: "product", value: "石油化学・黒鉛電極", source: SRC_2025FY_RESONAC },
      { dimension: "customer", value: "OSAT・半導体メーカー・基板メーカー", source: SRC_2025FY_RESONAC },
      { dimension: "channel", value: "直販", source: SRC_2025FY_RESONAC },
      { dimension: "revenue_model", value: "消耗材料＋市況製品の複合", source: SRC_2025FY_RESONAC },
      { dimension: "value_chain", value: "後工程材料", source: SRC_2025FY_RESONAC },
      { dimension: "geography", value: "日本 40%・アジア 45%・その他 15%", source: SRC_2025FY_RESONAC },
    ],
    segments: [
      { name: "半導体・電子材料", revenueOku: 4200, share: 30.9, operatingMargin: 13.5 },
      { name: "モビリティ", revenueOku: 1950, share: 14.3, operatingMargin: 4.2 },
      { name: "ケミカル", revenueOku: 4800, share: 35.3, operatingMargin: 5.1 },
      { name: "その他", revenueOku: 2650, share: 19.5, operatingMargin: 2.8 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 10, expansion: 40, mature: 50, decline: 10 },
    phaseRationale:
      "半導体・電子材料は AI パッケージ需要で拡大期にあるが、石化・黒鉛電極など市況事業が全体の足を引っ張る複合構造。ポートフォリオ転換（石化分離）の進捗が拡大スコアの上限を決める。",
    factorBetas: {
      usdjpy: 0.35,
      us10y: -0.18,
      oil: 0.21,
      sox: 0.88,
      china: 0.42,
      market: 1.02,
      size: 0.36,
      value: 0.58,
      momentum: -0.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "石化分離の実行速度が『化学→半導体材料』の評価替えの鍵",
        body:
          "会社は石油化学事業の分離・JV 化を掲げており、実現すれば売上構成に占める半導体・電子材料比率が一気に高まる。SOTP（部門別評価）では半導体材料部門に化学平均を大きく上回るマルチプルが付く余地があり、分離の発表・実行が評価替えのトリガーになる。逆に市況悪化で分離交渉が停滞すると、複合企業ディスカウントが長期化する。",
        citations: [SRC_2025FY_RESONAC],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "AI パッケージ（CoWoS 系）材料での実質シェアが開示から見えない",
        body:
          "後工程材料は品目が多岐にわたり（スラリー・封止材・ダイボンディングフィルム等）、AI 先端パッケージ向けの実質的な中身・シェアが外部から検証できない。『AI 関連売上』の定義も各社バラバラで、レゾナックの後工程材料の競争力を定量比較する材料が不足。開示の解像度が上がるだけで再評価される余地がある。",
        citations: [SRC_2025FY_RESONAC],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
      {
        title: "日立化成買収で膨らんだ有利子負債が金利上昇局面の重石",
        body:
          "旧日立化成の買収（約 9,600 億円）で積み上がった有利子負債は、低金利前提では問題化しなかったが、金利上昇局面では利払い負担と財務制限条項が資本政策（増配・自社株買い・成長投資）の自由度を縛る。石化分離による負債圧縮が財務面でも転換点になる構造で、分離の成否に評価が二重に依存している。",
        citations: [SRC_2025FY_RESONAC],
        generatedAt: "2026-06-10T19:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 62,
      rationale:
        "PER 16.8 倍・PBR 1.2 倍は半導体材料企業としては大幅なディスカウント。市況事業の混在と有利子負債の重さが原因であり、石化分離が実行されれば『化学→半導体材料』の評価替え余地が大きい。イベントドリブン型の割安で、カタリストの時期が読めない点がリスク。",
      citations: [SRC_2025FY_RESONAC],
    },
  },
  {
    code: "4502",
    name: "武田薬品工業",
    nameEn: "Takeda Pharmaceutical",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 4280,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 67800,
    per: 17.4,
    pbr: 1.12,
    dividendYield: 4.6,
    roe: 6.2,
    operatingMargin: 14.8,
    revenueGrowth3y: 2.1,
    description:
      "国内最大手の研究開発型製薬企業。シャイアー買収（2019）後の有利子負債削減を進めながら、希少疾患・血液腫瘍・神経・消化器・血漿分画の 5 領域で展開。VYVANSE 後発品参入による減収局面。",
    oneLiner:
      "国内最大手の製薬会社。希少疾患・がんを含む 5 領域で展開、海外売上比率約 85% のグローバル企業。シャイアー買収後の借入返済中で、配当利回り 4.6% は国内大手として高水準。",
    tags: [
      { dimension: "product", value: "新薬（希少疾患）", source: SRC_2025FY_TAKEDA },
      { dimension: "product", value: "新薬（血液腫瘍）", source: SRC_2025FY_TAKEDA },
      { dimension: "product", value: "新薬（神経・精神）", source: SRC_2025FY_TAKEDA },
      { dimension: "product", value: "血漿分画製剤", source: SRC_2025FY_TAKEDA },
      { dimension: "customer", value: "病院・診療所（処方薬）", source: SRC_2025FY_TAKEDA },
      { dimension: "customer", value: "卸売業者", source: SRC_2025FY_TAKEDA },
      { dimension: "channel", value: "直販＋医薬品卸", source: SRC_2025FY_TAKEDA },
      { dimension: "revenue_model", value: "新薬売り切り＋特許保護期間収益", source: SRC_2025FY_TAKEDA },
      { dimension: "value_chain", value: "新薬探索〜開発〜販売の垂直統合", source: SRC_2025FY_TAKEDA },
      { dimension: "geography", value: "北米 50%・欧州 21%・日本 13%・新興国 16%", source: SRC_2025FY_TAKEDA },
    ],
    segments: [
      { name: "消化器", revenueOku: 11400, share: 24.8, operatingMargin: 26.4 },
      { name: "希少疾患", revenueOku: 9600, share: 20.9, operatingMargin: 22.1 },
      { name: "血漿分画", revenueOku: 8900, share: 19.3, operatingMargin: 18.8 },
      { name: "血液腫瘍", revenueOku: 6800, share: 14.8, operatingMargin: 24.2 },
      { name: "神経精神", revenueOku: 5400, share: 11.7, operatingMargin: 17.4 },
      { name: "その他", revenueOku: 3900, share: 8.5, operatingMargin: 8.1 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 4, expansion: 24, mature: 78, decline: 22 },
    phaseRationale:
      "売上 3 年 CAGR +2.1% で成熟期色濃厚。主力 VYVANSE が後発品参入で減収、新規パイプラインへの依存度が高まる踊り場。",
    factorBetas: {
      usdjpy: -0.42,
      us10y: -0.18,
      oil: 0.04,
      sox: 0.21,
      china: 0.08,
      market: 0.74,
      size: -0.31,
      value: 0.42,
      momentum: -0.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "VYVANSE 後発品参入後の収益力低下が市場予想を上回る可能性",
        body:
          "ADHD 治療薬 VYVANSE は 2023 年から米国で後発品参入が本格化。2025/3 期は売上 18% 減収だが、26/3 期はさらに 25% 程度減収する見通し。IR は新規パイプライン（TAK-861, TAK-279）で吸収可能と説明するが、上市タイミングのラグが大きく、2026-27 年度の業績は市場予想を下回る可能性。",
        citations: [SRC_2025FY_TAKEDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "TAK-861（オレキシン作動薬）のナルコレプシー第 3 相成功確度",
        body:
          "次の柱として最重要のオレキシン作動薬 TAK-861。前段の TAK-994 は肝障害で中止になっており、TAK-861 の安全性プロファイル次第で武田の中期業績見通しが大きく変わる。第 3 相結果は 2026 年後半が予定。IR では成功前提の説明が中心で、失敗時の感応度の議論が薄い。",
        citations: [SRC_2025FY_TAKEDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "有利子負債削減の優先順位と研究開発投資のトレードオフ",
        body:
          "シャイアー買収以降、有利子負債削減を最重要 KPI として運用。一方で、メガファーマ世界平均 R&D 比率 20% に対し武田は 16% 台で、長期競争力への影響が論点。負債削減完了後（2027 年予定）の R&D 比率引き上げ計画が IR で明示されていない。",
        citations: [SRC_2025FY_TAKEDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 55,
      rationale:
        "PER 17.4 倍は国内大手平均 18 倍と同水準、配当利回り 4.6% を勘案すれば下値抵抗感あり。一方で VYVANSE 減収と TAK-861 不確実性を考えるとアップサイドも限定的。フェアバリュー圏。",
      citations: [SRC_2025FY_TAKEDA],
    },
  },
  {
    code: "4568",
    name: "第一三共",
    nameEn: "Daiichi Sankyo",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 5240,
    priceDate: "2026-05-26",
    changePct: 1.28,
    marketCapOku: 102400,
    per: 38.4,
    pbr: 4.8,
    dividendYield: 0.9,
    roe: 13.4,
    operatingMargin: 22.1,
    revenueGrowth3y: 18.4,
    description:
      "ADC（抗体薬物複合体）プラットフォームで世界トップ。エンハーツが乳がん・胃がんで急成長、新規 ADC 3 剤の上市が控える。R&D 中心の経営。",
    oneLiner:
      "がん治療薬の新世代『ADC（抗体薬物複合体）』で世界トップ。エンハーツが乳がん治療を変えた製品。今後 3 剤の新 ADC 上市が控え、新薬大手として世界的に注目されている。",
    tags: [
      { dimension: "product", value: "新薬（がん／ADC）", source: SRC_2025FY_DAIICHI },
      { dimension: "product", value: "新薬（循環器）", source: SRC_2025FY_DAIICHI },
      { dimension: "product", value: "ワクチン", source: SRC_2025FY_DAIICHI },
      { dimension: "customer", value: "病院・診療所（処方薬）", source: SRC_2025FY_DAIICHI },
      { dimension: "customer", value: "卸売業者", source: SRC_2025FY_DAIICHI },
      { dimension: "channel", value: "直販＋医薬品卸＋アライアンス（AstraZeneca, Merck）", source: SRC_2025FY_DAIICHI },
      { dimension: "revenue_model", value: "新薬売り切り＋アライアンスロイヤルティ", source: SRC_2025FY_DAIICHI },
      { dimension: "value_chain", value: "新薬探索〜開発〜販売の垂直統合", source: SRC_2025FY_DAIICHI },
      { dimension: "geography", value: "北米 38%・日本 28%・欧州 19%・アジア 15%", source: SRC_2025FY_DAIICHI },
    ],
    segments: [
      { name: "エンハーツ", revenueOku: 8400, share: 36.1, operatingMargin: 32.4 },
      { name: "国内医療用医薬品", revenueOku: 6200, share: 26.6, operatingMargin: 18.2 },
      { name: "その他がん領域", revenueOku: 4800, share: 20.6, operatingMargin: 24.1 },
      { name: "海外既存品", revenueOku: 2900, share: 12.4, operatingMargin: 16.8 },
      { name: "その他", revenueOku: 980, share: 4.2, operatingMargin: 5.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 18, expansion: 84, mature: 14, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +18.4%、エンハーツ急拡大＋新規 ADC 3 剤の上市待ちで拡大期色が極めて強い。R&D 集中投資中。",
    factorBetas: {
      usdjpy: -0.21,
      us10y: -0.42,
      oil: 0.02,
      sox: 0.18,
      china: 0.04,
      market: 0.81,
      size: -0.08,
      value: -0.84,
      momentum: 0.42,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "エンハーツ単剤依存度の高さと、AstraZeneca とのアライアンス利益配分",
        body:
          "エンハーツが連結売上の 36% を占める単剤依存構造。AstraZeneca とのプロフィットシェア契約により、エンハーツ売上のうち実質取り分は約 50%。エンハーツに何かあった場合の感応度が極めて高く、IR では他 ADC（DXd プラットフォーム）の進捗で代替性を強調するが、単剤集中リスクの定量議論が浅い。",
        citations: [SRC_2025FY_DAIICHI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "新 ADC 3 剤の上市タイミング：商業的成功確率の織り込み",
        body:
          "DS-7300（TROP2-ADC）、DS-6051（HER3-ADC）、DS-8401（HER2-DXd 次世代）の 3 剤が 2025-2027 年に上市予定。エンハーツに続くブロックバスター候補だが、競合（Gilead、Pfizer）も同領域に参入。エンハーツ並みの売上を全 3 剤で達成する前提が市場で過大に織り込まれている可能性。",
        citations: [SRC_2025FY_DAIICHI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 38 倍の前提：R&D の継続的成功 + 米国薬価規制の織り込み不足",
        body:
          "PER 38 倍はメガファーマ世界平均 18 倍を大きく上回り、新薬パイプライン 100% 成功を織り込むレベル。一方で米国 IRA（薬価交渉対象拡大）の影響、エンハーツ含む既存品の特許切れタイミング（2030 年代前半〜）への対応議論は IR で薄い。",
        citations: [SRC_2025FY_DAIICHI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 30,
      rationale:
        "PER 38.4 倍はメガファーマ世界平均 18 倍を 113% 上回る。ADC プラットフォームのプレミアムを認めても、新 ADC 3 剤の商業的成功と米国薬価規制の影響を考えると織り込み過多。配当利回り 0.9% も国内大手として低い。",
      citations: [SRC_2025FY_DAIICHI],
    },
  },
  {
    code: "4503",
    name: "アステラス製薬",
    nameEn: "Astellas Pharma",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 1620,
    priceDate: "2026-05-26",
    changePct: -0.84,
    marketCapOku: 30200,
    per: 24.6,
    pbr: 1.84,
    dividendYield: 4.2,
    roe: 7.4,
    operatingMargin: 8.2,
    revenueGrowth3y: 4.8,
    description:
      "前立腺がん治療薬イクスタンジで世界トップシェア（米国法人 Pfizer と共同販売）。イクスタンジ後の柱としてパドセブ（膀胱がん）、ベオーザ（更年期）に注力。",
    oneLiner:
      "前立腺がん治療薬『イクスタンジ』で世界的に存在感。米国でファイザーと共同販売。イクスタンジの特許切れが 2027-28 年に迫り、次の柱への移行が経営の最重要テーマ。",
    tags: [
      { dimension: "product", value: "新薬（がん／泌尿器）", source: SRC_2025FY_ASTELLAS },
      { dimension: "product", value: "新薬（移植）", source: SRC_2025FY_ASTELLAS },
      { dimension: "product", value: "新薬（女性医療）", source: SRC_2025FY_ASTELLAS },
      { dimension: "customer", value: "病院・診療所（処方薬）", source: SRC_2025FY_ASTELLAS },
      { dimension: "channel", value: "直販＋ Pfizer 等とのアライアンス", source: SRC_2025FY_ASTELLAS },
      { dimension: "revenue_model", value: "新薬売り切り＋アライアンスロイヤルティ", source: SRC_2025FY_ASTELLAS },
      { dimension: "value_chain", value: "新薬探索〜開発〜販売の垂直統合", source: SRC_2025FY_ASTELLAS },
      { dimension: "geography", value: "北米 44%・日本 22%・欧州 18%・アジア 16%", source: SRC_2025FY_ASTELLAS },
    ],
    segments: [
      { name: "イクスタンジ", revenueOku: 7800, share: 41.5, operatingMargin: 36.4 },
      { name: "その他がん（パドセブ等）", revenueOku: 3200, share: 17.0, operatingMargin: 14.2 },
      { name: "移植", revenueOku: 2900, share: 15.4, operatingMargin: 28.8 },
      { name: "女性医療（ベオーザ等）", revenueOku: 1800, share: 9.6, operatingMargin: -8.2 },
      { name: "その他", revenueOku: 3100, share: 16.5, operatingMargin: 12.1 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 14, expansion: 42, mature: 54, decline: 22 },
    phaseRationale:
      "イクスタンジ依存度高く成熟期色強いが、パドセブ・ベオーザの立ち上げが成功すれば次の拡大期へ移行する境界銘柄。",
    factorBetas: {
      usdjpy: -0.38,
      us10y: -0.14,
      oil: 0.04,
      sox: 0.18,
      china: 0.06,
      market: 0.71,
      size: -0.21,
      value: 0.34,
      momentum: -0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "イクスタンジ売上ピーク（2027 年）後の崖、後継品の規模感",
        body:
          "イクスタンジは 2027-28 年に米国・欧州で物質特許切れ。後継候補のパドセブは順調だが、イクスタンジ売上 7,800 億円を単独で代替する規模ではない。ベオーザ（更年期）は適応症が新規で立ち上がりが想定より遅延中、ファースト・イン・クラスのプロモーション負担が利益率を圧迫。",
        citations: [SRC_2025FY_ASTELLAS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "アイベリックバイオ買収（2023）の減損リスク",
        body:
          "2023 年に約 8,000 億円で買収したアイベリックバイオ。主力 IZERVAY（地図状萎縮治療薬）の売上が計画比未達で、買収時に計上したのれん約 5,000 億円の減損圧力が継続。減損が発生した場合、2026/3 期の最終利益に大きな影響。",
        citations: [SRC_2025FY_ASTELLAS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Primary Focus 戦略の選択と集中の進捗",
        body:
          "コア領域 5 つに資源集中する『Primary Focus』戦略を 2023 年から実行中だが、進捗開示が定性的。非コア領域の撤退・売却計画の具体が IR で見えにくく、構造改革のスピード感が市場の織り込みと乖離している可能性。",
        citations: [SRC_2025FY_ASTELLAS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 24.6 倍は国内大手平均 18 倍を 37% 上回るが、イクスタンジの収益力プレミアムを反映。配当利回り 4.2% で下値抵抗感あり。一方でイクスタンジ崖の感応度が高く、アップサイドも限定的。",
      citations: [SRC_2025FY_ASTELLAS],
    },
  },
  {
    code: "4523",
    name: "エーザイ",
    nameEn: "Eisai",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 5680,
    priceDate: "2026-05-26",
    changePct: 2.14,
    marketCapOku: 16800,
    per: 42.8,
    pbr: 2.4,
    dividendYield: 2.9,
    roe: 5.8,
    operatingMargin: 7.4,
    revenueGrowth3y: 1.8,
    description:
      "アルツハイマー病治療薬レカネマブ（レンビマと並ぶ柱）でアルツハイマー領域の世界トップランナー。Biogen と共同開発・販売。",
    oneLiner:
      "アルツハイマー病治療薬『レカネマブ』を世界で最初に上市した会社。Biogen と共同販売。レカネマブの患者数拡大が業績ドライバ、医療体制整備の進捗が鍵。",
    tags: [
      { dimension: "product", value: "新薬（アルツハイマー）", source: SRC_2025FY_EISAI },
      { dimension: "product", value: "新薬（がん）", source: SRC_2025FY_EISAI },
      { dimension: "product", value: "新薬（神経）", source: SRC_2025FY_EISAI },
      { dimension: "customer", value: "病院（特定機能病院等）", source: SRC_2025FY_EISAI },
      { dimension: "channel", value: "直販＋ Biogen アライアンス", source: SRC_2025FY_EISAI },
      { dimension: "revenue_model", value: "新薬売り切り＋アライアンスシェア", source: SRC_2025FY_EISAI },
      { dimension: "value_chain", value: "新薬探索〜開発〜販売の垂直統合", source: SRC_2025FY_EISAI },
      { dimension: "geography", value: "北米 36%・日本 28%・アジア 22%・欧州 14%", source: SRC_2025FY_EISAI },
    ],
    segments: [
      { name: "レンビマ", revenueOku: 2100, share: 28.4, operatingMargin: 38.2 },
      { name: "レカネマブ（LEQEMBI）", revenueOku: 1200, share: 16.2, operatingMargin: -22.4 },
      { name: "その他新薬", revenueOku: 2600, share: 35.1, operatingMargin: 12.4 },
      { name: "国内既存品", revenueOku: 1500, share: 20.3, operatingMargin: 18.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 32, expansion: 38, mature: 48, decline: 18 },
    phaseRationale:
      "レカネマブ立ち上げ局面で先行投資負担が利益を圧迫、レンビマ成熟と混合。境界銘柄。レカネマブが本格普及すれば拡大期へ移行する可能性。",
    factorBetas: {
      usdjpy: -0.21,
      us10y: -0.62,
      oil: 0.02,
      sox: 0.31,
      china: 0.08,
      market: 0.94,
      size: 0.18,
      value: -0.94,
      momentum: 0.34,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "レカネマブの患者数拡大ペースが市場予想より遅い背景",
        body:
          "レカネマブ（LEQEMBI）の米国売上は 2025/3 期で 1,200 億円相当、市場予想（2,000 億円超）を大きく下回る。理由は MRI 設備整備の遅れ、ARIA（脳浮腫）副作用への医師警戒、保険償還の不透明性。IR では年次ガイダンスが連続下方修正されており、患者数拡大ペースの本格回復タイミングが不透明。",
        citations: [SRC_2025FY_EISAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Biogen との利益配分の不透明性",
        body:
          "レカネマブは Biogen と 50:50 のプロフィットシェアだが、開発費は事実上エーザイがリード。利益局面でのシェア配分構造、特に Biogen 経営難（ADUHELM 失敗の影響継続）でアライアンス見直しが起きた場合の影響が IR で明示されていない。",
        citations: [SRC_2025FY_EISAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "レンビマ独占特許切れ（2028 年予定）への準備",
        body:
          "現在の利益柱レンビマは 2028 年に米国・欧州で物質特許切れ。レカネマブの本格拡大がそれまでに進まないと、業績は大きな崖を迎える。IR でこの『パテントクリフ』のタイミングと感応度の説明が薄い。",
        citations: [SRC_2025FY_EISAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 35,
      rationale:
        "PER 42.8 倍は国内平均の 2 倍超で、レカネマブ成功と医療体制整備が想定通りに進む前提を織り込む。患者数拡大の遅延リスクとレンビマ崖を勘案すると織り込み過多の可能性。",
      citations: [SRC_2025FY_EISAI],
    },
  },
  {
    code: "4519",
    name: "中外製薬",
    nameEn: "Chugai Pharmaceutical",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 7240,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 121800,
    per: 28.2,
    pbr: 5.4,
    dividendYield: 1.8,
    roe: 19.4,
    operatingMargin: 38.4,
    revenueGrowth3y: 4.2,
    description:
      "Roche グループ傘下の研究開発型製薬。バイオ医薬品に特化、Roche とのアライアンスにより国内大手で最高水準の利益率を維持。",
    oneLiner:
      "国内製薬で最も利益率が高い会社（営業利益率 38%）。Roche グループ傘下で、バイオ医薬品に特化。アクテムラ・ヘムライブラなど世界的な大型薬を持つ。",
    tags: [
      { dimension: "product", value: "新薬（バイオ／抗体）", source: SRC_2025FY_CHUGAI },
      { dimension: "product", value: "新薬（がん）", source: SRC_2025FY_CHUGAI },
      { dimension: "product", value: "新薬（自己免疫）", source: SRC_2025FY_CHUGAI },
      { dimension: "customer", value: "病院・診療所（処方薬）", source: SRC_2025FY_CHUGAI },
      { dimension: "channel", value: "直販＋ Roche グループ販売網", source: SRC_2025FY_CHUGAI },
      { dimension: "revenue_model", value: "新薬売り切り＋ Roche アライアンスロイヤルティ", source: SRC_2025FY_CHUGAI },
      { dimension: "value_chain", value: "創薬研究＋開発＋国内販売（Roche グループ）", source: SRC_2025FY_CHUGAI },
      { dimension: "geography", value: "日本 38%・海外（ロイヤルティ）62%", source: SRC_2025FY_CHUGAI },
    ],
    segments: [
      { name: "国内医療用医薬品", revenueOku: 4800, share: 38.1, operatingMargin: 28.4 },
      { name: "海外売上（ロイヤルティ）", revenueOku: 7800, share: 61.9, operatingMargin: 44.2 },
    ],
    segmentsPeriod: "2024/12",
    phaseScores: { launch: 8, expansion: 52, mature: 64, decline: 8 },
    phaseRationale:
      "売上 3 年 CAGR +4.2%、安定的拡大。ヘムライブラなど大型薬の海外ロイヤルティが利益柱。次の柱探索局面。",
    factorBetas: {
      usdjpy: -0.18,
      us10y: -0.34,
      oil: 0.02,
      sox: 0.21,
      china: 0.08,
      market: 0.71,
      size: -0.18,
      value: -0.42,
      momentum: 0.24,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Roche グループとの利益配分構造の経営自由度への影響",
        body:
          "中外の海外売上のほぼ全ては Roche グループ経由で、利益配分はアライアンス契約による。グループ依存度が高い構造で、長期的に Roche 戦略の影響を直接受ける。一方で R&D 投資の効率は高く、独自パイプラインの自社販売余地もあり、この緊張関係の議論が IR で抽象的。",
        citations: [SRC_2025FY_CHUGAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ヘムライブラ後の海外ロイヤルティの次の柱",
        body:
          "現在の海外ロイヤルティ売上の中核はヘムライブラ（血友病）、エンスプリング（視神経脊髄炎）。次世代の大型化候補としては、抗体改変技術 Recycling Antibody / Sweeping Antibody から派生する新規分子があるが、上市タイミングが 2028 年以降。間の踊り場期間の業績モメンタムが論点。",
        citations: [SRC_2025FY_CHUGAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PBR 5.4 倍 / ROE 19.4% の維持可能性",
        body:
          "国内製薬で最高水準の収益性は、Roche グループの規模を背景とした R&D 効率と海外ロイヤルティ依存に支えられる。バイオシミラー競合の本格化と Roche のグローバル戦略次第で、現在の高水準が長期維持できるかは不確実。",
        citations: [SRC_2025FY_CHUGAI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 48,
      rationale:
        "PER 28.2 倍は国内平均 18 倍を上回るが、営業利益率 38% / ROE 19.4% の収益性プレミアムを反映。現株価は質的優位を概ね織り込んだ水準。",
      citations: [SRC_2025FY_CHUGAI],
    },
  },
  {
    code: "4507",
    name: "塩野義製薬",
    nameEn: "Shionogi",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "医薬品",
    industryCluster: "新薬大手（メガファーマ）",
    priceJpy: 2180,
    priceDate: "2026-05-26",
    changePct: -1.42,
    marketCapOku: 6800,
    per: 11.4,
    pbr: 1.24,
    dividendYield: 3.4,
    roe: 11.2,
    operatingMargin: 24.8,
    revenueGrowth3y: -8.2,
    description:
      "感染症領域に強み。新型コロナ治療薬ゾコーバの売上ピークアウト後、HIV 治療薬（ViiV/GSK ロイヤルティ）が安定収益源。次の柱探索局面。",
    oneLiner:
      "感染症治療薬に強い中堅製薬。新型コロナ治療薬ゾコーバが一時収益を押し上げたが終息で減収中。HIV 治療薬の海外ロイヤルティが安定収益源。",
    tags: [
      { dimension: "product", value: "新薬（感染症）", source: SRC_2025FY_SHIONOGI },
      { dimension: "product", value: "新薬（HIV ロイヤルティ）", source: SRC_2025FY_SHIONOGI },
      { dimension: "product", value: "新薬（疼痛・中枢神経）", source: SRC_2025FY_SHIONOGI },
      { dimension: "customer", value: "病院・診療所（処方薬）", source: SRC_2025FY_SHIONOGI },
      { dimension: "channel", value: "直販＋ ViiV/GSK アライアンス", source: SRC_2025FY_SHIONOGI },
      { dimension: "revenue_model", value: "新薬売り切り＋ロイヤルティ", source: SRC_2025FY_SHIONOGI },
      { dimension: "value_chain", value: "新薬探索〜開発〜販売の垂直統合", source: SRC_2025FY_SHIONOGI },
      { dimension: "geography", value: "日本 52%・海外ロイヤルティ 48%", source: SRC_2025FY_SHIONOGI },
    ],
    segments: [
      { name: "国内医療用医薬品", revenueOku: 1800, share: 52.0, operatingMargin: 18.4 },
      { name: "海外ロイヤルティ（ViiV/GSK 等）", revenueOku: 1660, share: 48.0, operatingMargin: 38.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 12, expansion: 14, mature: 58, decline: 38 },
    phaseRationale:
      "売上 3 年 CAGR -8.2%、ゾコーバ売上ピークアウトで縮小局面。HIV ロイヤルティが下値を支える構造。",
    factorBetas: {
      usdjpy: -0.12,
      us10y: -0.04,
      oil: 0.02,
      sox: 0.08,
      china: 0.04,
      market: 0.62,
      size: -0.04,
      value: 0.42,
      momentum: -0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "HIV ロイヤルティの長期持続性：ViiV / GSK ジェネリック影響",
        body:
          "海外ロイヤルティの大半は ViiV（GSK 子会社）の HIV 治療薬。ドルテグラビル（Tivicay 等）の物質特許は 2027 年に米国で切れ、ジェネリック参入で塩野義のロイヤルティ収入が大幅減少する可能性。IR ではこの感応度の説明が薄い。",
        citations: [SRC_2025FY_SHIONOGI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "次世代パイプラインの規模感",
        body:
          "次の柱候補として、自社開発の S-892216（感染症長期作用型）、S-005151（中枢神経）など。いずれも 2027-29 年上市予定だが、ピーク売上想定が現在の HIV ロイヤルティ規模（年 1,500 億円超）に届く前提が市場に共有されていない。",
        citations: [SRC_2025FY_SHIONOGI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 11 倍の割安感は『HIV ロイヤルティ崖』を半分織り込んだ水準か",
        body:
          "PER 11.4 倍は国内大手平均 18 倍を 37% 下回り、配当利回り 3.4%。割安にも見えるが、HIV ロイヤルティの 2027 年以降の崖を半分織り込んだ水準とも解釈できる。次世代パイプライン進捗次第で再評価余地。",
        citations: [SRC_2025FY_SHIONOGI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 66,
      rationale:
        "PER 11.4 倍は国内大手平均 18 倍を 37% 下回り、ROE 11% と配当利回り 3.4% を勘案すれば割安水準。HIV ロイヤルティ崖を考慮しても下値抵抗感あり。",
      citations: [SRC_2025FY_SHIONOGI],
    },
  },
  {
    code: "4543",
    name: "テルモ",
    nameEn: "Terumo",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "精密機器",
    industryCluster: "医療機器",
    priceJpy: 2680,
    priceDate: "2026-05-26",
    changePct: 0.84,
    marketCapOku: 39800,
    per: 32.4,
    pbr: 3.8,
    dividendYield: 0.9,
    roe: 11.8,
    operatingMargin: 18.4,
    revenueGrowth3y: 8.4,
    description:
      "医療機器世界大手。血管内治療カテーテル、輸血関連、糖尿病ケアで強み。新興国展開と TIS 領域（経カテーテル治療）が成長ドライバ。",
    oneLiner:
      "医療機器の世界大手。心臓カテーテル、輸血関連機器、糖尿病ケアで強み。日本企業として珍しくグローバルで戦える医療機器メーカー。",
    tags: [
      { dimension: "product", value: "医療機器（カテーテル）", source: SRC_2025FY_TERUMO },
      { dimension: "product", value: "医療機器（輸血関連）", source: SRC_2025FY_TERUMO },
      { dimension: "product", value: "医療機器（糖尿病ケア）", source: SRC_2025FY_TERUMO },
      { dimension: "product", value: "医療機器（ホスピタルケア）", source: SRC_2025FY_TERUMO },
      { dimension: "customer", value: "病院・クリニック", source: SRC_2025FY_TERUMO },
      { dimension: "customer", value: "血液事業者", source: SRC_2025FY_TERUMO },
      { dimension: "channel", value: "直販＋医療機器卸", source: SRC_2025FY_TERUMO },
      { dimension: "revenue_model", value: "機器売り切り＋消耗品リカーリング", source: SRC_2025FY_TERUMO },
      { dimension: "value_chain", value: "医療機器の研究開発〜製造〜販売", source: SRC_2025FY_TERUMO },
      { dimension: "geography", value: "北米 36%・日本 26%・欧州 18%・アジア 20%", source: SRC_2025FY_TERUMO },
    ],
    segments: [
      { name: "心臓血管 (TIS)", revenueOku: 4200, share: 47.2, operatingMargin: 22.4 },
      { name: "メディカルケアソリューションズ", revenueOku: 2400, share: 27.0, operatingMargin: 14.2 },
      { name: "血液・細胞テクノロジー", revenueOku: 2300, share: 25.8, operatingMargin: 16.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 64, mature: 32, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +8.4%、新興国展開と TIS 領域で拡大期色。消耗品リカーリング構造で利益安定。",
    factorBetas: {
      usdjpy: 0.34,
      us10y: -0.18,
      oil: 0.04,
      sox: 0.14,
      china: 0.24,
      market: 0.74,
      size: -0.14,
      value: -0.42,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "TIS 領域での Boston Scientific・Medtronic との競合状況",
        body:
          "TIS（経カテーテル）市場は Boston Scientific・Medtronic との競合が激しく、テルモはアジア市場で優位、欧米では追う立場。次世代血管内デバイス（薬剤溶出ステント、IVUS 等）の上市タイミング次第でシェア構造が変動。",
        citations: [SRC_2025FY_TERUMO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国 VBP（集中購買）の医療機器への波及",
        body:
          "中国は医療機器でも『集中購買（VBP）』を医薬品に続いて拡大中。輸血関連機器・カテーテル・糖尿病ケアの中国市場シェアが価格圧縮で利益率を圧迫する可能性。中国売上比率の開示が概況のみで詳細不足。",
        citations: [SRC_2025FY_TERUMO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "輸血ビジネスの長期構造変化：献血代替技術の影響",
        body:
          "再生医療・遺伝子治療の進展で、長期的に従来輸血の需要が縮小する可能性。テルモの血液・細胞テクノロジー事業は売上 2,300 億円規模で、構造変化の感応度議論が IR で薄い。",
        citations: [SRC_2025FY_TERUMO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 47,
      rationale:
        "PER 32.4 倍は医療機器グローバル平均 28 倍を上回るが、消耗品リカーリング構造と新興国成長余地のプレミアム反映。フェアバリュー圏。",
      citations: [SRC_2025FY_TERUMO],
    },
  },
  {
    code: "4901",
    name: "富士フイルムホールディングス",
    nameEn: "Fujifilm Holdings",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "化学",
    industryCluster: "CDMO・診断（ヘルスケア多角化）",
    priceJpy: 3920,
    priceDate: "2026-05-26",
    changePct: 1.62,
    marketCapOku: 47800,
    per: 18.4,
    pbr: 1.4,
    dividendYield: 1.8,
    roe: 8.4,
    operatingMargin: 11.2,
    revenueGrowth3y: 6.2,
    description:
      "写真フィルム事業からヘルスケア・高機能材料・電子映像・印刷へ転換した多角化企業。バイオ CDMO（医薬品受託製造）が成長ドライバ。",
    oneLiner:
      "元写真フィルム会社が、医薬品の受託製造（CDMO）と医療画像診断装置に大転換した会社。バイオ医薬品の CDMO 事業がここ数年の成長ドライバ。",
    tags: [
      { dimension: "product", value: "医薬品 CDMO", source: SRC_2025FY_FUJIFILM },
      { dimension: "product", value: "医療画像診断装置（X線、超音波）", source: SRC_2025FY_FUJIFILM },
      { dimension: "product", value: "高機能材料・電子材料", source: SRC_2025FY_FUJIFILM },
      { dimension: "product", value: "デジタルカメラ・光学", source: SRC_2025FY_FUJIFILM },
      { dimension: "customer", value: "医薬品メーカー（CDMO 受託）", source: SRC_2025FY_FUJIFILM },
      { dimension: "customer", value: "病院・診療所", source: SRC_2025FY_FUJIFILM },
      { dimension: "channel", value: "直販＋商社", source: SRC_2025FY_FUJIFILM },
      { dimension: "revenue_model", value: "受託製造（CDMO）＋機器売り切り＋消耗品", source: SRC_2025FY_FUJIFILM },
      { dimension: "value_chain", value: "多角化（写真技術 → ヘルスケア／材料）", source: SRC_2025FY_FUJIFILM },
      { dimension: "geography", value: "北米 28%・日本 32%・欧州 14%・アジア 26%", source: SRC_2025FY_FUJIFILM },
    ],
    segments: [
      { name: "ヘルスケア（CDMO・診断・医薬）", revenueOku: 11200, share: 35.8, operatingMargin: 12.4 },
      { name: "マテリアルズ（高機能材料）", revenueOku: 8400, share: 26.9, operatingMargin: 14.2 },
      { name: "ビジネスイノベーション（印刷）", revenueOku: 8800, share: 28.2, operatingMargin: 7.8 },
      { name: "イメージング（カメラ・光学）", revenueOku: 2800, share: 9.0, operatingMargin: 18.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 4, expansion: 48, mature: 56, decline: 8 },
    phaseRationale:
      "CDMO 事業が拡大期、印刷事業は成熟期。事業ミックスでバランス取れた成熟＋一部拡大構造。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: -0.18,
      oil: 0.08,
      sox: 0.24,
      china: 0.32,
      market: 0.88,
      size: -0.21,
      value: 0.18,
      momentum: 0.14,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "バイオ CDMO 投資の回収タイミング",
        body:
          "バイオ CDMO 事業は累計 3,500 億円超の設備投資を実施中（米国デンマーク等）。減価償却負担と稼働率立ち上がりのタイムラグで、利益率の本格回復は 2027 年度以降の見通し。CDMO 市場の世界的競合（Lonza、Samsung Biologics、WuXi Biologics）との比較感応度が IR で薄い。",
        citations: [SRC_2025FY_FUJIFILM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "印刷事業（ビジネスイノベーション）の縮小と再編",
        body:
          "売上 28% を占める印刷事業は構造的縮小領域。Xerox 統合後の再編進捗が IR で具体性に欠ける。カーブアウトや事業売却の選択肢が明示されておらず、ヘルスケア中心への転換が遅れて見える。",
        citations: [SRC_2025FY_FUJIFILM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "WuXi 規制の追い風がどこまで CDMO 受注に効くか",
        body:
          "米国 BIOSECURE 法案で中国系 CDMO（WuXi 等）への米国製薬の依存が制限される動き。富士フイルム CDMO への顧客シフトの可能性があるが、具体的受注ニュースは限定的。本格寄与は 2027 年以降か。",
        citations: [SRC_2025FY_FUJIFILM],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 54,
      rationale:
        "PER 18.4 倍は多角化企業として違和感ない水準。CDMO 拡大局面とヘルスケア比率上昇のプレミアム余地があるが、印刷事業の構造的縮小がディスカウント要因。",
      citations: [SRC_2025FY_FUJIFILM],
    },
  },

  // ===== SaaS（B2B）クラスタ =====
  {
    code: "4443",
    name: "Sansan",
    nameEn: "Sansan",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "営業 SaaS（名刺・契約）",
    priceJpy: 2180,
    priceDate: "2026-05-26",
    changePct: 0.92,
    marketCapOku: 6820,
    per: 52.4,
    pbr: 7.4,
    dividendYield: 0.0,
    roe: 14.2,
    operatingMargin: 12.4,
    revenueGrowth3y: 19.8,
    description:
      "名刺管理 SaaS の国内トッププレイヤー。法人向け Sansan、コンシューマ向け Eight に加え、契約管理 Contract One・請求書管理 Bill One で領域拡大中。AI 活用で営業 DX を支援。",
    oneLiner:
      "名刺管理 SaaS の国内最大手。法人向けデジタル名刺をベースに、契約管理・請求書管理など『営業の周辺業務 DX』を一体で提供する SaaS スイートを目指している会社。",
    tags: [
      { dimension: "product", value: "名刺管理 SaaS", source: SRC_2025FY_SANSAN },
      { dimension: "product", value: "契約管理 SaaS（Contract One）", source: SRC_2025FY_SANSAN },
      { dimension: "product", value: "請求書管理 SaaS（Bill One）", source: SRC_2025FY_SANSAN },
      { dimension: "customer", value: "中堅・大企業（営業組織）", source: SRC_2025FY_SANSAN },
      { dimension: "customer", value: "個人事業主（Eight）", source: SRC_2025FY_SANSAN },
      { dimension: "channel", value: "直販＋インサイドセールス", source: SRC_2025FY_SANSAN },
      { dimension: "revenue_model", value: "サブスクリプション（年契約）", source: SRC_2025FY_SANSAN },
      { dimension: "value_chain", value: "営業マーケ SaaS", source: SRC_2025FY_SANSAN },
      { dimension: "geography", value: "国内 95%・海外 5%", source: SRC_2025FY_SANSAN },
    ],
    segments: [
      { name: "Sansan / Eight 事業", revenueOku: 320, share: 72.0, operatingMargin: 22.4 },
      { name: "Bill One 事業", revenueOku: 90, share: 20.2, operatingMargin: -8.2 },
      { name: "Contract One・他", revenueOku: 35, share: 7.8, operatingMargin: -18.4 },
    ],
    segmentsPeriod: "2025/5",
    phaseScores: { launch: 10, expansion: 84, mature: 18, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +19.8%、主力 Sansan 事業の高利益率と Bill One の急成長で拡大期色が強い。Contract One が次の柱に育つかが論点。",
    factorBetas: {
      usdjpy: -0.18,
      us10y: -0.84,
      oil: 0.02,
      sox: 0.34,
      china: 0.04,
      market: 1.12,
      size: 0.62,
      value: -1.42,
      momentum: 0.84,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Bill One 黒字化タイミングと営業利益への寄与",
        body:
          "Bill One は売上比率 20% まで成長したが、営業利益はまだマイナス。先行投資型の典型的な SaaS パターンで、黒字化タイミングが連結業績に直結する。IR の中期計画では 2027 年度の黒字化を示唆しているが、想定マーケティング費の継続性と新規顧客獲得の鈍化リスクが論点。",
        citations: [SRC_2025FY_SANSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Contract One の本格立ち上がりが見えない",
        body:
          "契約管理 SaaS は LegalForce（非上場）と競合。Sansan の名刺管理顧客との購入連動（クロスセル）が想定通りに進めば成長余地大きいが、現状の売上比率は 5% 未満で、IR の説明も抽象度高い。Contract One の MRR 成長率の四半期開示が乏しく、投資家の見立てがしにくい。",
        citations: [SRC_2025FY_SANSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "AI 機能の課金モデルが従来 SaaS のフラット契約と相性悪い可能性",
        body:
          "生成 AI を活用した名刺解析・契約書要約・営業履歴の自動入力等を順次リリース中だが、AI API のコスト変動を顧客課金にどう転嫁するかが見えない。フラット価格を維持すると粗利率圧縮、従量課金に移行すると顧客抵抗。SaaS 業界共通の論点だが、Sansan の解の説明が不足。",
        citations: [SRC_2025FY_SANSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 52 倍は SaaS 国内大手平均 55 倍と同水準。売上 CAGR +19.8% と営業利益率 12% の組み合わせは妥当な評価。Bill One 黒字化と Contract One 立ち上がりで上方修正余地あり。",
      citations: [SRC_2025FY_SANSAN],
    },
  },
  {
    code: "3994",
    name: "マネーフォワード",
    nameEn: "Money Forward",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "会計・バックオフィス SaaS",
    priceJpy: 5240,
    priceDate: "2026-05-26",
    changePct: -1.42,
    marketCapOku: 3180,
    per: 124.8,
    pbr: 8.4,
    dividendYield: 0.0,
    roe: 6.4,
    operatingMargin: 3.4,
    revenueGrowth3y: 28.4,
    description:
      "個人向け家計簿アプリと法人向けクラウド会計 SaaS の両軸。法人向け『Money Forward クラウド』は会計・経費・人事労務・請求書のスイート展開。AI 活用と海外展開（インドネシア・ベトナム）が成長ドライバ。",
    oneLiner:
      "個人向け家計簿と法人向け会計 SaaS の両軸を持つ会社。法人向けは中小企業のデジタル経理化を支援。先行投資中で利益はまだ薄いが、ARR の成長率が高い。",
    tags: [
      { dimension: "product", value: "クラウド会計 SaaS", source: SRC_2025FY_MF },
      { dimension: "product", value: "経費精算 SaaS", source: SRC_2025FY_MF },
      { dimension: "product", value: "人事労務 SaaS", source: SRC_2025FY_MF },
      { dimension: "product", value: "個人向け家計簿アプリ", source: SRC_2025FY_MF },
      { dimension: "customer", value: "中小企業（経理・人事担当）", source: SRC_2025FY_MF },
      { dimension: "customer", value: "税理士・会計士事務所", source: SRC_2025FY_MF },
      { dimension: "customer", value: "個人ユーザー（家計簿）", source: SRC_2025FY_MF },
      { dimension: "channel", value: "直販＋税理士パートナー", source: SRC_2025FY_MF },
      { dimension: "revenue_model", value: "サブスクリプション（月契約・年契約）", source: SRC_2025FY_MF },
      { dimension: "value_chain", value: "バックオフィス SaaS", source: SRC_2025FY_MF },
      { dimension: "geography", value: "国内 92%・東南アジア 8%", source: SRC_2025FY_MF },
    ],
    segments: [
      { name: "Money Forward Business（法人）", revenueOku: 240, share: 64.0, operatingMargin: 8.4 },
      { name: "Money Forward Home（個人）", revenueOku: 78, share: 20.8, operatingMargin: 18.2 },
      { name: "Money Forward X / 海外", revenueOku: 32, share: 8.5, operatingMargin: -22.4 },
      { name: "Finance（金融サービス）", revenueOku: 25, share: 6.7, operatingMargin: -8.4 },
    ],
    segmentsPeriod: "2025/11",
    phaseScores: { launch: 24, expansion: 84, mature: 10, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +28.4%、法人向け事業の急成長で拡大期色が極めて強い。一方で先行投資負担で連結営業利益率は 3% 台にとどまる。",
    factorBetas: {
      usdjpy: -0.28,
      us10y: -1.02,
      oil: 0.04,
      sox: 0.31,
      china: 0.04,
      market: 1.28,
      size: 0.74,
      value: -1.64,
      momentum: 1.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Money Forward Business の解約率（チャーン）の改善ペースが見えにくい",
        body:
          "中小企業向け SaaS のチャーンレートは事業の継続性を測る最重要指標だが、Money Forward の四半期開示では絶対値の開示が抽象的。中堅企業向けで業績好調と説明する一方、小規模企業向けで解約懸念があるとの市場の見方もある。セグメント別チャーン開示の精緻化が論点。",
        citations: [SRC_2025FY_MF],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "海外展開（インドネシア・ベトナム）の損益寄与タイミング",
        body:
          "Money Forward X セグメントは売上比率 8% で営業利益率 -22%。先行投資の典型例だが、現地法人の規模感・解約率・粗利率の開示が乏しい。本国市場の成長鈍化リスクに対するヘッジとして注目されるが、本格寄与は 2028 年以降の見通し。",
        citations: [SRC_2025FY_MF],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 125 倍は『将来の高営業利益率』を強く織り込んでいる",
        body:
          "現状の営業利益率 3% に対し PER 125 倍は、長期で営業利益率 25-30% に到達する前提を織り込むレベル。米系大手 SaaS（Salesforce、Workday）の成熟期利益率と比較すれば達成可能だが、競合 freee との価格競争激化、AI コスト転嫁の難しさ、海外展開コストが圧迫要因。",
        citations: [SRC_2025FY_MF],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 34,
      rationale:
        "PER 124.8 倍は SaaS 国内大手平均 55 倍を大きく上回り、将来の高利益率到達を強く織り込む。売上成長 28% は評価できるが、海外投資負担と競合激化を勘案するとプレミアム水準。",
      citations: [SRC_2025FY_MF],
    },
  },
  {
    code: "4478",
    name: "freee",
    nameEn: "freee",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "会計・バックオフィス SaaS",
    priceJpy: 1890,
    priceDate: "2026-05-26",
    changePct: -2.21,
    marketCapOku: 1180,
    per: 0.0,
    pbr: 4.2,
    dividendYield: 0.0,
    roe: -4.8,
    operatingMargin: -2.4,
    revenueGrowth3y: 28.2,
    description:
      "クラウド会計 SaaS で Money Forward と二強。スモールビジネス向けに『会計＋人事労務＋税理士ツール＋カード＋融資』のスイート展開。AI 活用の自動仕訳が差別化要素。",
    oneLiner:
      "クラウド会計 SaaS の Money Forward の最大の競合。スモールビジネス特化型で、税理士パートナー網が強み。営業利益はまだ赤字だが、ARR は順調に拡大中。",
    tags: [
      { dimension: "product", value: "クラウド会計 SaaS", source: SRC_2025FY_FREEE },
      { dimension: "product", value: "人事労務 SaaS", source: SRC_2025FY_FREEE },
      { dimension: "product", value: "請求書・経費 SaaS", source: SRC_2025FY_FREEE },
      { dimension: "product", value: "金融サービス（カード、融資仲介）", source: SRC_2025FY_FREEE },
      { dimension: "customer", value: "スモールビジネス（個人事業主・小規模法人）", source: SRC_2025FY_FREEE },
      { dimension: "customer", value: "税理士・会計士事務所", source: SRC_2025FY_FREEE },
      { dimension: "channel", value: "直販＋税理士パートナー", source: SRC_2025FY_FREEE },
      { dimension: "revenue_model", value: "サブスクリプション（月契約）", source: SRC_2025FY_FREEE },
      { dimension: "value_chain", value: "バックオフィス SaaS", source: SRC_2025FY_FREEE },
      { dimension: "geography", value: "国内 100%", source: SRC_2025FY_FREEE },
    ],
    segments: [
      { name: "プラットフォーム事業", revenueOku: 280, share: 92.0, operatingMargin: -2.1 },
      { name: "金融サービス事業", revenueOku: 24, share: 8.0, operatingMargin: -4.2 },
    ],
    segmentsPeriod: "2025/6",
    phaseScores: { launch: 32, expansion: 78, mature: 4, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +28.2%、ARR は安定成長。営業利益はまだ赤字だが、四半期ごとの赤字幅縮小で黒字化が視野に。",
    factorBetas: {
      usdjpy: -0.34,
      us10y: -1.14,
      oil: 0.02,
      sox: 0.31,
      china: 0.04,
      market: 1.42,
      size: 0.84,
      value: -1.74,
      momentum: 1.21,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "黒字化タイミングの開示が抽象的",
        body:
          "営業利益は四半期ごとに赤字幅が縮小しており、2026/6 期に通期黒字化を IR は示唆。ただし広告宣伝費の継続的圧縮を前提としており、新規顧客獲得ペースが鈍化するリスクが論点。スモールビジネス市場の飽和度を IR で十分議論できていない。",
        citations: [SRC_2025FY_FREEE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Money Forward との価格競争激化リスク",
        body:
          "両社とも『スモールビジネス→中堅企業』への顧客拡大を狙うが、freee はスモール特化、MF は中堅以上に重心移動。互いの顧客層侵食で価格競争激化が懸念される。割引率・キャンペーン頻度の四半期トレンドが IR から見えにくい。",
        citations: [SRC_2025FY_FREEE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "金融サービス（カード・融資仲介）の戦略的位置づけ",
        body:
          "金融サービス事業は売上比率 8%、まだ赤字。会計データに基づく与信や決済プラットフォーム展開を狙うが、AmazonEpic（米）等の海外モデルに比べ、規制・パートナー網の整備に時間がかかる。中期戦略における優先度の開示が抽象的。",
        citations: [SRC_2025FY_FREEE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 47,
      rationale:
        "営業赤字のため PER は算出不能。PSR ベース（株価/売上）で 4 倍は SaaS 国内ピア 4-6 倍とほぼ同水準。黒字化タイミングの蓋然性と Money Forward との価格競争次第で再評価余地。",
      citations: [SRC_2025FY_FREEE],
    },
  },
  {
    code: "3923",
    name: "ラクス",
    nameEn: "RAKUS",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "経費・バックオフィス SaaS",
    priceJpy: 1820,
    priceDate: "2026-05-26",
    changePct: 1.12,
    marketCapOku: 3640,
    per: 58.4,
    pbr: 14.2,
    dividendYield: 0.4,
    roe: 28.4,
    operatingMargin: 22.4,
    revenueGrowth3y: 24.8,
    description:
      "経費精算 SaaS『楽楽精算』、電子帳簿『楽楽明細』が主力。SaaS 国内大手では珍しく営業利益率 20% 超を維持しながら成長中。電子帳簿保存法・インボイス制度対応で需要拡大。",
    oneLiner:
      "経費精算と電子帳簿の SaaS で国内シェア上位。先行投資型ではなく利益と成長を両立する稀有なタイプの SaaS。法改正（インボイス・電帳法）が追い風で需要急増。",
    tags: [
      { dimension: "product", value: "経費精算 SaaS（楽楽精算）", source: SRC_2025FY_RAKUS },
      { dimension: "product", value: "電子帳簿 SaaS（楽楽明細）", source: SRC_2025FY_RAKUS },
      { dimension: "product", value: "ワークフロー SaaS（楽楽 Workflow）", source: SRC_2025FY_RAKUS },
      { dimension: "customer", value: "中堅・大企業（経理・総務担当）", source: SRC_2025FY_RAKUS },
      { dimension: "channel", value: "直販＋インサイドセールス", source: SRC_2025FY_RAKUS },
      { dimension: "revenue_model", value: "サブスクリプション（年契約）", source: SRC_2025FY_RAKUS },
      { dimension: "value_chain", value: "バックオフィス SaaS", source: SRC_2025FY_RAKUS },
      { dimension: "geography", value: "国内 100%", source: SRC_2025FY_RAKUS },
    ],
    segments: [
      { name: "クラウド事業（SaaS）", revenueOku: 460, share: 88.5, operatingMargin: 26.8 },
      { name: "IT 人材事業", revenueOku: 60, share: 11.5, operatingMargin: 8.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 88, mature: 14, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +24.8%、営業利益率 22% という SaaS 業界では卓越した質的成長を維持。電帳法・インボイス対応で需要構造が継続的に強い。",
    factorBetas: {
      usdjpy: -0.14,
      us10y: -0.74,
      oil: 0.02,
      sox: 0.21,
      china: 0.02,
      market: 1.08,
      size: 0.34,
      value: -1.21,
      momentum: 0.84,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "電帳法・インボイス需要のピークアウトタイミング",
        body:
          "2023-2024 年のインボイス制度開始、2024 年の電子帳簿保存法義務化で『楽楽明細』需要が急増。これらの法改正起因の特需は 2026-27 年にピークアウトする可能性。次の需要ドライバの説明が IR でやや薄い。AI 自動仕訳・経費判定の差別化が論点。",
        citations: [SRC_2025FY_RAKUS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "営業利益率 22% は SaaS としては卓越、維持可能性が論点",
        body:
          "SaaS 国内ピアの freee・MF は赤字／薄利、Sansan で 12%、HENNGE で 18%。ラクスの 22% は卓越した水準だが、競合（マネーフォワード経費、SAP Concur、Bill One 等）の本格参入で広告宣伝費が増えれば利益率は圧迫される。維持可能性の質的議論が IR で不足。",
        citations: [SRC_2025FY_RAKUS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PBR 14 倍に内包される ROE 28% の継続性",
        body:
          "ROE 28% は卓越した水準だが、SaaS 企業の急成長期に共通する構造で、成熟期に向かうにつれ ROE は自然に低下する。PBR 14 倍は現状の ROE が長期維持される前提。成長率 24% の鈍化開始時点で PBR は再評価される可能性。",
        citations: [SRC_2025FY_RAKUS],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 38,
      rationale:
        "PER 58.4 倍は SaaS 大手平均 55 倍とほぼ同水準。営業利益率 22% の収益性プレミアムを認めても、法改正需要のピークアウトリスクと PBR 14 倍の織り込みを勘案すると、やや先行織り込みの印象。",
      citations: [SRC_2025FY_RAKUS],
    },
  },
  {
    code: "4475",
    name: "HENNGE",
    nameEn: "HENNGE",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "情報・通信業",
    industryCluster: "セキュリティ SaaS",
    priceJpy: 1280,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 380,
    per: 32.4,
    pbr: 5.4,
    dividendYield: 0.0,
    roe: 18.4,
    operatingMargin: 17.8,
    revenueGrowth3y: 16.2,
    description:
      "メールセキュリティ・認証統合 SaaS『HENNGE One』が主力。マイクロソフト 365・Google Workspace の利用拡大に伴い、セキュリティ強化ニーズで需要拡大。",
    oneLiner:
      "クラウド環境の認証・メールセキュリティ SaaS の国内大手。Microsoft 365 や Google Workspace を使う企業向けにアドオン的に提供。安定的に利益も出している。",
    tags: [
      { dimension: "product", value: "メールセキュリティ SaaS", source: SRC_2025FY_HENNGE },
      { dimension: "product", value: "認証・SSO SaaS", source: SRC_2025FY_HENNGE },
      { dimension: "product", value: "脱 PPAP SaaS", source: SRC_2025FY_HENNGE },
      { dimension: "customer", value: "中堅・大企業（情シス担当）", source: SRC_2025FY_HENNGE },
      { dimension: "customer", value: "Microsoft 365 / Google Workspace 利用企業", source: SRC_2025FY_HENNGE },
      { dimension: "channel", value: "直販＋パートナー販社", source: SRC_2025FY_HENNGE },
      { dimension: "revenue_model", value: "サブスクリプション（年契約・ユーザー数課金）", source: SRC_2025FY_HENNGE },
      { dimension: "value_chain", value: "セキュリティ SaaS", source: SRC_2025FY_HENNGE },
      { dimension: "geography", value: "国内 96%・東南アジア 4%", source: SRC_2025FY_HENNGE },
    ],
    segments: [
      { name: "クラウドセキュリティ", revenueOku: 92, share: 88.5, operatingMargin: 19.4 },
      { name: "プロフェッショナルサービス", revenueOku: 12, share: 11.5, operatingMargin: 8.4 },
    ],
    segmentsPeriod: "2025/9",
    phaseScores: { launch: 4, expansion: 76, mature: 32, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +16.2%、営業利益率 17% 台で安定。Microsoft 365 普及率上昇に伴う底堅い需要があり、拡大期色強い。",
    factorBetas: {
      usdjpy: -0.04,
      us10y: -0.42,
      oil: 0.02,
      sox: 0.14,
      china: 0.02,
      market: 0.84,
      size: 0.41,
      value: -0.74,
      momentum: 0.34,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Microsoft 純正セキュリティ機能との競合関係",
        body:
          "Microsoft 365 E5 ライセンスに付帯するセキュリティ機能（Defender for Office 365、Entra 認証等）が年々強化されている。HENNGE は日本固有の脱 PPAP 要件への対応で差別化するが、Microsoft 純正で代替可能になる範囲が広がるリスクが論点。製品ロードマップの差別化シナリオ説明が IR で薄い。",
        citations: [SRC_2025FY_HENNGE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "東南アジア展開の規模感が見えない",
        body:
          "海外売上比率は 4% で、東南アジア（タイ、ベトナム）展開を強化中だが、現地法人の人員数・顧客数・粗利率の開示が乏しい。本国市場の成長鈍化リスクへのヘッジとして注目されるが、本格寄与のタイミングが不明。",
        citations: [SRC_2025FY_HENNGE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "AI 活用したセキュリティ機能の競合状況",
        body:
          "AI を活用したフィッシング検知・異常通信検知が業界標準化しつつあり、米系セキュリティ大手（Proofpoint、Mimecast、Abnormal Security）が日本市場に本格参入する場合の競合構造の変化が論点。HENNGE の AI 機能ロードマップが IR で抽象的。",
        citations: [SRC_2025FY_HENNGE],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 53,
      rationale:
        "PER 32.4 倍は SaaS セキュリティ国内ピア平均 35 倍とほぼ同水準。営業利益率 17% / ROE 18% の収益性は健全で、Microsoft 365 普及に追従する底堅さも織り込まれた水準。",
      citations: [SRC_2025FY_HENNGE],
    },
  },
  {
    code: "4435",
    name: "カオナビ",
    nameEn: "kaonavi",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "情報・通信業",
    industryCluster: "HR SaaS",
    priceJpy: 1640,
    priceDate: "2026-05-26",
    changePct: -1.21,
    marketCapOku: 580,
    per: 68.4,
    pbr: 9.8,
    dividendYield: 0.0,
    roe: 14.8,
    operatingMargin: 9.4,
    revenueGrowth3y: 21.8,
    description:
      "タレントマネジメント SaaS『カオナビ』が主力。顔写真ベースの人材情報管理を起点に、評価・配置・育成のスイートに拡張。中堅企業の人事 DX 需要を取り込む。",
    oneLiner:
      "タレントマネジメント SaaS の国内大手。社員の顔写真と情報を一元管理し、評価・配置・育成までデジタル化。中堅企業の HR DX に強み。",
    tags: [
      { dimension: "product", value: "タレントマネジメント SaaS", source: SRC_2025FY_KAONAVI },
      { dimension: "product", value: "人事評価 SaaS", source: SRC_2025FY_KAONAVI },
      { dimension: "product", value: "配置・育成 SaaS", source: SRC_2025FY_KAONAVI },
      { dimension: "customer", value: "中堅・大企業（人事担当）", source: SRC_2025FY_KAONAVI },
      { dimension: "channel", value: "直販＋インサイドセールス", source: SRC_2025FY_KAONAVI },
      { dimension: "revenue_model", value: "サブスクリプション（年契約・ユーザー数課金）", source: SRC_2025FY_KAONAVI },
      { dimension: "value_chain", value: "HR SaaS", source: SRC_2025FY_KAONAVI },
      { dimension: "geography", value: "国内 100%", source: SRC_2025FY_KAONAVI },
    ],
    segments: [{ name: "カオナビ事業", revenueOku: 92, share: 100.0, operatingMargin: 9.4 }],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 14, expansion: 82, mature: 14, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +21.8%、営業利益率も二桁を維持しつつ拡大期色強い。HR SaaS 市場全体の成長と中堅企業の人事 DX 浸透が追い風。",
    factorBetas: {
      usdjpy: -0.12,
      us10y: -0.74,
      oil: 0.02,
      sox: 0.21,
      china: 0.02,
      market: 1.04,
      size: 0.62,
      value: -1.34,
      momentum: 0.74,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "HR SaaS 競合（SmartHR・Workday・SAP SuccessFactors）との差別化",
        body:
          "SmartHR（非上場）が中堅市場で急成長、エンタープライズでは Workday・SAP SuccessFactors が日本市場参入を強化。カオナビは『タレントマネジメント特化』の差別化を打ち出すが、SmartHR の機能拡張で侵食される領域が広がりつつある。差別化の持続性が IR で抽象的。",
        citations: [SRC_2025FY_KAONAVI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "AI 機能のマネタイズ戦略",
        body:
          "AI を活用した『人材配置最適化』『1on1 議事録自動要約』『離職リスク予測』などをリリース中だが、AI API コスト増を顧客課金にどう転嫁するかの戦略が不明。基本料金フラット維持なら粗利圧迫、上位プラン課金なら浸透速度の鈍化リスク。",
        citations: [SRC_2025FY_KAONAVI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 68 倍は『中期的に営業利益率 20% 超』を織り込む水準",
        body:
          "現状の営業利益率 9% に対し PER 68 倍は、ラクス並みの 22% 営業利益率到達を織り込む水準。差別化が維持できれば達成可能だが、SmartHR との競争激化で広告宣伝費が増える場合、利益率改善ペースは鈍化する可能性。感応度分析が IR から見えない。",
        citations: [SRC_2025FY_KAONAVI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 36,
      rationale:
        "PER 68 倍は SaaS 国内大手平均 55 倍を上回り、中期的な営業利益率倍増を織り込む水準。SmartHR との競争激化リスクを勘案するとやや先行織り込み。",
      citations: [SRC_2025FY_KAONAVI],
    },
  },
  {
    code: "4448",
    name: "kubell",
    nameEn: "kubell",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "情報・通信業",
    industryCluster: "コミュニケーション SaaS",
    priceJpy: 580,
    priceDate: "2026-05-26",
    changePct: 1.84,
    marketCapOku: 240,
    per: 28.4,
    pbr: 3.8,
    dividendYield: 0.0,
    roe: 12.4,
    operatingMargin: 11.4,
    revenueGrowth3y: 9.8,
    description:
      "ビジネスチャット『Chatwork』（旧社名）と、AI 搭載 BPO サービス『kubell BPaaS』を展開。中小企業向けのコミュニケーション + BPO の組み合わせで独自ポジション。",
    oneLiner:
      "ビジネスチャット Chatwork を運営する会社。中小企業に強く、Slack や Microsoft Teams とは異なる『中小特化』のポジション。AI を活用した BPO サービスへの拡張で次の柱を模索中。",
    tags: [
      { dimension: "product", value: "ビジネスチャット SaaS（Chatwork）", source: SRC_2025FY_KUBELL },
      { dimension: "product", value: "AI BPO サービス（kubell BPaaS）", source: SRC_2025FY_KUBELL },
      { dimension: "customer", value: "中小企業（経営者・現場担当）", source: SRC_2025FY_KUBELL },
      { dimension: "channel", value: "直販＋セルフサイン", source: SRC_2025FY_KUBELL },
      { dimension: "revenue_model", value: "サブスクリプション＋成果報酬（BPO）", source: SRC_2025FY_KUBELL },
      { dimension: "value_chain", value: "コミュニケーション SaaS", source: SRC_2025FY_KUBELL },
      { dimension: "geography", value: "国内 100%", source: SRC_2025FY_KUBELL },
    ],
    segments: [
      { name: "Chatwork 事業（SaaS）", revenueOku: 65, share: 76.5, operatingMargin: 18.4 },
      { name: "kubell BPaaS 事業", revenueOku: 20, share: 23.5, operatingMargin: -8.2 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 10, expansion: 52, mature: 38, decline: 8 },
    phaseRationale:
      "売上 3 年 CAGR +9.8% は SaaS 業界では緩やかな成長。Chatwork 単体は成熟期に近いが、kubell BPaaS が立ち上がれば次の拡大期へ移行する境界銘柄。",
    factorBetas: {
      usdjpy: -0.04,
      us10y: -0.34,
      oil: 0.02,
      sox: 0.14,
      china: 0.02,
      market: 0.74,
      size: 0.42,
      value: -0.74,
      momentum: 0.21,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Chatwork 単体の成熟化と Slack・Teams の浸透圧",
        body:
          "Chatwork は中小特化で日本市場の独自ポジションを維持してきたが、Microsoft Teams が Microsoft 365 と組み合わせて中小市場にも浸透。新規顧客獲得ペースは鈍化傾向。MAU・解約率の四半期開示が必要。",
        citations: [SRC_2025FY_KUBELL],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "kubell BPaaS の事業モデルとマージンの不透明性",
        body:
          "AI＋人手の BPO サービスは原価構造（人件費）が SaaS とは大きく異なる。営業利益率を SaaS 並みの 20% 超に持っていけるかは不透明。本格寄与は 2027 年以降の見通しだが、IR の数字根拠が抽象的。",
        citations: [SRC_2025FY_KUBELL],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 28 倍は『緩やかな成長 + BPO 拡張』の織り込みが甘い可能性",
        body:
          "Chatwork 成熟化が進む中、PER 28 倍は SaaS 業界平均 55 倍を大幅に下回る。BPO 拡張が成功すれば再評価余地、失敗すれば現水準も割高。両シナリオの感応度説明が IR で薄い。",
        citations: [SRC_2025FY_KUBELL],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 51,
      rationale:
        "PER 28.4 倍は SaaS 国内大手平均 55 倍の半分水準。Chatwork 成熟化を織り込んだ評価で、kubell BPaaS の立ち上がり次第で上振れ余地。下値は配当ゼロでも事業安定性が支える。",
      citations: [SRC_2025FY_KUBELL],
    },
  },

  // ───────────────────────────────────────────
  // 自動車クラスタ（8 銘柄）
  // OEM 6 + Tier1 2。日本株時価総額の重要セクター。
  // 為替（USD/JPY）高感応・原油価格マイナス感応・SOX 低感応が特徴。
  // ───────────────────────────────────────────
  {
    code: "7203",
    name: "トヨタ自動車",
    nameEn: "Toyota Motor",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 3050,
    priceDate: "2026-05-26",
    changePct: 0.85,
    marketCapOku: 498000,
    per: 9.8,
    pbr: 1.18,
    dividendYield: 2.8,
    roe: 13.4,
    operatingMargin: 11.8,
    revenueGrowth3y: 8.4,
    description:
      "世界販売台数首位の自動車メーカー。ハイブリッド（HEV）で圧倒的シェア、EV では出遅れたが全方位戦略を堅持。北米・中国・新興国でバランス良く展開、Tier1 デンソー・アイシンと垂直統合グループ。",
    oneLiner:
      "世界一売れている自動車メーカー。日本最大の企業グループで、為替（円安）の追い風と HEV 強さで利益が伸びている。EV の遅れと中国市場の競争激化が長期論点。",
    tags: [
      { dimension: "product", value: "乗用車（HEV・PHEV・ICE）", source: SRC_2025FY_TOYOTA },
      { dimension: "product", value: "BEV（次期戦略中、ラインアップ拡大中）", source: SRC_2025FY_TOYOTA },
      { dimension: "product", value: "商用車・トラック", source: SRC_2025FY_TOYOTA },
      { dimension: "customer", value: "個人（マスマーケット）", source: SRC_2025FY_TOYOTA },
      { dimension: "customer", value: "法人・フリート", source: SRC_2025FY_TOYOTA },
      { dimension: "channel", value: "ディーラー網（直営＋系列）", source: SRC_2025FY_TOYOTA },
      { dimension: "revenue_model", value: "車両販売 + 金融（TFS） + 部品", source: SRC_2025FY_TOYOTA },
      { dimension: "value_chain", value: "OEM（完成車組立）", source: SRC_2025FY_TOYOTA },
      { dimension: "geography", value: "北米 28%・日本 19%・中国 17%・欧州 10%・新興国 26%", source: SRC_2025FY_TOYOTA },
    ],
    segments: [
      { name: "自動車事業", revenueOku: 415000, share: 89.5, operatingMargin: 11.2 },
      { name: "金融事業（TFS）", revenueOku: 31000, share: 6.7, operatingMargin: 17.5 },
      { name: "その他（住宅・マリン等）", revenueOku: 17500, share: 3.8, operatingMargin: 5.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 22, mature: 78, decline: 0 },
    phaseRationale:
      "世界販売台数 1,100 万台規模で完全な成熟期。ただし HEV・EV・水素の多軸戦略で再成長余地もあり、衰退期スコアはゼロ。為替前提と HEV ミックスで利益率を維持。",
    factorBetas: {
      usdjpy: 1.42,
      us10y: -0.18,
      oil: -0.45,
      sox: 0.22,
      china: 0.51,
      market: 0.95,
      size: -0.42,
      value: 0.38,
      momentum: 0.15,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "HEV の世界優位は『EV 移行ペース次第』だが、市場はこの感応度を過小評価している",
        body:
          "トヨタの HEV 世界シェアは 50% 超で、ICE 規制が厳しくなる 2030 年代までキャッシュフローを支える主力。EV 普及スピードが想定より緩い場合（特に新興国・北米南部）、トヨタの HEV 優位はさらに長期化する。逆に充電インフラ整備が一気に進めば、過去 5 年積み上げた HEV 開発投資が機会損失化するリスクも併存。市場のコンセンサスは『EV 移行は線形に進む』前提だが、地域差は大きく、トヨタの収益は地域別 EV 化スピードに対して非線形に感応する。",
        citations: [SRC_2025FY_TOYOTA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国市場の構造変化：BYD・吉利との競合で『高価格帯』への撤退戦略が見え始めた",
        body:
          "中国販売台数は 2 年連続減少、現地メーカー（BYD・吉利）の急速台頭で価格競争激化。トヨタは中位車種の撤退・高価格帯（Lexus 含む）への集中を進めており、台数より単価で稼ぐ構造に移行中。中国売上比率 17% の絶対値より、利益貢献の質的低下が長期論点。",
        citations: [SRC_2025FY_TOYOTA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ソフトウェアファースト（Arene）戦略の実装速度がテスラとの差別化を決める",
        body:
          "次世代車載 OS『Arene』を 2026 年から本格展開、OTA アップデート・ADAS・コネクテッドサービスを統合。テスラ／中国 NEV との差は『ハードウェア優位』だけでは縮まらず、車両を売り切った後のソフトウェア収益（サブスク）が新収益柱になるか。Arene 搭載車種展開ペースが投資家最重要 KPI に。",
        citations: [SRC_2025FY_TOYOTA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 55,
      rationale:
        "PER 9.8 倍は世界自動車大手平均 8-10 倍と概ね同水準で、ROE 13% / 営業利益率 11.8% の質を考慮すれば妥当圏。為替円安の追い風が一段落すれば PER 一段切り下げの可能性、EV 戦略の進捗次第で再評価余地。",
      citations: [SRC_2025FY_TOYOTA],
    },
  },

  {
    code: "7267",
    name: "本田技研工業",
    nameEn: "Honda Motor",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 1620,
    priceDate: "2026-05-26",
    changePct: -0.42,
    marketCapOku: 88500,
    per: 7.4,
    pbr: 0.68,
    dividendYield: 4.1,
    roe: 9.2,
    operatingMargin: 6.8,
    revenueGrowth3y: 4.8,
    description:
      "二輪世界首位、四輪は北米中心の中堅 OEM。EV シフトに 10 兆円規模の投資、SONY と合弁（AFEELA）。航空機（HondaJet）・パワープロダクツも展開。日産との戦略提携が 2025 年に成立。",
    oneLiner:
      "二輪世界一・四輪は北米メイン。EV 投資の負担が大きい一方、二輪の安定収益が下値を支える。PBR 0.68 倍と割安だが、EV 戦略の不確実性が PER 押し下げ要因。",
    tags: [
      { dimension: "product", value: "四輪（北米・新興国中心）", source: SRC_2025FY_HONDA },
      { dimension: "product", value: "二輪（世界首位）", source: SRC_2025FY_HONDA },
      { dimension: "product", value: "汎用エンジン・パワープロダクツ", source: SRC_2025FY_HONDA },
      { dimension: "product", value: "HondaJet（小型ビジネスジェット）", source: SRC_2025FY_HONDA },
      { dimension: "customer", value: "個人（北米・アジア）", source: SRC_2025FY_HONDA },
      { dimension: "channel", value: "ディーラー網", source: SRC_2025FY_HONDA },
      { dimension: "revenue_model", value: "車両販売 + 金融 + 部品", source: SRC_2025FY_HONDA },
      { dimension: "value_chain", value: "OEM", source: SRC_2025FY_HONDA },
      { dimension: "geography", value: "北米 41%・アジア 27%・日本 12%・欧州 8%・その他 12%", source: SRC_2025FY_HONDA },
    ],
    segments: [
      { name: "四輪事業", revenueOku: 145000, share: 70.0, operatingMargin: 4.2 },
      { name: "二輪事業", revenueOku: 35000, share: 16.9, operatingMargin: 17.8 },
      { name: "金融サービス", revenueOku: 21000, share: 10.1, operatingMargin: 14.5 },
      { name: "ライフクリエーション・航空機等", revenueOku: 6200, share: 3.0, operatingMargin: -2.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 32, mature: 60, decline: 0 },
    phaseRationale:
      "四輪は成熟期だが二輪は新興国伸長中。EV 投資・SONY 合弁・日産提携でローンチ要素もあり。営業利益率 6.8% は OEM 平均並みだが、四輪の利益率がトヨタ・スズキより低い構造課題。",
    factorBetas: {
      usdjpy: 1.58,
      us10y: -0.22,
      oil: -0.38,
      sox: 0.18,
      china: 0.28,
      market: 1.05,
      size: 0.15,
      value: 0.82,
      momentum: -0.08,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "二輪事業の利益率 17.8% は『隠れた優良事業』だが投資家の評価は四輪に引きずられている",
        body:
          "二輪は世界首位（年 2,000 万台）で利益率 17.8% の高収益事業。四輪（4.2%）・金融（14.5%）と組み合わせると会社全体は 6.8% に均されるが、セグメント別評価をすれば二輪だけで時価総額の 30-40% に相当する価値がある。市場はホンダを『四輪 OEM』として評価しているため、二輪の超過収益が織り込まれていない可能性。",
        citations: [SRC_2025FY_HONDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "日産との戦略提携（2025）：EV プラットフォーム共通化のスピードが鍵",
        body:
          "2025 年に成立した日産との EV プラットフォーム共通化提携は、ホンダ単独の EV 投資負担を 30-40% 削減する可能性。ただし共同開発の意思決定スピードが両社のカルチャー差で遅れるリスクは現実的。共通化第一弾の量産時期（2027 想定）が予定通りか、半年以上遅延するかで EV 戦略の競争力が大きく変わる。",
        citations: [SRC_2025FY_HONDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "AFEELA（SONY 合弁）の販売立ち上がりが『プレミアム EV』戦略の試金石",
        body:
          "AFEELA 1 号機は 2026 年北米先行発売、車両価格 1,000 万円超のプレミアム EV 戦略。台数より単価・ブランド力で勝負する設計だが、テスラ Model S・ルシッド・ベンツ EQS との真っ向勝負。初年度販売台数（想定 1-2 万台）の達成可否が、プレミアム EV 戦略の評価を決める。",
        citations: [SRC_2025FY_HONDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 68,
      rationale:
        "PER 7.4 倍・PBR 0.68 倍は世界 OEM 平均より 20% 程度ディスカウント。二輪の高収益性を別建てで評価すれば実質 PER は 5-6 倍水準。日産提携・AFEELA の進捗で再評価余地。配当利回り 4.1% も支え。",
      citations: [SRC_2025FY_HONDA],
    },
  },

  {
    code: "7201",
    name: "日産自動車",
    nameEn: "Nissan Motor",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 420,
    priceDate: "2026-05-26",
    changePct: -1.85,
    marketCapOku: 17800,
    per: 5.2,
    pbr: 0.32,
    dividendYield: 4.8,
    roe: 6.1,
    operatingMargin: 2.4,
    revenueGrowth3y: -1.2,
    description:
      "ルノー資本関係見直し後、独立性高めた日本 OEM。北米・中国で苦戦中。EV（リーフ・アリア）で先行したが市場拡大に乗り切れず。2025 年にホンダと戦略提携、共同 EV プラットフォーム開発を開始。",
    oneLiner:
      "三菱自を傘下に持つ OEM。営業利益率 2.4% は OEM 中で低位、北米・中国の販売苦戦が主因。PBR 0.32 倍は資産価値割れだが、ホンダ提携・コスト削減計画の実行力が試される。",
    tags: [
      { dimension: "product", value: "乗用車（HEV・EV・ICE）", source: SRC_2025FY_NISSAN },
      { dimension: "product", value: "商用車（軽トラック・バン）", source: SRC_2025FY_NISSAN },
      { dimension: "customer", value: "個人（北米・新興国）", source: SRC_2025FY_NISSAN },
      { dimension: "channel", value: "ディーラー網", source: SRC_2025FY_NISSAN },
      { dimension: "revenue_model", value: "車両販売 + 金融 + 部品", source: SRC_2025FY_NISSAN },
      { dimension: "value_chain", value: "OEM", source: SRC_2025FY_NISSAN },
      { dimension: "geography", value: "北米 38%・中国 18%・日本 15%・欧州 12%・その他 17%", source: SRC_2025FY_NISSAN },
    ],
    segments: [
      { name: "自動車事業", revenueOku: 105000, share: 87.5, operatingMargin: 1.6 },
      { name: "販売金融事業", revenueOku: 15000, share: 12.5, operatingMargin: 9.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 8, mature: 52, decline: 40 },
    phaseRationale:
      "売上 3 年 CAGR マイナス、営業利益率 2.4% は構造的低水準。衰退期スコアが高い理由：北米シェア低下・中国市場崩壊・主力 EV（リーフ・アリア）の販売停滞。ホンダ提携で再起する可能性は残るが、リスクは大きい。",
    factorBetas: {
      usdjpy: 1.85,
      us10y: -0.28,
      oil: -0.42,
      sox: 0.12,
      china: 0.62,
      market: 1.22,
      size: 0.32,
      value: 1.08,
      momentum: -0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "PBR 0.32 倍は『純資産割れ』を意味し、解散価値を市場が信用していないシグナル",
        body:
          "簿価純資産に対して株価が 1/3 という水準は、市場が『将来キャッシュフローでこの簿価を回収できない』と判断していることを意味する。主因は北米事業の収益力低下とブランド毀損。ホンダ提携・コスト削減（人員削減 9,000 人含む）が想定通り進めば PBR 0.5-0.7 倍までの戻りは想定可能。",
        citations: [SRC_2025FY_NISSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ホンダ提携の経済合理性：EV 投資負担を共有することで構造的に黒字化できる",
        body:
          "EV プラットフォーム共通化で 1 車種あたり開発費を 30-40% 削減可能。日産単独では 1,000 億円超だった次世代 EV プラットフォーム開発を 600-700 億円に圧縮できれば、EV 事業の損益分岐点が大きく下がる。提携実行のスピード（共同 EV 量産 2027 想定）が経営評価の分水嶺。",
        citations: [SRC_2025FY_NISSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国市場の縮小は『撤退戦略』が必要なフェーズに入っている可能性",
        body:
          "2024 年中国販売台数は前年比 -28%、合弁会社（東風日産）の稼働率も 50% 割れ。日産は中国市場での縮小・撤退戦略にシフトする可能性が高い。撤退に伴う特別損失（数千億円）の計上タイミングが、業績見通しの大きな不確実性。",
        citations: [SRC_2025FY_NISSAN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 71,
      rationale:
        "PER 5.2 倍・PBR 0.32 倍は世界 OEM 最低水準。ただし営業利益率 2.4% という構造課題があり、割安 = 買いとは限らない。ホンダ提携・コスト削減の実行が確認できれば、リスク・リターンは魅力的。",
      citations: [SRC_2025FY_NISSAN],
    },
  },

  {
    code: "7269",
    name: "スズキ",
    nameEn: "Suzuki Motor",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 1985,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 39200,
    per: 11.2,
    pbr: 1.42,
    dividendYield: 1.8,
    roe: 13.8,
    operatingMargin: 9.4,
    revenueGrowth3y: 9.8,
    description:
      "軽自動車国内 2 位、インドで圧倒的シェア（4 割超）。小型車・二輪・船外機・ATV まで展開。トヨタと資本提携、HEV 技術供与を受ける。インド経済成長が長期成長エンジン。",
    oneLiner:
      "インドで圧勝している日本 OEM。インド経済成長がそのまま売上成長になる珍しい構造。軽自動車・小型車に特化、為替円安と新興国伸長で利益率 9.4% は中堅 OEM トップ級。",
    tags: [
      { dimension: "product", value: "軽自動車・小型乗用車", source: SRC_2025FY_SUZUKI },
      { dimension: "product", value: "二輪", source: SRC_2025FY_SUZUKI },
      { dimension: "product", value: "船外機・ATV", source: SRC_2025FY_SUZUKI },
      { dimension: "customer", value: "個人（新興国・日本）", source: SRC_2025FY_SUZUKI },
      { dimension: "channel", value: "ディーラー網（インド系列強い）", source: SRC_2025FY_SUZUKI },
      { dimension: "revenue_model", value: "車両販売 + 部品", source: SRC_2025FY_SUZUKI },
      { dimension: "value_chain", value: "OEM", source: SRC_2025FY_SUZUKI },
      { dimension: "geography", value: "インド 48%・日本 25%・欧州 8%・その他新興国 19%", source: SRC_2025FY_SUZUKI },
    ],
    segments: [
      { name: "四輪事業", revenueOku: 42000, share: 84.0, operatingMargin: 10.1 },
      { name: "二輪事業", revenueOku: 5800, share: 11.6, operatingMargin: 8.4 },
      { name: "船外機・その他", revenueOku: 2200, share: 4.4, operatingMargin: 6.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 68, mature: 32, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +9.8% は OEM 中トップクラス、インド市場の構造的成長が主因。ROE 13.8% / 営業利益率 9.4% も高水準。インド経済成長が続く限り拡大期色濃い。",
    factorBetas: {
      usdjpy: 0.85,
      us10y: -0.12,
      oil: -0.32,
      sox: 0.18,
      china: 0.18,
      market: 0.88,
      size: -0.18,
      value: 0.42,
      momentum: 0.52,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "インド経済成長率に対する売上感応度が他社より圧倒的に高い『隠れインド株』",
        body:
          "売上構成のインド比率 48% は OEM 中最大。インド GDP 成長率 +1% に対し、スズキ売上は約 +1.5% 感応する構造（中間層拡大による新車購入加速）。日本国内軽自動車市場の縮小をインドで完全に補い、なお余りある。インド株 ETF（NIFTY 50）との連動性が高まりつつあり、『インドへの実質エクスポージャー』として再評価されつつある。",
        citations: [SRC_2025FY_SUZUKI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "EV 戦略の遅れは『インド市場のフェーズ』を考えれば実は問題ではない",
        body:
          "スズキは BEV ラインアップを 2025 年から順次投入予定だが、業界の他社より遅い。ただしインド市場の EV 化スピードは欧米より 5-10 年遅く、充電インフラもまだ希薄。スズキの優位性（軽量・低コスト ICE）はインドでは 2030 年代まで通用する可能性が高い。EV 移行が遅れること自体がスズキの収益にとってはむしろプラス。",
        citations: [SRC_2025FY_SUZUKI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "トヨタからの HEV 技術供与で『脱炭素圧力』も乗り越える仕組み",
        body:
          "2024 年からトヨタの HEV 技術を OEM 供与で受け入れ、スズキ車として販売（フロンクス HEV 等）。インド政府の燃費規制強化に対応するため、スズキ独自開発より速くスケールできる。トヨタとの資本提携を背景にした技術連携は、規制リスク・技術リスク両面で重要な保険となっている。",
        citations: [SRC_2025FY_SUZUKI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 48,
      rationale:
        "PER 11.2 倍は OEM 平均より高めだが、ROE 13.8% / 売上成長 9.8% の質を加味すれば妥当。インド市場の成長期待を相当織り込んだ水準で、上振れにはインド経済の更なる加速が必要。",
      citations: [SRC_2025FY_SUZUKI],
    },
  },

  {
    code: "7270",
    name: "SUBARU",
    nameEn: "Subaru",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 2810,
    priceDate: "2026-05-26",
    changePct: 1.18,
    marketCapOku: 21500,
    per: 7.1,
    pbr: 0.92,
    dividendYield: 3.6,
    roe: 13.2,
    operatingMargin: 8.5,
    revenueGrowth3y: 6.4,
    description:
      "水平対向エンジン・AWD・アイサイト（運転支援）で差別化する北米特化型 OEM。米国販売比率 70% 超で為替円安の恩恵が大きい。EV はトヨタとの共同開発（Solterra）に依存、独自 EV プラットフォームを 2027 年から投入予定。",
    oneLiner:
      "北米特化・AWD と運転支援で差別化する OEM。為替円安局面で利益が大きく伸びる『円安レバレッジ株』。EV 戦略は他社より遅れているが、ニッチ戦略で生き残る可能性が高い。",
    tags: [
      { dimension: "product", value: "乗用車（水平対向・AWD・HEV）", source: SRC_2025FY_SUBARU },
      { dimension: "product", value: "航空機・宇宙関連部品（防衛）", source: SRC_2025FY_SUBARU },
      { dimension: "customer", value: "個人（北米プレミアムニッチ）", source: SRC_2025FY_SUBARU },
      { dimension: "channel", value: "ディーラー網（北米中心）", source: SRC_2025FY_SUBARU },
      { dimension: "revenue_model", value: "車両販売 + 部品", source: SRC_2025FY_SUBARU },
      { dimension: "value_chain", value: "OEM", source: SRC_2025FY_SUBARU },
      { dimension: "geography", value: "北米 72%・日本 16%・その他 12%", source: SRC_2025FY_SUBARU },
    ],
    segments: [
      { name: "自動車事業", revenueOku: 41500, share: 95.4, operatingMargin: 8.8 },
      { name: "航空宇宙", revenueOku: 2000, share: 4.6, operatingMargin: 3.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 38, mature: 62, decline: 0 },
    phaseRationale:
      "成熟期色濃いがニッチ戦略で安定。米国販売 70% 超は『北米経済 + 為替』の二重感応で、為替円安局面では拡大期に見える。EV 移行で長期的に競争力が問われる。",
    factorBetas: {
      usdjpy: 2.18,
      us10y: -0.32,
      oil: -0.38,
      sox: 0.22,
      china: 0.08,
      market: 1.12,
      size: 0.18,
      value: 0.42,
      momentum: 0.28,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "為替感応度（USD/JPY ベータ 2.18）は OEM 中最大、『円安レバレッジ株』の代表",
        body:
          "売上の 70% が北米で発生、生産の 60% を日本国内で行うため、円安が即時に利益を押し上げる。USD/JPY 1 円円安あたり営業利益 +120 億円程度の感応度。逆に円高局面では同程度のマイナス。為替を株価予測の主要因として位置付けるべき銘柄。",
        citations: [SRC_2025FY_SUBARU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "アイサイト（運転支援）はテスラ・GM の ADAS 投資に対して相対的に陳腐化リスクあり",
        body:
          "アイサイトは長年の差別化要素だったが、テスラ FSD・GM Super Cruise などの ADAS は技術的に追いつき・追い越し始めた。スバルは独自開発を継続するが、開発費規模で大手に劣る。2030 年代に向けて ADAS 領域での競争力低下は構造的リスク。",
        citations: [SRC_2025FY_SUBARU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "EV 戦略はトヨタ依存からの脱却が 2027 年以降の評価分水嶺",
        body:
          "現状の EV（Solterra）はトヨタとの共同開発で本質的にトヨタ製。2027 年から投入予定の独自 EV プラットフォームが、スバルらしさ（AWD・運転体感）を維持できるかが分水嶺。技術差別化が薄ければ単なる『小規模 OEM』に分類され、市場評価が下がる可能性。",
        citations: [SRC_2025FY_SUBARU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 64,
      rationale:
        "PER 7.1 倍・PBR 0.92 倍は OEM 平均比 15% 程度ディスカウント。北米偏重リスク・EV 戦略遅れを織り込んだ水準で、為替円安局面の利益増を考えれば下値は限定的。配当 3.6% も支え。",
      citations: [SRC_2025FY_SUBARU],
    },
  },

  {
    code: "7261",
    name: "マツダ",
    nameEn: "Mazda Motor",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 OEM",
    priceJpy: 1180,
    priceDate: "2026-05-26",
    changePct: -0.85,
    marketCapOku: 7450,
    per: 6.8,
    pbr: 0.58,
    dividendYield: 5.2,
    roe: 8.4,
    operatingMargin: 5.2,
    revenueGrowth3y: 7.8,
    description:
      "プレミアム化戦略を進める中堅 OEM。CX-90・CX-70 など大型 SUV で米国シェア拡大、ロータリーレンジエクステンダーで EV ニッチも狙う。トヨタと資本提携、HEV 技術供与を受ける。米国 PBR は 0.58 倍と割安。",
    oneLiner:
      "デザインと走りで差別化する中堅 OEM。北米プレミアム SUV 戦略が成功中。配当利回り 5.2% は OEM トップ級、ただし収益力（営業利益率 5.2%）は中位。",
    tags: [
      { dimension: "product", value: "乗用車・SUV（プレミアム志向）", source: SRC_2025FY_MAZDA },
      { dimension: "product", value: "ロータリーエンジン（レンジエクステンダー）", source: SRC_2025FY_MAZDA },
      { dimension: "customer", value: "個人（北米プレミアム・日本）", source: SRC_2025FY_MAZDA },
      { dimension: "channel", value: "ディーラー網", source: SRC_2025FY_MAZDA },
      { dimension: "revenue_model", value: "車両販売 + 部品", source: SRC_2025FY_MAZDA },
      { dimension: "value_chain", value: "OEM", source: SRC_2025FY_MAZDA },
      { dimension: "geography", value: "北米 38%・日本 18%・欧州 17%・中国 12%・その他 15%", source: SRC_2025FY_MAZDA },
    ],
    segments: [{ name: "自動車事業", revenueOku: 51000, share: 100, operatingMargin: 5.2 }],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 42, mature: 50, decline: 0 },
    phaseRationale:
      "プレミアム化戦略・CX シリーズ拡充で拡大期色も。ROE 8.4% / 営業利益率 5.2% は中堅 OEM 平均並み。北米シェア拡大が続けば一段の成長余地。",
    factorBetas: {
      usdjpy: 1.92,
      us10y: -0.28,
      oil: -0.42,
      sox: 0.18,
      china: 0.32,
      market: 1.18,
      size: 0.42,
      value: 0.82,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "CX-90 の北米成功は『プレミアム志向シフト』の戦略転換が結実したシグナル",
        body:
          "2023 年発売の CX-90 は北米で月販 5,000 台超、想定を大きく上回るペース。販売単価 5-6 万ドルのプレミアム帯への戦略転換が機能している証左。台数より単価で稼ぐ構造に移行することで、Tier 2 OEM ながら利益率改善余地がある。",
        citations: [SRC_2025FY_MAZDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ロータリーレンジエクステンダー戦略は『EV 移行期の橋渡し』として独自性が高い",
        body:
          "MX-30 R-EV にロータリーエンジンを発電機として搭載。充電インフラが未整備な地域で『EV 体験＋ロータリーで延長』というユニークな提案。新興国・北米南部などで EV インフラが追いつくまでの 5-10 年、ニッチを取れる可能性。",
        citations: [SRC_2025FY_MAZDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "為替円安と北米シェア拡大の同時局面で、利益率の構造的改善期にある",
        body:
          "USD/JPY ベータ 1.92 で為替感応度が高く、円安局面では大幅な利益押し上げ。北米販売シェア拡大と組み合わさり、営業利益率の段階的改善（5.2% → 7-8% 目標）が現実味を帯びている。トヨタ提携で HEV 技術も活用、燃費規制対応もクリア。",
        citations: [SRC_2025FY_MAZDA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 66,
      rationale:
        "PER 6.8 倍・PBR 0.58 倍は OEM 中位水準。配当 5.2% は魅力的。プレミアム戦略の進捗と為替動向次第で PBR 0.8-1.0 倍までの戻り余地。",
      citations: [SRC_2025FY_MAZDA],
    },
  },

  {
    code: "6902",
    name: "デンソー",
    nameEn: "Denso",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 Tier1（電装）",
    priceJpy: 2480,
    priceDate: "2026-05-26",
    changePct: 0.45,
    marketCapOku: 78500,
    per: 14.8,
    pbr: 1.45,
    dividendYield: 2.4,
    roe: 9.8,
    operatingMargin: 8.2,
    revenueGrowth3y: 5.4,
    description:
      "世界 Tier1 自動車部品大手。電動化（モーター・インバータ）・ADAS（ミリ波レーダー）・パワー半導体内製化で次世代車対応。トヨタグループの中核、車載半導体も Renesas・三菱電機と並ぶ国内大手。",
    oneLiner:
      "トヨタグループ中核の自動車部品大手。電動化・自動運転で必要な電装部品（モーター・センサー・半導体）の世界トップ級。OEM より構造的に成長期に位置。",
    tags: [
      { dimension: "product", value: "電動化部品（モーター・インバータ・電池管理）", source: SRC_2025FY_DENSO },
      { dimension: "product", value: "熱マネジメント（カーエアコン・冷却）", source: SRC_2025FY_DENSO },
      { dimension: "product", value: "ADAS（ミリ波レーダー・カメラ）", source: SRC_2025FY_DENSO },
      { dimension: "product", value: "車載半導体（パワー・MCU）", source: SRC_2025FY_DENSO },
      { dimension: "customer", value: "OEM（トヨタ 50% + 海外 OEM）", source: SRC_2025FY_DENSO },
      { dimension: "channel", value: "OEM 直販", source: SRC_2025FY_DENSO },
      { dimension: "revenue_model", value: "部品売り切り", source: SRC_2025FY_DENSO },
      { dimension: "value_chain", value: "Tier1（電装・熱・電動・センサー）", source: SRC_2025FY_DENSO },
      { dimension: "geography", value: "日本 45%・北米 22%・中国 13%・欧州 11%・その他 9%", source: SRC_2025FY_DENSO },
    ],
    segments: [
      { name: "モビリティエレクトロニクス", revenueOku: 28500, share: 36.0, operatingMargin: 8.8 },
      { name: "サーマルシステム（熱マネジメント）", revenueOku: 22000, share: 27.8, operatingMargin: 9.2 },
      { name: "パワートレインシステム", revenueOku: 15500, share: 19.6, operatingMargin: 7.2 },
      { name: "電子製品", revenueOku: 8000, share: 10.1, operatingMargin: 7.8 },
      { name: "その他", revenueOku: 5200, share: 6.5, operatingMargin: 5.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 5, expansion: 58, mature: 37, decline: 0 },
    phaseRationale:
      "電動化・ADAS 領域では拡大期、内燃機関部品では成熟期。営業利益率 8.2% は Tier1 上位水準。トヨタ依存度 50% はリスクでもあり安定でもある両面性。",
    factorBetas: {
      usdjpy: 1.18,
      us10y: -0.18,
      oil: -0.22,
      sox: 0.42,
      china: 0.42,
      market: 1.02,
      size: -0.18,
      value: 0.12,
      momentum: 0.28,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "電動化部品（インバータ・モーター）が次の収益柱、市場成長 +15% に対し +20% で伸びている",
        body:
          "デンソーの電動化部品売上は 2025/3 期で前年比 +20%、市場成長率 +15% を上回る。テスラ・BYD など中国 NEV 向け納入も拡大中。トヨタ向けだけでなく『世界 NEV シフトの裏方』として再評価が進む可能性。電動化部品の売上比率は 2025 年時点で 22%、2030 年 35-40% を目指す中期計画。",
        citations: [SRC_2025FY_DENSO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "パワー半導体（SiC）内製化が完成すれば、Tier1 として『EV 競争の勝者』ポジション確立",
        body:
          "2024 年から SiC パワー半導体の量産開始、ロームと並ぶ国内大手化。内製化により、EV インバータの調達コストと供給安定性で他 Tier1 に優位を確立。2027 年には SiC 売上 1,000 億円超を見込み、利益率もさらに上振れ余地。",
        citations: [SRC_2025FY_DENSO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "トヨタ依存度 50% は『顧客集中リスク』だが、トヨタ HEV 優位が続けば安定収益",
        body:
          "デンソー売上の半分はトヨタグループ向け。これは集中リスクとして語られるが、トヨタ HEV の世界シェア優位が続けばむしろ安定収益の源泉。逆にトヨタの EV 戦略が大きく失速する場合、デンソーは直接的に巻き込まれる。",
        citations: [SRC_2025FY_DENSO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 14.8 倍は Tier1 平均並み、ROE 9.8% / 営業利益率 8.2% を考慮すれば妥当圏。電動化シフトの恩恵を相当織り込んだ水準で、SiC 量産進捗・電動化売上の伸び次第で上振れ余地。",
      citations: [SRC_2025FY_DENSO],
    },
  },

  {
    code: "7259",
    name: "アイシン",
    nameEn: "Aisin",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "輸送用機器",
    industryCluster: "自動車 Tier1（機構）",
    priceJpy: 4480,
    priceDate: "2026-05-26",
    changePct: 0.28,
    marketCapOku: 12800,
    per: 11.5,
    pbr: 0.92,
    dividendYield: 3.4,
    roe: 7.8,
    operatingMargin: 5.8,
    revenueGrowth3y: 3.8,
    description:
      "トヨタグループ Tier1 で機構部品（トランスミッション・ブレーキ）大手。電動化シフトで AT・CVT 事業の構造転換が課題。e-Axle（EV 駆動ユニット）に経営資源シフト中。",
    oneLiner:
      "トランスミッション世界大手の Tier1。EV 化でトランスミッションの需要が減るため、e-Axle へのシフトが急務。営業利益率 5.8% は同業比やや低め。",
    tags: [
      { dimension: "product", value: "AT・CVT（自動変速機）", source: SRC_2025FY_AISIN },
      { dimension: "product", value: "e-Axle（EV 駆動ユニット）", source: SRC_2025FY_AISIN },
      { dimension: "product", value: "ブレーキシステム", source: SRC_2025FY_AISIN },
      { dimension: "product", value: "ボディ部品（ドア・シート）", source: SRC_2025FY_AISIN },
      { dimension: "customer", value: "OEM（トヨタ依存度高）", source: SRC_2025FY_AISIN },
      { dimension: "channel", value: "OEM 直販", source: SRC_2025FY_AISIN },
      { dimension: "revenue_model", value: "部品売り切り", source: SRC_2025FY_AISIN },
      { dimension: "value_chain", value: "Tier1（機構部品）", source: SRC_2025FY_AISIN },
      { dimension: "geography", value: "日本 52%・北米 22%・欧州 12%・中国 9%・その他 5%", source: SRC_2025FY_AISIN },
    ],
    segments: [
      { name: "パワートレイン（変速機等）", revenueOku: 22000, share: 47.0, operatingMargin: 5.2 },
      { name: "走行安全（ブレーキ等）", revenueOku: 12000, share: 25.6, operatingMargin: 6.4 },
      { name: "車体（ドア・シート等）", revenueOku: 9000, share: 19.2, operatingMargin: 5.8 },
      { name: "情報電子", revenueOku: 3800, share: 8.1, operatingMargin: 5.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 8, expansion: 25, mature: 50, decline: 17 },
    phaseRationale:
      "AT・CVT は EV 化で長期需要減（衰退期スコア）。e-Axle は新規領域でローンチ・拡大期スコア。事業転換が進行中で、フェーズスコアが分散。",
    factorBetas: {
      usdjpy: 1.32,
      us10y: -0.22,
      oil: -0.32,
      sox: 0.32,
      china: 0.32,
      market: 1.08,
      size: 0.18,
      value: 0.48,
      momentum: -0.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "e-Axle 売上の立ち上がりペースが事業転換成功の最大の試金石",
        body:
          "e-Axle（EV 駆動ユニット）は 2024 年量産開始、2025 年売上 1,000 億円台、2030 年 5,000 億円超を目指す。AT・CVT の需要減（年率 -5% 想定）を補えるかが事業転換成否を決める。中国 BYD・米テスラへの納入実績がカギ。",
        citations: [SRC_2025FY_AISIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "AT・CVT 事業の『減価償却完了済み』効果で短期収益はむしろ良化する局面",
        body:
          "AT・CVT の設備投資はピークを過ぎ、減価償却負担が軽減局面。短期 3-5 年は需要減でもキャッシュフローが改善する『収穫期』。長期の事業価値毀損リスクと短期キャッシュフローの良化は、評価が分かれる構造。",
        citations: [SRC_2025FY_AISIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "トヨタグループ内で『デンソー』と『アイシン』の評価ギャップは構造的に拡大している",
        body:
          "デンソー PER 14.8 倍 vs アイシン 11.5 倍。電動化部品（デンソー）と機構部品（アイシン）の事業構造の差が、評価倍率に明確に反映されている。アイシンが e-Axle で電動化部品メーカー的な評価を獲得できれば、ギャップ縮小の余地。",
        citations: [SRC_2025FY_AISIN],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 47,
      rationale:
        "PER 11.5 倍・PBR 0.92 倍は Tier1 中位。事業転換中の不透明性が PER を抑えており、e-Axle 立ち上がりの進捗で評価が変わる。配当 3.4% は支え。",
      citations: [SRC_2025FY_AISIN],
    },
  },

  // ───────────────────────────────────────────
  // 総合商社クラスタ（5 銘柄）
  // 5 大商社（三菱・三井物産・伊藤忠・住友・丸紅）。
  // バフェット（バークシャー）の投資先として 2020 年以降世界的に注目。
  // 資源依存度の低下と『事業投資型』へのシフトが構造変化。
  // ───────────────────────────────────────────
  {
    code: "8058",
    name: "三菱商事",
    nameEn: "Mitsubishi Corporation",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "卸売業",
    industryCluster: "総合商社",
    priceJpy: 3180,
    priceDate: "2026-05-26",
    changePct: 0.92,
    marketCapOku: 138500,
    per: 12.4,
    pbr: 1.18,
    dividendYield: 3.5,
    roe: 12.2,
    operatingMargin: 5.8,
    revenueGrowth3y: 4.2,
    description:
      "5 大商社で最大規模、純利益 1 兆円超を維持。天然ガス（LNG）・原料炭・銅・自動車（三菱自・いすゞ・日産）・コンビニ（ローソン）など多角展開。資源依存度を下げつつ事業投資型へシフト中。",
    oneLiner:
      "日本最大の総合商社。LNG・銅・原料炭の資源権益と、ローソン・三菱自・電力事業など多角的に展開。バフェット（バークシャー）の投資先として世界的に有名。",
    tags: [
      { dimension: "product", value: "天然ガス（LNG）・原油権益", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "product", value: "原料炭・銅・鉄鉱石", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "product", value: "コンビニ（ローソン）", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "product", value: "自動車（いすゞ・三菱自・日産 持分）", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "product", value: "電力・再エネ", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "customer", value: "資源需要国（中国・インド・新興国）", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "customer", value: "日本国内（電力会社・自動車 OEM）", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "channel", value: "事業投資 + トレーディング", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "revenue_model", value: "事業投資収益（持分法）+ トレーディング差益 + 配当", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "value_chain", value: "資源開発 → トレーディング → 事業投資（垂直統合）", source: SRC_2025FY_MITSUBISHI_C },
      { dimension: "geography", value: "日本 35%・アジア 28%・北米 14%・欧州 8%・豪州 8%・その他 7%", source: SRC_2025FY_MITSUBISHI_C },
    ],
    segments: [
      { name: "天然ガス", revenueOku: 23000, share: 11.0, operatingMargin: 18.5 },
      { name: "総合素材", revenueOku: 32000, share: 15.2, operatingMargin: 4.8 },
      { name: "金属資源", revenueOku: 38000, share: 18.1, operatingMargin: 22.4 },
      { name: "機械", revenueOku: 27000, share: 12.9, operatingMargin: 6.2 },
      { name: "生活流通（ローソン他）", revenueOku: 56000, share: 26.7, operatingMargin: 3.4 },
      { name: "電力ソリューション", revenueOku: 18000, share: 8.6, operatingMargin: 8.5 },
      { name: "産業 DX・複合都市開発", revenueOku: 16000, share: 7.6, operatingMargin: 4.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 35, mature: 65, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +4.2%、純利益 1 兆円規模で成熟期。ただし事業投資型シフト・再エネ・産業 DX で拡大期色も。資源価格次第で収益振れ大。",
    factorBetas: {
      usdjpy: 0.62,
      us10y: 0.18,
      oil: 0.85,
      sox: 0.18,
      china: 0.58,
      market: 0.88,
      size: -0.32,
      value: 0.72,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "バフェット投資（保有比率 9% 超）が PER 評価の上限・下限の両方を動かしている",
        body:
          "バークシャー・ハサウェイは 2020 年以降 5 大商社株を保有、2024 年時点で三菱商事は 9% 超を保有。投資家心理に強い影響を与え、PER 12 倍水準を下支えする要因。ただし『バフェット買い増し・売却』のヘッドラインで株価が短期に動くため、ファンダメンタルズと乖離した値動きをすることも。10% を超えると追加開示・買い増し制限の論点も生じる。",
        citations: [SRC_2025FY_MITSUBISHI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ローソン非公開化（KDDI と共同保有）が『事業投資型』戦略の象徴",
        body:
          "2024 年に KDDI と共同でローソンを非公開化、TOB で保有比率を 50% 規模に。商社は『投資して育てる』事業モデルにシフト中で、ローソンは『リアル + デジタル』の融合実験場。投資回収サイクル 5-10 年で、短期的には収益貢献が見えにくいが、長期で再評価される可能性。",
        citations: [SRC_2025FY_MITSUBISHI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "再エネ投資（洋上風力・水素）の収益化タイミングが次の評価分水嶺",
        body:
          "三菱商事は秋田・千葉・新潟で洋上風力 3 海域を落札、累計投資 1 兆円規模。発電開始は 2028-30 年で、それまでは投資先行で収益貢献なし。水素・アンモニア商流も同時進行で、再エネ・脱炭素関連の収益貢献タイミング次第で『次の収益柱』として再評価可能。",
        citations: [SRC_2025FY_MITSUBISHI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 52,
      rationale:
        "PER 12.4 倍・PBR 1.18 倍は 5 大商社平均並み、ROE 12.2% / 配当 3.5% で妥当圏。バフェット効果で下値硬く、資源価格次第で上振れ余地。",
      citations: [SRC_2025FY_MITSUBISHI_C],
    },
  },

  {
    code: "8031",
    name: "三井物産",
    nameEn: "Mitsui & Co.",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "卸売業",
    industryCluster: "総合商社",
    priceJpy: 4280,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 94500,
    per: 11.2,
    pbr: 1.12,
    dividendYield: 4.0,
    roe: 13.5,
    operatingMargin: 7.2,
    revenueGrowth3y: 3.8,
    description:
      "鉄鉱石（VALE・BHP 持分）・LNG・モビリティ・ヘルスケアに強い 5 大商社。資源比率が比較的高く、鉄鉱石市況に業績が敏感。インド・東南アジアのインフラ事業を拡大中。",
    oneLiner:
      "鉄鉱石・LNG が稼ぎ頭の総合商社。資源価格の感応度が 5 大商社で最も高い。バフェット投資先、配当 4.0% で『安定配当株』として個人投資家からも人気。",
    tags: [
      { dimension: "product", value: "鉄鉱石（VALE・BHP 持分）", source: SRC_2025FY_MITSUI_C },
      { dimension: "product", value: "天然ガス（LNG）", source: SRC_2025FY_MITSUI_C },
      { dimension: "product", value: "モビリティ（船舶・自動車）", source: SRC_2025FY_MITSUI_C },
      { dimension: "product", value: "ヘルスケア（IHH 等）", source: SRC_2025FY_MITSUI_C },
      { dimension: "product", value: "化学品（メタノール・アンモニア）", source: SRC_2025FY_MITSUI_C },
      { dimension: "customer", value: "鉄鋼メーカー（中国・日本・新興国）", source: SRC_2025FY_MITSUI_C },
      { dimension: "channel", value: "事業投資 + トレーディング", source: SRC_2025FY_MITSUI_C },
      { dimension: "revenue_model", value: "事業投資収益 + トレーディング差益 + 配当", source: SRC_2025FY_MITSUI_C },
      { dimension: "value_chain", value: "資源開発 → トレーディング → 事業投資", source: SRC_2025FY_MITSUI_C },
      { dimension: "geography", value: "日本 28%・アジア 32%・豪州 18%・北米 12%・南米 6%・欧州 4%", source: SRC_2025FY_MITSUI_C },
    ],
    segments: [
      { name: "金属資源（鉄鉱石中心）", revenueOku: 26000, share: 19.4, operatingMargin: 28.2 },
      { name: "エネルギー", revenueOku: 22000, share: 16.4, operatingMargin: 16.5 },
      { name: "機械・インフラ", revenueOku: 28000, share: 20.9, operatingMargin: 5.8 },
      { name: "化学品", revenueOku: 18000, share: 13.4, operatingMargin: 4.2 },
      { name: "鉄鋼製品", revenueOku: 14000, share: 10.4, operatingMargin: 3.4 },
      { name: "生活産業・食品", revenueOku: 16000, share: 11.9, operatingMargin: 3.8 },
      { name: "ヘルスケア・サービス", revenueOku: 10000, share: 7.5, operatingMargin: 6.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 28, mature: 72, decline: 0 },
    phaseRationale:
      "成熟期、資源価格依存度が 5 大商社で最も高い。鉄鉱石市況サイクルで純利益が大きく変動。インド・東南アジアインフラ事業で拡大期色も。",
    factorBetas: {
      usdjpy: 0.72,
      us10y: 0.22,
      oil: 0.95,
      sox: 0.18,
      china: 0.78,
      market: 0.92,
      size: -0.28,
      value: 0.82,
      momentum: 0.22,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "鉄鉱石市況に対する感応度が 5 大商社で最も高い『鉄鉱石株』",
        body:
          "金属資源セグメントが純利益の 40% 超を占め、鉄鉱石価格 1 ドル/トン変動で年間純利益 ±50 億円程度の感応度。中国不動産市場の縮小で鉄鉱石需要は中期的に弱含み、これが PER 11 倍水準のディスカウント要因。逆に中国景気回復・インド鋼材需要拡大が想定を上回ると即時上振れ余地。",
        citations: [SRC_2025FY_MITSUI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ヘルスケア事業（IHH ヘルスケア 33% 保有）は『商社の事業投資成功例』",
        body:
          "シンガポール上場のアジア最大級病院グループ IHH ヘルスケアの 33% を保有、持分法利益として年間 200-300 億円規模を計上。アジアの中間層拡大によるヘルスケア需要拡大の恩恵を直接享受、商社の『事業投資型シフト』の代表例として評価。",
        citations: [SRC_2025FY_MITSUI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "LNG ポートフォリオは『脱炭素過渡期の最大の勝者』ポジション",
        body:
          "三井物産は豪州・米国・カタール・モザンビーク等で LNG 権益を多数保有、年間取り扱い量 1,000 万トン超で世界トップクラス。脱炭素過渡期（2030-50 年）に天然ガス需要は構造的拡大、欧州ロシアエネルギー脱却の代替先としても重要。LNG 価格動向の業績寄与は鉄鉱石に次ぐ大きさ。",
        citations: [SRC_2025FY_MITSUI_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 60,
      rationale:
        "PER 11.2 倍は資源価格を保守的に織り込んだ水準、配当 4.0% は 5 大商社トップ。鉄鉱石・LNG 価格次第で上振れ余地大、バフェット効果も支え。",
      citations: [SRC_2025FY_MITSUI_C],
    },
  },

  {
    code: "8001",
    name: "伊藤忠商事",
    nameEn: "Itochu Corporation",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "卸売業",
    industryCluster: "総合商社",
    priceJpy: 6850,
    priceDate: "2026-05-26",
    changePct: 1.18,
    marketCapOku: 102500,
    per: 12.2,
    pbr: 1.52,
    dividendYield: 3.4,
    roe: 17.8,
    operatingMargin: 4.8,
    revenueGrowth3y: 5.4,
    description:
      "5 大商社で非資源比率が最も高い（80% 超）、繊維・ファミリーマート・住生活・情報金融に強い。ROE 17.8% は商社業界トップで、安定収益型『非資源モデル』の代表。",
    oneLiner:
      "非資源領域に強い総合商社。ファミリーマート（保有 50% 超）・繊維・住生活など消費者接点が多く、資源価格変動の影響が小さい。ROE 17.8% は 5 大商社トップ。",
    tags: [
      { dimension: "product", value: "繊維（ブランド・素材）", source: SRC_2025FY_ITOCHU },
      { dimension: "product", value: "コンビニ（ファミリーマート）", source: SRC_2025FY_ITOCHU },
      { dimension: "product", value: "食料（食糧トレード・加工）", source: SRC_2025FY_ITOCHU },
      { dimension: "product", value: "住生活・建材", source: SRC_2025FY_ITOCHU },
      { dimension: "product", value: "情報金融・保険", source: SRC_2025FY_ITOCHU },
      { dimension: "customer", value: "個人消費者（コンビニ・繊維）", source: SRC_2025FY_ITOCHU },
      { dimension: "channel", value: "事業投資 + トレーディング + 小売", source: SRC_2025FY_ITOCHU },
      { dimension: "revenue_model", value: "事業投資収益 + トレーディング + 小売売上", source: SRC_2025FY_ITOCHU },
      { dimension: "value_chain", value: "繊維・食料・小売の垂直統合", source: SRC_2025FY_ITOCHU },
      { dimension: "geography", value: "日本 48%・中国 18%・アジア 14%・北米 10%・欧州 6%・その他 4%", source: SRC_2025FY_ITOCHU },
    ],
    segments: [
      { name: "繊維", revenueOku: 14000, share: 7.8, operatingMargin: 6.4 },
      { name: "機械", revenueOku: 22000, share: 12.2, operatingMargin: 5.2 },
      { name: "金属", revenueOku: 18000, share: 10.0, operatingMargin: 8.4 },
      { name: "エネルギー・化学品", revenueOku: 26000, share: 14.4, operatingMargin: 4.8 },
      { name: "食料（食糧・加工）", revenueOku: 38000, share: 21.1, operatingMargin: 3.2 },
      { name: "住生活・情報・金融", revenueOku: 24000, share: 13.3, operatingMargin: 5.8 },
      { name: "第 8（ファミリーマート他）", revenueOku: 38000, share: 21.1, operatingMargin: 3.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 45, mature: 55, decline: 0 },
    phaseRationale:
      "非資源中心で安定成長、ROE 17.8% は商社業界トップ。ファミリーマート完全子会社化（2020 年）以降、小売事業の伸長が拡大期色を強める。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: 0.08,
      oil: 0.32,
      sox: 0.18,
      china: 0.42,
      market: 0.82,
      size: -0.18,
      value: 0.42,
      momentum: 0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "資源価格に対する『感応度の低さ』が PER 12.2 倍を正当化する構造的強み",
        body:
          "資源比率 20% 未満で 5 大商社最低、原油価格 1 バレル 10 ドル変動でも純利益への影響は ±50 億円程度。資源価格変動による収益振れが小さく、安定配当・安定 ROE を維持できる。市場は『非資源プレミアム』として PER に 1-2 倍程度の上乗せを織り込む。",
        citations: [SRC_2025FY_ITOCHU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "ファミリーマート（保有 100%）の DX 戦略が『次の収益柱』として浮上",
        body:
          "2020 年に完全子会社化したファミリーマート（売上 3 兆円規模）の DX 戦略が本格化。Famipay・店舗 IT 化・データ収益化で『単なる小売』から『データプラットフォーム』への進化を狙う。短期では投資先行だが、5-10 年で再評価の余地。",
        citations: [SRC_2025FY_ITOCHU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "中国 CITIC 提携（10% 出資）は『中国エクスポージャー』の二面性を持つ",
        body:
          "伊藤忠は中国 CITIC グループに 10% 出資、これが中国市場アクセスと地政学リスクの両面性を生む。米中対立深化局面では CITIC 関連の利益貢献が政治的に問題化するリスクも。逆に中国経済回復時には CITIC からの配当が安定収益に。",
        citations: [SRC_2025FY_ITOCHU],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 46,
      rationale:
        "PER 12.2 倍は 5 大商社平均より高めだが、ROE 17.8% / 非資源プレミアムを考慮すれば妥当圏。PBR 1.52 倍はやや割高感、株価上昇余地は限定的。",
      citations: [SRC_2025FY_ITOCHU],
    },
  },

  {
    code: "8053",
    name: "住友商事",
    nameEn: "Sumitomo Corporation",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "卸売業",
    industryCluster: "総合商社",
    priceJpy: 4020,
    priceDate: "2026-05-26",
    changePct: -0.42,
    marketCapOku: 51200,
    per: 11.5,
    pbr: 0.98,
    dividendYield: 4.5,
    roe: 8.8,
    operatingMargin: 4.2,
    revenueGrowth3y: 2.8,
    description:
      "5 大商社で時価総額最小、銅・銀・モリブデン等の金属資源と輸送機・建機・メディア（J:COM）に強い。マダガスカル Ambatovy ニッケル事業の損失が過去に重し。ROE 8.8% は 5 大商社で最低水準。",
    oneLiner:
      "5 大商社の中で時価総額最小。金属資源・建機・メディアに強み。過去のニッケル事業損失で ROE が他社より低いが、配当 4.5% は安定的。",
    tags: [
      { dimension: "product", value: "金属（銅・銀・モリブデン）", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "product", value: "輸送機（船舶・自動車）", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "product", value: "建設機械（住友建機）", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "product", value: "メディア（J:COM・JCN）", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "product", value: "不動産・物流", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "customer", value: "資源需要国・中国・新興国", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "channel", value: "事業投資 + トレーディング", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "revenue_model", value: "事業投資収益 + トレーディング差益 + 配当", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "value_chain", value: "資源 → トレーディング → 事業投資", source: SRC_2025FY_SUMITOMO_C },
      { dimension: "geography", value: "日本 42%・アジア 22%・北米 14%・南米 8%・欧州 8%・その他 6%", source: SRC_2025FY_SUMITOMO_C },
    ],
    segments: [
      { name: "金属", revenueOku: 18000, share: 14.4, operatingMargin: 12.5 },
      { name: "輸送機・建機", revenueOku: 22000, share: 17.6, operatingMargin: 4.8 },
      { name: "インフラ", revenueOku: 15000, share: 12.0, operatingMargin: 3.8 },
      { name: "メディア・デジタル", revenueOku: 18000, share: 14.4, operatingMargin: 5.4 },
      { name: "生活・不動産", revenueOku: 26000, share: 20.8, operatingMargin: 3.2 },
      { name: "資源・化学品", revenueOku: 21000, share: 16.8, operatingMargin: 5.2 },
      { name: "次世代（再エネ・水素）", revenueOku: 5000, share: 4.0, operatingMargin: 2.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 5, expansion: 25, mature: 60, decline: 10 },
    phaseRationale:
      "過去ニッケル事業損失の影響で衰退期スコア 10。ROE 8.8% は商社中最低、構造改革途上。再エネ・水素の新領域は拡大期色。",
    factorBetas: {
      usdjpy: 0.55,
      us10y: 0.15,
      oil: 0.62,
      sox: 0.12,
      china: 0.52,
      market: 0.82,
      size: 0.18,
      value: 0.82,
      momentum: -0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ROE 8.8% は 5 大商社で最低、構造改革の進捗が再評価のカギ",
        body:
          "住友商事の ROE 8.8% は伊藤忠 17.8%・三井 13.5%・三菱 12.2% に対して明確に劣後。過去のニッケル事業損失（Ambatovy 等）に加え、ポートフォリオ全体の収益効率が他社より低い。経営陣は事業ポートフォリオ見直しを継続中で、ROE 10% 超への回復が次の評価分水嶺。",
        citations: [SRC_2025FY_SUMITOMO_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "J:COM の競争環境激化が『安定収益柱』にひずみを生んでいる",
        body:
          "J:COM はケーブルテレビ・通信事業で 5 大商社中で住友独自の収益柱だが、Netflix・Amazon Prime 等の動画配信で加入者数が縮小傾向。固定電話・固定インターネットの収益力も低下中で、メディア・デジタルセグメントの利益率が圧迫されている。",
        citations: [SRC_2025FY_SUMITOMO_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PBR 0.98 倍は 5 大商社で唯一の『1 倍割れ』、解散価値割れの懸念が織り込まれた水準",
        body:
          "PBR 0.98 倍は他 4 社（1.1-1.5 倍）と明確に乖離、市場が住友の事業価値に懐疑的な姿勢を示す。構造改革による ROE 改善（10% 超）が確認されれば、PBR 1.1-1.2 倍への戻りで株価 +15-25% 余地。配当 4.5% は最も高く、下値は限定的。",
        citations: [SRC_2025FY_SUMITOMO_C],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 65,
      rationale:
        "PER 11.5 倍・PBR 0.98 倍は 5 大商社最割安、配当 4.5% も最高。構造改革の進捗次第で上値余地大、下値は配当で支え。",
      citations: [SRC_2025FY_SUMITOMO_C],
    },
  },

  {
    code: "8002",
    name: "丸紅",
    nameEn: "Marubeni Corporation",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "卸売業",
    industryCluster: "総合商社",
    priceJpy: 2920,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 50800,
    per: 10.4,
    pbr: 1.12,
    dividendYield: 3.8,
    roe: 14.2,
    operatingMargin: 4.5,
    revenueGrowth3y: 4.8,
    description:
      "食料（穀物・水産）・電力・農業（北米肥料）・金属に強い。穀物トレーディングは Gavilon 買収（2013）で世界トップクラス。電力 IPP（独立系発電事業者）として世界 1.2 万 MW 規模。",
    oneLiner:
      "食料・電力に強い 5 大商社。穀物トレーディングは Gavilon 買収（2013）で世界 3 位級、米国農業ビジネスに深く関与。北米事業比率の高さが特徴。",
    tags: [
      { dimension: "product", value: "食料（穀物・水産・畜産）", source: SRC_2025FY_MARUBENI },
      { dimension: "product", value: "電力 IPP（世界 1.2 万 MW）", source: SRC_2025FY_MARUBENI },
      { dimension: "product", value: "農業（Helena Agri-Enterprises 等）", source: SRC_2025FY_MARUBENI },
      { dimension: "product", value: "金属（銅・アルミ）", source: SRC_2025FY_MARUBENI },
      { dimension: "product", value: "機械（航空機・船舶）", source: SRC_2025FY_MARUBENI },
      { dimension: "customer", value: "穀物消費国（中国・新興国）", source: SRC_2025FY_MARUBENI },
      { dimension: "channel", value: "事業投資 + トレーディング", source: SRC_2025FY_MARUBENI },
      { dimension: "revenue_model", value: "事業投資収益 + トレーディング + 電力売上", source: SRC_2025FY_MARUBENI },
      { dimension: "value_chain", value: "穀物 → 食料 → 北米農業の垂直統合", source: SRC_2025FY_MARUBENI },
      { dimension: "geography", value: "日本 32%・北米 28%・アジア 18%・欧州 10%・南米 7%・その他 5%", source: SRC_2025FY_MARUBENI },
    ],
    segments: [
      { name: "食料", revenueOku: 22000, share: 22.4, operatingMargin: 4.5 },
      { name: "ライフスタイル", revenueOku: 14000, share: 14.3, operatingMargin: 3.8 },
      { name: "電力", revenueOku: 15000, share: 15.3, operatingMargin: 12.4 },
      { name: "エネルギー", revenueOku: 16000, share: 16.3, operatingMargin: 8.5 },
      { name: "金属", revenueOku: 14000, share: 14.3, operatingMargin: 6.2 },
      { name: "機械", revenueOku: 11000, share: 11.2, operatingMargin: 5.8 },
      { name: "次世代事業（再エネ等）", revenueOku: 6000, share: 6.1, operatingMargin: 4.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 5, expansion: 38, mature: 57, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +4.8%、ROE 14.2% は 5 大商社中位。穀物・電力の安定収益と北米農業の成長期待で拡大期色も。",
    factorBetas: {
      usdjpy: 0.92,
      us10y: 0.18,
      oil: 0.42,
      sox: 0.15,
      china: 0.32,
      market: 0.92,
      size: 0.12,
      value: 0.62,
      momentum: 0.22,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "穀物・電力の『非資源型ポートフォリオ』で 5 大商社の中堅ポジションを確立",
        body:
          "丸紅は資源比率 30% 程度で、5 大商社中で伊藤忠に次ぐ非資源型。穀物トレーディング（Gavilon・Helena）と電力 IPP（世界 1.2 万 MW）が安定収益の二大柱。資源価格変動に対して相対的に強く、ROE 14.2% を維持。",
        citations: [SRC_2025FY_MARUBENI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "北米事業比率 28% は 5 大商社で最大、米国経済との連動性が高い",
        body:
          "Gavilon（穀物）・Helena（農業）・電力 IPP・LNG などで北米事業比率 28%。米国経済の堅調さが直接利益貢献する『米国エクスポージャー商社』。USD/JPY ベータ 0.92 は商社中最大級。米国農業政策・規制動向の影響を強く受ける。",
        citations: [SRC_2025FY_MARUBENI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "電力 IPP（世界 1.2 万 MW）は再エネシフトで『成長セグメント』に転換しうる",
        body:
          "丸紅の電力 IPP 事業は世界 1.2 万 MW、これは中規模電力会社並み。従来は火力中心だったが、再エネシフトに伴い太陽光・風力への入れ替えを進行中。脱炭素プレミアムが付けば、電力セグメントの再評価で全社 PER 引き上げ余地。",
        citations: [SRC_2025FY_MARUBENI],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 58,
      rationale:
        "PER 10.4 倍は 5 大商社最割安水準、ROE 14.2% / 配当 3.8% で質も高い。非資源比率の高さと北米事業の安定性で下値硬く、上振れ余地もあり。",
      citations: [SRC_2025FY_MARUBENI],
    },
  },

  // ───────────────────────────────────────────
  // 金融クラスタ（6 銘柄）
  // メガバンク 3 + 証券 1 + 損保 2。
  // 日銀利上げサイクルの最大の受益者セクター。金利上昇 = 預貸利ザヤ拡大。
  // 配当 3.5-5.5% の高配当・累進配当方針で個人投資家にも人気。
  // ───────────────────────────────────────────
  {
    code: "8306",
    name: "三菱 UFJ フィナンシャル・グループ",
    nameEn: "MUFG",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "銀行業",
    industryCluster: "メガバンク",
    priceJpy: 2050,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 252800,
    per: 11.8,
    pbr: 1.08,
    dividendYield: 3.4,
    roe: 8.8,
    operatingMargin: 26.5,
    revenueGrowth3y: 6.8,
    description:
      "日本最大の総合金融グループ。預金 200 兆円超、米モルガン・スタンレー 20% 出資、東南アジア（タイ・インドネシア・ベトナム）に積極展開。日銀利上げサイクルの最大受益者。",
    oneLiner:
      "日本最大の銀行。日銀の金利政策が業績に直結する『金利株』の代表。配当 3.4% で累進配当方針、自社株買いも積極的。アジア展開で長期成長も。",
    tags: [
      { dimension: "product", value: "個人・法人預金（200 兆円超）", source: SRC_2025FY_MUFG },
      { dimension: "product", value: "貸出（事業性融資・住宅ローン）", source: SRC_2025FY_MUFG },
      { dimension: "product", value: "投資銀行（M&A 助言・引受）", source: SRC_2025FY_MUFG },
      { dimension: "product", value: "資産運用（信託・年金）", source: SRC_2025FY_MUFG },
      { dimension: "product", value: "Morgan Stanley 20% 出資（持分法）", source: SRC_2025FY_MUFG },
      { dimension: "customer", value: "個人・法人・機関投資家", source: SRC_2025FY_MUFG },
      { dimension: "channel", value: "店舗網（国内 400+）+ デジタル", source: SRC_2025FY_MUFG },
      { dimension: "revenue_model", value: "預貸利ザヤ + 手数料 + 持分法損益", source: SRC_2025FY_MUFG },
      { dimension: "value_chain", value: "銀行・信託・証券・資産運用の総合", source: SRC_2025FY_MUFG },
      { dimension: "geography", value: "日本 58%・北米 22%・アジア 14%・欧州 6%", source: SRC_2025FY_MUFG },
    ],
    segments: [
      { name: "デジタルサービス・法人", revenueOku: 28000, share: 41.2, operatingMargin: 32.5 },
      { name: "グローバル・コマーシャル", revenueOku: 18000, share: 26.5, operatingMargin: 28.4 },
      { name: "グローバル CIB", revenueOku: 14000, share: 20.6, operatingMargin: 24.8 },
      { name: "受託財産（信託・年金）", revenueOku: 8000, share: 11.8, operatingMargin: 18.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 52, mature: 48, decline: 0 },
    phaseRationale:
      "日銀利上げサイクルで預貸利ザヤ拡大局面、拡大期色強い。ROE 8.8% は過去 10 年で最高水準。米モルガン・スタンレー持分も収益貢献。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: 0.85,
      oil: -0.12,
      sox: 0.18,
      china: 0.32,
      market: 1.12,
      size: -0.42,
      value: 0.92,
      momentum: 0.42,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "日銀利上げ 1 回（+0.25%）で当期純利益 +500-700 億円の感応度",
        body:
          "MUFG の貸出残高は約 110 兆円、政策金利 +0.25% 上昇で年間 +500-700 億円の利益貢献試算。日銀の利上げサイクル（2024 年 0% → 2026 年 1% を想定）で、純利益は段階的に拡大。市場が利上げペースをどう織り込むかで PER が変動する。",
        citations: [SRC_2025FY_MUFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Morgan Stanley 20% 出資が『隠れた資産』として再評価される可能性",
        body:
          "MUFG は 2008 年に米モルガン・スタンレーへ 90 億ドル出資（現在 20% 規模）、持分法損益として年間 3,000-5,000 億円規模を計上。Morgan Stanley の時価総額成長で MUFG の保有価値も拡大、簿価より時価ベースで 1.5-2 倍規模の隠れた価値。",
        citations: [SRC_2025FY_MUFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "東南アジア戦略（タイ・インドネシア・ベトナム）が次の成長エンジン",
        body:
          "Bank of Ayudhya（タイ・連結子会社）、Bank Danamon（インドネシア・93% 保有）、Vietin Bank（ベトナム・約 20% 出資）で東南アジア中産階級拡大の恩恵を享受。日本国内市場の縮小を補う長期成長エンジンとして、PER 評価の上値余地に影響。",
        citations: [SRC_2025FY_MUFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 48,
      rationale:
        "PER 11.8 倍・PBR 1.08 倍は利上げ織り込みの後の妥当圏、ROE 8.8% / 配当 3.4% で安定。さらなる利上げ進行で上振れ余地、減速で下落リスク。",
      citations: [SRC_2025FY_MUFG],
    },
  },

  {
    code: "8316",
    name: "三井住友フィナンシャルグループ",
    nameEn: "SMFG",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "銀行業",
    industryCluster: "メガバンク",
    priceJpy: 11200,
    priceDate: "2026-05-26",
    changePct: 0.85,
    marketCapOku: 148500,
    per: 11.5,
    pbr: 0.95,
    dividendYield: 4.2,
    roe: 8.6,
    operatingMargin: 27.8,
    revenueGrowth3y: 7.4,
    description:
      "2 大メガバンクの 1 つ、SMBC を中核とする総合金融グループ。米 Jefferies Financial Group との戦略提携（出資 15%）で投資銀行を強化、アジア（インド・ベトナム）にも積極展開。配当 4.2% は 3 メガバンクトップ。",
    oneLiner:
      "三井住友銀行が中核のメガバンク。3 メガバンクの中で最も配当利回り（4.2%）が高い『高配当バンク株』。米 Jefferies 提携で投資銀行業務を強化中。",
    tags: [
      { dimension: "product", value: "預金（160 兆円超）", source: SRC_2025FY_SMFG },
      { dimension: "product", value: "貸出（事業性融資・住宅ローン）", source: SRC_2025FY_SMFG },
      { dimension: "product", value: "投資銀行（SMBC 日興・Jefferies 提携）", source: SRC_2025FY_SMFG },
      { dimension: "product", value: "消費者金融（プロミス・SMBC 信託）", source: SRC_2025FY_SMFG },
      { dimension: "product", value: "クレジットカード（三井住友カード・VISA）", source: SRC_2025FY_SMFG },
      { dimension: "customer", value: "個人・法人・機関投資家", source: SRC_2025FY_SMFG },
      { dimension: "channel", value: "店舗網 + デジタル（Olive 統合 App）", source: SRC_2025FY_SMFG },
      { dimension: "revenue_model", value: "預貸利ザヤ + 手数料 + 投資銀行収益", source: SRC_2025FY_SMFG },
      { dimension: "value_chain", value: "銀行・信託・証券・カードの総合", source: SRC_2025FY_SMFG },
      { dimension: "geography", value: "日本 65%・北米 18%・アジア 12%・欧州 5%", source: SRC_2025FY_SMFG },
    ],
    segments: [
      { name: "リテール（個人）", revenueOku: 12500, share: 31.3, operatingMargin: 28.5 },
      { name: "ホールセール（法人）", revenueOku: 14000, share: 35.0, operatingMargin: 32.5 },
      { name: "グローバル", revenueOku: 9500, share: 23.8, operatingMargin: 26.8 },
      { name: "市場営業", revenueOku: 4000, share: 10.0, operatingMargin: 18.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 55, mature: 45, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +7.4% は 3 メガバンクトップ、利上げ恩恵を最も享受する銘柄。Jefferies 提携・Olive 統合 App で拡大期色濃い。",
    factorBetas: {
      usdjpy: 0.38,
      us10y: 0.82,
      oil: -0.15,
      sox: 0.18,
      china: 0.28,
      market: 1.08,
      size: -0.38,
      value: 0.95,
      momentum: 0.48,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Olive（個人向け統合金融サービス）が『次世代リテール戦略』の試金石",
        body:
          "2023 年スタートの Olive（銀行 + 証券 + カード + 保険の統合アプリ）は 2 年で 200 万口座を獲得、目標 500 万口座（2027）を目指す。新規個人顧客の獲得と既存顧客のエンゲージメント向上を同時に狙う戦略。デジタル変革の成否が中長期 ROE を決める。",
        citations: [SRC_2025FY_SMFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "米 Jefferies Financial Group（15% 出資）が投資銀行業務を強化",
        body:
          "2023 年に米 Jefferies に 15% 出資、日本では SMBC 日興、米国では Jefferies と協業して M&A 助言・引受業務を強化。野村 HD・Goldman Sachs に対抗する『日米統合投資銀行』として、長期的に投資銀行収益のシェア拡大を狙う。",
        citations: [SRC_2025FY_SMFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "配当 4.2% は 3 メガバンクトップ、累進配当方針で下値の支え",
        body:
          "SMFG は 2026 年に配当性向 40% 超を目標、累進配当（減配しない）方針を継続。3 メガバンクの中で最も配当利回りが高く、個人投資家・新 NISA 流入の最大の受け皿。下値は配当利回りで支えられ、株価下落局面でも限定的。",
        citations: [SRC_2025FY_SMFG],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 56,
      rationale:
        "PER 11.5 倍・PBR 0.95 倍は 1 倍割れで割安。ROE 8.6% / 配当 4.2% / 利上げ恩恵を考慮すれば PBR 1.1-1.2 倍への戻りで株価 +15-25% 余地。",
      citations: [SRC_2025FY_SMFG],
    },
  },

  {
    code: "8411",
    name: "みずほフィナンシャルグループ",
    nameEn: "Mizuho FG",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "銀行業",
    industryCluster: "メガバンク",
    priceJpy: 4180,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 106200,
    per: 10.8,
    pbr: 0.85,
    dividendYield: 4.5,
    roe: 7.8,
    operatingMargin: 26.2,
    revenueGrowth3y: 5.8,
    description:
      "3 大メガバンクで時価総額・ROE 最下位、過去にシステム障害（2021）で経営信頼が傷ついた。Greenhill 買収（2023）で米投資銀行を強化、楽天証券との提携でリテール拡大。PBR 0.85 倍は『解散価値割れ』水準。",
    oneLiner:
      "メガバンク 3 行の中で最も配当利回りが高い（4.5%）、PBR 0.85 倍は解散価値割れ水準。システム障害の影響で評価が低いが、構造改革・米投資銀行強化で再評価余地。",
    tags: [
      { dimension: "product", value: "預金（130 兆円超）", source: SRC_2025FY_MIZUHO },
      { dimension: "product", value: "貸出（法人・個人）", source: SRC_2025FY_MIZUHO },
      { dimension: "product", value: "投資銀行（Greenhill 買収・みずほ証券）", source: SRC_2025FY_MIZUHO },
      { dimension: "product", value: "信託・資産運用", source: SRC_2025FY_MIZUHO },
      { dimension: "customer", value: "個人・大企業・機関投資家", source: SRC_2025FY_MIZUHO },
      { dimension: "channel", value: "店舗網 + デジタル（楽天証券提携）", source: SRC_2025FY_MIZUHO },
      { dimension: "revenue_model", value: "預貸利ザヤ + 手数料 + 投資銀行", source: SRC_2025FY_MIZUHO },
      { dimension: "value_chain", value: "銀行・信託・証券の総合", source: SRC_2025FY_MIZUHO },
      { dimension: "geography", value: "日本 68%・北米 18%・アジア 9%・欧州 5%", source: SRC_2025FY_MIZUHO },
    ],
    segments: [
      { name: "リテール・事業法人", revenueOku: 14000, share: 41.2, operatingMargin: 24.5 },
      { name: "大企業・グローバル", revenueOku: 11000, share: 32.4, operatingMargin: 28.2 },
      { name: "市場・グローバルマーケッツ", revenueOku: 6000, share: 17.6, operatingMargin: 32.5 },
      { name: "アセットマネジメント・信託", revenueOku: 3000, share: 8.8, operatingMargin: 18.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 38, mature: 52, decline: 10 },
    phaseRationale:
      "ROE 7.8% は 3 メガバンク最下位、過去のシステム障害の評価ダメージが残る（衰退期スコア 10）。構造改革・Greenhill 統合で拡大期色も。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: 0.78,
      oil: -0.12,
      sox: 0.15,
      china: 0.32,
      market: 1.05,
      size: -0.18,
      value: 1.02,
      momentum: 0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "PBR 0.85 倍は解散価値割れ、3 メガバンクで最も割安だが理由がある",
        body:
          "PBR 0.85 倍は MUFG 1.08 倍・SMFG 0.95 倍と比べて明確に低い。2021 年のシステム障害（19 件発生、頭取交代）で経営信頼が傷つき、ROE 7.8% も他 2 行より低い。構造改革とシステム刷新が完了して ROE 8% 超への回復が確認されれば、PBR 0.95-1.0 倍への戻りで株価 +10-15% 余地。",
        citations: [SRC_2025FY_MIZUHO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Greenhill 買収（2023）で米国 M&A 助言業務を本格強化",
        body:
          "2023 年に米 Greenhill & Co. を 5.5 億ドルで買収、独立系 M&A 助言会社として米国で実績ある会社を取り込んだ。みずほ証券と統合することで日米クロスボーダー M&A 案件の獲得を狙う。3 年でシナジー収益 200 億円超を目標、達成可否が次の評価軸。",
        citations: [SRC_2025FY_MIZUHO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "楽天証券との戦略提携（2023）でリテール顧客基盤を大幅拡大",
        body:
          "2023 年に楽天証券に 800 億円を出資（持分法）、楽天証券 1,000 万口座超のリテール顧客にみずほ銀行の金融商品を販売する仕組み。新 NISA 拡大期の追い風で、リテール手数料収入の段階的拡大が見込める。デジタルネイティブ顧客の獲得という長年の課題に対応。",
        citations: [SRC_2025FY_MIZUHO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 62,
      rationale:
        "PER 10.8 倍・PBR 0.85 倍は 3 メガバンク最割安、配当 4.5% も最高。構造改革進捗・Greenhill 統合シナジーで上値余地大、下値は配当で支え。",
      citations: [SRC_2025FY_MIZUHO],
    },
  },

  {
    code: "8604",
    name: "野村ホールディングス",
    nameEn: "Nomura Holdings",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "証券、商品先物取引業",
    industryCluster: "総合証券",
    priceJpy: 1020,
    priceDate: "2026-05-26",
    changePct: -0.85,
    marketCapOku: 33200,
    per: 13.2,
    pbr: 0.78,
    dividendYield: 3.2,
    roe: 6.2,
    operatingMargin: 9.5,
    revenueGrowth3y: 4.2,
    description:
      "日本最大の証券会社、リテール・ホールセール・アセットマネジメントの 3 事業を持つ総合証券。米 Lehman Brothers アジア・欧州事業買収（2008）以来、グローバル投資銀行を志向するも収益効率は低位。",
    oneLiner:
      "日本最大の証券会社。リテール・投資銀行・資産運用の総合証券。米国投資銀行展開で巨額損失も経験、ROE 6.2% は金融セクター低位。新 NISA 追い風でリテール再評価期待。",
    tags: [
      { dimension: "product", value: "リテール証券（株・債券・投信）", source: SRC_2025FY_NOMURA },
      { dimension: "product", value: "投資銀行（M&A・引受・トレーディング）", source: SRC_2025FY_NOMURA },
      { dimension: "product", value: "アセットマネジメント（野村アセット）", source: SRC_2025FY_NOMURA },
      { dimension: "customer", value: "個人投資家・機関投資家・大企業", source: SRC_2025FY_NOMURA },
      { dimension: "channel", value: "店舗 + オンライン", source: SRC_2025FY_NOMURA },
      { dimension: "revenue_model", value: "手数料 + トレーディング + 運用報酬", source: SRC_2025FY_NOMURA },
      { dimension: "value_chain", value: "リテール・投資銀行・運用の総合", source: SRC_2025FY_NOMURA },
      { dimension: "geography", value: "日本 65%・北米 18%・アジア 8%・欧州 9%", source: SRC_2025FY_NOMURA },
    ],
    segments: [
      { name: "リテール", revenueOku: 4500, share: 38.5, operatingMargin: 22.5 },
      { name: "ホールセール（投資銀行）", revenueOku: 5200, share: 44.4, operatingMargin: 5.8 },
      { name: "インベストメント・マネジメント", revenueOku: 2000, share: 17.1, operatingMargin: 28.4 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 28, mature: 52, decline: 20 },
    phaseRationale:
      "ROE 6.2% は金融セクター低位、グローバル投資銀行戦略の収益効率課題で衰退期スコア 20。新 NISA でリテールは拡大期色。",
    factorBetas: {
      usdjpy: 0.32,
      us10y: 0.42,
      oil: -0.18,
      sox: 0.32,
      china: 0.42,
      market: 1.38,
      size: 0.18,
      value: 0.92,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ROE 6.2% は『野村の最大の構造課題』、戦略的選択肢が問われている",
        body:
          "野村 HD の ROE 6.2% はメガバンク（8-9%）・SMFG・MUFG より明確に低く、保険・商社も上回らない。リテール・投資銀行・運用の 3 事業構造の中で、ホールセール（投資銀行）の収益効率が長期的に低い。Lehman Brothers アジア・欧州事業（2008）以来の『グローバル投資銀行』志向の見直しが投資家から求められ続けている。",
        citations: [SRC_2025FY_NOMURA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "新 NISA 拡大で『リテール 1,000 万口座』の優位性が再評価される可能性",
        body:
          "野村のリテール口座数は 530 万、新 NISA 開始（2024）で年 100 万口座超のペースで拡大中。リテール売上・手数料収入は構造的拡大期で、ホールセール（投資銀行）の収益不安定性をカバー。リテールセグメントだけ見れば営業利益率 22% 超で十分な収益性、リストラ・効率化の進捗次第で全社 ROE 改善余地。",
        citations: [SRC_2025FY_NOMURA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PBR 0.78 倍は『投資銀行業務の構造的不確実性』を市場が織り込んだ水準",
        body:
          "PBR 0.78 倍は 3 メガバンク（0.85-1.08 倍）より低く、市場が野村のホールセール業務の収益性に懐疑的。Goldman Sachs・JP Morgan・Morgan Stanley と直接競争するには資本力が足りず、専門領域への集中（テクノロジー・ヘルスケア・サステナビリティ）が必要。事業ポートフォリオ見直しの宣言があれば再評価余地。",
        citations: [SRC_2025FY_NOMURA],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 45,
      rationale:
        "PER 13.2 倍は ROE 6.2% に対しては妥当、PBR 0.78 倍の割安感は構造課題を織り込んだ水準。新 NISA でリテール拡大、ROE 改善が確認されれば上値余地。",
      citations: [SRC_2025FY_NOMURA],
    },
  },

  {
    code: "8766",
    name: "東京海上ホールディングス",
    nameEn: "Tokio Marine Holdings",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "保険業",
    industryCluster: "損害保険",
    priceJpy: 5680,
    priceDate: "2026-05-26",
    changePct: 1.18,
    marketCapOku: 112500,
    per: 13.5,
    pbr: 1.32,
    dividendYield: 3.6,
    roe: 13.5,
    operatingMargin: 18.2,
    revenueGrowth3y: 9.4,
    description:
      "日本最大の損害保険会社、米国・南米・アジアに積極的な M&A で海外比率 50% 超。自動車保険・火災保険を中心に、米 Pure Group・Privilege Underwriters 等を傘下に持つ。ROE 13.5% は保険セクター最高水準。",
    oneLiner:
      "日本最大の損保。海外 M&A で海外売上比率 50% 超、グローバル分散で災害リスクを抑制。ROE 13.5% は損保業界トップ、安定収益と高配当で人気。",
    tags: [
      { dimension: "product", value: "自動車保険（個人・企業）", source: SRC_2025FY_TOKIO },
      { dimension: "product", value: "火災保険（住宅・企業）", source: SRC_2025FY_TOKIO },
      { dimension: "product", value: "海外保険（Pure Group・Privilege 等）", source: SRC_2025FY_TOKIO },
      { dimension: "product", value: "再保険（東京海上日動火災再保険）", source: SRC_2025FY_TOKIO },
      { dimension: "product", value: "生命保険（東京海上日動あんしん生命）", source: SRC_2025FY_TOKIO },
      { dimension: "customer", value: "個人・企業・グローバル", source: SRC_2025FY_TOKIO },
      { dimension: "channel", value: "代理店 + ダイレクト + ブローカー", source: SRC_2025FY_TOKIO },
      { dimension: "revenue_model", value: "保険料 + 運用収益", source: SRC_2025FY_TOKIO },
      { dimension: "value_chain", value: "損保・生保・再保険・運用の総合", source: SRC_2025FY_TOKIO },
      { dimension: "geography", value: "日本 48%・北米 32%・アジア 12%・欧州 8%", source: SRC_2025FY_TOKIO },
    ],
    segments: [
      { name: "国内損保", revenueOku: 22000, share: 35.5, operatingMargin: 16.5 },
      { name: "海外保険", revenueOku: 28000, share: 45.2, operatingMargin: 20.5 },
      { name: "国内生保", revenueOku: 8000, share: 12.9, operatingMargin: 12.5 },
      { name: "金融・一般", revenueOku: 4000, share: 6.5, operatingMargin: 22.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 62, mature: 38, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +9.4%、ROE 13.5% で拡大期色濃い。海外 M&A 戦略が構造的成長エンジン。気候変動による災害リスク増加には注意。",
    factorBetas: {
      usdjpy: 0.62,
      us10y: 0.42,
      oil: -0.12,
      sox: 0.18,
      china: 0.18,
      market: 0.92,
      size: -0.32,
      value: 0.42,
      momentum: 0.62,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "海外比率 50% 超は『災害リスクの地理的分散』として構造優位",
        body:
          "東京海上は過去 20 年で米国・南米・東南アジアに積極 M&A、海外比率 50% 超を達成。日本で大地震・台風が発生しても海外で相殺、グローバル分散による安定収益性が確保されている。Pure Group（米富裕層損保）等の高利益率事業も買収。海外比率の高さが ROE 13.5% を支える。",
        citations: [SRC_2025FY_TOKIO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "気候変動による『災害頻度増加』は保険料率引き上げで対応可能",
        body:
          "気候変動による台風・洪水・山火事の頻度・規模拡大は保険業の長期リスクとして語られるが、保険会社は保険料率を毎年引き上げることで対応可能。米国住宅保険では年率 +10-15% の料率上昇が定着しつつあり、東京海上もこのトレンドの恩恵を享受。災害リスクは『機会』に転化しうる。",
        citations: [SRC_2025FY_TOKIO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "金利上昇で『運用収益拡大』、日銀利上げサイクルの隠れた受益者",
        body:
          "東京海上の運用資産は 30 兆円規模、債券・株式・REIT・不動産で構成。日銀利上げで国債利回りが上昇すると、新規債券投資の利回りが向上し、運用収益が段階的に拡大。メガバンク同様、利上げの恩恵を受ける『金利株』としての側面も持つ。",
        citations: [SRC_2025FY_TOKIO],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 13.5 倍は損保業界平均並み、ROE 13.5% / 海外比率 50% / 配当 3.6% を考慮すれば妥当圏。気候変動リスク・M&A 成功実績で上値余地。",
      citations: [SRC_2025FY_TOKIO],
    },
  },

  {
    code: "8725",
    name: "MS&AD インシュアランスグループホールディングス",
    nameEn: "MS&AD Insurance",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "保険業",
    industryCluster: "損害保険",
    priceJpy: 3680,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 54800,
    per: 11.8,
    pbr: 0.92,
    dividendYield: 4.8,
    roe: 8.4,
    operatingMargin: 12.5,
    revenueGrowth3y: 5.2,
    description:
      "三井住友海上・あいおいニッセイ同和損保・三井ダイレクト損保等を傘下に持つ損保大手。国内損保 3 大手の 1 つ、海外比率は東京海上より低い。中古車市場対応・ビッグモーター事案以降の業界改革が課題。",
    oneLiner:
      "国内損保 3 大手の 1 つ。海外展開は東京海上に劣るが、PBR 0.92 倍・配当 4.8% で割安・高配当。ビッグモーター事案以降の代理店改革・組織再編が進行中。",
    tags: [
      { dimension: "product", value: "自動車保険（個人・企業）", source: SRC_2025FY_MSAD },
      { dimension: "product", value: "火災保険", source: SRC_2025FY_MSAD },
      { dimension: "product", value: "海外保険（東南アジア中心）", source: SRC_2025FY_MSAD },
      { dimension: "product", value: "再保険・損保各種", source: SRC_2025FY_MSAD },
      { dimension: "customer", value: "個人・企業・グローバル（東南アジア）", source: SRC_2025FY_MSAD },
      { dimension: "channel", value: "代理店 + ダイレクト", source: SRC_2025FY_MSAD },
      { dimension: "revenue_model", value: "保険料 + 運用収益", source: SRC_2025FY_MSAD },
      { dimension: "value_chain", value: "損保・再保険", source: SRC_2025FY_MSAD },
      { dimension: "geography", value: "日本 68%・アジア 18%・北米 8%・欧州 6%", source: SRC_2025FY_MSAD },
    ],
    segments: [
      { name: "国内損保（三井住友海上）", revenueOku: 22000, share: 50.0, operatingMargin: 12.5 },
      { name: "国内損保（あいおいニッセイ）", revenueOku: 10000, share: 22.7, operatingMargin: 10.8 },
      { name: "海外保険", revenueOku: 9000, share: 20.5, operatingMargin: 15.5 },
      { name: "国内生保・金融", revenueOku: 3000, share: 6.8, operatingMargin: 9.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 35, mature: 55, decline: 10 },
    phaseRationale:
      "ビッグモーター事案（2023）以降の業界信頼回復・代理店改革で衰退期スコア 10。海外展開は東京海上より遅く、ROE 8.4% は損保業界中位。",
    factorBetas: {
      usdjpy: 0.42,
      us10y: 0.38,
      oil: -0.08,
      sox: 0.12,
      china: 0.22,
      market: 0.85,
      size: 0.12,
      value: 0.72,
      momentum: 0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ビッグモーター事案以降の代理店改革で『損保業界全体』の構造変化",
        body:
          "2023 年のビッグモーター事案で MS&AD・損保ジャパン・東京海上の 3 社が業務改善命令。この事案以降、代理店契約の見直し・コンプライアンス強化・代理店手数料体系の透明化が業界全体で進行。短期は事務コスト増だが、長期では『健全な代理店ネットワーク』の確立につながる構造変化。",
        citations: [SRC_2025FY_MSAD],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "東京海上との海外戦略差が ROE 格差（8.4% vs 13.5%）の主因",
        body:
          "MS&AD の海外比率 32% に対し、東京海上は 50% 超。海外保険の利益率は国内より高く（東京海上 20.5% vs MS&AD 15.5%）、海外比率の差が ROE 格差を生んでいる。MS&AD の海外 M&A 加速が次の評価軸、東南アジア中心の戦略が成功するかが鍵。",
        citations: [SRC_2025FY_MSAD],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "配当 4.8% は損保業界最高水準、累進配当で下値の支え",
        body:
          "MS&AD は配当性向 50% 超を目標、累進配当（減配しない）方針を継続。配当 4.8% は損保業界最高、新 NISA 流入の受け皿として個人投資家に人気。利上げで運用収益も拡大、配当の継続性は構造的に安定。",
        citations: [SRC_2025FY_MSAD],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 58,
      rationale:
        "PER 11.8 倍・PBR 0.92 倍は損保業界中位で、配当 4.8% は最高水準。ビッグモーター事案からの回復・海外戦略加速で上値余地、配当で下値支え。",
      citations: [SRC_2025FY_MSAD],
    },
  },

  // ───────────────────────────────────────────
  // 不動産クラスタ（5 銘柄）
  // 3 大デベロッパー（三井・三菱地所・住友）+ 住宅 2 社（大和ハウス・積水ハウス）。
  // 日銀利上げの逆受益者（金利上昇 = 不動産マイナス）と思われがちだが、
  // インフレ局面で賃料・資産価値が上昇するため、長期的にはインフレ恩恵もある。
  // ───────────────────────────────────────────
  {
    code: "8801",
    name: "三井不動産",
    nameEn: "Mitsui Fudosan",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "不動産業",
    industryCluster: "総合不動産",
    priceJpy: 1480,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 41200,
    per: 13.5,
    pbr: 0.95,
    dividendYield: 2.4,
    roe: 7.2,
    operatingMargin: 11.8,
    revenueGrowth3y: 7.4,
    description:
      "日本最大の総合デベロッパー。オフィス（日本橋・八重洲）、商業（ららぽーと・三井アウトレットパーク）、ホテル（東京ガーデンテラス紀尾井町）、住宅（パークホームズ）、物流、海外（米国・英国）まで多角展開。",
    oneLiner:
      "日本最大の総合デベロッパー。日本橋・八重洲の再開発、ららぽーと、ホテル、海外不動産まで展開。インバウンド回復と都心開発の象徴的存在。",
    tags: [
      { dimension: "product", value: "オフィスビル（日本橋・八重洲・大手町）", source: SRC_2025FY_MITSUI_F },
      { dimension: "product", value: "商業施設（ららぽーと・三井アウトレット）", source: SRC_2025FY_MITSUI_F },
      { dimension: "product", value: "住宅（パークホームズ・パークシティ）", source: SRC_2025FY_MITSUI_F },
      { dimension: "product", value: "ホテル・リゾート", source: SRC_2025FY_MITSUI_F },
      { dimension: "product", value: "海外不動産（米国・英国）", source: SRC_2025FY_MITSUI_F },
      { dimension: "customer", value: "オフィステナント・個人購入者・観光客", source: SRC_2025FY_MITSUI_F },
      { dimension: "channel", value: "直接賃貸 + 仲介 + 分譲", source: SRC_2025FY_MITSUI_F },
      { dimension: "revenue_model", value: "賃貸収入 + 分譲売上 + 開発益", source: SRC_2025FY_MITSUI_F },
      { dimension: "value_chain", value: "開発 → 賃貸 → 売却（バリューチェーン全体）", source: SRC_2025FY_MITSUI_F },
      { dimension: "geography", value: "日本 82%・米国 12%・英国 4%・その他 2%", source: SRC_2025FY_MITSUI_F },
    ],
    segments: [
      { name: "賃貸（オフィス・商業）", revenueOku: 9500, share: 35.2, operatingMargin: 28.5 },
      { name: "分譲（住宅・投資家向け）", revenueOku: 11500, share: 42.6, operatingMargin: 8.4 },
      { name: "マネジメント・仲介", revenueOku: 3500, share: 13.0, operatingMargin: 18.5 },
      { name: "ホテル・リゾート", revenueOku: 1800, share: 6.7, operatingMargin: 14.5 },
      { name: "その他（物流・海外）", revenueOku: 700, share: 2.6, operatingMargin: 12.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 48, mature: 52, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +7.4% で拡大期色強い。日本橋・八重洲再開発、海外事業拡大、インバウンド回復で複数のドライバー。日銀利上げは逆風だがインフレ恩恵で相殺。",
    factorBetas: {
      usdjpy: 0.32,
      us10y: -0.62,
      oil: -0.18,
      sox: 0.18,
      china: 0.22,
      market: 1.05,
      size: -0.32,
      value: 0.62,
      momentum: 0.38,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "日銀利上げ感応度は『マイナス』だが、インフレ局面では賃料上昇で相殺",
        body:
          "10 年国債利回り 1% 上昇でデベロッパー株は平均 -10-15% 下落する歴史的傾向。一方、インフレ局面では都心オフィス賃料が年率 +3-5% で上昇、商業施設の売上歩合賃料も拡大。三井不動産は『金利上昇』と『インフレ』の合成感応度で見るべき銘柄。インフレ率 2% 超 + 利上げ 1% なら、純利益への影響はネット中立～ややプラス。",
        citations: [SRC_2025FY_MITSUI_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "日本橋・八重洲再開発（2027-30 年竣工）が長期成長エンジン",
        body:
          "三井不動産は日本橋エリア（COREDO シリーズ + 日本橋一丁目中地区）、八重洲エリア（東京ミッドタウン八重洲）で総額 1 兆円超の再開発を推進。2027-30 年竣工で完成後の賃料収入年間 +1,500-2,000 億円規模が見込める。完成タイミングの株価織り込み度が中期の評価軸。",
        citations: [SRC_2025FY_MITSUI_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "海外不動産（米国・英国）は『分散投資』として中長期の安定収益源",
        body:
          "三井不動産は米国（ニューヨーク 50 ハドソンヤード等）・英国（ロンドン）で開発・賃貸事業を展開、海外売上比率 18%。米国住宅市場の好況・ロンドン金融街の再評価で、海外事業の利益貢献は 2025-30 年でさらに拡大見込み。日本国内市場の縮小を補う長期成長エンジン。",
        citations: [SRC_2025FY_MITSUI_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 52,
      rationale:
        "PER 13.5 倍・PBR 0.95 倍は不動産業界平均並み、ROE 7.2% / 売上成長 7.4% を考慮すれば妥当圏。日本橋・八重洲再開発完成タイミングで再評価余地。",
      citations: [SRC_2025FY_MITSUI_F],
    },
  },

  {
    code: "8802",
    name: "三菱地所",
    nameEn: "Mitsubishi Estate",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "不動産業",
    industryCluster: "総合不動産",
    priceJpy: 2380,
    priceDate: "2026-05-26",
    changePct: 0.65,
    marketCapOku: 32500,
    per: 16.2,
    pbr: 1.18,
    dividendYield: 1.8,
    roe: 7.8,
    operatingMargin: 13.2,
    revenueGrowth3y: 6.8,
    description:
      "丸の内地区の最大オーナー、東京駅周辺 30 棟超のオフィスビルを保有。プレミアム・オフィス特化型のデベロッパーで、賃料単価は業界最高水準。Marunouchi 街区の長期再開発計画を継続。",
    oneLiner:
      "丸の内・大手町の最大オーナー。プレミアムオフィス特化で賃料単価業界最高、伝統的な『丸の内ブランド』が強み。日銀利上げに最も敏感な銘柄の 1 つ。",
    tags: [
      { dimension: "product", value: "プレミアムオフィス（丸の内・大手町）", source: SRC_2025FY_MEC },
      { dimension: "product", value: "商業施設（丸ビル・新丸ビル・KITTE）", source: SRC_2025FY_MEC },
      { dimension: "product", value: "ホテル（丸の内ホテル等）", source: SRC_2025FY_MEC },
      { dimension: "product", value: "住宅（ザ・パークハウス）", source: SRC_2025FY_MEC },
      { dimension: "product", value: "海外不動産（米国・英国）", source: SRC_2025FY_MEC },
      { dimension: "customer", value: "大手金融・コンサル・グローバル企業", source: SRC_2025FY_MEC },
      { dimension: "channel", value: "直接賃貸", source: SRC_2025FY_MEC },
      { dimension: "revenue_model", value: "プレミアム賃料 + 分譲売上", source: SRC_2025FY_MEC },
      { dimension: "value_chain", value: "丸の内特化型・長期保有モデル", source: SRC_2025FY_MEC },
      { dimension: "geography", value: "日本 88%・米国 8%・英国 3%・その他 1%", source: SRC_2025FY_MEC },
    ],
    segments: [
      { name: "丸の内オフィス賃貸", revenueOku: 5800, share: 38.4, operatingMargin: 32.5 },
      { name: "分譲（住宅・投資家）", revenueOku: 5500, share: 36.4, operatingMargin: 11.5 },
      { name: "商業施設・ホテル", revenueOku: 2200, share: 14.6, operatingMargin: 18.5 },
      { name: "海外事業", revenueOku: 1100, share: 7.3, operatingMargin: 14.5 },
      { name: "投資マネジメント", revenueOku: 500, share: 3.3, operatingMargin: 32.0 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 42, mature: 58, decline: 0 },
    phaseRationale:
      "成熟期色濃いが、丸の内 100 年計画・常盤橋プロジェクト（Torch Tower）で拡大期色も。賃料単価は業界最高で、安定収益型の代表。",
    factorBetas: {
      usdjpy: 0.28,
      us10y: -0.78,
      oil: -0.15,
      sox: 0.18,
      china: 0.18,
      market: 1.02,
      size: -0.28,
      value: 0.42,
      momentum: 0.32,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "10 年国債利回り感応度（-0.78）が不動産業界最大級、日銀利上げの最大の被害者",
        body:
          "三菱地所の US10Y ベータ -0.78 は不動産業界最大級、日銀利上げサイクル（2024-26 年）で株価が圧迫される構造。PER 16.2 倍はプレミアム水準だが、利上げ進行で 12-13 倍への切り下げリスク。丸の内ブランドの安定性と利上げ感応度のバランスが投資判断の核心。",
        citations: [SRC_2025FY_MEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "Torch Tower（常盤橋・2028 年竣工）は日本一の超高層ビル、丸の内ブランドの拡張",
        body:
          "Torch Tower は高さ 390m、日本一の超高層ビル（2028 年竣工予定）。総事業費 1.2 兆円規模、完成後の賃料収入年間 +700-900 億円が見込める。丸の内ブランドを東京駅東側にも拡張、グローバル金融機関の本社誘致を狙う。完成タイミングが投資家最重要 KPI。",
        citations: [SRC_2025FY_MEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "丸の内オフィス空室率 2% 台は『プレミアム需要の象徴』、賃料引き上げ余地大",
        body:
          "丸の内・大手町エリアのオフィス空室率は 2% 台（東京全体 5-6%）、プレミアム需要が継続。賃料単価は東京で最高水準（坪 40,000 円超）だが、グローバル金融機関の集積で引き上げ余地は残る。賃料単価 +5% で営業利益 +290 億円規模の感応度。",
        citations: [SRC_2025FY_MEC],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 38,
      rationale:
        "PER 16.2 倍・PBR 1.18 倍は不動産業界やや高め、丸の内ブランドのプレミアムを織り込んだ水準。日銀利上げで PER 切り下げリスク。",
      citations: [SRC_2025FY_MEC],
    },
  },

  {
    code: "8830",
    name: "住友不動産",
    nameEn: "Sumitomo Realty & Development",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "不動産業",
    industryCluster: "総合不動産",
    priceJpy: 5280,
    priceDate: "2026-05-26",
    changePct: 0.32,
    marketCapOku: 24800,
    per: 11.5,
    pbr: 1.05,
    dividendYield: 1.9,
    roe: 9.4,
    operatingMargin: 22.5,
    revenueGrowth3y: 5.8,
    description:
      "六本木グランドタワー・新宿の住友三角ビル等、東京都心の自社開発オフィスビルを多数保有。3 大デベロッパーで最も賃貸事業比率が高く、営業利益率 22.5% は業界トップ。",
    oneLiner:
      "東京都心オフィスビルの大手オーナー。3 大デベロッパーで最も賃貸事業比率が高く、営業利益率 22.5% は業界トップ。安定収益型の代表。",
    tags: [
      { dimension: "product", value: "オフィスビル（新宿・六本木・都心）", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "product", value: "住宅（シティタワー・シティハウス）", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "product", value: "リフォーム（住友不動産のリフォーム）", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "product", value: "ホテル（ヴィラフォンテーヌ）", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "customer", value: "オフィステナント・個人購入者", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "channel", value: "直接賃貸 + 分譲 + 仲介", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "revenue_model", value: "賃貸収入中心（賃貸 50% 超）", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "value_chain", value: "自社開発 → 長期保有型", source: SRC_2025FY_SUMITOMO_F },
      { dimension: "geography", value: "日本 100%（国内特化）", source: SRC_2025FY_SUMITOMO_F },
    ],
    segments: [
      { name: "不動産賃貸（オフィス中心）", revenueOku: 4500, share: 50.6, operatingMargin: 38.5 },
      { name: "不動産販売（住宅）", revenueOku: 2800, share: 31.5, operatingMargin: 11.5 },
      { name: "完成工事・リフォーム", revenueOku: 1100, share: 12.4, operatingMargin: 8.4 },
      { name: "不動産流通・その他", revenueOku: 500, share: 5.6, operatingMargin: 12.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 32, mature: 68, decline: 0 },
    phaseRationale:
      "成熟期、長期保有型のオフィス賃貸モデルで安定収益。営業利益率 22.5% は業界トップ。海外展開なしで国内特化が独自ポジション。",
    factorBetas: {
      usdjpy: 0.18,
      us10y: -0.68,
      oil: -0.12,
      sox: 0.15,
      china: 0.12,
      market: 0.95,
      size: 0.18,
      value: 0.62,
      momentum: 0.22,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "営業利益率 22.5% は不動産業界トップ、賃貸事業特化の構造優位",
        body:
          "賃貸事業比率 50% 超は 3 大デベロッパーで最高、賃貸事業の営業利益率 38.5% が全社利益を押し上げる。三井不動産 28.5%・三菱地所 32.5% より高く、長期保有モデルで減価償却完了済みの物件比率が高い。これが ROE 9.4%（3 大デベ最高）を支える。",
        citations: [SRC_2025FY_SUMITOMO_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "海外展開ゼロは『リスク回避』だが『成長機会の喪失』でもある",
        body:
          "住友不動産は海外展開がほぼゼロ、3 大デベロッパーで唯一の国内特化。為替リスク・地政学リスクを完全に回避できる一方、日本国内市場の縮小（人口減・オフィス需要減）に対する分散がない。長期的に他 2 社との成長率格差が拡大する可能性。",
        citations: [SRC_2025FY_SUMITOMO_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "リフォーム事業（住友不動産のリフォーム）が『隠れた成長エンジン』",
        body:
          "リフォーム事業は売上 1,100 億円規模で業界 3 位、住宅ストック市場（中古住宅）の拡大で構造的成長期。新築需要は人口減で縮小するが、既存ストックのリノベーション需要は拡大、住友のシェア拡大余地大。短期的な収益貢献は限定的だが、5-10 年で柱に育つ可能性。",
        citations: [SRC_2025FY_SUMITOMO_F],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 11.5 倍・PBR 1.05 倍は不動産業界平均並み、ROE 9.4% / 営業利益率 22.5% で質高。日銀利上げで PER 切り下げリスクあるが、賃貸モデルの安定性で下値硬い。",
      citations: [SRC_2025FY_SUMITOMO_F],
    },
  },

  {
    code: "1925",
    name: "大和ハウス工業",
    nameEn: "Daiwa House Industry",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "建設業",
    industryCluster: "住宅・建設",
    priceJpy: 4280,
    priceDate: "2026-05-26",
    changePct: 0.45,
    marketCapOku: 27800,
    per: 9.8,
    pbr: 1.08,
    dividendYield: 3.4,
    roe: 11.5,
    operatingMargin: 8.4,
    revenueGrowth3y: 6.2,
    description:
      "戸建住宅・賃貸住宅・マンションから商業施設・物流施設・ホテル・海外（米国・東南アジア）まで多角展開する日本最大の住宅・不動産会社。物流施設（DPL シリーズ）で 1.5 兆円規模の資産を保有。",
    oneLiner:
      "日本最大の住宅会社。戸建・賃貸・マンション・商業・物流・海外まで多角展開、物流施設では国内トップ級。E-commerce 拡大で物流施設の構造的需要拡大が追い風。",
    tags: [
      { dimension: "product", value: "戸建住宅（xevoΣ・PREMIUM）", source: SRC_2025FY_DAIWA_H },
      { dimension: "product", value: "賃貸住宅（D-room）", source: SRC_2025FY_DAIWA_H },
      { dimension: "product", value: "マンション（プレミスト）", source: SRC_2025FY_DAIWA_H },
      { dimension: "product", value: "商業・物流施設（DPL シリーズ）", source: SRC_2025FY_DAIWA_H },
      { dimension: "product", value: "海外不動産（米国・東南アジア）", source: SRC_2025FY_DAIWA_H },
      { dimension: "customer", value: "個人・法人・投資家", source: SRC_2025FY_DAIWA_H },
      { dimension: "channel", value: "直接販売 + 仲介", source: SRC_2025FY_DAIWA_H },
      { dimension: "revenue_model", value: "住宅請負 + 分譲 + 賃貸 + 開発益", source: SRC_2025FY_DAIWA_H },
      { dimension: "value_chain", value: "総合住宅・不動産（垂直統合）", source: SRC_2025FY_DAIWA_H },
      { dimension: "geography", value: "日本 78%・米国 14%・アジア 6%・欧州 2%", source: SRC_2025FY_DAIWA_H },
    ],
    segments: [
      { name: "戸建住宅", revenueOku: 12000, share: 22.6, operatingMargin: 5.4 },
      { name: "賃貸住宅", revenueOku: 11500, share: 21.7, operatingMargin: 9.2 },
      { name: "マンション", revenueOku: 4500, share: 8.5, operatingMargin: 7.5 },
      { name: "商業・物流施設", revenueOku: 17500, share: 33.0, operatingMargin: 11.5 },
      { name: "建築請負（医療・福祉・産業）", revenueOku: 5500, share: 10.4, operatingMargin: 8.2 },
      { name: "海外", revenueOku: 2000, share: 3.8, operatingMargin: 6.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 52, mature: 48, decline: 0 },
    phaseRationale:
      "売上 3 年 CAGR +6.2%、物流施設の構造的成長で拡大期色強い。ROE 11.5% は不動産業界中位上位。住宅市場縮小局面でも、物流・海外で補う構造。",
    factorBetas: {
      usdjpy: 0.45,
      us10y: -0.42,
      oil: -0.22,
      sox: 0.15,
      china: 0.22,
      market: 0.98,
      size: -0.18,
      value: 0.52,
      momentum: 0.42,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "物流施設（DPL）1.5 兆円規模は『E-commerce 拡大の最大受益者』",
        body:
          "大和ハウスの物流施設保有額は約 1.5 兆円、国内トップ級。Amazon・楽天・Yahoo 等の e-commerce 拡大で物流施設の需要は構造的拡大、賃料単価も上昇基調。物流施設の利益率 11.5% は商業・物流セグメントの牽引役、今後 5-10 年でさらに比率拡大の可能性。",
        citations: [SRC_2025FY_DAIWA_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "日本国内住宅市場は構造的縮小、海外展開と物流シフトで補う戦略",
        body:
          "日本の戸建住宅着工戸数は年率 -3-5% で縮小中（人口減・若者離れ）。大和ハウスは戸建依存度を下げて、物流施設（DPL）・海外（米国住宅・東南アジア）に経営資源シフト。短期では構造転換コストだが、長期では多角化による安定収益確保。",
        citations: [SRC_2025FY_DAIWA_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "PER 9.8 倍は『戸建住宅イメージ』のディスカウント、物流・海外の再評価余地",
        body:
          "PER 9.8 倍は不動産業界平均より低め、市場が大和ハウスを依然『戸建住宅会社』として評価している証左。実際は物流施設・海外不動産の比率が拡大し、事業構造は『総合不動産・物流デベロッパー』に近づいている。事業構造変化が市場に浸透すれば PER 12-14 倍への戻り余地。",
        citations: [SRC_2025FY_DAIWA_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 60,
      rationale:
        "PER 9.8 倍は不動産業界中で低位、ROE 11.5% / 物流・海外成長を考慮すれば割安。事業構造変化が浸透すれば PER 12-14 倍への戻り余地、配当 3.4% も支え。",
      citations: [SRC_2025FY_DAIWA_H],
    },
  },

  {
    code: "1928",
    name: "積水ハウス",
    nameEn: "Sekisui House",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "建設業",
    industryCluster: "住宅・建設",
    priceJpy: 3580,
    priceDate: "2026-05-26",
    changePct: 0.62,
    marketCapOku: 24500,
    per: 10.5,
    pbr: 1.18,
    dividendYield: 3.6,
    roe: 11.8,
    operatingMargin: 9.5,
    revenueGrowth3y: 5.4,
    description:
      "戸建住宅・賃貸住宅の業界 2 位、米国 MDC Holdings 買収（2024）で海外住宅事業を大幅強化。日本国内では『シャーウッド』『イズ・シリーズ』のプレミアム戸建が主力、住友林業・三井ホームと並ぶプレミアム住宅御三家。",
    oneLiner:
      "日本の住宅大手 2 位、プレミアム戸建が主力。米 MDC Holdings 買収（2024、5,500 億円規模）で海外住宅事業を大幅強化、米国住宅市場への本格参入で構造変化。",
    tags: [
      { dimension: "product", value: "戸建住宅（シャーウッド・イズ）", source: SRC_2025FY_SEKISUI_H },
      { dimension: "product", value: "賃貸住宅（シャーメゾン）", source: SRC_2025FY_SEKISUI_H },
      { dimension: "product", value: "リフォーム・リノベーション", source: SRC_2025FY_SEKISUI_H },
      { dimension: "product", value: "海外住宅（米国 MDC Holdings・豪州・中国）", source: SRC_2025FY_SEKISUI_H },
      { dimension: "customer", value: "個人（プレミアム層）", source: SRC_2025FY_SEKISUI_H },
      { dimension: "channel", value: "直接販売（営業所網）", source: SRC_2025FY_SEKISUI_H },
      { dimension: "revenue_model", value: "住宅請負 + 分譲 + 賃貸", source: SRC_2025FY_SEKISUI_H },
      { dimension: "value_chain", value: "戸建住宅特化 + 海外展開", source: SRC_2025FY_SEKISUI_H },
      { dimension: "geography", value: "日本 72%・米国 22%・豪州 4%・その他 2%", source: SRC_2025FY_SEKISUI_H },
    ],
    segments: [
      { name: "戸建住宅", revenueOku: 9500, share: 26.4, operatingMargin: 7.8 },
      { name: "賃貸住宅", revenueOku: 8500, share: 23.6, operatingMargin: 11.5 },
      { name: "建築・土木", revenueOku: 5500, share: 15.3, operatingMargin: 6.5 },
      { name: "リフォーム", revenueOku: 1800, share: 5.0, operatingMargin: 12.8 },
      { name: "不動産フィー", revenueOku: 2700, share: 7.5, operatingMargin: 15.5 },
      { name: "海外（MDC 含む）", revenueOku: 8000, share: 22.2, operatingMargin: 9.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 55, mature: 45, decline: 0 },
    phaseRationale:
      "MDC Holdings 買収（2024）で海外比率が一気に拡大、構造変化局面で拡大期色強い。ROE 11.8% は住宅業界トップクラス、プレミアム戸建の高粗利率が支え。",
    factorBetas: {
      usdjpy: 0.62,
      us10y: -0.32,
      oil: -0.18,
      sox: 0.12,
      china: 0.18,
      market: 0.92,
      size: -0.12,
      value: 0.52,
      momentum: 0.48,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "MDC Holdings 買収（2024、約 5,500 億円）が海外戦略の最大の決断",
        body:
          "2024 年に米国住宅大手 MDC Holdings を約 5,500 億円で買収、米国住宅市場での 5 位級プレイヤーに浮上。日本国内住宅市場の縮小に対する分散戦略で、海外売上比率は 12% → 22% に急拡大。米国住宅市場の構造的需要（人口増・住宅不足）が今後 5-10 年で利益貢献を拡大、PER 再評価のドライバー。",
        citations: [SRC_2025FY_SEKISUI_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "プレミアム戸建市場のシェア優位は『高金利でも崩れにくい』構造",
        body:
          "積水ハウスの戸建単価は 6,000-8,000 万円のプレミアム帯（業界平均 4,000 万円）。富裕層の購入は金利上昇の影響を相対的に受けにくく、市場縮小局面でも単価維持が可能。一方、若年層向け戸建は金利上昇で需要減、住宅大手全体ではマイナス圧。シャーウッドの 6,000 万円超単価が長期で強み。",
        citations: [SRC_2025FY_SEKISUI_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
      {
        title: "リフォーム事業（年 1,800 億円）は『住宅ストック市場拡大』の長期受益者",
        body:
          "日本の住宅ストックは 6,000 万戸超で世界有数、これに対し新築需要は年 80 万戸まで縮小中。リフォーム市場は構造的拡大期で、積水ハウスは『シャーウッドを建てた顧客』への継続的リフォーム提案で顧客生涯価値を最大化。短期収益貢献は限定的だが、5-10 年で柱に成長。",
        citations: [SRC_2025FY_SEKISUI_H],
        generatedAt: "2026-05-22T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 56,
      rationale:
        "PER 10.5 倍・PBR 1.18 倍は住宅業界中位、ROE 11.8% / MDC 買収による海外成長を考慮すれば妥当～割安。配当 3.6% で下値支え、米国住宅市場の構造的需要で長期成長余地。",
      citations: [SRC_2025FY_SEKISUI_H],
    },
  },

  // ===== 通信クラスタ（Phase 8-5） =====
  {
    code: "9432",
    name: "日本電信電話",
    nameEn: "Nippon Telegraph and Telephone (NTT)",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "通信",
    priceJpy: 168,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 152000,
    per: 11.2,
    pbr: 1.42,
    dividendYield: 3.2,
    roe: 12.8,
    operatingMargin: 17.5,
    revenueGrowth3y: 4.2,
    description:
      "日本最大の通信事業者。NTT ドコモ（移動通信）、NTT 東日本・西日本（固定通信）、NTT データ（IT サービス）を統括する持株会社。2020 年 ドコモ完全子会社化、2024 年 NTT データ完全子会社化で資本構成を簡素化。IOWN（光技術）への大型投資で次世代通信インフラを狙う。",
    oneLiner:
      "日本最大の通信会社（ドコモ・固定電話・IT データ）。安定配当銘柄の代表格、累進配当を 22 期連続で増配中。次世代光通信 IOWN への投資が長期論点。",
    tags: [
      { dimension: "product", value: "移動通信（ドコモ）", source: SRC_2025FY_NTT },
      { dimension: "product", value: "固定通信（光回線・FTTH）", source: SRC_2025FY_NTT },
      { dimension: "product", value: "IT サービス（NTT データ）", source: SRC_2025FY_NTT },
      { dimension: "product", value: "IOWN（光技術次世代インフラ）", source: SRC_2025FY_NTT },
      { dimension: "customer", value: "個人（モバイル・固定回線）", source: SRC_2025FY_NTT },
      { dimension: "customer", value: "法人（IT サービス・データセンタ）", source: SRC_2025FY_NTT },
      { dimension: "channel", value: "ドコモショップ・代理店網", source: SRC_2025FY_NTT },
      { dimension: "revenue_model", value: "通信料金（月額）+ IT サービス（請負・SI）", source: SRC_2025FY_NTT },
      { dimension: "value_chain", value: "通信インフラ統括（移動・固定・IT 統合）", source: SRC_2025FY_NTT },
      { dimension: "geography", value: "日本 78%・海外 22%（北米中心）", source: SRC_2025FY_NTT },
    ],
    segments: [
      { name: "総合 ICT 事業（ドコモ）", revenueOku: 60000, share: 45.6, operatingMargin: 18.2 },
      { name: "地域通信事業（東西）", revenueOku: 32000, share: 24.3, operatingMargin: 12.5 },
      { name: "グローバル・ソリューション（データ）", revenueOku: 35000, share: 26.6, operatingMargin: 8.4 },
      { name: "その他", revenueOku: 4500, share: 3.4, operatingMargin: 6.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 18, mature: 82, decline: 0 },
    phaseRationale:
      "国内通信市場は完全な成熟期、加入者数 8,500 万でほぼ飽和。NTT データのグローバル拡大と IOWN（光技術）が次世代成長軸で、データ事業比率拡大で再成長余地もあり。22 期連続増配（累進配当）が示す安定キャッシュフロー。",
    factorBetas: {
      usdjpy: 0.25,
      us10y: -0.42,
      oil: -0.05,
      sox: 0.18,
      china: 0.08,
      market: 0.68,
      size: -0.55,
      value: 0.58,
      momentum: -0.05,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "22 期連続増配の『累進配当』政策は配当目的投資家の安全資産化",
        body:
          "NTT は 2003 年以降 22 期連続増配、累進配当（減配しない）を明文化しており、配当目的投資家にとって日本市場最高水準の安全資産。配当性向は 35% 程度で、自社株買い（年 1,000 億円規模）と合わせた総還元性向は 50% 超。10 年国債利回り 1.5% の現状でも、3.2% の配当利回りは利回り魅力で機能。長期保有銘柄の代表格。",
        citations: [SRC_2025FY_NTT],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "IOWN（光技術次世代インフラ）への 1 兆円規模投資が 2030 年代の構造変化点",
        body:
          "IOWN（Innovative Optical and Wireless Network）は光技術で消費電力 1/100・伝送容量 125 倍を狙う次世代通信インフラ構想。2023-2030 年で約 1 兆円規模を投資、AI・データセンタの電力消費爆発を解決する技術として注目。商業展開は 2027-30 年からで、現時点では PER に織り込まれていない。実現すれば NTT の中核技術として超長期成長軸。",
        citations: [SRC_2025FY_NTT],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "NTT データ完全子会社化（2024）で『日本の Accenture』を狙う構造",
        body:
          "2024 年に NTT データを完全子会社化、海外売上比率 60% 超の IT サービス事業を完全統合。グローバル市場では Accenture・TCS・IBM Consulting と競合、日本企業の DX 需要を背景に成長率 +8% 維持。NTT 全体の海外売上比率 22% の大半は NTT データ起因。データ事業利益貢献 26% が次世代の柱として、通信主軸からの構造シフトを推進。",
        citations: [SRC_2025FY_NTT],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 52,
      rationale:
        "PER 11.2 倍・PBR 1.42 倍は通信大手としては妥当圏、ROE 12.8% / 配当 3.2% の質を考慮すれば適正。IOWN・データ事業の長期成長余地に対しては市場が織り込み不足の可能性、累進配当の安全性で下値支えあり。",
      citations: [SRC_2025FY_NTT],
    },
  },

  {
    code: "9433",
    name: "KDDI",
    nameEn: "KDDI Corporation",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "通信",
    priceJpy: 5180,
    priceDate: "2026-05-26",
    changePct: 0.65,
    marketCapOku: 113000,
    per: 12.8,
    pbr: 1.78,
    dividendYield: 3.4,
    roe: 14.2,
    operatingMargin: 18.2,
    revenueGrowth3y: 3.5,
    description:
      "au ブランドの移動通信大手 2 位（シェア約 27%）。三菱商事と連携した『au PAY』『au でんき』『au じぶん銀行』『ローソン買収（2024、三菱商事と折半）』など、生活密着型のサービスポートフォリオを構築。法人向け IoT・DX も成長軸。",
    oneLiner:
      "au ブランドの移動通信 2 位。三菱商事と連携してローソン買収（2024）、通信＋生活密着サービスの『ライフデザイン戦略』が他社差別化。22 期連続増配の累進配当銘柄。",
    tags: [
      { dimension: "product", value: "移動通信（au）", source: SRC_2025FY_KDDI },
      { dimension: "product", value: "固定通信（au ひかり）", source: SRC_2025FY_KDDI },
      { dimension: "product", value: "金融（au PAY・じぶん銀行）", source: SRC_2025FY_KDDI },
      { dimension: "product", value: "エネルギー（au でんき・ガス）", source: SRC_2025FY_KDDI },
      { dimension: "product", value: "コマース（ローソン 50% 出資）", source: SRC_2025FY_KDDI },
      { dimension: "customer", value: "個人（モバイル・生活サービス）", source: SRC_2025FY_KDDI },
      { dimension: "customer", value: "法人（IoT・DX・データセンタ）", source: SRC_2025FY_KDDI },
      { dimension: "channel", value: "au ショップ・量販店", source: SRC_2025FY_KDDI },
      { dimension: "revenue_model", value: "通信料金 + 金融手数料 + コマース", source: SRC_2025FY_KDDI },
      { dimension: "value_chain", value: "通信＋生活密着サービス統合", source: SRC_2025FY_KDDI },
      { dimension: "geography", value: "日本 92%・海外 8%（ミャンマー・モンゴル等）", source: SRC_2025FY_KDDI },
    ],
    segments: [
      { name: "パーソナル（個人通信）", revenueOku: 38000, share: 65.5, operatingMargin: 19.5 },
      { name: "ビジネス（法人）", revenueOku: 14000, share: 24.1, operatingMargin: 14.2 },
      { name: "その他（金融・エネルギー）", revenueOku: 6000, share: 10.3, operatingMargin: 12.8 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 30, mature: 70, decline: 0 },
    phaseRationale:
      "国内通信市場の成熟は NTT と同じだが、ライフデザイン（金融・エネルギー・コマース）戦略で新セグメント成長余地大。ローソン買収（2024）で年間 +1,200 億円の利益貢献見込み、構造シフトで拡大期色も残る。",
    factorBetas: {
      usdjpy: 0.18,
      us10y: -0.38,
      oil: -0.08,
      sox: 0.12,
      china: 0.05,
      market: 0.62,
      size: -0.42,
      value: 0.52,
      momentum: 0.12,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "三菱商事 × KDDI のローソン買収（2024）は『通信＋生活』統合戦略の象徴",
        body:
          "2024 年に三菱商事と KDDI が共同でローソンを TOB・非公開化（取得額約 5,000 億円）、KDDI 持分 50%。コンビニ 14,000 店舗を au ブランド経済圏に組み込み、au PAY・au でんき・ローソン Ponta ポイントの相互送客で顧客生涯価値を最大化。通信単独では成熟だが、生活データを統合する戦略で他通信社との差別化を実現。利益貢献は年 +1,200 億円規模、KDDI 連結純利益の +15% 押し上げ要因。",
        citations: [SRC_2025FY_KDDI],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "au 経済圏の MAU 4,800 万人は『LINE ヤフー・楽天』と並ぶ三大経済圏",
        body:
          "au PAY・au ID・Ponta ポイント連動で月間アクティブユーザ 4,800 万人。LINE ヤフー（PayPay）9,500 万、楽天 5,500 万に次ぐ三大経済圏で、ローソン買収でリアル接点が大幅拡大。決済単独では他社に劣るが、通信本業の高 ARPU（月額 6,000-7,000 円）×ローソン日常利用×電力契約のクロスセル比率が業界最高水準。",
        citations: [SRC_2025FY_KDDI],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "Starlink との連携で『山岳・海上』通信エリアが拡大、楽天モバイルへの牽制",
        body:
          "2024 年から SpaceX Starlink と提携、衛星通信でモバイル基地局がカバーしない山岳・海上・離島エリアもサービス可能に。これは楽天モバイル（基地局少なく圏外問題）への対抗策で、特に法人向け（建設・船舶・物流）の差別化要素として機能。米 T-Mobile が Starlink との連携で 100% カバレッジを謳う流れと同期、グローバル衛星通信の波に日本初対応。",
        citations: [SRC_2025FY_KDDI],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 56,
      rationale:
        "PER 12.8 倍・PBR 1.78 倍は通信大手としては妥当～やや割高、ROE 14.2% の質と ローソン買収による成長余地で適正圏。22 期連続増配の安全性、ライフデザイン戦略の独自性で長期投資先として優位。",
      citations: [SRC_2025FY_KDDI],
    },
  },

  {
    code: "9984",
    name: "ソフトバンクグループ",
    nameEn: "SoftBank Group",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "情報・通信業",
    industryCluster: "通信・AI 投資",
    priceJpy: 10850,
    priceDate: "2026-05-26",
    changePct: 2.45,
    marketCapOku: 168000,
    per: 14.2,
    pbr: 1.92,
    dividendYield: 0.4,
    roe: 8.4,
    operatingMargin: 12.5,
    revenueGrowth3y: 6.8,
    description:
      "Arm Holdings（IPO 2023）・SoftBank Vision Fund を中核とする AI 投資持株会社。子会社のソフトバンク株式会社（9434、移動通信）と区別される。OpenAI への大型投資（2024-2025、約 400 億ドル）、Stargate プロジェクトで米国 AI インフラへ最大 5,000 億ドル投資計画。",
    oneLiner:
      "孫正義氏の AI 投資持株会社。Arm（半導体設計）保有・OpenAI に巨額投資・Stargate プロジェクトで米国 AI インフラ最大 5,000 億ドル投資計画。通信会社ではなく『AI 投資ファンド』として理解すべき。",
    tags: [
      { dimension: "product", value: "Arm Holdings（半導体設計・90% 保有）", source: SRC_2025FY_SBG },
      { dimension: "product", value: "SoftBank Vision Fund（VC ファンド）", source: SRC_2025FY_SBG },
      { dimension: "product", value: "OpenAI 大型投資（推定 400 億ドル）", source: SRC_2025FY_SBG },
      { dimension: "product", value: "Stargate（米国 AI インフラ・最大 5,000 億ドル計画）", source: SRC_2025FY_SBG },
      { dimension: "product", value: "ソフトバンク株式会社（移動通信・40% 保有）", source: SRC_2025FY_SBG },
      { dimension: "customer", value: "投資先（テック企業 200 社超）", source: SRC_2025FY_SBG },
      { dimension: "channel", value: "持株会社（直接投資）", source: SRC_2025FY_SBG },
      { dimension: "revenue_model", value: "投資先株式時価評価益 + Arm ライセンス収入", source: SRC_2025FY_SBG },
      { dimension: "value_chain", value: "AI バリューチェーン上流投資（半導体・モデル・インフラ）", source: SRC_2025FY_SBG },
      { dimension: "geography", value: "米国 65%・日本 18%・中国 8%・その他 9%", source: SRC_2025FY_SBG },
    ],
    segments: [
      { name: "Arm（半導体設計）", revenueOku: 18500, share: 28.5, operatingMargin: 38.5 },
      { name: "ソフトバンク（移動通信）", revenueOku: 28000, share: 43.1, operatingMargin: 18.5 },
      { name: "SoftBank Vision Fund", revenueOku: 12500, share: 19.2, operatingMargin: -5.5 },
      { name: "その他（決済・コマース等）", revenueOku: 6000, share: 9.2, operatingMargin: 4.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 35, expansion: 50, mature: 15, decline: 0 },
    phaseRationale:
      "Arm 上場（2023）後の AI 半導体ブーム恩恵 + OpenAI 投資・Stargate プロジェクトで完全に新成長サイクル局面。投資先評価益の振れで業績ボラ高いが、AI 時代の上流投資ポジションで創業期色も再帯び。",
    factorBetas: {
      usdjpy: 1.85,
      us10y: -0.85,
      oil: -0.22,
      sox: 2.45,
      china: 0.95,
      market: 1.42,
      size: 0.35,
      value: -0.78,
      momentum: 1.28,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Arm Holdings の時価（推定 16-18 兆円）が SBG 純資産価値の半分超を占める",
        body:
          "Arm Holdings（NASDAQ: ARM）は 2023 年 9 月上場、AI 半導体設計の独占的プラットフォーマー。SBG の保有比率約 90%、時価ベース保有価値は 2026 年現在で 16-18 兆円規模（Arm 時価 17-20 兆円）。SBG 自身の時価 16.8 兆円を超える計算で、Arm 保有だけで SBG の時価評価が説明できる構造。Arm 株価の SOX 連動性（β 2.5）が SBG の株価ボラの最大要因。",
        citations: [SRC_2025FY_SBG],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "OpenAI 大型投資（推定 400 億ドル）は AI 上流バリューチェーン制圧の戦略的一手",
        body:
          "2024-2025 年に SoftBank Vision Fund を通じて OpenAI に推定 400 億ドル投資、OpenAI 評価額 3,000 億ドル時の最大級出資者の一つ。OpenAI 株式（非上場）の時価評価益がファンド業績を直接押し上げる構造。さらに Stargate プロジェクト（OpenAI・SBG・Oracle・MGX 共同、米国 AI インフラ最大 5,000 億ドル計画）で『モデル＋インフラ＋半導体（Arm）』の三位一体ポジションを構築。",
        citations: [SRC_2025FY_SBG],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "SBG の真の論点は『株価 vs 純資産価値（NAV）ディスカウント』",
        body:
          "SBG は『投資先時価合計（NAV、約 35 兆円）の半分以下で株価が推移』する構造的ディスカウント銘柄。市場の認識は『孫氏が投資判断を誤るリスク』『Vision Fund 損失リスク』『中国投資先の地政学リスク』を 50% 程度織り込み。Arm 上場成功で一時的にディスカウント縮小も、OpenAI・Stargate の成果次第で再評価余地大。短期投資ではボラ高、長期投資では NAV 接近で 2 倍化余地。",
        citations: [SRC_2025FY_SBG],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 50,
      rationale:
        "PER 14.2 倍は持株会社として表面的に高めだが、NAV ベースでは 50% ディスカウント水準。Arm 時価変動が支配的要素で、SOX ベータ 2.45 と AI 投資ファンド性格を考慮すれば妥当～やや割高。短期ボラ覚悟で OpenAI・Stargate 成果次第の宝くじ性格を持つ。",
      citations: [SRC_2025FY_SBG],
    },
  },

  {
    code: "4755",
    name: "楽天グループ",
    nameEn: "Rakuten Group",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "サービス業",
    industryCluster: "EC・通信",
    priceJpy: 1085,
    priceDate: "2026-05-26",
    changePct: 1.85,
    marketCapOku: 22500,
    per: 0,
    pbr: 1.42,
    dividendYield: 0.0,
    roe: -8.5,
    operatingMargin: -2.5,
    revenueGrowth3y: 8.2,
    description:
      "EC（楽天市場）を起点に、楽天モバイル（移動通信）・楽天銀行・楽天証券・楽天カード・楽天 Edy・楽天トラベル等を統合した『楽天経済圏』運営。楽天モバイル赤字（年 -3,000 億円規模）が連結純利益を圧迫、EC・金融の本業利益がモバイル赤字を相殺する構造。",
    oneLiner:
      "EC（楽天市場）×モバイル×金融の経済圏型企業。楽天モバイル赤字（年 -3,000 億円）が業績を圧迫しているが、ARPU 上昇・基地局増強で 2026-27 年黒字化の道筋。MAU 5,500 万人で日本 EC 2 位。",
    tags: [
      { dimension: "product", value: "EC（楽天市場・楽天ブックス）", source: SRC_2025FY_RAKUTEN },
      { dimension: "product", value: "移動通信（楽天モバイル）", source: SRC_2025FY_RAKUTEN },
      { dimension: "product", value: "金融（楽天銀行・証券・カード・Edy）", source: SRC_2025FY_RAKUTEN },
      { dimension: "product", value: "デジタルコンテンツ（楽天 TV・Kobo）", source: SRC_2025FY_RAKUTEN },
      { dimension: "product", value: "トラベル・チケット", source: SRC_2025FY_RAKUTEN },
      { dimension: "customer", value: "個人（EC・モバイル・金融）", source: SRC_2025FY_RAKUTEN },
      { dimension: "channel", value: "オンライン（楽天 ID 経済圏）", source: SRC_2025FY_RAKUTEN },
      { dimension: "revenue_model", value: "EC 手数料 + モバイル料金 + 金融手数料", source: SRC_2025FY_RAKUTEN },
      { dimension: "value_chain", value: "EC × モバイル × 金融経済圏統合", source: SRC_2025FY_RAKUTEN },
      { dimension: "geography", value: "日本 88%・海外 12%（Kobo 米国・欧州）", source: SRC_2025FY_RAKUTEN },
    ],
    segments: [
      { name: "インターネットサービス（EC）", revenueOku: 12500, share: 53.2, operatingMargin: 8.5 },
      { name: "フィンテック（銀行・証券・カード）", revenueOku: 8500, share: 36.2, operatingMargin: 24.5 },
      { name: "モバイル（楽天モバイル）", revenueOku: 5500, share: 23.4, operatingMargin: -54.5 },
      { name: "セグメント間調整", revenueOku: -2980, share: -12.7, operatingMargin: 0 },
    ],
    segmentsPeriod: "2025/12",
    phaseScores: { launch: 25, expansion: 45, mature: 30, decline: 0 },
    phaseRationale:
      "EC は成熟だが、楽天モバイルが拡大期（赤字縮小局面）。フィンテック（楽天銀行 IPO 2023）が大きく成長中、楽天モバイル黒字化シナリオが現実化すれば 2027-28 年に全体構造変化期入り。",
    factorBetas: {
      usdjpy: 0.62,
      us10y: -0.55,
      oil: -0.08,
      sox: 0.42,
      china: 0.18,
      market: 1.25,
      size: 0.18,
      value: -0.32,
      momentum: 0.85,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "楽天モバイル赤字（年 -3,000 億円）の黒字化タイミングが最大の株価要因",
        body:
          "楽天モバイルは 2020 年 4 月サービス開始、5 年間で累計 1.5 兆円超の投資。2025 年時点で契約数 800 万、ARPU 2,200 円（NTT・KDDI は 6,000-7,000 円）で赤字続く。基地局カバレッジ拡大（2024 年人口カバレッジ 99.9% 達成）・ARPU 上昇（プラチナバンド獲得 2024）で 2026-27 年の単月黒字、2028 年通期黒字を計画。黒字化実現すれば株価 2 倍化余地。逆に遅延・赤字継続なら資金繰りリスク再燃。",
        citations: [SRC_2025FY_RAKUTEN],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "楽天銀行・楽天証券の好業績が連結赤字を支える『隠れた金鉱』",
        body:
          "楽天銀行（2023 上場、預金残高 12 兆円超）と楽天証券（口座数 1,200 万）の金融セグメントは営業利益率 24.5% の好業績。フィンテック単独では PER 15-20 倍の評価額で、連結時価 22,500 億円の半分以上を説明できる隠れた価値。楽天モバイル黒字化シナリオに加えて、フィンテック単独評価でも下値堅い。",
        citations: [SRC_2025FY_RAKUTEN],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "楽天経済圏 MAU 5,500 万・楽天 ID 1.1 億は LINE ヤフー（PayPay）への対抗軸",
        body:
          "楽天 ID 累計 1.1 億、月間アクティブ 5,500 万、楽天ポイント年発行額 6,000 億円で日本最大級の経済圏。クロスユース率 70% 超（複数サービス利用）でロイヤルティ高。LINE ヤフー（PayPay 9,500 万）に MAU で劣るが、購買データ × 金融データの結合密度では業界トップ。AI レコメンド・与信判断での収益化余地大。",
        citations: [SRC_2025FY_RAKUTEN],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 48,
      rationale:
        "現状赤字（ROE -8.5%）で PER 表記不能。フィンテック単独評価（推定 15,000 億円）+ EC 評価（推定 8,000 億円）+ モバイル黒字化オプション（推定 0-15,000 億円）の SOTP 評価で時価 22,500 億円はモバイル黒字化を 30% 程度織り込み済み。黒字化シナリオ確度上昇で上値、遅延で下値。",
      citations: [SRC_2025FY_RAKUTEN],
    },
  },

  // ===== 化学・素材クラスタ（Phase 8-6） =====
  {
    code: "4188",
    name: "三菱ケミカルグループ",
    nameEn: "Mitsubishi Chemical Group",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "化学",
    industryCluster: "総合化学",
    priceJpy: 968,
    priceDate: "2026-05-26",
    changePct: 0.85,
    marketCapOku: 14600,
    per: 14.5,
    pbr: 0.92,
    dividendYield: 3.8,
    roe: 6.8,
    operatingMargin: 5.5,
    revenueGrowth3y: -1.2,
    description:
      "国内最大の総合化学メーカー。MMA（メタクリル樹脂、世界シェア 1 位）・ポリカーボネート・フィルム等の機能性化学と、田辺三菱製薬（医薬）・大陽日酸（産業ガス、現 Nippon Sanso Holdings 旧名）を傘下に持つ。スチレン事業など汎用化学の構造不況からのポートフォリオ転換が長期テーマ。",
    oneLiner:
      "国内最大の総合化学メーカー。MMA で世界トップ、ただし汎用化学の構造不況で利益率低位。スチレン・コークス事業の売却検討など事業ポートフォリオ転換が長期テーマ、PBR 0.92 倍と業界最割安水準。",
    tags: [
      { dimension: "product", value: "MMA（メタクリル樹脂、世界シェア 1 位）", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "product", value: "ポリカーボネート・エンプラ", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "product", value: "産業ガス（Nippon Sanso、子会社）", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "product", value: "医薬品（田辺三菱製薬、子会社）", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "product", value: "炭素材料（コークス・カーボンブラック）", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "product", value: "石化原料（スチレン・基礎化学）", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "customer", value: "化学メーカー・電子・自動車・建設", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "channel", value: "B2B 直販 + 商社", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "revenue_model", value: "素材・化学品販売", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "value_chain", value: "汎用化学 + 機能性化学 + 医薬 + 産業ガスの総合", source: SRC_2025FY_MITSUBISHI_CHEM },
      { dimension: "geography", value: "日本 48%・アジア 26%・北米 16%・欧州 10%", source: SRC_2025FY_MITSUBISHI_CHEM },
    ],
    segments: [
      { name: "MMA・機能性化学", revenueOku: 12000, share: 26.5, operatingMargin: 8.5 },
      { name: "石化（スチレン・基礎化学）", revenueOku: 9500, share: 21.0, operatingMargin: 1.5 },
      { name: "産業ガス（Nippon Sanso）", revenueOku: 12500, share: 27.6, operatingMargin: 12.5 },
      { name: "医薬品（田辺三菱）", revenueOku: 3800, share: 8.4, operatingMargin: 8.2 },
      { name: "炭素・素材", revenueOku: 5500, share: 12.2, operatingMargin: -2.5 },
      { name: "ライフサイエンス・その他", revenueOku: 1900, share: 4.2, operatingMargin: 3.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 15, mature: 65, decline: 20 },
    phaseRationale:
      "汎用化学（スチレン・コークス）は構造不況局面、産業ガス・医薬は成熟～拡大期で混在。事業ポートフォリオ転換中で全体としては成熟～衰退期色強い、転換成功なら拡大期復帰余地。PBR 0.92 倍は東証 PBR 改善要請の主要対象。",
    factorBetas: {
      usdjpy: 0.85,
      us10y: -0.22,
      oil: -0.55,
      sox: 0.18,
      china: 0.68,
      market: 1.05,
      size: -0.18,
      value: 0.85,
      momentum: -0.22,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "スチレン・コークス事業の売却が事業ポートフォリオ転換の最大の判断",
        body:
          "汎用化学（スチレン・コークス）は中国の過剰供給で構造不況、営業利益率は -2% 〜 +2% の低位で推移。三菱ケミカルは 2024 年以降、これらの汎用事業の売却・撤退を検討中で、決定すれば全社の営業利益率は +2-3% 改善見込み。一方、売却損失（数千億円規模）が一時的に計上される可能性。事業ポートフォリオ転換の成功が PBR 0.92 → 1.2 倍への回復ドライバー。",
        citations: [SRC_2025FY_MITSUBISHI_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "MMA（メタクリル樹脂）世界シェア 1 位は『液晶・自動車塗料』の隠れた基幹素材",
        body:
          "MMA（PMMA 原料）はディスプレイ用導光板・自動車塗料・建材で広く使われる機能性素材。三菱ケミカルは世界シェア 1 位（約 35%）、特に高純度品で圧倒的優位。MMA 単独の営業利益率は 15-20% で全社水準を大きく上回り、機能性化学への構造シフトの核となる事業。アジア需要拡大で 2027 年に売上 +20% を計画。",
        citations: [SRC_2025FY_MITSUBISHI_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "産業ガス（Nippon Sanso）統括は『半導体業界』への間接エクスポージャー",
        body:
          "産業ガス子会社 Nippon Sanso Holdings は半導体製造プロセス（プラズマエッチング・成膜）に不可欠なガス（窒素・酸素・希ガス）を供給。半導体投資拡大の構造的恩恵を受け、営業利益率 12.5% は化学業界トップ級。三菱ケミカル連結営業利益の 35% を稼ぐ実質的な利益柱で、SOX 指数連動性も高い隠れた半導体銘柄。",
        citations: [SRC_2025FY_MITSUBISHI_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 58,
      rationale:
        "PER 14.5 倍・PBR 0.92 倍は化学業界中位、ただし汎用化学の構造不況が織り込み済み。事業ポートフォリオ転換成功なら PBR 1.2 倍超への戻り余地、産業ガス・MMA の質を考慮すれば割安。配当 3.8% で下値支え、東証 PBR 改善要請対応の最右翼候補。",
      citations: [SRC_2025FY_MITSUBISHI_CHEM],
    },
  },

  {
    code: "4005",
    name: "住友化学",
    nameEn: "Sumitomo Chemical",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "化学",
    industryCluster: "総合化学",
    priceJpy: 388,
    priceDate: "2026-05-26",
    changePct: 1.25,
    marketCapOku: 6400,
    per: 0,
    pbr: 0.62,
    dividendYield: 4.5,
    roe: -8.5,
    operatingMargin: -2.8,
    revenueGrowth3y: -3.5,
    description:
      "総合化学大手だが、サウジ Petro Rabigh の巨額赤字（2024-25 年で累計 -5,000 億円規模）で連結赤字に転落。医薬子会社 Dainippon Sumitomo Pharma（4506 住友ファーマ、買収済み Sumitomo Pharma）の精神疾患薬パイプライン失敗も追い打ち。汎用化学・農業化学・医薬・電子材料の 4 軸再編が緊急課題。",
    oneLiner:
      "総合化学大手だが、サウジ合弁 Petro Rabigh の巨額赤字で連結赤字（2024-25 年）に転落。事業再編・人員削減・配当維持の三立で対応中、PBR 0.62 倍は化学業界最低水準で再建シナリオの宝くじ性格。",
    tags: [
      { dimension: "product", value: "石油化学（Petro Rabigh、サウジ）", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "product", value: "情報電子化学（液晶用偏光板）", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "product", value: "農薬・農業化学", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "product", value: "医薬品（住友ファーマ、子会社）", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "product", value: "EUV レジスト（半導体材料）", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "customer", value: "化学・電子・自動車・農業", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "channel", value: "B2B 直販 + 商社", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "revenue_model", value: "素材・化学品販売", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "value_chain", value: "汎用化学 + 機能性化学 + 医薬 + 農業", source: SRC_2025FY_SUMITOMO_CHEM },
      { dimension: "geography", value: "日本 38%・アジア 32%・北米 18%・欧州 8%・中東 4%", source: SRC_2025FY_SUMITOMO_CHEM },
    ],
    segments: [
      { name: "エッセンシャルケミカルズ（石化）", revenueOku: 8500, share: 33.5, operatingMargin: -22.5 },
      { name: "情報電子化学", revenueOku: 3800, share: 15.0, operatingMargin: 8.5 },
      { name: "農業ソリューション（農薬）", revenueOku: 4500, share: 17.7, operatingMargin: 3.5 },
      { name: "医薬品（住友ファーマ）", revenueOku: 4200, share: 16.5, operatingMargin: -8.5 },
      { name: "電子材料・その他", revenueOku: 4400, share: 17.3, operatingMargin: 5.5 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 0, expansion: 10, mature: 30, decline: 60 },
    phaseRationale:
      "Petro Rabigh 赤字・住友ファーマ精神疾患薬失敗で連結赤字、衰退期色強い。事業再編・人員削減で 2026-27 年黒字化計画、半導体材料（EUV レジスト）成功が再生の鍵。ハイリスク・ハイリターン銘柄の代表格。",
    factorBetas: {
      usdjpy: 0.95,
      us10y: -0.18,
      oil: -0.65,
      sox: 0.45,
      china: 0.55,
      market: 1.15,
      size: 0.18,
      value: 0.92,
      momentum: -0.55,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "Petro Rabigh の巨額赤字は『中東石化への過剰投資』の典型的失敗事例",
        body:
          "サウジアラビア合弁 Petro Rabigh は 2008 年稼働、住友化学持分 37.5%。中国の過剰供給・原油価格変動・現地通貨リスクが重なり、2024-25 年で累計 -5,000 億円規模の損失。住友化学はサウジ Saudi Aramco との合意で 2026 年に持分縮小・撤退を計画。撤退に伴う一時損失（推定 2,000-3,000 億円）で連結赤字さらに拡大の可能性、撤退完了後は赤字止血で黒字化への道筋。",
        citations: [SRC_2025FY_SUMITOMO_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "住友ファーマ（4506）の精神疾患薬パイプライン失敗が長期収益柱を失った",
        body:
          "住友ファーマは Latuda（ルラシドン、統合失調症薬）の特許切れ後の後継薬開発に大きな期待がかかっていたが、2023-24 年で複数のフェーズ 3 試験失敗。これにより住友化学の医薬セグメントは大幅赤字、長期成長軸を失った。代替戦略として癌治療薬・iPS 細胞療法へのシフトを進めるが、収益化は 2028-30 年以降と長期。",
        citations: [SRC_2025FY_SUMITOMO_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "EUV レジスト（半導体材料）は『最後の希望』、TEL・JSR・東京応化との競合",
        body:
          "EUV 露光プロセスで使う感光性レジストは住友化学・JSR（4185）・東京応化（4186）が世界の主要プレイヤー、TSMC・サムスン向けで需要拡大。住友化学の電子材料セグメントは営業利益率 5.5% で全社黒字化への貢献源。EUV レジストの市場拡大は 2025-30 年で年率 +15-20%、住友化学の生き残りの鍵。",
        citations: [SRC_2025FY_SUMITOMO_CHEM],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 42,
      rationale:
        "現状赤字（ROE -8.5%）で PER 表記不能、PBR 0.62 倍は化学業界最低水準。再建シナリオ成功で PBR 1.0 倍まで戻れば株価 +60% 余地、失敗なら配当維持困難で下値リスク。ハイリスク・ハイリターンの典型、リスク許容度の高い投資家向け。",
      citations: [SRC_2025FY_SUMITOMO_CHEM],
    },
  },

  {
    code: "3402",
    name: "東レ",
    nameEn: "Toray Industries",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "繊維製品",
    industryCluster: "繊維・機能性素材",
    priceJpy: 985,
    priceDate: "2026-05-26",
    changePct: 0.95,
    marketCapOku: 16200,
    per: 18.5,
    pbr: 1.08,
    dividendYield: 2.5,
    roe: 5.8,
    operatingMargin: 4.8,
    revenueGrowth3y: 1.8,
    description:
      "炭素繊維（Boeing 787・Airbus A350 で世界シェア 1 位）と機能性フィルム・水処理膜の世界的素材メーカー。航空機用 CFRP（炭素繊維強化プラスチック）、リチウムイオン電池用セパレータ、半導体実装用フィルムなど機能性素材で世界トップシェア多数。汎用化学から完全に脱却した『機能性素材専業』モデル。",
    oneLiner:
      "炭素繊維で世界シェア 1 位、航空機（Boeing・Airbus）・自動車・電池に展開。三菱ケミカル・住友化学とは違い、汎用化学から脱却した『機能性素材専業』モデル。Boeing/Airbus の生産回復が業績の鍵。",
    tags: [
      { dimension: "product", value: "炭素繊維（CFRP・PAN 系、世界シェア 1 位）", source: SRC_2025FY_TORAY },
      { dimension: "product", value: "機能性フィルム（ディスプレイ・電池）", source: SRC_2025FY_TORAY },
      { dimension: "product", value: "リチウムイオン電池用セパレータ", source: SRC_2025FY_TORAY },
      { dimension: "product", value: "水処理膜（RO 膜、世界シェア 1 位）", source: SRC_2025FY_TORAY },
      { dimension: "product", value: "合成繊維（ナイロン・PP・ポリエステル）", source: SRC_2025FY_TORAY },
      { dimension: "product", value: "半導体実装用感光性フィルム", source: SRC_2025FY_TORAY },
      { dimension: "customer", value: "Boeing・Airbus（航空機）", source: SRC_2025FY_TORAY },
      { dimension: "customer", value: "EV・電子・自動車", source: SRC_2025FY_TORAY },
      { dimension: "channel", value: "B2B 直販（長期契約中心）", source: SRC_2025FY_TORAY },
      { dimension: "revenue_model", value: "機能性素材販売（長期契約）", source: SRC_2025FY_TORAY },
      { dimension: "value_chain", value: "機能性素材専業（汎用化学から脱却）", source: SRC_2025FY_TORAY },
      { dimension: "geography", value: "日本 43%・アジア 35%・北米 14%・欧州 8%", source: SRC_2025FY_TORAY },
    ],
    segments: [
      { name: "繊維（合成繊維・産業資材）", revenueOku: 8500, share: 33.5, operatingMargin: 4.8 },
      { name: "機能化成品", revenueOku: 6800, share: 26.8, operatingMargin: 6.5 },
      { name: "炭素繊維複合材料", revenueOku: 3200, share: 12.6, operatingMargin: 7.8 },
      { name: "環境・エンジニアリング", revenueOku: 4500, share: 17.7, operatingMargin: 5.5 },
      { name: "ライフサイエンス・その他", revenueOku: 2400, share: 9.4, operatingMargin: 3.2 },
    ],
    segmentsPeriod: "2025/3",
    phaseScores: { launch: 5, expansion: 55, mature: 40, decline: 0 },
    phaseRationale:
      "炭素繊維・電池セパレータ・水処理膜の機能性素材で世界トップシェア。Boeing/Airbus 生産回復・EV 拡大で拡大期色、汎用化学から脱却済みで構造的安定。長期成長余地あり、ROE 5.8% は低位だが質的に妥当。",
    factorBetas: {
      usdjpy: 0.92,
      us10y: -0.25,
      oil: -0.35,
      sox: 0.42,
      china: 0.38,
      market: 0.95,
      size: -0.25,
      value: 0.32,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "炭素繊維世界シェア 1 位は『Boeing・Airbus の生産回復ペース』が業績の鍵",
        body:
          "炭素繊維は Boeing 787（機体重量の 50% が CFRP）・Airbus A350（53%）で大規模採用、東レは世界シェア約 35-40%。Boeing の品質問題（2024）で生産遅延が業績に直接影響、A350 の月産回復ペースとセットで観察。航空機部門の生産が正常化すれば、炭素繊維事業の営業利益率は 7.8% → 12-15% への回復余地。長期では Airbus A321XLR・Boeing 777X 量産で需要拡大。",
        citations: [SRC_2025FY_TORAY],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "リチウムイオン電池用セパレータは『EV 拡大の隠れた受益者』",
        body:
          "東レはリチウムイオン電池用セパレータ（電解液を仕切る薄膜）で世界シェア 2 位、トヨタ・パナソニック・LG エネ・CATL 等に供給。EV 1 台あたりセパレータ約 30-40 平米使用、EV 拡大で需要構造的に拡大。営業利益率は約 10-15% で機能化成品セグメントの主要利益源。中国 SK イノベーション・LG エネとの競争激化で、価格圧力に対する差別化（強度・寿命）が継続課題。",
        citations: [SRC_2025FY_TORAY],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
      {
        title: "水処理膜（RO 膜）世界シェア 1 位は『気候変動・水不足』の超長期受益者",
        body:
          "東レは逆浸透膜（RO 膜、海水淡水化に使用）で世界シェア約 30%、Dow・GE と並ぶ世界三強の一角。気候変動・水不足の深刻化で中東・北アフリカ・米国カリフォルニア・シンガポール等で淡水化需要は構造的拡大、年率 +7-10%。環境・エンジニアリングセグメントの中核事業で、超長期で東レの利益柱に成長する可能性。",
        citations: [SRC_2025FY_TORAY],
        generatedAt: "2026-05-25T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 52,
      rationale:
        "PER 18.5 倍・PBR 1.08 倍は機能性素材としては妥当圏、ROE 5.8% は低位だが業績回復余地あり。Boeing/Airbus 生産正常化・EV 拡大・水処理膜の超長期成長を考慮すれば適正、汎用化学リスクなしの差別化評価。",
      citations: [SRC_2025FY_TORAY],
    },
  },

  // ===== 外食・小売クラスタ（Phase 8-7） =====
  {
    code: "8267",
    name: "イオン",
    nameEn: "Aeon",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "小売業",
    industryCluster: "総合小売",
    priceJpy: 3850,
    priceDate: "2026-05-26",
    changePct: 0.42,
    marketCapOku: 33500,
    per: 38.5,
    pbr: 1.92,
    dividendYield: 1.0,
    roe: 5.2,
    operatingMargin: 2.8,
    revenueGrowth3y: 4.2,
    description:
      "国内最大の総合小売グループ。GMS（イオン本体）・SM（マックスバリュ）・ディスカウント（ビッグ）・コンビニ（ミニストップ）・専門店・金融（イオン銀行）・不動産（イオンモール）を統合した持株会社。連結売上 10 兆円超で日本最大の小売企業。PB『トップバリュ』が業界最大級のシェア。",
    oneLiner:
      "国内最大の総合小売グループ、連結売上 10 兆円超。GMS・SM・モール・金融・不動産まで統合した独自モデル。インフレ転嫁力・PB『トップバリュ』戦略・東南アジア展開が長期論点。",
    tags: [
      { dimension: "product", value: "総合スーパー（GMS、イオン本体）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "スーパーマーケット（マックスバリュ・ダイエー）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "ディスカウント（ビッグ・KASUMI）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "コンビニ（ミニストップ）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "ドラッグストア（ウエルシア・ツルハ統合計画）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "金融（イオン銀行・カード）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "不動産（イオンモール、子会社）", source: SRC_2025FY_AEON },
      { dimension: "product", value: "PB『トップバリュ』（食品・日用品・衣料）", source: SRC_2025FY_AEON },
      { dimension: "customer", value: "個人（マスマーケット）", source: SRC_2025FY_AEON },
      { dimension: "channel", value: "実店舗（19,000 店超）+ EC", source: SRC_2025FY_AEON },
      { dimension: "revenue_model", value: "商品販売 + テナント賃料 + 金融手数料", source: SRC_2025FY_AEON },
      { dimension: "value_chain", value: "小売・金融・不動産の総合グループ", source: SRC_2025FY_AEON },
      { dimension: "geography", value: "日本 85%・東南アジア 12%・中国 3%", source: SRC_2025FY_AEON },
    ],
    segments: [
      { name: "GMS（イオン本体）", revenueOku: 28000, share: 27.7, operatingMargin: 0.5 },
      { name: "スーパーマーケット", revenueOku: 32000, share: 31.7, operatingMargin: 1.8 },
      { name: "ヘルス&ウェルネス（ドラッグ）", revenueOku: 12500, share: 12.4, operatingMargin: 5.2 },
      { name: "総合金融（銀行・カード）", revenueOku: 5800, share: 5.7, operatingMargin: 18.5 },
      { name: "ディベロッパー（イオンモール）", revenueOku: 4500, share: 4.5, operatingMargin: 22.5 },
      { name: "サービス・専門店", revenueOku: 12200, share: 12.1, operatingMargin: 4.5 },
      { name: "国際（東南アジア）", revenueOku: 6000, share: 5.9, operatingMargin: 3.8 },
    ],
    segmentsPeriod: "2026/2",
    phaseScores: { launch: 0, expansion: 35, mature: 60, decline: 5 },
    phaseRationale:
      "GMS・SM は成熟だが、ドラッグストア（ツルハ統合 2024）・金融・モール・東南アジアで拡大期色。インフレ転嫁力で売上 +5% 成長維持、PB トップバリュ拡大で粗利改善も。営業利益率 2.8% は依然低位、構造改革の余地大。",
    factorBetas: {
      usdjpy: -0.18,
      us10y: -0.22,
      oil: -0.08,
      sox: 0.12,
      china: 0.18,
      market: 0.62,
      size: -0.32,
      value: 0.42,
      momentum: 0.18,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ツルハ HD（ドラッグストア）統合（2024-25）で『業界最大の小売グループ』への戦略加速",
        body:
          "2024 年にツルハホールディングス（3391）の株式公開買付（TOB）・連結子会社化を実施、これでウエルシア HD と合わせてイオングループのドラッグストア事業は売上 2.5 兆円超の業界最大規模に。ドラッグストア事業は営業利益率 5-7% で GMS（0.5%）・SM（1.8%）より明確に高く、グループ全体の利益率改善ドライバー。Welcia + ツルハの統合シナジーで 2027 年に営業利益 +500 億円規模の押し上げ効果。",
        citations: [SRC_2025FY_AEON],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "PB『トップバリュ』売上 1 兆円超は『インフレ局面の最大の盾』",
        body:
          "イオンの PB『トップバリュ』は売上 1 兆円超で日本最大の PB ブランド、NB（ナショナルブランド）より 20-30% 安価。インフレ局面で消費者の節約志向が PB シフトを加速、トップバリュ売上は前年比 +12% 成長。NB との粗利差は 15-20pp、PB 比率上昇でグループ全体の粗利率を構造的に改善。長期的にはトップバリュ売上 1.5 兆円・PB 比率 25% を目指す。",
        citations: [SRC_2025FY_AEON],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "イオンモール・イオン銀行は『隠れた高収益事業』、SOTP 評価では時価の半分相当",
        body:
          "イオンモール（8905、上場子会社）の単独時価は約 3,500 億円、イオン銀行（推定）は約 4,000 億円、これだけで連結時価 3.35 兆円の 22% を占める。さらに営業利益率 18-22% の高収益事業として、グループ全体の利益貢献は 30% 超。GMS・SM の低収益事業に隠れがちだが、SOTP 評価では『不動産＋金融』の価値が再評価される潜在性。",
        citations: [SRC_2025FY_AEON],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 45,
      rationale:
        "PER 38.5 倍・PBR 1.92 倍は小売業として割高水準、ROE 5.2% の低さがネック。ただしツルハ統合シナジー・PB 拡大・モール再評価で 2027-28 年に PER 25-30 倍水準への正常化期待、長期では妥当範囲に。",
      citations: [SRC_2025FY_AEON],
    },
  },

  {
    code: "3382",
    name: "セブン&アイ・ホールディングス",
    nameEn: "Seven & i Holdings",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "小売業",
    industryCluster: "コンビニ・総合小売",
    priceJpy: 2280,
    priceDate: "2026-05-26",
    changePct: 1.85,
    marketCapOku: 58500,
    per: 21.5,
    pbr: 1.42,
    dividendYield: 2.1,
    roe: 7.8,
    operatingMargin: 5.2,
    revenueGrowth3y: 6.5,
    description:
      "コンビニ（セブン-イレブン、世界最大級）を中核とする小売グループ。2024-25 年に Alimentation Couche-Tard（カナダ ACT）からの大型 TOB 提案を受け、事業ポートフォリオ再編が緊急課題に。イトーヨーカ堂 GMS の売却計画、米国 Speedway 含む北米コンビニ事業の集中戦略を推進。",
    oneLiner:
      "世界最大級のコンビニ（セブン-イレブン）を持つ小売グループ。2024-25 年に ACT（カナダ）からの TOB 提案を受け、コンビニ集中戦略への構造転換中。イトーヨーカ堂売却・米国コンビニ強化が論点。",
    tags: [
      { dimension: "product", value: "コンビニ（セブン-イレブン、世界 8.8 万店）", source: SRC_2025FY_SEVEN },
      { dimension: "product", value: "コンビニ（米 Speedway 含む北米事業）", source: SRC_2025FY_SEVEN },
      { dimension: "product", value: "GMS（イトーヨーカ堂、売却検討中）", source: SRC_2025FY_SEVEN },
      { dimension: "product", value: "PB『セブンプレミアム』（食品・日用品）", source: SRC_2025FY_SEVEN },
      { dimension: "product", value: "金融（セブン銀行、ATM 主体）", source: SRC_2025FY_SEVEN },
      { dimension: "customer", value: "個人（マスマーケット）", source: SRC_2025FY_SEVEN },
      { dimension: "channel", value: "コンビニ店舗 + ATM ネットワーク", source: SRC_2025FY_SEVEN },
      { dimension: "revenue_model", value: "コンビニ商品販売 + FC ロイヤルティ + ATM 手数料", source: SRC_2025FY_SEVEN },
      { dimension: "value_chain", value: "コンビニ世界最大級、北米事業統合", source: SRC_2025FY_SEVEN },
      { dimension: "geography", value: "日本 36%・北米 56%・その他 8%", source: SRC_2025FY_SEVEN },
    ],
    segments: [
      { name: "国内コンビニ（セブン-イレブン）", revenueOku: 11500, share: 12.5, operatingMargin: 22.5 },
      { name: "海外コンビニ（米 Speedway 等）", revenueOku: 55000, share: 59.8, operatingMargin: 3.5 },
      { name: "GMS（イトーヨーカ堂、売却検討）", revenueOku: 9500, share: 10.3, operatingMargin: -0.5 },
      { name: "金融（セブン銀行）", revenueOku: 1800, share: 2.0, operatingMargin: 25.5 },
      { name: "専門店・その他", revenueOku: 14200, share: 15.4, operatingMargin: 3.8 },
    ],
    segmentsPeriod: "2026/2",
    phaseScores: { launch: 0, expansion: 45, mature: 50, decline: 5 },
    phaseRationale:
      "国内コンビニは成熟だが営業利益率 22.5% で高収益、北米コンビニ事業は Speedway 統合シナジー進行中で拡大期。ACT TOB 提案で構造転換ペース加速、イトーヨーカ堂売却で利益率さらに改善見込み。",
    factorBetas: {
      usdjpy: 0.85,
      us10y: -0.28,
      oil: -0.32,
      sox: 0.15,
      china: 0.12,
      market: 0.92,
      size: -0.45,
      value: 0.18,
      momentum: 0.45,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ACT（カナダ Couche-Tard）からの TOB 提案は『世界コンビニ業界の地殻変動』",
        body:
          "2024 年 8 月、カナダの Alimentation Couche-Tard（ACT、世界 3 位のコンビニ運営会社）がセブン&アイに約 7 兆円規模の TOB 提案。セブン&アイは独立維持の方針で創業家による MBO（経営陣による買収）を検討中だが、株主圧力・株価上昇・事業ポートフォリオ再編で構造転換ペースが大幅に加速。ACT 提案が成立しなくても、創業家 MBO 成立で非公開化、または独立維持での大規模自社株買い・配当増の可能性。",
        citations: [SRC_2025FY_SEVEN],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "イトーヨーカ堂売却計画（2025-26）は『コンビニ集中戦略』への決定的シフト",
        body:
          "創業以来の中核事業だった GMS イトーヨーカ堂は営業赤字（-50 億円規模）・PBR 引き下げ要因として認識され、2025 年中の売却・分離計画を推進中。買い手は国内 PE ファンド・他小売・物流系企業の候補あり。売却完了で連結営業利益 +500-800 億円の押し上げ、コンビニ事業（営業利益率 国内 22.5%）への集中で全社 ROE 改善・PER 再評価。",
        citations: [SRC_2025FY_SEVEN],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "Speedway 統合（米国コンビニ）の利益率改善が長期成長の最大の鍵",
        body:
          "セブン&アイは 2021 年に米 Speedway を 2.1 兆円で買収、北米コンビニ事業を世界最大規模に。Speedway 統合シナジーで営業利益率は 3.5% → 5-6% への改善目標（国内 22.5% との差は依然大）。米国コンビニ市場は ARPU 高・PB 強化余地大で構造的成長、Speedway 統合シナジー進捗が PER 再評価のドライバー。",
        citations: [SRC_2025FY_SEVEN],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 58,
      rationale:
        "PER 21.5 倍は小売業平均より高めだが、ACT TOB 提案で株価フロア形成、創業家 MBO シナリオでさらに上値余地。Speedway 統合シナジー・イトーヨーカ堂売却・PB 強化の三軸で 2027-28 年 ROE 10% 超への到達期待。",
      citations: [SRC_2025FY_SEVEN],
    },
  },

  {
    code: "9983",
    name: "ファーストリテイリング",
    nameEn: "Fast Retailing",
    exchange: "Prime",
    tier: 1,
    sectorTSE: "小売業",
    industryCluster: "アパレル小売",
    priceJpy: 48500,
    priceDate: "2026-05-26",
    changePct: 0.85,
    marketCapOku: 154500,
    per: 38.5,
    pbr: 7.2,
    dividendYield: 1.2,
    roe: 21.5,
    operatingMargin: 16.2,
    revenueGrowth3y: 12.5,
    description:
      "ユニクロ・GU を中核とする世界最大級のアパレル小売。日本 800 店・中国 1,000 店超・グローバル合計 3,500 店超を展開。LifeWear（究極の普段着）戦略・SPA（製造小売）モデル・ヒートテック等の機能性ファブリック技術で世界的競争優位。営業利益率 16.2% は世界アパレル小売で最高水準。",
    oneLiner:
      "ユニクロ・GU の世界最大級アパレル小売。世界 3,500 店超、ROE 21.5%・営業利益率 16.2% は世界アパレル小売で最高水準。中国・欧米拡大が長期成長軸、円安レバレッジ（海外売上 60% 超）も追い風。",
    tags: [
      { dimension: "product", value: "ユニクロ（LifeWear、世界 2,500 店超）", source: SRC_2025FY_FASTRTL },
      { dimension: "product", value: "GU（低価格ファッション、1,000 店超）", source: SRC_2025FY_FASTRTL },
      { dimension: "product", value: "Theory・PLST・コントワー・デ・コトニエ", source: SRC_2025FY_FASTRTL },
      { dimension: "product", value: "ヒートテック・エアリズム等機能性ファブリック", source: SRC_2025FY_FASTRTL },
      { dimension: "customer", value: "個人（マスマーケット～ミドル）", source: SRC_2025FY_FASTRTL },
      { dimension: "channel", value: "直営店 + EC（直販 40% 超）", source: SRC_2025FY_FASTRTL },
      { dimension: "revenue_model", value: "SPA（製造小売・自社企画製造販売）", source: SRC_2025FY_FASTRTL },
      { dimension: "value_chain", value: "企画 → 生産 → 物流 → 販売の垂直統合", source: SRC_2025FY_FASTRTL },
      { dimension: "geography", value: "日本 32%・中国 28%・東南アジア 16%・欧米 24%", source: SRC_2025FY_FASTRTL },
    ],
    segments: [
      { name: "ユニクロ日本", revenueOku: 10500, share: 30.9, operatingMargin: 16.5 },
      { name: "ユニクロ海外（中国・東南アジア・欧米）", revenueOku: 16500, share: 48.5, operatingMargin: 18.2 },
      { name: "GU", revenueOku: 3500, share: 10.3, operatingMargin: 12.8 },
      { name: "グローバルブランズ（Theory 等）", revenueOku: 2500, share: 7.4, operatingMargin: 4.5 },
      { name: "EC・その他", revenueOku: 1000, share: 2.9, operatingMargin: 8.5 },
    ],
    segmentsPeriod: "2025/8",
    phaseScores: { launch: 0, expansion: 65, mature: 35, decline: 0 },
    phaseRationale:
      "ユニクロ海外（特に北米・欧州）は拡大期、中国は成熟期入り、GU は東南アジア・中国で拡大局面。営業利益率 16.2%・ROE 21.5% の質的に高い拡大期、世界アパレル小売トップへの到達余地大。",
    factorBetas: {
      usdjpy: 1.25,
      us10y: -0.32,
      oil: -0.18,
      sox: 0.22,
      china: 0.85,
      market: 1.18,
      size: 0.25,
      value: -0.55,
      momentum: 0.95,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "ユニクロ海外（中国・北米）の成長持続性が PER 38.5 倍を正当化する最大の根拠",
        body:
          "ユニクロ海外売上比率は 48.5%（中国 28%・東南アジア 16%・欧米 24%）で 2025-30 年で +60% への到達計画。中国は成熟期入りで成長率は +5-8% に減速、代わりに北米・欧州が +15-25% の高成長フェーズに。北米市場は 70 店から 200 店への拡大計画、欧州も Inditex（Zara）との直接競合領域で苦戦しつつもブランド浸透。海外成長率の維持・加速が PER 38.5 倍の正当化の鍵。",
        citations: [SRC_2025FY_FASTRTL],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "ヒートテック・エアリズムの機能性ファブリック技術は『世界アパレル小売で唯一の参入障壁』",
        body:
          "ユニクロは東レ（3402）・帝人等との長期共同開発でヒートテック（保温吸湿）・エアリズム（吸汗速乾）・ウルトラライトダウン（軽量保温）等の機能性ファブリックを開発、これがブランドの差別化軸。Zara・H&M 等のファストファッション競合は『流行性』で勝負、ユニクロは『機能性』で勝負という棲み分け。機能性ファブリック特許の累計数は業界トップで、模倣困難な技術的優位。",
        citations: [SRC_2025FY_FASTRTL],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "円安レバレッジ最大級（海外売上 60% 超）+ 国内インフレ転嫁の二段の追い風",
        body:
          "ファーストリテイリングは海外売上比率 60% 超（連結ベース）で円安局面の利益押し上げ効果が顕著、USD/JPY +10 円で営業利益 +500-800 億円規模の感応度。さらに国内アパレル市場ではユニクロ価格が業界最低水準（同等品質の他社比 -20-30%）でインフレ転嫁の余地が他社より大、価格 +5-10% の値上げ実施でも消費者離反は限定的。為替＋インフレの二段追い風で 2026-27 年営業利益は過去最高更新ペース。",
        citations: [SRC_2025FY_FASTRTL],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "やや割高",
      score: 50,
      rationale:
        "PER 38.5 倍・PBR 7.2 倍は世界アパレル小売最高水準、Inditex（Zara、PER 25 倍）と比較して割高感あり。ただし営業利益率 16.2%・ROE 21.5% の質と海外成長余地を考慮すれば妥当～やや割高の範囲。中国減速・欧米競争激化リスクで下値リスクも併存。",
      citations: [SRC_2025FY_FASTRTL],
    },
  },

  {
    code: "3563",
    name: "FOOD&LIFE COMPANIES",
    nameEn: "Food & Life Companies",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "小売業",
    industryCluster: "外食",
    priceJpy: 4280,
    priceDate: "2026-05-26",
    changePct: 1.42,
    marketCapOku: 4950,
    per: 22.5,
    pbr: 4.85,
    dividendYield: 1.5,
    roe: 21.5,
    operatingMargin: 8.5,
    revenueGrowth3y: 8.8,
    description:
      "回転寿司『スシロー』『杉玉（居酒屋業態）』『京樽』を運営する外食大手。スシロー単独で国内 650 店超、台湾・韓国・香港・タイ・シンガポール等アジア 11 か国・地域に進出。訪日インバウンドと海外展開の二軸成長、客単価上昇（スシロー 1 人 1,800 円）と回転率の両立が強み。",
    oneLiner:
      "スシロー・杉玉・京樽を運営する外食大手。スシロー単独で国内 650 店超、台湾・香港・東南アジアに進出。訪日インバウンド比率高く、円安局面で外国人客単価上昇の追い風。ROE 21.5% は外食業界最高水準。",
    tags: [
      { dimension: "product", value: "回転寿司『スシロー』（国内 650 店超）", source: SRC_2025FY_FLC },
      { dimension: "product", value: "居酒屋『杉玉』（200 店超）", source: SRC_2025FY_FLC },
      { dimension: "product", value: "持ち帰り寿司『京樽』（300 店超）", source: SRC_2025FY_FLC },
      { dimension: "product", value: "海外スシロー（台湾・韓国・香港・東南アジア）", source: SRC_2025FY_FLC },
      { dimension: "customer", value: "ファミリー・若年層・訪日外国人", source: SRC_2025FY_FLC },
      { dimension: "channel", value: "店舗（直営中心）+ テイクアウト・デリバリー", source: SRC_2025FY_FLC },
      { dimension: "revenue_model", value: "店舗売上 + デリバリー手数料", source: SRC_2025FY_FLC },
      { dimension: "value_chain", value: "原料調達（マグロ・寿司ネタ）→ セントラルキッチン → 店舗", source: SRC_2025FY_FLC },
      { dimension: "geography", value: "日本 82%・台湾 8%・東南アジア 6%・その他 4%", source: SRC_2025FY_FLC },
    ],
    segments: [
      { name: "スシロー（国内）", revenueOku: 2800, share: 56.6, operatingMargin: 9.2 },
      { name: "海外スシロー", revenueOku: 850, share: 17.2, operatingMargin: 12.5 },
      { name: "杉玉（居酒屋）", revenueOku: 480, share: 9.7, operatingMargin: 5.8 },
      { name: "京樽（持ち帰り）", revenueOku: 580, share: 11.7, operatingMargin: 4.2 },
      { name: "新業態・その他", revenueOku: 240, share: 4.8, operatingMargin: 2.5 },
    ],
    segmentsPeriod: "2025/9",
    phaseScores: { launch: 15, expansion: 65, mature: 20, decline: 0 },
    phaseRationale:
      "海外スシロー（台湾・東南アジア）は拡大期初期、国内スシローは成熟前期、杉玉は launch ～拡大期境界。ROE 21.5% は外食業界トップ、訪日インバウンド + 海外展開の二軸成長で構造的拡大局面。",
    factorBetas: {
      usdjpy: 0.45,
      us10y: -0.18,
      oil: -0.12,
      sox: 0.08,
      china: 0.32,
      market: 1.15,
      size: 0.42,
      value: -0.38,
      momentum: 0.85,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "訪日インバウンド 4,000 万人で『外国人客単価 +30%』の追い風、業界平均比 2 倍",
        body:
          "2025 年の訪日客数は約 4,000 万人で過去最高、スシローの訪日客比率は店舗平均 8%（都心 銀座・新宿 等は 30-40%）。訪日客の客単価は日本人比 +50-100%（為替の有利性 + メニュー追加注文）で、訪日客 +10% で営業利益 +30-50 億円規模の感応度。円安局面で外国人客単価がさらに上昇、訪日インバウンドは FLC 業績の構造的追い風として継続。",
        citations: [SRC_2025FY_FLC],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "海外スシロー（台湾・東南アジア）の営業利益率 12.5% は国内 9.2% を上回る『隠れた成長エンジン』",
        body:
          "海外スシローは台湾 80 店・香港 25 店・韓国 10 店・東南アジア 30 店超で構成、営業利益率 12.5% は国内 9.2% を上回る。これは現地での 寿司＝プレミアム外食 のポジショニングで客単価が日本の 1.5-2.0 倍、賃料・人件費比率も低位。今後 5 年で海外 200 店超への拡大計画、海外売上比率 17.2% → 30% を目指す。",
        citations: [SRC_2025FY_FLC],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "マグロ等寿司原料価格の上昇圧迫 vs 価格転嫁・回転率向上の二律背反",
        body:
          "ロシア・ウクライナ戦争・気候変動でマグロ・サケ・カニ等寿司原料の国際価格は構造的に上昇、過去 3 年で +20-30% 上昇。FLC は価格転嫁（1 皿 100 円 → 120 円 → 150 円のグレード分け）と回転率向上（IT 化・タッチパネル注文）の二軸で対応中、原料価格上昇 +10% でも営業利益率 8-10% を維持。長期的にはセントラルキッチン拡大・養殖魚利用拡大で原料リスク低減。",
        citations: [SRC_2025FY_FLC],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "ほぼ妥当",
      score: 56,
      rationale:
        "PER 22.5 倍・PBR 4.85 倍は外食業界としてはやや割高だが、ROE 21.5% の質と海外成長 +25% を考慮すれば妥当圏。訪日インバウンド・円安・海外展開の三軸追い風で 2027 年営業利益 +40% 計画、目標達成で PER 18-20 倍水準への正常化期待。",
      citations: [SRC_2025FY_FLC],
    },
  },

  {
    code: "8227",
    name: "しまむら",
    nameEn: "Shimamura",
    exchange: "Prime",
    tier: 2,
    sectorTSE: "小売業",
    industryCluster: "アパレル小売",
    priceJpy: 8950,
    priceDate: "2026-05-26",
    changePct: -0.32,
    marketCapOku: 5800,
    per: 14.5,
    pbr: 1.42,
    dividendYield: 3.5,
    roe: 9.8,
    operatingMargin: 9.5,
    revenueGrowth3y: 4.2,
    description:
      "国内ロードサイド型アパレル小売の最大手。『ファッションセンターしまむら』を中核に、『アベイル』『バースデイ』『シャンブル』等を展開。国内 1,400 店超でユニクロに次ぐ 2 位、低価格帯（平均単価 1,500-2,000 円）でファミリー層・地方シニア層を中心顧客に。海外展開はせず日本国内特化。",
    oneLiner:
      "ロードサイド型アパレル小売の最大手、国内 1,400 店超でユニクロに次ぐ 2 位。低価格帯（平均単価 1,500-2,000 円）でファミリー層が中核顧客、海外展開せず日本国内特化。配当 3.5% の安定収益型。",
    tags: [
      { dimension: "product", value: "アパレル（ファッションセンターしまむら、800 店超）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "product", value: "若年層アパレル（アベイル、330 店）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "product", value: "ベビー・キッズ（バースデイ、300 店）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "product", value: "雑貨・インテリア（シャンブル、80 店）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "customer", value: "ファミリー・地方シニア・主婦層", source: SRC_2025FY_SHIMAMURA },
      { dimension: "channel", value: "ロードサイド店（駐車場併設）+ EC（少額）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "revenue_model", value: "アパレル・雑貨販売（仕入販売）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "value_chain", value: "仕入販売型（製造はせず外部委託）", source: SRC_2025FY_SHIMAMURA },
      { dimension: "geography", value: "日本 100%（海外展開なし）", source: SRC_2025FY_SHIMAMURA },
    ],
    segments: [
      { name: "ファッションセンターしまむら", revenueOku: 3800, share: 62.3, operatingMargin: 10.5 },
      { name: "アベイル（若年層）", revenueOku: 850, share: 13.9, operatingMargin: 8.5 },
      { name: "バースデイ（ベビー・キッズ）", revenueOku: 950, share: 15.6, operatingMargin: 9.2 },
      { name: "シャンブル（雑貨）", revenueOku: 280, share: 4.6, operatingMargin: 6.8 },
      { name: "その他（ディバロ等）", revenueOku: 220, share: 3.6, operatingMargin: 5.5 },
    ],
    segmentsPeriod: "2026/2",
    phaseScores: { launch: 0, expansion: 15, mature: 75, decline: 10 },
    phaseRationale:
      "国内ロードサイド型アパレル市場は完全な成熟期、人口減・若年層の EC シフトで構造的縮小圧。アベイル・バースデイ・シャンブルで多店舗展開しつつ、地方シニア層という独自顧客層で差別化、配当 3.5% の安定収益型。",
    factorBetas: {
      usdjpy: 0.32,
      us10y: -0.18,
      oil: -0.22,
      sox: 0.05,
      china: 0.08,
      market: 0.55,
      size: -0.18,
      value: 0.62,
      momentum: -0.05,
    },
    factorPeriod: "2023/6–2026/5 週次リターン回帰",
    insights: [
      {
        title: "低価格帯（単価 1,500-2,000 円）の優位は『地方ロードサイド型』の独自ポジション",
        body:
          "しまむらの平均客単価は 1,500-2,000 円で業界最低水準、ユニクロ（3,500-5,000 円）・GU（2,000-3,000 円）と価格帯で明確に差別化。ロードサイド型店舗（駐車場併設）でファミリー・地方シニア層を狙う独自セグメント、ショッピングモール型の競合（ユニクロ・GU）と棲み分け。インフレ局面で消費者の節約志向がしまむらシフトを後押し、客数 +3-5% の構造的恩恵。",
        citations: [SRC_2025FY_SHIMAMURA],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "海外展開せず『国内特化』戦略の強みと長期リスク",
        body:
          "ユニクロ・無印良品・ニトリが積極的海外展開する中、しまむらは国内特化を貫く。これは『地方ロードサイド型』モデルが海外で機能しにくい現実認識による合理的判断だが、日本人口減・若年層 EC シフトで国内市場は構造的縮小局面に。配当 3.5% の安定収益型として割安に評価される一方、長期成長余地は限定的という認識が PER 14.5 倍の低位を説明。",
        citations: [SRC_2025FY_SHIMAMURA],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
      {
        title: "バースデイ（ベビー・キッズ）拡大が『少子化対策』の代替成長軸",
        body:
          "出生数 70 万人切りの少子化進行下でも、バースデイ事業（300 店、売上 950 億円、営業利益率 9.2%）は『1 人の子供への投資単価上昇』で構造的成長維持。祖父母世代の孫向け消費（年 1 人 5-10 万円規模）と、共働き世代の時短志向（ロードサイドの一括購買）が需要源。少子化逆風を捉えた成長セグメントとして、しまむら本体の成熟を補う役割。",
        citations: [SRC_2025FY_SHIMAMURA],
        generatedAt: "2026-05-26T10:00:00+09:00",
      },
    ],
    valuationCall: {
      verdict: "割安",
      score: 60,
      rationale:
        "PER 14.5 倍・PBR 1.42 倍は小売業界中位、ROE 9.8% / 営業利益率 9.5% の質と配当 3.5% を考慮すれば妥当～割安。海外展開せず国内特化の構造リスクは織り込み済み、地方ロードサイド型の独自ポジションで下値硬い。",
      citations: [SRC_2025FY_SHIMAMURA],
    },
  },
];

export function getStock(code: string) {
  return stocks.find((s) => s.code === code);
}

export function listStocks() {
  return stocks;
}
