import { stocks } from "./data";
import type { Stock } from "./types";

export type ChainPosition =
  // 製造業（半導体・医薬等）のバリューチェーン位置
  | "材料"
  | "部材"
  | "前工程"
  | "後工程"
  | "計測"
  | "設計"
  | "パワー"
  // SaaS の機能カテゴリ
  | "バックオフィス"
  | "営業マーケ"
  | "HR"
  | "コミュニケーション"
  | "セキュリティ"
  | "業界特化"
  // 自動車のバリューチェーン位置
  | "OEM"
  | "Tier1電装"
  | "Tier1機構"
  | "電池"
  | "車載半導体"
  // 総合商社のセグメント位置
  | "資源エネルギー"
  | "金属素材"
  | "機械モビリティ"
  | "生活産業"
  | "DX新領域"
  // 金融のセグメント位置
  | "メガバンク"
  | "証券"
  | "損保"
  | "生保"
  // 不動産のセグメント位置
  | "オフィス不動産"
  | "住宅不動産"
  | "商業物流"
  | "海外不動産"
  // 通信のセグメント位置
  | "移動通信"
  | "固定通信"
  | "インターネット"
  | "AI投資"
  // 化学・素材のセグメント位置
  | "汎用化学"
  | "機能性化学"
  | "繊維素材"
  | "半導体材料"
  // 外食・小売のセグメント位置
  | "総合スーパー"
  | "コンビニ"
  | "アパレル"
  | "外食";

export type SubCluster = {
  key: string;
  name: string;
  role: string;
  companyCodes: string[];
  position: ChainPosition;
};

export type ShareEntry = {
  rank?: number;
  name: string;
  value: string;
  note?: string;
};

export type CompetitiveBlock = {
  sub: string;
  /** 1 行で見える要約。要約だけ知りたい方はここだけ読んで OK */
  summary: string;
  /** 展開で出る詳細分析 */
  detail: string;
  /** 展開で出るシェア比較（任意） */
  shares?: { metric: string; entries: ShareEntry[]; note?: string };
};

export type KpiHistory = { period: string; value: string; note?: string };

export type Kpi = {
  name: string;
  /** 現在値（見える） */
  current: string;
  /** 展開で出る定義・読み方 */
  desc: string;
  /** 展開で出る時系列推移（任意） */
  history?: KpiHistory[];
};

export type IndustryInsight = {
  title: string;
  /** 1 行で見える要旨 */
  lede: string;
  /** 展開で出る詳細 */
  body: string;
  citations: { doc: string; period?: string }[];
};

export type ChainColumn = {
  title: string;
  subtitle: string;
  positions: ChainPosition[];
};

export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  theme2025: string[];
  subClusters: SubCluster[];
  /** 業界マップの 3 カラム構成（業界によって意味が変わるため業界別に定義） */
  chainColumns: ChainColumn[];
  competitiveStructure: CompetitiveBlock[];
  keyKpis: Kpi[];
  industryInsights: IndustryInsight[];
  marketScale: { headline: string; growth: string; breakdown: string };
};

export const SEMICONDUCTOR: Industry = {
  slug: "semiconductor",
  name: "半導体",
  shortName: "半導体",
  description:
    "AI 投資・スマートフォン・自動車・産業機器のすべての基盤。日本企業は前工程装置・後工程装置・材料・テスト装置で世界トップシェアの領域が多く、AI 半導体・HBM・SiC で構造的追い風を受けている。",
  theme2025: [
    "AI 半導体・HBM 需要拡大",
    "EUV Hi-NA 世代移行",
    "SiC パワー半導体立ち上がり",
    "米中規制と中国成熟ノード自立化",
    "先端パッケージ（CoWoS）拡大",
  ],
  marketScale: {
    headline: "世界半導体市場 約 6,000 億ドル",
    growth: "前年比 +18%（AI 半導体牽引）",
    breakdown: "WFE（前工程装置）約 1,200 億ドル / テスト装置 約 80 億ドル / 材料 約 700 億ドル",
  },
  chainColumns: [
    { title: "上流", subtitle: "ウェハ・薬液・装置部材", positions: ["材料", "部材"] },
    { title: "製造装置", subtitle: "前工程・後工程・テスト", positions: ["前工程", "後工程", "計測"] },
    { title: "設計・素子", subtitle: "ファブレス・パワー半導体", positions: ["設計", "パワー"] },
  ],
  subClusters: [
    {
      key: "front-end-equipment",
      name: "前工程装置（WFE）",
      role: "ウェハ上にトランジスタを形成する装置群。エッチング、成膜、洗浄、コータ／デベロッパなど。",
      companyCodes: ["8035", "7735", "6525"],
      position: "前工程",
    },
    {
      key: "mask-inspection",
      name: "マスク・検査装置",
      role: "EUV マスク欠陥検査、ウェハ検査装置。極めて狭いニッチで寡占。",
      companyCodes: ["6920"],
      position: "前工程",
    },
    {
      key: "back-end-equipment",
      name: "後工程装置",
      role: "ウェハ切断・薄化装置、ウェハプローバ。CoWoS／HBM 後工程拡大で構造受益。",
      companyCodes: ["6146", "7729"],
      position: "後工程",
    },
    {
      key: "test-equipment",
      name: "テスト装置",
      role: "完成半導体の性能・品質検査。AI 半導体・HBM テスト需要で急成長。",
      companyCodes: ["6857"],
      position: "後工程",
    },
    {
      key: "materials",
      name: "材料（ウェハ・レジスト）",
      role: "シリコンウェハ、フォトレジスト、ガス、薬液など。製造のたびに消費される消耗材。",
      companyCodes: ["4063", "3436", "4186"],
      position: "材料",
    },
    {
      key: "mask-blanks",
      name: "マスクブランクス",
      role: "回路の設計図を焼き付けるフォトマスクの原版。EUV 用は HOYA がほぼ独占。",
      companyCodes: ["7741"],
      position: "材料",
    },
    {
      key: "package-substrate",
      name: "パッケージ基板",
      role: "チップと基板をつなぐ高密度配線基板（FC-BGA）。AI 半導体の大型化で構造受益。",
      companyCodes: ["4062"],
      position: "部材",
    },
    {
      key: "backend-materials",
      name: "後工程材料",
      role: "CMP スラリー、封止材、ダイボンディング材など。先端パッケージ化で使用量が増加。",
      companyCodes: ["4004"],
      position: "材料",
    },
    {
      key: "equipment-parts",
      name: "製造装置部材",
      role: "半導体製造装置に組み込まれる真空シール、石英、サセプタ等。",
      companyCodes: ["6890"],
      position: "部材",
    },
    {
      key: "fabless",
      name: "ファブレス（設計）",
      role: "製造を委託、設計に特化。カスタム SoC・ASIC。データセンタ向け急拡大。",
      companyCodes: ["6526"],
      position: "設計",
    },
    {
      key: "auto-idm",
      name: "車載・マイコン（IDM）",
      role: "設計から製造まで一貫の IDM。車載マイコンで世界首位級、自動車業界との結節点。",
      companyCodes: ["6723"],
      position: "設計",
    },
    {
      key: "power-semi",
      name: "パワー半導体",
      role: "電力変換用デバイス。SiC（炭化珪素）で EV／産業向け需要拡大。",
      companyCodes: ["6963"],
      position: "パワー",
    },
    {
      key: "metrology",
      name: "計測・通信計測",
      role: "高速信号品質試験、通信計測器。AI 半導体高速 I/O 試験で関連。",
      companyCodes: ["6754"],
      position: "計測",
    },
  ],
  competitiveStructure: [
    {
      sub: "前工程装置（WFE）",
      summary:
        "世界 4 強（AMAT・ASML・ラム・TEL）が市場のほぼ全てを占める寡占構造。日本勢では TEL が世界 2 位級、SCREEN が洗浄でシェア 50% 超。",
      detail:
        "TEL がコータ／デベロッパで圧倒的世界シェア、エッチング・成膜でも世界 2 位級。AMAT（米）・ラム（米）・ASML（蘭）と並ぶ世界 4 強の一角。SCREEN は枚葉式洗浄装置で世界シェア 50% 超。Hi-NA EUV 普及局面で塗布・現像とエッチング精度の要求が一段引き上がり、TEL のシェア維持余地が論点。",
      shares: {
        metric: "WFE 売上（2024 概算）",
        entries: [
          { rank: 1, name: "ASML（蘭）", value: "約 280 億ドル", note: "EUV 露光装置独占" },
          { rank: 2, name: "AMAT（米）", value: "約 270 億ドル" },
          { rank: 3, name: "TEL（日）", value: "約 220 億ドル" },
          { rank: 4, name: "ラム（米）", value: "約 170 億ドル" },
          { rank: 5, name: "KLA（米）", value: "約 100 億ドル", note: "検査・計測中心" },
          { rank: 6, name: "SCREEN（日）", value: "約 35 億ドル", note: "洗浄装置で 50% シェア" },
        ],
        note: "WFE = Wafer Fab Equipment（前工程装置）。各社売上の WFE 関連分の推計値。",
      },
    },
    {
      sub: "マスク・検査装置",
      summary:
        "EUV マスク検査はレーザーテックがほぼ独占。粗利率 60% 超のニッチ寡占。KLA・ASML 子会社の参入観測が中期論点。",
      detail:
        "レーザーテックが EUV マスクブランクス／パターンマスク検査でほぼ独占。粗利率 60% 超のニッチ寡占。KLA や ASML 子会社の参入観測がしきい値を超え始める水準にあり、競合参入リスクが中期論点。",
      shares: {
        metric: "EUV マスク検査装置シェア",
        entries: [
          { rank: 1, name: "レーザーテック（日）", value: "ほぼ独占" },
          { name: "KLA（米）", value: "部分参入観測" },
        ],
      },
    },
    {
      sub: "後工程装置",
      summary:
        "ダイサ・グラインダ領域はディスコが世界トップ。CoWoS／HBM 後工程拡大で構造受益。営業利益率 38% は WFE 業界平均を上回る。",
      detail:
        "ディスコがダイサ・グラインダで世界トップ。CoWoS／HBM 後工程拡大で構造受益、消耗品（ブレード）が安定収益源。AMAT／ラムのハイブリッドボンディング装置との組み合わせで後工程ラインが構成されるため、装置メーカーの後工程参入が中期影響要因。",
    },
    {
      sub: "テスト装置",
      summary:
        "アドバンテスト（日）とテラダイン（米）の 2 強寡占。AI 半導体・HBM テスト需要で急成長。PER 38 倍は AI 投資 3 年継続を織り込む。",
      detail:
        "AI 半導体・HBM テスト需要で急成長。Cohu・中国系新興プレイヤーの先端領域参入が静かに進む。アドバンテストの PER 38 倍は AI 投資 3 年継続を織り込んだ水準。",
      shares: {
        metric: "SoC テスタ世界シェア",
        entries: [
          { rank: 1, name: "アドバンテスト（日）", value: "約 50%" },
          { rank: 2, name: "テラダイン（米）", value: "約 35%" },
          { rank: 3, name: "Cohu（米）", value: "約 8%", note: "ハンドラ含む" },
          { name: "中国系新興", value: "10% 未満", note: "先端領域参入観測" },
        ],
      },
    },
    {
      sub: "材料",
      summary:
        "300mm シリコンウェハは信越・SUMCO の日本 2 社で世界シェア 5 割超。AI 半導体需要で 450mm 移行議論が再燃する可能性。",
      detail:
        "信越化学と SUMCO の 2 社で 300mm シリコンウェハ世界シェア 5 割超。AI 半導体需要で 450mm 移行議論が水面下で再燃する可能性があり、移行時の設備投資負担が論点。フォトレジストは JSR・TOK が先端 EUV で先行、信越のシェアが見えにくい。",
      shares: {
        metric: "300mm シリコンウェハ世界シェア",
        entries: [
          { rank: 1, name: "信越化学（日）", value: "約 30%" },
          { rank: 2, name: "SUMCO（日）", value: "約 22%" },
          { rank: 3, name: "GlobalWafers（台）", value: "約 18%" },
          { rank: 4, name: "Siltronic（独）", value: "約 13%" },
          { rank: 5, name: "SK Siltron（韓）", value: "約 12%" },
        ],
      },
    },
    {
      sub: "ファブレス",
      summary:
        "Broadcom・Marvell（米）がハイパースケーラー向けカスタム ASIC で爆発的成長。ソシオネクストは規模で 1 桁以上劣位、国内ニーズに集中。",
      detail:
        "Broadcom・Marvell がハイパースケーラー向けカスタム ASIC で爆発的成長。ソシオネクストはグローバル規模では桁違いに劣後する。一方、自動車向け・国内データセンタ向けは地理的・コンプライアンス的に日本企業の優位があり、ここに集中する戦略。NRE（設計受託）から量産ロイヤルティへの移行で利益率改善余地。",
      shares: {
        metric: "カスタム ASIC 売上（2024 概算）",
        entries: [
          { rank: 1, name: "Broadcom（米）", value: "約 200 億ドル超" },
          { rank: 2, name: "Marvell（米）", value: "約 60 億ドル" },
          { name: "ソシオネクスト（日）", value: "約 15 億ドル", note: "国内最大ファブレス" },
        ],
        note: "Broadcom・Marvell の AI 関連カスタム ASIC 売上の概算値。",
      },
    },
    {
      sub: "パワー半導体（SiC）",
      summary:
        "STMicro が SiC 約 40% でトップ、ローム・インフィニオン・WolfSpeed が追う。SiC ウェハ価格急落で各社採算前提が変化中。",
      detail:
        "ロームの SiC 採算が SiC ウェハ価格下落をどこまで吸収できるかが収益性の鍵。SiC ウェハ価格は 2024–25 年で 20–30% 下落、デバイス価格も追随。垂直統合度と LTA（長期契約）構成の違いで価格下落の業績影響に大きな差。ロームは東芝デバイス&ストレージとの SiC 製造合弁を継続。",
      shares: {
        metric: "SiC パワー半導体世界シェア（2024 概算）",
        entries: [
          { rank: 1, name: "STMicro（伊仏）", value: "約 40%" },
          { rank: 2, name: "インフィニオン（独）", value: "約 20%" },
          { rank: 3, name: "ローム（日）", value: "約 10%" },
          { rank: 4, name: "WolfSpeed（米）", value: "約 8%" },
          { rank: 5, name: "オン・セミ（米）", value: "約 7%" },
        ],
      },
    },
    {
      sub: "マスクブランクス・材料",
      summary:
        "EUV マスクブランクスは HOYA がほぼ独占、AGC が第 2 供給者を追う。300mm ウェハは信越・SUMCO の 2 強、レジストは TOK が首位級。",
      detail:
        "EUV マスクブランクスは低欠陥率の歩留まりが参入障壁で、HOYA の独占が続く。顧客側はデュアルソース化圧力を強めるが、Hi-NA 世代では品質要求がさらに上がり格差が開く可能性もある。レジストは JSR の非公開化（JIC 傘下）後、上場大手として TOK の希少性が増した。ラムリサーチの乾式レジスト参入が中期の世代交代リスク。",
      shares: {
        metric: "EUV マスクブランクス世界シェア",
        entries: [
          { rank: 1, name: "HOYA（日）", value: "ほぼ独占" },
          { rank: 2, name: "AGC（日）", value: "第 2 供給者として追随" },
        ],
      },
    },
    {
      sub: "パッケージ基板",
      summary:
        "FC-BGA はイビデン・新光電気工業（非上場化）・台湾 Unimicron の 3 強。AI 半導体の大型化・多層化で需要構造が転換、各社が大型投資を実行中。",
      detail:
        "AI 半導体（GPU・カスタム ASIC）はチップサイズと信号数の増大でパッケージ基板も大型・多層化し、単価が従来品の数倍になる構造変化が進む。日本勢ではイビデンが先行投資（岐阜の新工場群）で受注を固める。新光電気工業は 2025 年に JIC 傘下で非公開化され、上場プレーヤーはイビデンに絞られた。中期ではガラスコア基板への技術転換が競争構造のリセット要因。",
      shares: {
        metric: "高級 FC-BGA 基板シェア（概算）",
        entries: [
          { rank: 1, name: "イビデン（日）", value: "約 30%" },
          { rank: 2, name: "新光電気工業（日・非上場）", value: "約 20%" },
          { rank: 3, name: "Unimicron（台）", value: "約 20%" },
          { name: "サムスン電機・AT&S ほか", value: "約 30%" },
        ],
        note: "サーバー・AI 向け高級品の概算シェア。集計範囲により数値は大きく変わる。",
      },
    },
    {
      sub: "車載マイコン（MCU）",
      summary:
        "ルネサス・NXP・インフィニオン・ST・TI の 5 強寡占。車載は認証障壁が高く参入困難だが、中国 OEM の現地調達志向が中期リスク。",
      detail:
        "車載 MCU は機能安全認証（ISO 26262）と長期供給保証が参入障壁となり、5 強寡占が長く続いてきた。ルネサスは車載 MCU で世界首位級だが、EV シフトでドメインコントローラ（高性能 SoC）への統合が進むと、MCU 単体の搭載数が減る『アーキテクチャ変化リスク』がある。中国 BYD 系など OEM の半導体内製・現地調達も数量面の中期リスク。",
      shares: {
        metric: "車載 MCU 世界シェア（概算）",
        entries: [
          { rank: 1, name: "ルネサス（日）", value: "約 30%" },
          { rank: 2, name: "NXP（蘭）", value: "約 25%" },
          { rank: 3, name: "インフィニオン（独）", value: "約 20%" },
          { rank: 4, name: "ST（伊仏）", value: "約 10%" },
          { rank: 5, name: "TI（米）", value: "約 8%" },
        ],
      },
    },
  ],
  keyKpis: [
    {
      name: "WFE 市場規模",
      current: "2025: 約 1,200 億ドル（+8% YoY）",
      desc:
        "WFE = Wafer Fab Equipment（前工程装置）の世界市場規模。半導体投資サイクルの最も基本的な指標で、AMAT・TEL・ラム・ASML 等の業績はこれに連動。",
      history: [
        { period: "2020", value: "約 700 億ドル", note: "コロナで一時急増" },
        { period: "2021", value: "約 950 億ドル", note: "メモリ・ロジック投資ピーク" },
        { period: "2022", value: "約 1,050 億ドル" },
        { period: "2023", value: "約 1,000 億ドル", note: "メモリ調整局面で減速" },
        { period: "2024", value: "約 1,110 億ドル", note: "AI 半導体投資が牽引" },
        { period: "2025", value: "約 1,200 億ドル", note: "+8% YoY" },
      ],
    },
    {
      name: "ファブ稼働率",
      current: "AI 関連高稼働、レガシー過剰気味",
      desc:
        "TSMC・サムスン・SK ハイニックスなど大手ファウンドリ・メモリメーカーの工場稼働率。先端ノード（5nm 以下）と成熟ノード（28nm 以上）で需給が大きく分かれている。",
    },
    {
      name: "HBM 出荷数量",
      current: "2025: 前年比 +80% 見込み",
      desc:
        "HBM = High Bandwidth Memory。AI 半導体（GPU）と組み合わせて使う高速メモリ。SK ハイニックスがシェア首位、サムスン・マイクロンが追随。HBM はテスト工程が長く、アドバンテストのテスタ需要にも直結。",
      history: [
        { period: "2022", value: "約 20 億ドル" },
        { period: "2023", value: "約 40 億ドル" },
        { period: "2024", value: "約 120 億ドル", note: "AI ブーム本格化" },
        { period: "2025", value: "約 250 億ドル予想" },
      ],
    },
    {
      name: "SiC ウェハ価格",
      current: "2024–25 で −25%、2026 安定化観測",
      desc:
        "8 インチ SiC ウェハの平均価格。SiC = 炭化珪素、EV や産業向けパワー半導体に使われる新素材。WolfSpeed の生産能力増強と需要伸び鈍化で価格急落中。ローム・ST・インフィニオン等の SiC 採算に直結。",
      history: [
        { period: "2022", value: "上昇（供給逼迫）" },
        { period: "2023", value: "高値推移" },
        { period: "2024", value: "−10〜15%（下落開始）" },
        { period: "2025", value: "−15〜20%（さらに下落）" },
        { period: "2026 見通し", value: "底打ち・安定化観測" },
      ],
    },
    {
      name: "米国規制（BIS Entity List）",
      current: "段階的強化が継続",
      desc:
        "米商務省 BIS（産業安全保障局）が運用する輸出規制対象企業リスト。中国の半導体先端ノードへのアクセスを段階的に制限している。装置・材料メーカーの中国売上に直接影響。",
    },
    {
      name: "中国の半導体投資",
      current: "2024 から減速、装置現地調達比率上昇",
      desc:
        "中国大手 SMIC・YMTC・CXMT の設備投資額。米国規制で先端ノードを諦め、成熟ノード（28nm 以上）の自立化に集中。日本装置メーカーの中国売上構成が『先端→レガシー』に質的変化中。",
    },
  ],
  industryInsights: [
    {
      title: "Hi-NA EUV の本格普及タイミングが、装置メーカーのシェアを再構成する",
      lede:
        "2027 年以降の Hi-NA EUV 世代で、塗布／現像・エッチング・洗浄の精度要求が一段引き上がる。TEL・SCREEN・レーザーテックの認定タイミングが業績格差を決めるが、各社の IR では言及が薄い。",
      body:
        "ASML の Hi-NA EUV は 2027 年以降の本格量産世代。Hi-NA 採用ロジックノードでは、塗布／現像・エッチング・洗浄の精度要求が一段引き上がる。TEL（コータ／デベロッパ）、SCREEN（洗浄）、レーザーテック（マスク検査）のそれぞれが Hi-NA 認定タイミングでどう変わるかが、2027 年以降の業績格差を決める。各社の IR では Hi-NA 対応の言及が浅い。",
      citations: [{ doc: "TEL 2025年3月期 通期決算説明会資料" }, { doc: "ASML 2025 Investor Day" }],
    },
    {
      title: "中国の『成熟ノード自立化』は装置メーカーの中国売上の質を変える",
      lede:
        "中国売上比率は表面上維持されるが、ミックスが先端→レガシーへ変化し粗利率が段階的に低下する可能性。各社の中国売上のノード別開示が不足。",
      body:
        "中国は米国規制で先端ノードへのアクセスを失い、成熟ノード（28nm 以上）の自立化に集中投資中。TEL・SCREEN・ディスコの中国売上比率は 30–40% で表面上維持されるが、ミックスが先端からレガシーへ変化することで粗利率は段階的に低下する可能性。各社の中国売上のノード別開示が不足しており、市場の織り込みが甘い。",
      citations: [{ doc: "TEL 2025年3月期 通期決算説明会資料" }, { doc: "SCREEN 2025年3月期 通期決算説明会資料" }],
    },
    {
      title: "SiC ウェハ価格急落でパワー半導体メーカーの SiC 採算前提が変わる",
      lede:
        "SiC ウェハ価格は 2024–25 年で 20–30% 下落、デバイス価格も追随。垂直統合度と LTA 構成の違いで業績影響に大きな差が出る。ロームの感応度が IR で示されていない。",
      body:
        "SiC ウェハ価格は 2024–25 年で 20–30% 下落、デバイス価格も追随。ローム・ST・インフィニオン・WolfSpeed の中で、垂直統合度と長期契約（LTA）の構成が異なるため、価格下落の業績影響に大きな差が出る。ロームは 2027 年度に SiC 立ち上がりが利益で寄与する想定だが、価格前提の感応度が IR で示されていない。",
      citations: [{ doc: "ローム 2025年3月期 通期決算説明会資料" }, { doc: "STMicro 2025 Q1 Earnings" }],
    },
    {
      title: "ファブレス 2 強の独走で、日本ファブレスの存在意義は『自動車・国内 DC』に絞られる",
      lede:
        "ハイパースケーラー向けカスタム ASIC は Broadcom・Marvell が独走。ソシオネクストは規模で桁違いに劣後するが、自動車・国内 DC で比較優位を確保できるか。",
      body:
        "ハイパースケーラー向けカスタム ASIC は Broadcom・Marvell が独走。ソシオネクストはグローバル規模では桁違いに劣後する。一方、自動車向け・国内データセンタ向けは地理的・コンプライアンス的に日本企業の優位があり、ここに集中する戦略の明示が IR から不足。",
      citations: [{ doc: "ソシオネクスト 2025年3月期 通期決算説明会資料" }],
    },
    {
      title: "HBM テスト機需要の前提は、HBM メーカーのテスト内製化次第で崩れうる",
      lede:
        "HBM テスト工程の長時間化でアドバンテスト需要が増える前提は広く共有されているが、HBM 製造各社の独自テスト内製化や KGSD 方式変化で線形には乗らない可能性。",
      body:
        "HBM3E から HBM4 への世代交代でテスト工程が長時間化し、テスタ需要が増える前提が市場に広く共有されている。しかし HBM 製造各社の独自テスト内製化や、KGSD（Known Good Stacked Die）テスト方式の変化が起きると、テスタ需要の伸びは線形には乗らない。アドバンテストの IR では言及が薄い。",
      citations: [{ doc: "アドバンテスト 2025年3月期 通期決算説明会資料" }],
    },
  ],
};

export const PHARMA: Industry = {
  slug: "pharmaceutical",
  name: "医薬品",
  shortName: "医薬品",
  description:
    "薬を作る企業群。新薬研究開発に長期間（10〜15 年）と巨額の資金（1 剤あたり 1,000〜3,000 億円）を投じ、特許保護期間中に回収するビジネス。日本企業は希少疾患・ADC・アルツハイマー・HIV など独自の強みを持つが、米国薬価規制と特許切れ（パテントクリフ）が共通の課題。",
  theme2025: [
    "ADC（抗体薬物複合体）の世界的拡大",
    "アルツハイマー治療薬の患者数拡大",
    "米国 IRA（薬価交渉対象拡大）の影響",
    "2027-28 年に集中する主力薬パテントクリフ",
    "中国 VBP（集中購買）の影響範囲拡大",
  ],
  marketScale: {
    headline: "世界医薬品市場 約 1.6 兆ドル",
    growth: "前年比 +6%（がん・希少疾患・GLP-1 牽引）",
    breakdown: "新薬大手 約 1.2 兆ドル / 後発品 約 1,500 億ドル / 医療機器 約 6,000 億ドル",
  },
  chainColumns: [
    { title: "新薬大手", subtitle: "メガファーマ（垂直統合）", positions: ["設計"] },
    { title: "医療機器", subtitle: "デバイス・診断", positions: ["計測"] },
    { title: "受託・多角化", subtitle: "CDMO・診断・ヘルスケア", positions: ["材料"] },
  ],
  subClusters: [
    {
      key: "pharma-major",
      name: "新薬大手（メガファーマ）",
      role: "新薬開発から販売までを垂直統合で運営。R&D 比率 15-20% で長期投資、特許期間中に回収。",
      companyCodes: ["4502", "4568", "4503", "4523", "4519", "4507"],
      position: "設計",
    },
    {
      key: "medical-devices",
      name: "医療機器",
      role: "カテーテル、画像診断、輸血関連、糖尿病ケアなどのデバイス。消耗品リカーリングが利益安定要因。",
      companyCodes: ["4543"],
      position: "計測",
    },
    {
      key: "cdmo-diagnostic",
      name: "CDMO・診断（ヘルスケア多角化）",
      role: "医薬品の受託製造、医療画像診断装置など。多角化企業のヘルスケア部門が中心。",
      companyCodes: ["4901"],
      position: "材料",
    },
  ],
  competitiveStructure: [
    {
      sub: "新薬大手（メガファーマ）",
      summary:
        "国内 6 社（武田・第一三共・アステラス・エーザイ・中外・塩野義）は世界 Top 20 級ではあるが、Pfizer・J&J・Merck・Roche など欧米大手とは規模で 3-5 倍の差。各社が特定領域に集中する戦略。",
      detail:
        "国内大手は『領域集中』で差別化を図る。武田は希少疾患・血液腫瘍、第一三共は ADC、アステラスは前立腺がん、エーザイはアルツハイマー、中外は Roche グループの抗体技術、塩野義は感染症。Pfizer・J&J・Merck などの欧米メガファーマは全領域カバー型で、規模の経済が異なる。",
      shares: {
        metric: "世界医薬品売上ランキング（2024 概算、円換算）",
        entries: [
          { rank: 1, name: "Pfizer（米）", value: "約 9 兆円" },
          { rank: 2, name: "J&J 医薬品部門（米）", value: "約 8 兆円" },
          { rank: 3, name: "Merck（米）", value: "約 9 兆円", note: "Keytruda が中核" },
          { rank: 4, name: "Roche（瑞）", value: "約 9 兆円" },
          { rank: 5, name: "Novartis（瑞）", value: "約 7 兆円" },
          { rank: 13, name: "武田（日）", value: "約 4.6 兆円", note: "国内首位" },
          { rank: 18, name: "第一三共（日）", value: "約 2.3 兆円", note: "ADC で急成長" },
        ],
        note: "Pfizer・J&J・Merck・Roche は『メガファーマ Big 4』と呼ばれる。日本企業は規模で劣るが、特定領域（ADC、希少疾患等）で世界トップシェアを取る戦略。",
      },
    },
    {
      sub: "ADC（抗体薬物複合体）",
      summary:
        "第一三共と AstraZeneca のエンハーツが市場を切り開いた領域。Gilead、Pfizer、Roche、Merck が後続参入で競合激化。第一三共の独走から本格競争局面へ。",
      detail:
        "ADC は『抗体（標的特異性）＋細胞毒（殺細胞作用）』の組み合わせ。第一三共の DXd リンカー技術が業界標準。次世代では：（1）細胞毒の多様化、（2）二重特異性 ADC、（3）非がん領域への拡大が進む。市場規模 2025 年で約 130 億ドル、2030 年に 350 億ドル超の予測。",
      shares: {
        metric: "ADC 売上シェア（2024 概算）",
        entries: [
          { rank: 1, name: "第一三共／AZ（エンハーツ）", value: "約 70 億ドル", note: "DXd プラットフォーム" },
          { rank: 2, name: "Roche（Kadcyla）", value: "約 20 億ドル" },
          { rank: 3, name: "Gilead（Trodelvy）", value: "約 14 億ドル" },
          { rank: 4, name: "Pfizer（Adcetris）", value: "約 14 億ドル" },
          { rank: 5, name: "AbbVie（Elahere）", value: "約 4 億ドル", note: "ImmunoGen 買収" },
        ],
      },
    },
    {
      sub: "アルツハイマー治療",
      summary:
        "エーザイ／Biogen のレカネマブと Eli Lilly のドナネマブが市場を二分。新規上市局面で患者数拡大ペースが医療体制整備と保険償還の両方に依存。",
      detail:
        "両剤とも『アミロイド β』を標的にする抗体薬。レカネマブは先行上市の優位、ドナネマブは投与頻度（4 週間隔）の利便性で勝負。医療体制（MRI 設備、専門医、ARIA 副作用管理）の整備が患者数拡大の律速。米国メディケアの保険償還条件（CMS 規定）変更で拡大が加速する可能性。",
      shares: {
        metric: "アルツハイマー新薬の状況",
        entries: [
          { rank: 1, name: "エーザイ／Biogen（レカネマブ）", value: "2025/3 期 約 1,200 億円", note: "先行上市" },
          { rank: 2, name: "Eli Lilly（ドナネマブ）", value: "上市開始、競合激化", note: "4 週間隔で利便性高" },
        ],
      },
    },
    {
      sub: "希少疾患・血液腫瘍",
      summary:
        "武田・Vertex・Alnylam・BioMarin など、希少疾患特化型の企業が高単価薬で利益を上げる。武田はシャイアー買収で世界 Top 3 級のポジション。",
      detail:
        "希少疾患は患者数少ないが、薬価が極めて高い（年 1,000 万円超の薬も）。米国 ODA（孤児薬法）で開発インセンティブ手厚い。市場全体は 2025 年で約 2,000 億ドル、2030 年に 3,000 億ドル超予想。",
    },
    {
      sub: "医療機器",
      summary:
        "テルモは TIS（経カテーテル）でアジア優位、欧米では Boston Scientific・Medtronic と競合。中国 VBP（集中購買）の影響が新興リスク。",
      detail:
        "医療機器は『機器＋消耗品リカーリング』の構造で、医薬品より利益安定。世界市場規模 6,000 億ドル超。日本企業はテルモ・オリンパス（消化器内視鏡）・ニプロが世界で存在感。Boston Scientific・Medtronic・Stryker（米）が世界 Top 3。",
    },
    {
      sub: "CDMO（受託製造）",
      summary:
        "WuXi（中）が世界トップだが、米国 BIOSECURE 法案で規制リスク。Lonza（瑞）、Samsung Biologics（韓）、富士フイルムが代替先として注目。",
      detail:
        "バイオ医薬品の製造受託（CDMO）市場は世界で約 200 億ドル、年成長 10% 超。米国 BIOSECURE 法案で中国 CDMO への米国製薬の依存が制限される動きで、非中国系 CDMO（Lonza、Samsung Biologics、富士フイルム）の受注機会が拡大する可能性。",
      shares: {
        metric: "バイオ CDMO 世界シェア（2024 概算）",
        entries: [
          { rank: 1, name: "WuXi Biologics（中）", value: "約 13%" },
          { rank: 2, name: "Lonza（瑞）", value: "約 11%" },
          { rank: 3, name: "Samsung Biologics（韓）", value: "約 9%" },
          { rank: 4, name: "Catalent（米）", value: "約 6%", note: "Novo Holdings 買収予定" },
          { rank: 5, name: "富士フイルム（日）", value: "約 5%" },
        ],
      },
    },
  ],
  keyKpis: [
    {
      name: "新薬承認数（FDA）",
      current: "2024: 50 件（前年 55 件から微減）",
      desc:
        "米国 FDA の新有効成分（NME）の年間承認数。グローバル新薬市場の活発度を測る最も基本的な指標。",
      history: [
        { period: "2020", value: "53 件" },
        { period: "2021", value: "50 件" },
        { period: "2022", value: "37 件", note: "コロナ反動で減少" },
        { period: "2023", value: "55 件" },
        { period: "2024", value: "50 件" },
      ],
    },
    {
      name: "ADC 市場規模",
      current: "2025: 約 130 億ドル（+30% YoY）",
      desc:
        "ADC（抗体薬物複合体）の世界市場規模。第一三共のエンハーツが市場をリード、後続 ADC の上市で 2030 年 350 億ドル超予想。",
      history: [
        { period: "2022", value: "約 50 億ドル" },
        { period: "2023", value: "約 80 億ドル" },
        { period: "2024", value: "約 100 億ドル" },
        { period: "2025", value: "約 130 億ドル予想" },
        { period: "2030 予想", value: "約 350 億ドル" },
      ],
    },
    {
      name: "米国薬価交渉（IRA）対象薬",
      current: "2025: 10 剤対象→第 2 波で 15 剤追加",
      desc:
        "米国インフレ抑制法（IRA）で、メディケアが直接薬価交渉する対象薬。対象薬は薬価が大幅に引き下げられる。2026 年以降は対象薬数が段階的に拡大予定。",
    },
    {
      name: "薬価改定（日本）",
      current: "2024 年度：薬価引下げ平均 −5.0%、長期収載品 −7.5%",
      desc:
        "日本の薬価は 2 年に 1 度（最近は毎年）改定。新薬は 4 年で 6 回まで薬価維持加算で守られるが、特許切れ後は急速に下落。長期収載品は段階的に後発品薬価水準へ。",
    },
    {
      name: "アルツハイマー患者数拡大",
      current: "レカネマブ：米国 2025/3 期 約 1,200 億円、計画比未達",
      desc:
        "レカネマブ／ドナネマブの患者数拡大ペース。医療体制整備、保険償還条件、ARIA（脳浮腫）管理が律速要因。米国 CMS（メディケア）の規定変更が拡大ペースを大きく動かす。",
    },
    {
      name: "中国 VBP（集中購買）",
      current: "医薬品 → 医療機器へ拡大",
      desc:
        "中国の集中購買制度。医薬品で 70% 超の価格引下げを実現したスキームを、医療機器（カテーテル、整形外科等）に拡大中。日本企業（テルモ、オリンパス等）の中国売上利益率に影響。",
    },
  ],
  industryInsights: [
    {
      title: "2027-28 年の『日本製薬パテントクリフ』が集中",
      lede:
        "武田 VYVANSE・アステラス イクスタンジ・エーザイ レンビマ・塩野義 HIV ロイヤルティの主力品が 2027-28 年に集中して特許切れ。後継品の上市タイミングが各社業績の崖を埋められるか。",
      body:
        "国内大手の主力品の特許切れが 2027-28 年に集中。武田は VYVANSE 後発参入（既に進行）、アステラスはイクスタンジ、エーザイはレンビマ、塩野義は HIV ロイヤルティ。それぞれの後継品（TAK-861、パドセブ、レカネマブ、新規パイプライン）の上市と立ち上がりがこの『崖』を埋められるかが業績の鍵。IR では個社の説明はあるが、業界全体としての影響整理は薄い。",
      citations: [
        { doc: "武田 2025年3月期 通期決算説明会資料" },
        { doc: "アステラス 2025年3月期 通期決算説明会資料" },
        { doc: "エーザイ 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "ADC 競争激化：第一三共の独走から、複数プレイヤー時代へ",
      lede:
        "Gilead・Pfizer・AbbVie が ADC 領域に本格参入、第一三共の DXd プラットフォーム独走時代から競合時代へ。エンハーツ後継 ADC 3 剤の差別化が問われる。",
      body:
        "ADC 市場は 2022 年まで第一三共／AZ のエンハーツが独走したが、Gilead（Trodelvy）、Pfizer（Adcetris）、AbbVie（Elahere）が本格参入、Merck の Keytruda+ADC 併用も進む。第一三共の新 ADC 3 剤（DS-7300、DS-6051、DS-8401）の差別化次第で 2027 年以降のシェアが大きく動く。PER 38 倍は『DXd 独走継続』前提を織り込んでおり、競合激化の感応度を再考する必要。",
      citations: [
        { doc: "第一三共 2025年3月期 通期決算説明会資料" },
        { doc: "AstraZeneca 2025 Q1 Earnings" },
      ],
    },
    {
      title: "アルツハイマー治療：医療体制整備が次の 2 年を決める",
      lede:
        "レカネマブの売上が計画比未達なのは医療体制整備の遅れ。MRI 設備・専門医・保険償還の 3 点が揃う 2026-27 年に患者数拡大が本格化する可能性。",
      body:
        "レカネマブの 2025/3 期売上 1,200 億円は当初予想を大幅下回り。理由はアミロイド PET・MRI 設備整備の遅れ、ARIA（脳浮腫）副作用への医師警戒、保険償還の不透明性の 3 点。これらが 2026-27 年に整備されれば、患者数拡大が本格化する可能性。エーザイの PER 42 倍はこの『遅延後の爆発的拡大』を一部織り込んでいる。",
      citations: [
        { doc: "エーザイ 2025年3月期 通期決算説明会資料" },
        { doc: "Biogen 2025 Q1 Earnings" },
      ],
    },
    {
      title: "米国 IRA（薬価交渉）の影響範囲が想定より広がる可能性",
      lede:
        "米国インフレ抑制法（IRA）の薬価交渉対象薬は段階的拡大予定。日本企業の主力品（イクスタンジ・エンハーツ・レンビマ）が将来対象に含まれる可能性が IR で十分議論されていない。",
      body:
        "IRA で 2026 年に最初の 10 剤の薬価交渉、2027 年から年 15 剤ずつ追加。武田の血漿分画製剤、アステラスのイクスタンジ、エーザイのレンビマ、第一三共のエンハーツも将来対象となる可能性。各社の感応度（IRA 対象になった場合の売上影響）の説明が IR で抽象的にとどまっている。",
      citations: [
        { doc: "アステラス 2025年3月期 通期決算説明会資料" },
        { doc: "Pfizer 2024 Annual Report" },
      ],
    },
    {
      title: "BIOSECURE 法案の追い風は CDMO 各社にいつ・どの程度効くか",
      lede:
        "米国 BIOSECURE 法案で中国 CDMO（WuXi 等）への依存が制限される動き。代替先候補（Lonza、Samsung Biologics、富士フイルム）の受注機会だが、本格寄与は 2027 年以降か。",
      body:
        "BIOSECURE 法案は 2024-25 年に米国議会で審議継続中。可決時期と適用範囲は不確実だが、米国製薬企業は前倒しで CDMO サプライチェーン分散を始めている。Lonza・Samsung Biologics に加え、富士フイルムも候補。ただし生産能力立ち上げに時間が必要で、本格的な受注寄与は 2027 年以降。富士フイルムの CDMO 投資の回収タイミングがこの政策動向に左右される。",
      citations: [
        { doc: "富士フイルム 2025年3月期 統合報告書" },
        { doc: "Lonza 2024 Full Year Results" },
      ],
    },
  ],
};

export const SAAS: Industry = {
  slug: "saas",
  name: "SaaS（B2B）",
  shortName: "SaaS",
  description:
    "クラウド上でソフトウェアを月額契約で提供する事業モデル。会計・人事・営業・コミュニケーション・セキュリティなど機能カテゴリ別に多数のプレイヤーが存在。日本の上場 SaaS は売上成長 20–30% が中心で、利益と成長のトレードオフが業界共通の論点。",
  theme2025: [
    "AI 統合による機能拡張と原価圧迫",
    "ARR 成長と営業利益率のバランス",
    "海外 SaaS（Salesforce、Workday 等）との競合激化",
    "国内 SaaS の M&A 再編",
    "電子帳簿保存法・インボイス制度に伴うバックオフィス需要",
  ],
  marketScale: {
    headline: "国内 SaaS 市場 約 1.4 兆円",
    growth: "前年比 +15%（業務効率化・DX 投資牽引）",
    breakdown: "バックオフィス系 約 4,000 億円 / 営業・HR 系 約 3,500 億円 / セキュリティ・他 約 6,000 億円",
  },
  chainColumns: [
    { title: "バックオフィス", subtitle: "会計・経理・労務", positions: ["バックオフィス"] },
    {
      title: "営業・HR・コミュニケーション",
      subtitle: "顧客接点とチームワーク",
      positions: ["営業マーケ", "HR", "コミュニケーション"],
    },
    { title: "セキュリティ・他", subtitle: "セキュリティ・業界特化", positions: ["セキュリティ", "業界特化"] },
  ],
  subClusters: [
    {
      key: "saas-accounting",
      name: "会計・経理 SaaS",
      role: "クラウド会計・経費精算・電子帳簿。中小〜中堅企業のバックオフィス DX の中心。",
      companyCodes: ["3994", "4478", "3923"],
      position: "バックオフィス",
    },
    {
      key: "saas-sales",
      name: "営業 SaaS",
      role: "名刺管理・契約管理・請求書管理など営業の周辺業務 DX。",
      companyCodes: ["4443"],
      position: "営業マーケ",
    },
    {
      key: "saas-hr",
      name: "HR SaaS",
      role: "タレントマネジメント・評価・配置・育成など人事関連業務の SaaS 化。",
      companyCodes: ["4435"],
      position: "HR",
    },
    {
      key: "saas-communication",
      name: "コミュニケーション SaaS",
      role: "ビジネスチャット・ビデオ会議など、社内外のコミュニケーション基盤。",
      companyCodes: ["4448"],
      position: "コミュニケーション",
    },
    {
      key: "saas-security",
      name: "セキュリティ SaaS",
      role: "メールセキュリティ・認証統合・ID 管理など、クラウド環境のセキュリティ強化。",
      companyCodes: ["4475"],
      position: "セキュリティ",
    },
  ],
  competitiveStructure: [
    {
      sub: "会計・経理 SaaS",
      summary:
        "freee と Money Forward が二強で熾烈な競争、ラクスは経費・電子帳簿に特化して高利益率を維持。海外勢（Sage、Xero）は日本では未本格参入。",
      detail:
        "freee はスモールビジネス特化、Money Forward はスモール〜中堅、ラクスは中堅以上の経費・電子帳簿に特化。インボイス制度・電子帳簿保存法義務化で 2023-25 年は特需局面。3 社の競争は『機能拡張＋税理士パートナー網＋AI 自動化』が軸。海外 SaaS（Sage、Xero）の日本本格参入が起きると競争構造が一変する可能性。",
      shares: {
        metric: "クラウド会計 SaaS 国内シェア（2024 推計）",
        entries: [
          { rank: 1, name: "freee", value: "約 28%", note: "スモールビジネス特化" },
          { rank: 2, name: "Money Forward", value: "約 25%", note: "スモール〜中堅" },
          { rank: 3, name: "弥生", value: "約 16%", note: "デスクトップ＋クラウド" },
          { rank: 4, name: "ラクス（楽楽精算）", value: "約 8%", note: "経費精算特化" },
          { rank: 5, name: "TKC / OBC（中堅）", value: "約 20%", note: "従来型会計ソフト" },
        ],
        note: "シェアは契約社数ベース推計。中堅以上では従来型会計ソフトが依然強い。",
      },
    },
    {
      sub: "営業 SaaS",
      summary:
        "Sansan が名刺管理で国内独占的、Salesforce（米）が CRM で国内トップシェア。両者は領域は違うが、営業 DX の予算を取り合う構造。",
      detail:
        "Sansan は名刺管理・契約管理・請求書管理の『営業周辺業務』に強み。Salesforce（米）は CRM・SFA の中核を握り、国内売上 1,400 億円超。Sansan は Salesforce との連携で共存戦略を取るが、Salesforce が名刺管理機能を強化すれば競合化する可能性。",
      shares: {
        metric: "営業関連 SaaS 国内売上（2024 概算）",
        entries: [
          { rank: 1, name: "Salesforce（米）", value: "約 1,400 億円", note: "CRM・SFA 国内首位" },
          { rank: 2, name: "Sansan", value: "約 450 億円", note: "名刺管理国内首位" },
          { rank: 3, name: "Microsoft Dynamics（米）", value: "約 200 億円" },
        ],
      },
    },
    {
      sub: "HR SaaS",
      summary:
        "国内は SmartHR（非上場）が急成長で頭角、カオナビはタレントマネジメント特化で差別化。エンタープライズ層では Workday・SAP SuccessFactors（米独）が浸透。",
      detail:
        "SmartHR は労務手続き SaaS で急成長、評価管理機能の拡張でカオナビ領域に侵食中。カオナビは『顔写真ベースの人材情報管理』を起点に評価・配置に拡張するが、機能の重複が増えている。エンタープライズ層では Workday・SAP SuccessFactors（米独）の日本本格参入が論点。",
    },
    {
      sub: "コミュニケーション SaaS",
      summary:
        "Microsoft Teams が Microsoft 365 普及に伴い圧倒的、Slack（米）が個人クリエイティブ層で支持、Chatwork（kubell）は中小特化で日本独自ポジション。",
      detail:
        "Microsoft Teams は Office 365 / Microsoft 365 ライセンスにバンドル販売で実質無料化、企業のシェア急上昇。Slack は IT 系・クリエイティブ系で根強い支持。Chatwork は中小企業特化で日本市場の独自ポジションを維持するが、Teams の中小浸透で新規獲得ペースが鈍化。",
    },
    {
      sub: "セキュリティ SaaS",
      summary:
        "HENNGE はメールセキュリティ・認証で日本企業のクラウド化に追従。Microsoft 純正セキュリティの強化と、米系（Proofpoint、Cloudflare）の日本本格参入が中期論点。",
      detail:
        "Microsoft 365 普及率上昇に伴い、HENNGE のメールセキュリティ・脱 PPAP 機能の需要は安定的。一方、Microsoft 純正の Defender for Office 365 強化、Cloudflare・Cisco 等の米系セキュリティ大手の日本本格参入により、HENNGE の差別化領域が縮小する可能性が論点。",
    },
  ],
  keyKpis: [
    {
      name: "ARR（年間経常収益）成長率",
      current: "国内 SaaS 大手平均 +20% 前後",
      desc:
        "ARR = Annual Recurring Revenue。サブスクリプション SaaS の最重要 KPI。MRR（月次経常収益）× 12 で算出。新規獲得＋アップセル−解約の差で増減する。",
      history: [
        { period: "2022", value: "国内 SaaS 大手平均 +30%" },
        { period: "2023", value: "+25%（金利上昇で SaaS 株調整）" },
        { period: "2024", value: "+22%" },
        { period: "2025", value: "+20%（成長鈍化局面）" },
      ],
    },
    {
      name: "NRR（純収益維持率）",
      current: "国内 SaaS 大手平均 105–115%",
      desc:
        "NRR = Net Revenue Retention。既存顧客からの売上の前年比。100% 超なら『アップセルが解約を上回っている』状態。120% 超は卓越した水準。米系 SaaS は 115–130% が標準、日本は 105–115% が中心。",
    },
    {
      name: "営業利益率（黒字／赤字）",
      current: "国内 SaaS 大手平均 5–15%（黒字組）/ -10%〜0%（赤字組）",
      desc:
        "SaaS は先行投資型のビジネスで、成長期は赤字、成熟期に向かうにつれ利益率が向上する『Rule of 40』（成長率＋利益率 ≥ 40%）が業界の目安。",
    },
    {
      name: "国内 SaaS 市場規模",
      current: "2025: 約 1.4 兆円（+15% YoY）",
      desc:
        "国内 B2B SaaS 市場の総規模。IDC・矢野経済等の調査ベース。DX 投資全体の伸びと連動。",
      history: [
        { period: "2022", value: "約 0.9 兆円" },
        { period: "2023", value: "約 1.1 兆円" },
        { period: "2024", value: "約 1.2 兆円" },
        { period: "2025", value: "約 1.4 兆円予想" },
      ],
    },
    {
      name: "電子帳簿保存法・インボイス制度の特需",
      current: "2025-26 年がピーク、2027 年以降は安定化",
      desc:
        "2024 年の電子帳簿保存法義務化、2023 年のインボイス制度開始で、特に経費精算・電子帳簿 SaaS の需要が急増。2026 年がピーク観測、2027 年以降は基調的な需要に戻る。",
    },
    {
      name: "AI API コスト動向",
      current: "GPT-4 系で 1 トークン当たり継続的に下落",
      desc:
        "SaaS が AI 機能を組み込む際の原価。OpenAI・Anthropic の API 単価は 2023-25 年で 10 分の 1 程度に下落。さらなる下落で SaaS の AI 機能マネタイズが容易になる可能性。",
    },
  ],
  industryInsights: [
    {
      title: "AI 機能のマネタイズ戦略が SaaS 業界共通の未解論点",
      lede:
        "生成 AI を組み込む際の API コストを顧客課金にどう転嫁するか、業界全体で答えが定まっていない。フラット価格維持なら粗利圧迫、従量課金なら浸透速度の鈍化。",
      body:
        "SaaS 各社が AI 機能（自動入力、要約、予測等）をリリースしているが、AI API コストを顧客課金にどう転嫁するかの戦略が業界全体で定まっていない。フラット価格を維持すると粗利率圧縮、上位プラン課金にすると浸透速度の鈍化、従量課金にすると顧客の心理的抵抗。Microsoft 365 Copilot（月 30 ドル / ユーザー）型の上位プラン課金が業界標準になる可能性があるが、日本市場の単価感度との整合が論点。",
      citations: [
        { doc: "Sansan 2025年5月期 通期決算説明会資料" },
        { doc: "マネーフォワード 2025年11月期 通期決算説明会資料" },
      ],
    },
    {
      title: "電子帳簿・インボイス特需のピークアウト後の成長エンジン",
      lede:
        "2023-25 年の法改正特需で経費・電子帳簿 SaaS が急成長したが、2026 年がピーク観測。次の需要ドライバの説明が業界全体で抽象的。",
      body:
        "電子帳簿保存法の義務化（2024 年）、インボイス制度開始（2023 年）で、経費精算・電子帳簿 SaaS の需要が急増。ラクス・freee・Money Forward の業績を押し上げてきたが、義務化対応の浸透完了で 2026 年がピークアウト観測。次の需要ドライバ（AI 自動仕訳、海外展開、業務範囲拡大）の蓋然性と規模感の説明が IR で抽象的。",
      citations: [
        { doc: "ラクス 2025年3月期 通期決算説明会資料" },
        { doc: "freee 2025年6月期 通期決算説明会資料" },
      ],
    },
    {
      title: "米系 SaaS（Salesforce、Workday）の日本本格参入で競争構造が一変する可能性",
      lede:
        "Salesforce 国内売上 1,400 億円超、Workday は本格営業開始。国内 SaaS の差別化領域がどこに残るかが中期論点。",
      body:
        "Salesforce は既に国内 CRM・SFA 市場で支配的、Workday は人事領域で本格営業開始。Microsoft も Dynamics 365 で攻勢。国内 SaaS の差別化は『日本固有の業務要件への対応』『中小・中堅市場のきめ細かなサポート』『税理士パートナー網』の 3 点に集約されつつある。これらが米系 SaaS の機能拡張で侵食された場合の感応度の議論が IR で抽象的。",
      citations: [
        { doc: "Salesforce Japan 2024 年次レポート" },
        { doc: "カオナビ 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "成長 SaaS の PER は『将来の高営業利益率』を 5–10 年先まで織り込む水準",
      lede:
        "Money Forward PER 125 倍、カオナビ 68 倍、ラクス 58 倍。現状の薄利／赤字に対し、長期で米系 SaaS 並みの 25–30% 営業利益率を織り込む。",
      body:
        "国内 SaaS 大手の PER は 50–125 倍と高水準。現状の薄利・赤字に対し、長期的に米系 SaaS（Salesforce、Workday）の成熟期営業利益率 20–30% に到達する前提を織り込む。達成は理論的に可能だが、競合激化・AI コスト・海外展開コストが圧迫要因。PER と現状営業利益率のギャップが、SaaS 株のボラティリティの源泉になっている。",
      citations: [
        { doc: "マネーフォワード 2025年11月期 通期決算説明会資料" },
        { doc: "カオナビ 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "SaaS 業界の M&A 再編が静かに進行",
      lede:
        "海外大手（Salesforce、Microsoft）による日本 SaaS 買収、国内 SaaS 同士の統合の両軸で再編観測。投資家は『買われる側』のプレミアム織り込みが論点。",
      body:
        "国内 SaaS は事業単独で世界規模に到達することが現実的でない中、海外大手による買収（Sage が日本 SaaS を買収するシナリオ等）や、国内 SaaS 同士の機能補完統合の観測が水面下で進む。Money Forward、freee、Sansan のような時価総額 1,000-7,000 億円規模の銘柄は『買われる側』のプレミアム織り込みの余地があり、PER の高さの一因にもなっている可能性。",
      citations: [{ doc: "Sansan 2025年5月期 通期決算説明会資料" }],
    },
  ],
};

export const AUTOMOTIVE: Industry = {
  slug: "automotive",
  name: "自動車",
  shortName: "自動車",
  description:
    "日本最大の輸出セクター。OEM 7 社（トヨタ・ホンダ・日産・スズキ・スバル・マツダ・三菱）と巨大 Tier1（デンソー・アイシン・豊田自動織機）が垂直統合を成す。EV シフト・ソフトウェア化・地政学リスクが構造変化の中心。",
  theme2025: [
    "EV シフトの地域別スピード差（北米・欧州 vs 新興国・日本）",
    "中国市場の構造的縮小と現地メーカー（BYD・吉利）の台頭",
    "ソフトウェアファースト戦略（トヨタ Arene・ホンダ AFEELA）",
    "ホンダ・日産の戦略提携と業界再編観測",
    "為替（USD/JPY）と原油価格の収益感応度",
    "Tier1（デンソー・アイシン）の電動化シフト成否",
  ],
  marketScale: {
    headline: "日本自動車産業 出荷額 約 60 兆円",
    growth: "前年比 +3%（為替円安と新車単価上昇）",
    breakdown: "OEM 約 35 兆円 / Tier1 約 18 兆円 / Tier2 約 7 兆円",
  },
  chainColumns: [
    { title: "OEM（完成車）", subtitle: "ブランド・販売・開発", positions: ["OEM"] },
    {
      title: "Tier1 部品",
      subtitle: "電装・機構・センサー",
      positions: ["Tier1電装", "Tier1機構"],
    },
    {
      title: "次世代基盤",
      subtitle: "電池・車載半導体",
      positions: ["電池", "車載半導体"],
    },
  ],
  subClusters: [
    {
      key: "auto-oem-major",
      name: "OEM 大手（グローバル展開）",
      role: "世界販売 100 万台以上、グローバル全方位展開する大手 OEM。",
      companyCodes: ["7203", "7267", "7201"],
      position: "OEM",
    },
    {
      key: "auto-oem-niche",
      name: "OEM 中堅・特化型",
      role: "特定市場・特定技術で差別化する OEM。インド・北米・プレミアム等。",
      companyCodes: ["7269", "7270", "7261"],
      position: "OEM",
    },
    {
      key: "auto-tier1-electronics",
      name: "Tier1（電装・電動化）",
      role: "電動化部品（インバータ・モーター）、ADAS、車載半導体を担う Tier1。",
      companyCodes: ["6902"],
      position: "Tier1電装",
    },
    {
      key: "auto-tier1-mechanical",
      name: "Tier1（機構部品）",
      role: "トランスミッション・ブレーキ・ボディ部品など機構系 Tier1。EV 化で事業転換期。",
      companyCodes: ["7259"],
      position: "Tier1機構",
    },
  ],
  competitiveStructure: [
    {
      sub: "OEM 大手（グローバル展開）",
      summary:
        "トヨタが世界販売台数首位、ホンダ・日産が追走。中国市場での BYD 台頭で 3 社とも中国シェア低下。北米市場の堅調さで利益は維持されているが、EV シフトの遅れが長期論点。",
      detail:
        "トヨタ（年 1,100 万台）は HEV 優位で利益率 11.8% を維持。ホンダ（400 万台）は二輪の高収益が四輪を支える構造。日産（300 万台）は北米苦戦・中国崩壊で構造課題。3 社とも EV 戦略では中国 BYD・米テスラに対して後手。トヨタ Arene、ホンダ AFEELA（SONY 合弁）、ホンダ・日産提携が次の競争軸。",
      shares: {
        metric: "世界販売台数（2024 実績、推計含む）",
        entries: [
          { rank: 1, name: "トヨタ", value: "約 1,100 万台", note: "HEV 圧倒的シェア" },
          { rank: 2, name: "ホンダ", value: "約 410 万台", note: "二輪首位の影響大" },
          { rank: 3, name: "日産", value: "約 300 万台", note: "ルノー・三菱との緩い連携" },
          { rank: 4, name: "BYD（中）", value: "約 430 万台", note: "EV/PHEV 中心、急成長中" },
        ],
        note: "世界販売はトヨタ・VW・ヒュンダイ・現代起亜が上位 4 社、BYD が 2024 年に急浮上。",
      },
    },
    {
      sub: "OEM 中堅・特化型",
      summary:
        "スズキはインドで圧倒的、スバルは北米プレミアムニッチ、マツダは北米シフト・プレミアム化戦略。3 社とも『大手と同じ土俵で勝負しない』戦略で生き残る。",
      detail:
        "スズキはインド販売 48% で『隠れインド株』、トヨタ HEV 技術供与で規制対応も。スバルは北米 72% で為替感応度 OEM 最大、アイサイトでの差別化。マツダはプレミアム SUV（CX-90 等）で北米単価上昇、ロータリーレンジエクステンダーで EV ニッチ狙う。3 社とも EV 戦略は遅れ気味だが、ニッチ市場の特性を考えると致命的とは言えない。",
      shares: {
        metric: "世界販売台数 vs 営業利益率（2025/3 期）",
        entries: [
          { name: "スズキ", value: "320 万台 / 9.4%", note: "インド利益柱" },
          { name: "スバル", value: "92 万台 / 8.5%", note: "北米プレミアム" },
          { name: "マツダ", value: "120 万台 / 5.2%", note: "プレミアム移行期" },
        ],
      },
    },
    {
      sub: "Tier1（電装・電動化）",
      summary:
        "デンソーが日本 Tier1 で最大、世界でも Bosch・Continental・ZF と並ぶ大手。電動化部品（モーター・インバータ）・ADAS・車載半導体で次世代車対応を加速。",
      detail:
        "デンソーの電動化部品売上は前年比 +20%、市場成長 +15% を上回るペース。トヨタ向け 50% の依存度はリスクでもあり安定でもある。SiC パワー半導体の内製化（ロームと並ぶ国内大手）が長期の構造優位を生む可能性。グローバル Tier1（Bosch・Continental）との競争では『日本品質＋トヨタグループの内製技術』が武器。",
      shares: {
        metric: "世界 Tier1 自動車部品売上ランキング（2024 推計）",
        entries: [
          { rank: 1, name: "Bosch（独）", value: "約 9.5 兆円" },
          { rank: 2, name: "デンソー", value: "約 7.8 兆円", note: "EV 化で差を縮め中" },
          { rank: 3, name: "Continental（独）", value: "約 6.0 兆円" },
          { rank: 4, name: "ZF（独）", value: "約 5.5 兆円" },
        ],
      },
    },
    {
      sub: "Tier1（機構部品）",
      summary:
        "アイシンは AT・CVT で世界大手だが、EV 化でトランスミッション需要は長期的に縮小。e-Axle（EV 駆動ユニット）へのシフトが事業転換成否を決める。",
      detail:
        "アイシンの AT・CVT 売上は EV 化で年率 -5% 程度の減少想定。代替として e-Axle に経営資源シフト中で、2024 年から量産開始、2030 年 5,000 億円超を目指す。中国 BYD・米テスラへの納入実績が事業転換成否のカギ。短期的には AT・CVT の減価償却負担軽減でキャッシュフローはむしろ改善する『収穫期』にあり、長短のシナリオが分かれる構造。",
    },
  ],
  keyKpis: [
    {
      name: "USD/JPY 為替感応度",
      current: "OEM 平均 USD/JPY ベータ 1.5-2.2",
      desc:
        "日本 OEM の最大の業績変動要因。スバル（2.18）・マツダ（1.92）・ホンダ（1.58）など北米偏重メーカーが最も感応度高い。USD/JPY 1 円円安あたりトヨタ +450 億円、スバル +120 億円程度の営業利益感応度。",
      history: [
        { period: "2022", value: "USD/JPY 平均 132 円" },
        { period: "2023", value: "平均 141 円" },
        { period: "2024", value: "平均 151 円" },
        { period: "2025", value: "平均 150 円" },
      ],
    },
    {
      name: "世界 EV 販売比率（BEV のみ）",
      current: "2025 年見込み 約 14%（前年 +1pp）",
      desc:
        "BEV（純粋電気自動車）の世界新車販売比率。中国 30% 超、欧州 20%、北米 10%、日本 3%。地域差が大きく、日本 OEM の戦略は地域別 EV 化スピードに非線形に感応する。",
      history: [
        { period: "2022", value: "10%" },
        { period: "2023", value: "12%" },
        { period: "2024", value: "13%" },
        { period: "2025", value: "14% 見込み" },
      ],
    },
    {
      name: "北米新車販売台数",
      current: "2025 年 約 1,580 万台（+2%）",
      desc:
        "日本 OEM の最大利益源市場。SUV 比率上昇で単価も上昇傾向。EV 比率は 10% で欧州・中国より低い。スバル・マツダ・トヨタ・ホンダの北米依存度が高い。",
    },
    {
      name: "中国新車販売台数",
      current: "2025 年 約 2,700 万台（横ばい）",
      desc:
        "世界最大の自動車市場だが、日本 OEM のシェアは BYD・吉利・長安等の現地勢に押され低下中。トヨタ・ホンダの中国シェアは過去 5 年で 30% 縮小。日産は撤退戦略観測。",
    },
    {
      name: "原油価格（WTI）",
      current: "2025 年 平均 75 ドル/バレル",
      desc:
        "OEM・Tier1 の生産コストに直結。1 バレル 10 ドル上昇で OEM 平均営業利益が約 2% 圧迫。資源価格の高止まりが続けば構造的コスト圧。",
    },
    {
      name: "車載半導体（SiC・MCU）需給",
      current: "2025 年は緩和、SiC は供給拡大局面",
      desc:
        "2021-23 年の半導体不足は完全解消。SiC（パワー半導体）は EV 普及加速で供給拡大競争、ロームとデンソーが国内大手。MCU は Renesas・三菱電機が強い。",
    },
  ],
  industryInsights: [
    {
      title: "EV 移行スピードに対する『地域差』が日本 OEM の差別化要因になる",
      lede:
        "EV 化は中国・欧州で先行、北米・新興国で緩い。日本 OEM の HEV 優位は『EV インフラ未整備地域』では 2030 年代まで通用する可能性が高い。",
      body:
        "市場のコンセンサスは『EV 移行は線形に進む』前提だが、地域差は決定的。中国（BEV 30% 超）と新興国（BEV 5% 未満）で 20-30 年のラグがある。日本 OEM、特にトヨタ・スズキ・ホンダは『EV インフラが整わない地域での HEV/ICE 優位』で利益を稼ぎ続けることが可能。EV シフトが線形にスムーズに進む前提でのバリュエーション（PER ディスカウント）は、長期で見直される余地がある。",
      citations: [
        { doc: "トヨタ自動車 2025年3月期 通期決算説明会資料" },
        { doc: "IEA Global EV Outlook 2025" },
      ],
    },
    {
      title: "中国市場の撤退戦略は『損失計上 vs 機会損失』の選択になる",
      lede:
        "中国 EV シフトと現地メーカー（BYD）の台頭で、日本 OEM の中国シェアは継続低下。日産・ホンダは撤退戦略観測、トヨタは Lexus 集中。",
      body:
        "中国販売台数の構造的縮小は日本 OEM 共通の課題。日産は東風日産の稼働率 50% 割れで撤退・縮小の特別損失計上が現実的に。ホンダも合弁見直し観測。トヨタは中位車種から撤退・Lexus 集中で『台数より単価』戦略。各社の中国戦略決算開示が今後 1-2 年の重要論点。撤退で短期損失計上 vs 残留で機会損失、両方の経済合理性を冷静に比較する必要。",
      citations: [
        { doc: "日産自動車 2025年3月期 通期決算説明会資料" },
        { doc: "ホンダ 2025年3月期 通期決算説明会資料" },
        { doc: "中国乗用車協会（CPCA）月次データ" },
      ],
    },
    {
      title: "ホンダ・日産の戦略提携は『業界再編の本格化』のシグナル",
      lede:
        "2025 年に成立した EV プラットフォーム共通化提携は、日本 OEM 7 社の自立路線が限界に近づいた象徴。次は誰と誰が組むかが論点。",
      body:
        "EV 投資負担（1 社あたり 5-10 兆円規模）と AI・ソフトウェア投資の同時進行で、Tier 2 OEM の単独生存は構造的に難しい。ホンダ・日産提携が機能すれば、スバル・マツダ・スズキも何らかの提携に動く可能性。すでにスズキ・マツダ・スバルはトヨタと資本提携しているが、EV プラットフォーム共通化レベルへの深化が観測される。Tier 2 OEM の独立性低下は、業界全体の利益率改善要因にもなりうる。",
      citations: [
        { doc: "ホンダ・日産 戦略提携発表資料（2025/3）" },
        { doc: "ホンダ 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "Tier1 の電動化売上比率が『次の評価軸』として定着しつつある",
      lede:
        "デンソー PER 14.8 倍 vs アイシン 11.5 倍。電動化部品（デンソー）と機構部品（アイシン）の事業構造の差が、評価倍率に明確に反映される時代。",
      body:
        "Tier1 業界の構造変化は OEM より速い。デンソーの電動化部品売上比率 22%（2030 年 35-40% 目標）、アイシンの e-Axle 立ち上がりペースが、両社の PER 格差を生んでいる。Bosch・Continental も同様の事業転換を進めており、Tier1 業界全体で『機構部品（衰退）から電動化部品（成長）への売上シフト率』が評価指標として定着しつつある。",
      citations: [
        { doc: "デンソー 2025年3月期 通期決算説明会資料" },
        { doc: "アイシン 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "ソフトウェアファースト戦略の実装速度がテスラ・中国 NEV との差を決める",
      lede:
        "トヨタ Arene、ホンダ AFEELA、日産（ホンダ提携経由）が次世代車載 OS 戦略。実装スピードが投資家最重要 KPI に。",
      body:
        "テスラ FSD・中国 NEV（XPeng・NIO）はソフトウェアアップデートで車両価値を維持・向上する仕組みを既に確立。日本 OEM の Arene・AFEELA は技術的キャッチアップ中だが、量産車への搭載タイミングが鍵。2026-27 年の搭載車種展開数が遅れれば、ソフトウェアの差別化機会が失われ、車両は『ハードウェアコモディティ化』のリスク。",
      citations: [
        { doc: "トヨタ Arene 開発状況（IR）" },
        { doc: "ホンダ AFEELA 発表資料" },
      ],
    },
  ],
};

export const TRADING_HOUSE: Industry = {
  slug: "trading-house",
  name: "総合商社",
  shortName: "商社",
  description:
    "5 大商社（三菱・三井・伊藤忠・住友・丸紅）+ 専門商社で構成。資源開発・トレーディング・事業投資を統合したユニークな日本型ビジネスモデル。バフェット（バークシャー）の保有で世界的に注目、配当 3-5% の安定収益型として個人投資家にも人気。",
  theme2025: [
    "バフェット（バークシャー）の保有継続・買い増し動向",
    "資源依存度の低下と『事業投資型』へのシフト",
    "鉄鉱石・LNG・銅・原料炭の市況サイクル",
    "中国経済・インド需要への感応度",
    "再エネ・水素・脱炭素関連投資",
    "ROE 経営と株主還元（自社株買い・増配）の強化",
  ],
  marketScale: {
    headline: "5 大商社合計時価総額 約 44 兆円",
    growth: "前年比 +12%（純利益総額 5 兆円超）",
    breakdown: "三菱 13.8 兆円 / 伊藤忠 10.3 兆円 / 三井 9.5 兆円 / 住友 5.1 兆円 / 丸紅 5.1 兆円",
  },
  chainColumns: [
    {
      title: "資源・エネルギー",
      subtitle: "鉄鉱石・LNG・原料炭・銅",
      positions: ["資源エネルギー", "金属素材"],
    },
    {
      title: "機械・モビリティ",
      subtitle: "船舶・自動車・建機・インフラ",
      positions: ["機械モビリティ"],
    },
    {
      title: "生活産業・DX",
      subtitle: "食料・コンビニ・住生活・新領域",
      positions: ["生活産業", "DX新領域"],
    },
  ],
  subClusters: [
    {
      key: "trading-energy",
      name: "資源・エネルギー型",
      role: "鉄鉱石・LNG・原料炭・銅などの資源権益を事業の柱とする商社。資源価格サイクルとの連動性が高い。",
      companyCodes: ["8058", "8031"],
      position: "資源エネルギー",
    },
    {
      key: "trading-nonresource",
      name: "非資源型（消費・サービス）",
      role: "コンビニ・繊維・住生活・食料など消費者接点が多い商社。資源価格変動の影響が小さく、ROE 効率が高い。",
      companyCodes: ["8001"],
      position: "生活産業",
    },
    {
      key: "trading-balanced",
      name: "バランス型・北米・電力",
      role: "金属・電力・食料・建機・メディアなどに多角展開、北米事業比率が高い商社。",
      companyCodes: ["8053", "8002"],
      position: "機械モビリティ",
    },
  ],
  competitiveStructure: [
    {
      sub: "資源・エネルギー型",
      summary:
        "三菱商事は LNG・銅・原料炭で、三井物産は鉄鉱石・LNG で世界トップクラスの権益を保有。資源価格変動で純利益が大きく振れる構造。バフェット投資で下値硬い。",
      detail:
        "三菱商事は LNG（豪州・カタール・ロシア等）・銅（チリ Escondida・Quellaveco）・原料炭（豪州 BHP 合弁）で世界トップクラスの権益。三井物産は鉄鉱石（VALE・BHP 持分）・LNG（豪州・米国・モザンビーク）で資源比率が 5 大商社最高。資源価格 1% 変動で純利益 100-200 億円の感応度。",
      shares: {
        metric: "純利益（2025/3 期、IFRS）",
        entries: [
          { rank: 1, name: "三菱商事", value: "1.12 兆円", note: "5 大商社首位、LNG・銅・原料炭" },
          { rank: 2, name: "三井物産", value: "9,400 億円", note: "鉄鉱石・LNG" },
          { rank: 3, name: "伊藤忠商事", value: "8,800 億円", note: "非資源・ファミマ" },
          { rank: 4, name: "住友商事", value: "4,300 億円", note: "金属・建機・J:COM" },
          { rank: 5, name: "丸紅", value: "4,950 億円", note: "食料・電力・北米" },
        ],
        note: "純利益は IFRS ベース、持分法損益を含む包括的な収益。",
      },
    },
    {
      sub: "非資源型（消費・サービス）",
      summary:
        "伊藤忠商事が唯一の純粋『非資源型』ポジション。ファミリーマート完全子会社化（2020）以降、ROE 17.8% で 5 大商社トップ。資源価格変動への耐性が構造的強み。",
      detail:
        "伊藤忠は資源比率 20% 未満、繊維・食料・住生活・情報金融・ファミマで純利益の 80% を稼ぐ。資源価格変動による収益振れが小さく、安定配当・安定 ROE を維持できる『非資源プレミアム』が PER に 1-2 倍程度上乗せされる構造。中国 CITIC 提携で中国市場アクセスも持つ。",
      shares: {
        metric: "資源比率（純利益ベース、2025/3 期推計）",
        entries: [
          { rank: 1, name: "伊藤忠商事", value: "18% （最低）", note: "ファミマ・繊維・住生活" },
          { rank: 2, name: "丸紅", value: "32%", note: "食料・電力" },
          { rank: 3, name: "住友商事", value: "38%", note: "金属比率高" },
          { rank: 4, name: "三菱商事", value: "42%", note: "LNG・銅" },
          { rank: 5, name: "三井物産", value: "55% （最高）", note: "鉄鉱石・LNG" },
        ],
      },
    },
    {
      sub: "バランス型・北米・電力",
      summary:
        "住友商事は構造改革途上で ROE 8.8% と劣後、丸紅は穀物・電力・北米事業で安定。両社とも PBR 1 倍前後で配当 3.8-4.5% の高配当株として個人投資家に人気。",
      detail:
        "住友商事は過去のニッケル事業損失（Ambatovy）の影響が残り ROE が他社より低い。J:COM の競争激化も重し。丸紅は穀物（Gavilon）・電力 IPP（世界 1.2 万 MW）・北米農業（Helena）で非資源型ポートフォリオを構築、北米事業比率 28% は商社中最大。",
    },
  ],
  keyKpis: [
    {
      name: "5 大商社合計純利益",
      current: "2025/3 期 約 5.1 兆円",
      desc:
        "5 大商社の純利益合計。2022/3 期に過去最高（合計 5.6 兆円）を記録、2023-25 年は資源価格落ち着きで横ばい〜微減局面。中国経済・LNG 価格動向で次年度の振れ幅大。",
      history: [
        { period: "2021/3", value: "約 2.0 兆円", note: "コロナ影響" },
        { period: "2022/3", value: "約 4.5 兆円", note: "資源高" },
        { period: "2023/3", value: "約 5.6 兆円", note: "過去最高" },
        { period: "2024/3", value: "約 5.0 兆円" },
        { period: "2025/3", value: "約 5.1 兆円" },
      ],
    },
    {
      name: "鉄鉱石価格（CFR 北中国 62%）",
      current: "2025 年平均 約 110 ドル/トン",
      desc:
        "三井物産・三菱商事の業績に最も影響する資源価格。中国不動産・鋼材需要次第で 80-150 ドル/トン のレンジで変動。1 ドル変動で 5 大商社合計純利益 ±200 億円程度の感応度。",
    },
    {
      name: "LNG 価格（JKM スポット）",
      current: "2025 年平均 約 12 ドル/MMBtu",
      desc:
        "アジア向け LNG スポット価格。三菱・三井のエネルギー利益に直接影響。欧州ロシア LNG 脱却で 2022-23 年は急騰（30-50 ドル）、2024-25 年は落ち着き。脱炭素過渡期に構造的需要拡大期待。",
    },
    {
      name: "バフェット保有率（バークシャー）",
      current: "5 大商社平均 8-9% （各社）",
      desc:
        "2020 年に 5% 保有を発表、2024 年までに 8-9% 規模に拡大。10% を超えると追加開示・買い増し制限の論点が生じる。バフェットの保有継続・買い増しメッセージが株価支援要因。",
      history: [
        { period: "2020", value: "5% 保有開始", note: "サプライズ発表" },
        { period: "2022", value: "6-7% に拡大" },
        { period: "2024", value: "8-9%", note: "上限近づくとの観測" },
      ],
    },
    {
      name: "USD/JPY 為替",
      current: "2025 年平均 150 円",
      desc:
        "商社は USD 建て売上・資源権益が多く、円安は基本的にプラス（USD/JPY ベータ 0.5-0.9）。ただし業績への波及はメーカー（OEM）より小さい。資源価格との合成感応度が重要。",
    },
    {
      name: "5 大商社平均配当利回り",
      current: "2025 年 約 3.8%",
      desc:
        "5 大商社の平均配当利回り。日経平均 1.8% 比べて高く、安定配当株として個人投資家に人気。各社とも累進配当（減配しない）方針を打ち出し、下値の支え。",
    },
  ],
  industryInsights: [
    {
      title: "バフェット保有 10% 接近で『追加買い増しの制限』が新たな論点に",
      lede:
        "5 大商社へのバフェット投資は 2024 年に 8-9% に到達。10% を超えると米国の追加開示義務・各社との交渉が必要で、買い増しペースが落ちる構造的変化。",
      body:
        "バークシャー・ハサウェイは 2020 年から 5 大商社株を継続的に買い増し、2024 年時点で各社 8-9% 規模に達する。日本の金融商品取引法では 5% 超を保有すると大量保有報告書の提出義務があり、10% 超で更に厳格な制約。バフェットは『保有を継続する』と明言しつつも、買い増しペースは緩やかになる可能性。これにより『バフェット効果による下支え』は維持されるが、『買い増しサプライズ』による上値伸びは限定的に。",
      citations: [
        { doc: "三菱商事 2025年3月期 通期決算説明会資料" },
        { doc: "Berkshire Hathaway 2024 Annual Letter" },
      ],
    },
    {
      title: "資源価格依存度の構造的低下が『PER ディスカウントの解消』を促す可能性",
      lede:
        "5 大商社は過去 10 年で『資源 → 非資源』への事業ポートフォリオシフトを進めてきた。PER 10-12 倍のディスカウント水準は、市場が依然『資源株』として評価している証左。",
      body:
        "5 大商社の純利益に占める資源・エネルギー比率は、2015 年の 60-70% から 2025 年の 30-50% へと低下。コンビニ・ヘルスケア・電力・農業・DX 投資など『安定収益型』にシフト中。それでも市場の PER 10-12 倍評価は資源株並みのディスカウント水準で、ROE 12-18% の質を考慮すれば構造的に割安。長期で『非資源プレミアム』が浸透すれば PER 14-15 倍への戻りで株価 +20-30% 余地。",
      citations: [
        { doc: "伊藤忠商事 2025年3月期 通期決算説明会資料" },
        { doc: "三菱商事 中期経営戦略 2026" },
      ],
    },
    {
      title: "中国不動産市場の構造的縮小が『資源型商社』の長期論点",
      lede:
        "鉄鉱石需要の 40-50% は中国の鋼材需要、特に不動産・インフラ。中国不動産市場の構造的縮小（年率 -10-15%）が三井・三菱の長期利益見通しに影。",
      body:
        "中国不動産市場は 2021 年ピーク後、年率 -10-15% で縮小中。鋼材需要も比例して減少、鉄鉱石価格は構造的下降圧力。三井物産（鉄鉱石比率 40% 超）と三菱商事（原料炭比率高）の長期利益見通しに影。インド・東南アジアの鋼材需要拡大で穴埋めできるかが、商社業界全体の長期評価を決める。",
      citations: [
        { doc: "三井物産 2025年3月期 通期決算説明会資料" },
        { doc: "中国国家統計局 不動産投資データ 2024" },
      ],
    },
    {
      title: "再エネ・水素・アンモニア投資の『収益貢献タイミング』が次の評価分水嶺",
      lede:
        "5 大商社は累計数兆円を再エネ・水素・アンモニア事業に投資中。発電開始・サプライチェーン構築は 2028-30 年からで、それまでは投資先行で収益貢献なし。",
      body:
        "三菱商事の洋上風力（秋田・千葉・新潟）、三井物産の水素・アンモニア、丸紅の電力 IPP 再エネシフト、住友商事のグリーン水素など、5 大商社は累計数兆円を投資。だが発電開始・収益化は 2028-30 年から本格化、それまでは投資先行で減価償却負担。脱炭素プレミアムが付くか、単なるコスト先行で終わるかが、5-10 年後の評価を分ける。",
      citations: [
        { doc: "三菱商事 洋上風力プロジェクト発表資料" },
        { doc: "丸紅 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "株主還元（自社株買い・累進配当）の継続性が個人投資家を惹きつけ続けるか",
      lede:
        "5 大商社は累進配当（減配しない）方針を打ち出し、自社株買いも継続。これが個人投資家の安定支持基盤となり、株価下値を支えている。",
      body:
        "5 大商社は 2021 年以降、累進配当（減配しない）方針を明示、自社株買いも年 1,000-3,000 億円規模で継続。配当利回り 3.5-4.5% は日経平均 1.8% 比べて高く、個人投資家・新 NISA 流入で買い支えられる構造。資源価格急落で純利益が一時的に大きく落ちる局面でも、配当を維持できるかが長期評価のカギ。",
      citations: [
        { doc: "三菱商事 中期経営戦略 2026" },
        { doc: "伊藤忠商事 株主還元方針 2025" },
      ],
    },
  ],
};

export const FINANCE: Industry = {
  slug: "finance",
  name: "金融（銀行・証券・保険）",
  shortName: "金融",
  description:
    "メガバンク 3 行（MUFG・SMFG・みずほ）+ 証券（野村）+ 損保 2 社（東京海上・MS&AD）で構成。日銀利上げサイクルの最大の受益者セクター。配当 3-5% の安定収益型として新 NISA 流入の受け皿でもある。",
  theme2025: [
    "日銀利上げサイクル（2024 年 0% → 2026 年 1% 想定）と預貸利ザヤ拡大",
    "新 NISA 拡大によるリテール顧客流入",
    "東南アジア・米国への積極 M&A 戦略",
    "気候変動による災害頻度増加と保険料率引き上げ",
    "PBR 1 倍割れ（みずほ・住友商事系・MS&AD）からの脱却",
    "累進配当方針による下値の支え",
  ],
  marketScale: {
    headline: "対象 6 社合計時価総額 約 71 兆円",
    growth: "前年比 +15%（利上げ恩恵）",
    breakdown: "MUFG 25.3 兆円 / SMFG 14.9 兆円 / 東京海上 11.3 兆円 / みずほ 10.6 兆円 / MS&AD 5.5 兆円 / 野村 3.3 兆円",
  },
  chainColumns: [
    {
      title: "銀行（メガバンク）",
      subtitle: "預貸利ザヤ + 投資銀行",
      positions: ["メガバンク"],
    },
    {
      title: "証券・資産運用",
      subtitle: "リテール + 投資銀行 + 運用",
      positions: ["証券"],
    },
    {
      title: "保険",
      subtitle: "損害保険・生命保険",
      positions: ["損保", "生保"],
    },
  ],
  subClusters: [
    {
      key: "fin-megabank",
      name: "メガバンク 3 行",
      role: "預貸利ザヤ・投資銀行・資産運用を統合した総合金融グループ。日銀利上げの最大受益者。",
      companyCodes: ["8306", "8316", "8411"],
      position: "メガバンク",
    },
    {
      key: "fin-securities",
      name: "総合証券（野村）",
      role: "リテール・投資銀行・運用の総合証券。新 NISA 拡大期のリテール再評価が期待される。",
      companyCodes: ["8604"],
      position: "証券",
    },
    {
      key: "fin-property-insurance",
      name: "損害保険大手",
      role: "自動車保険・火災保険を中心に、海外 M&A でグローバル展開する損保大手。",
      companyCodes: ["8766", "8725"],
      position: "損保",
    },
  ],
  competitiveStructure: [
    {
      sub: "メガバンク 3 行",
      summary:
        "MUFG が時価総額・規模で最大、SMFG が ROE・成長率でリード、みずほは PBR 0.85 倍と最割安だが過去のシステム障害で評価低位。3 行とも利上げ恩恵で利益拡大局面。",
      detail:
        "MUFG は預金 200 兆円超で最大、Morgan Stanley 20% 出資の隠れた価値も。SMFG は売上成長 +7.4% でリード、Olive 統合 App でリテール強化、Jefferies 提携で投資銀行も。みずほは Greenhill 買収（2023）で米投資銀行強化、楽天証券提携でリテール拡大。3 行とも累進配当方針で下値硬い。",
      shares: {
        metric: "預金残高（2025/3 期）",
        entries: [
          { rank: 1, name: "三菱 UFJ FG", value: "約 200 兆円", note: "国内首位" },
          { rank: 2, name: "三井住友 FG", value: "約 160 兆円" },
          { rank: 3, name: "みずほ FG", value: "約 130 兆円" },
        ],
        note: "メガバンク 3 行で日本の預金市場の約 40% を占める寡占構造。",
      },
    },
    {
      sub: "総合証券（野村）",
      summary:
        "野村 HD は日本最大の証券会社、リテール 530 万口座は新 NISA で拡大中。ただしホールセール（投資銀行）の収益効率課題で ROE 6.2% は金融セクター低位。",
      detail:
        "野村は Lehman Brothers アジア・欧州事業買収（2008）以来、グローバル投資銀行を志向するが、Goldman Sachs・JP Morgan と直接競争するには資本不足。専門領域（テクノロジー・ヘルスケア・サステナビリティ）への集中が中期戦略。新 NISA 拡大でリテール手数料は構造的拡大期。",
    },
    {
      sub: "損害保険大手",
      summary:
        "東京海上は海外比率 50% 超でグローバル分散、ROE 13.5% は損保業界トップ。MS&AD は ROE 8.4% で海外戦略加速が課題、配当 4.8% は損保業界最高。",
      detail:
        "東京海上は米 Pure Group・Privilege Underwriters 等の M&A で海外展開を加速、災害リスクをグローバル分散。MS&AD は東南アジア中心の海外戦略で東京海上よりやや劣後、ビッグモーター事案（2023）以降の代理店改革も進行中。",
      shares: {
        metric: "海外保険売上比率（2025/3 期）",
        entries: [
          { rank: 1, name: "東京海上 HD", value: "約 50% 超", note: "Pure Group 等で米国強化" },
          { rank: 2, name: "MS&AD HD", value: "約 32%", note: "東南アジア中心" },
          { rank: 3, name: "SOMPO HD（参考）", value: "約 30%", note: "本サービス未収録" },
        ],
      },
    },
  ],
  keyKpis: [
    {
      name: "日銀政策金利",
      current: "2026 年現在 0.5%",
      desc:
        "メガバンク利益の最大変動要因。政策金利 +0.25% で各メガバンクの当期純利益 +500-700 億円規模の感応度。2024 年 0% → 2026 年 1% 想定で、利上げの 1 サイクル中に各メガバンクの純利益は +2,000-3,000 億円規模で押し上げられる。",
      history: [
        { period: "2023", value: "-0.1%", note: "マイナス金利" },
        { period: "2024", value: "0% → 0.25%", note: "マイナス金利解除" },
        { period: "2025", value: "0.25% → 0.5%", note: "利上げ継続" },
        { period: "2026", value: "0.5% → 1.0% 想定" },
      ],
    },
    {
      name: "日本 10 年国債利回り",
      current: "2026 年現在 約 1.5%",
      desc:
        "保険会社の運用収益に直接影響、メガバンクの長期金利感応度の指標。1% 上昇で各メガバンク純利益 +200-300 億円、保険大手 +500-800 億円規模の感応度。",
      history: [
        { period: "2023", value: "0.5%" },
        { period: "2024", value: "1.0%" },
        { period: "2025", value: "1.3%" },
        { period: "2026", value: "1.5% 想定" },
      ],
    },
    {
      name: "新 NISA 口座数（証券業界全体）",
      current: "2025 年末 約 2,300 万口座",
      desc:
        "2024 年改正で年間 360 万円・生涯 1,800 万円の非課税枠拡大、口座数は年 +500-700 万のペースで拡大中。SMFG（Olive）・野村・楽天証券（みずほ提携）が主要受益者。新 NISA 流入で証券・運用報酬が構造的拡大。",
      history: [
        { period: "2023", value: "約 1,400 万口座（旧 NISA）" },
        { period: "2024", value: "約 1,800 万口座", note: "改正初年度" },
        { period: "2025", value: "約 2,300 万口座" },
      ],
    },
    {
      name: "メガバンク平均配当利回り",
      current: "2025 年 約 4.0%",
      desc:
        "3 メガバンクの平均配当利回り。MUFG 3.4% / SMFG 4.2% / みずほ 4.5%。累進配当（減配しない）方針で安定、日経平均 1.8% と比べて高く、個人投資家・新 NISA 流入の受け皿。",
    },
    {
      name: "メガバンク平均 ROE",
      current: "2025 年 約 8.4%",
      desc:
        "MUFG 8.8% / SMFG 8.6% / みずほ 7.8%。3 行とも累進的に改善中で、利上げサイクル完了時点で 10% 超への到達を目標。海外金融大手（JP Morgan 17%・Goldman Sachs 13%）と比べると低位だが、過去 10 年で着実に改善。",
    },
    {
      name: "損保業界 NEP（正味収入保険料）",
      current: "2025 年 約 13 兆円",
      desc:
        "国内損保業界全体の NEP。気候変動による災害頻度増加で保険料率は年率 +5-8% で上昇基調、業界全体の収益拡大ドライバー。海外比率が高い東京海上ほど、世界的な保険料率上昇の恩恵を享受。",
    },
  ],
  industryInsights: [
    {
      title: "日銀利上げサイクル『2026 年 1% 到達』が金融セクター最大のテーマ",
      lede:
        "政策金利 0% → 1% のサイクル中、メガバンク 3 行の純利益は合計 +5,000-7,000 億円規模で押し上げられる。市場の織り込み進度が PER の変動要因に。",
      body:
        "日銀は 2024 年マイナス金利解除以降、段階的に利上げを進める。2026 年に 1% 到達想定で、政策金利 +1% で各メガバンクの当期純利益が +2,000-3,000 億円規模の押し上げ効果。市場はこの織り込みを段階的に進めているが、利上げペースが想定より早い／遅いで PER が変動。日銀の総裁会見・議事要旨が金融株の主要価格変動要因に。",
      citations: [
        { doc: "MUFG 2025年3月期 通期決算説明会資料" },
        { doc: "日本銀行 2025 年経済・物価情勢の展望" },
      ],
    },
    {
      title: "PBR 1 倍割れ脱却が 3 メガバンク + MS&AD 共通の長期テーマ",
      lede:
        "SMFG・みずほ・MS&AD は PBR 1 倍割れ。東証の『PBR 1 倍超改善要請』もあり、自社株買い・増配・ROE 改善で PBR 1.2-1.5 倍への戻りが期待される。",
      body:
        "2023 年の東証『資本コストや株価を意識した経営の実現』要請以降、PBR 1 倍割れ企業は改善計画開示を求められる。3 メガバンク + MS&AD は累進配当・自社株買い・ROE 改善で対応中。PBR 1.0 → 1.2 倍への戻りで株価は +20% 上昇余地、各社の改善計画の実行力が次の評価軸。",
      citations: [
        { doc: "東京証券取引所 2023 年 3 月『資本コストや株価を意識した経営の実現に向けた対応』" },
        { doc: "みずほ FG 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "新 NISA は『証券・運用業界の構造的拡大』を 5-10 年規模で実現",
      lede:
        "2024 年改正で生涯 1,800 万円の非課税枠拡大、年 500-700 万口座のペースで拡大中。SMFG（Olive）・野村・楽天証券（みずほ提携）が主要受益者。",
      body:
        "新 NISA 改正で国内個人金融資産（2,000 兆円超）の運用シフトが構造的に加速。年間の純流入額は 5-10 兆円規模、証券業界全体の運用報酬・販売手数料を押し上げる。SMFG の Olive、野村のリテール、楽天証券（みずほ提携）の 3 つが主要受益者として位置付けられる。投資信託の純資産総額は 2030 年に 300 兆円超を目指す。",
      citations: [
        { doc: "投資信託協会 統計データ 2025" },
        { doc: "SMFG 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "気候変動による『災害頻度増加』は保険業界にとって短期コスト・長期機会",
      lede:
        "台風・洪水・山火事の頻度・規模拡大で、損保業界は短期的に支払い増加、長期的に保険料率上昇という両面性。東京海上は海外分散でリスク低減。",
      body:
        "気候変動の進行で災害支払いは年率 +3-5% で増加、これ自体は損保業界のコスト圧。しかし保険料率の毎年引き上げ（米国住宅保険では +10-15%）で対応可能。東京海上は海外比率 50% 超でグローバル分散、地理的にリスクをならす構造優位。MS&AD は海外比率 32% で東京海上より相対的に災害集中リスク高い。",
      citations: [
        { doc: "東京海上 HD 2025年3月期 通期決算説明会資料" },
        { doc: "IPCC 第 6 次評価報告書（2023）" },
      ],
    },
    {
      title: "ビッグモーター事案以降の代理店改革が業界全体の構造変化",
      lede:
        "2023 年のビッグモーター事案で MS&AD・損保ジャパン・東京海上の 3 社が業務改善命令。代理店契約見直し・コンプライアンス強化が業界全体で進行。",
      body:
        "2023 年のビッグモーター事案（修理代不正請求・保険金詐欺等）は損保業界に大きな信頼ダメージ。3 社が業務改善命令、代理店契約の見直し・代理店手数料体系の透明化・コンプライアンス強化が業界共通の課題。短期は事務コスト増（年間数百億円）だが、長期では『健全な代理店ネットワーク』の確立、業界全体の評価回復につながる。",
      citations: [
        { doc: "MS&AD 2025年3月期 通期決算説明会資料" },
        { doc: "金融庁 損害保険業界の構造的問題と課題（2024）" },
      ],
    },
  ],
};

export const REAL_ESTATE: Industry = {
  slug: "real-estate",
  name: "不動産",
  shortName: "不動産",
  description:
    "3 大デベロッパー（三井不動産・三菱地所・住友不動産）と住宅 2 社（大和ハウス・積水ハウス）で構成。日銀利上げの逆受益者と思われがちだが、インフレ局面で賃料・資産価値が上昇するため『金利 vs インフレ』の合成感応度が本質。E-commerce 拡大で物流施設の構造的需要拡大も追い風。",
  theme2025: [
    "日銀利上げによるディスカウント vs インフレでの賃料上昇",
    "都心オフィス再開発（三井日本橋・三菱地所 Torch Tower）",
    "E-commerce 拡大による物流施設需要",
    "海外不動産（米国・英国・東南アジア）への積極投資",
    "新築住宅市場縮小とリフォーム・ストック市場拡大",
    "プレミアム住宅・富裕層需要の金利耐性",
  ],
  marketScale: {
    headline: "対象 5 社合計時価総額 約 15 兆円",
    growth: "前年比 +8%（再開発・物流伸長）",
    breakdown: "三井 4.1 兆円 / 三菱地所 3.3 兆円 / 大和ハウス 2.8 兆円 / 住友 2.5 兆円 / 積水 2.5 兆円",
  },
  chainColumns: [
    {
      title: "オフィス・商業",
      subtitle: "都心デベロッパー・賃貸",
      positions: ["オフィス不動産"],
    },
    {
      title: "住宅",
      subtitle: "戸建・賃貸・マンション",
      positions: ["住宅不動産"],
    },
    {
      title: "商業・物流・海外",
      subtitle: "ショッピングモール・物流施設・海外",
      positions: ["商業物流", "海外不動産"],
    },
  ],
  subClusters: [
    {
      key: "re-office",
      name: "オフィス・商業デベロッパー",
      role: "東京都心のオフィスビル・商業施設を中心に開発・賃貸する 3 大デベロッパー。",
      companyCodes: ["8801", "8802", "8830"],
      position: "オフィス不動産",
    },
    {
      key: "re-housing",
      name: "住宅大手",
      role: "戸建住宅・賃貸住宅・マンションを中心に展開、海外住宅事業にも進出する住宅大手。",
      companyCodes: ["1925", "1928"],
      position: "住宅不動産",
    },
  ],
  competitiveStructure: [
    {
      sub: "オフィス・商業デベロッパー",
      summary:
        "三井不動産が最大規模、三菱地所が丸の内ブランドで賃料単価最高、住友不動産が賃貸事業比率最高で営業利益率トップ。3 社とも 1-2 兆円規模の再開発を推進中。",
      detail:
        "三井不動産は日本橋・八重洲再開発（1 兆円超）、ららぽーと・三井アウトレットモールで多角展開、海外比率 18%。三菱地所は丸の内・大手町プレミアムオフィス特化、Torch Tower（2028 年竣工、高さ 390m）で長期成長。住友不動産は六本木・新宿の自社開発オフィスビルで賃貸事業比率 50% 超、営業利益率 22.5% は業界トップ。",
      shares: {
        metric: "賃貸事業の営業利益率（2025/3 期）",
        entries: [
          { rank: 1, name: "住友不動産", value: "38.5%", note: "賃貸特化型" },
          { rank: 2, name: "三菱地所", value: "32.5%", note: "丸の内プレミアム" },
          { rank: 3, name: "三井不動産", value: "28.5%", note: "多角展開型" },
        ],
        note: "営業利益率の差は事業ポートフォリオ構成（賃貸 vs 分譲 vs その他）の差。",
      },
    },
    {
      sub: "住宅大手",
      summary:
        "大和ハウスは物流施設 1.5 兆円規模で E-commerce 拡大の最大受益者、積水ハウスは MDC Holdings 買収（2024、5,500 億円）で米国住宅市場本格参入。両社とも国内住宅市場縮小に対する分散戦略。",
      detail:
        "大和ハウスは戸建・賃貸・マンションから物流施設（DPL）・商業・海外（米国・東南アジア）まで多角展開。物流施設は国内トップ級保有額 1.5 兆円規模で、E-commerce 拡大の構造的恩恵を享受。積水ハウスは MDC Holdings 買収で海外売上比率 12% → 22% に急拡大、プレミアム戸建（シャーウッド・イズ）で富裕層需要も取り込む。",
      shares: {
        metric: "新築戸建住宅着工戸数シェア（2024 推計）",
        entries: [
          { rank: 1, name: "大和ハウス", value: "約 13%", note: "戸建大手首位" },
          { rank: 2, name: "積水ハウス", value: "約 11%", note: "プレミアム特化" },
          { rank: 3, name: "住友林業（参考）", value: "約 6%", note: "本サービス未収録" },
          { rank: 4, name: "三井ホーム（参考）", value: "約 4%", note: "プレミアム特化" },
        ],
      },
    },
  ],
  keyKpis: [
    {
      name: "東京オフィス空室率（都心 5 区）",
      current: "2025 年 5-6%",
      desc:
        "千代田・中央・港・新宿・渋谷区の平均オフィス空室率。5% 以下なら賃料上昇局面、6% 超なら賃料下落局面。丸の内・大手町は特に低く 2% 台で、プレミアム需要の象徴。",
      history: [
        { period: "2021", value: "6.5%", note: "コロナ影響ピーク" },
        { period: "2023", value: "6.0%" },
        { period: "2024", value: "5.5%" },
        { period: "2025", value: "5.0%", note: "改善基調" },
      ],
    },
    {
      name: "東京オフィス賃料単価（都心 5 区平均）",
      current: "2025 年 約 22,000 円/坪",
      desc:
        "都心オフィス賃料単価。インフレ局面で年率 +3-5% で上昇基調。丸の内・大手町は単価最高（40,000 円超）、新興エリアは 12,000-15,000 円程度。",
    },
    {
      name: "10 年国債利回り（不動産への逆相関）",
      current: "2026 年現在 約 1.5%",
      desc:
        "不動産株は 10 年国債利回りに逆相関。1% 上昇で不動産株は平均 -10-15% 下落の歴史的傾向。三菱地所が最も感応度高（US10Y ベータ -0.78）。日銀利上げサイクルが業界全体の逆風。",
    },
    {
      name: "新築戸建住宅着工戸数",
      current: "2025 年 約 80 万戸",
      desc:
        "日本の新築戸建住宅着工戸数。年率 -3-5% で構造的縮小、人口減・若者離れ・住宅価格上昇が主因。大和ハウス・積水ハウスは物流・海外へのシフトで対応。",
      history: [
        { period: "2020", value: "約 100 万戸" },
        { period: "2022", value: "約 95 万戸" },
        { period: "2024", value: "約 85 万戸" },
        { period: "2025", value: "約 80 万戸" },
      ],
    },
    {
      name: "物流施設賃料単価（首都圏）",
      current: "2025 年 約 5,500 円/坪",
      desc:
        "首都圏物流施設の賃料単価。E-commerce 拡大で需要構造的拡大、過去 5 年で +25% 上昇。大和ハウス（DPL）・三井不動産（MFLP）・三菱地所などが大手保有者。",
    },
    {
      name: "訪日インバウンド客数（参考）",
      current: "2025 年 約 4,000 万人（過去最高）",
      desc:
        "訪日客数。ホテル・商業施設の利益貢献に直結。三井不動産（ホテル）・三菱地所（KITTE 等商業）・住友不動産（ヴィラフォンテーヌ）の主要収益ドライバー。",
    },
  ],
  industryInsights: [
    {
      title: "日銀利上げサイクル中の不動産株は『金利 vs インフレ』の合成で見る",
      lede:
        "日銀利上げで PER は切り下げ圧力、インフレで賃料・資産価値は上昇。両者の合成感応度が業界の本質。",
      body:
        "市場の単純な視点では『利上げ = 不動産マイナス』だが、実際はインフレ局面では賃料が年率 +3-5% で上昇、資産価値（NAV）も上昇する。三井不動産の US10Y ベータ -0.62、三菱地所 -0.78 は確かに利上げで圧迫されるが、インフレ率 2-3% が続けば賃料上昇で純利益はネット中立～プラス。短期的なボラティリティは高いが、長期では『利上げ織り込み完了 + インフレ恩恵』の局面が来る。",
      citations: [
        { doc: "三井不動産 2025年3月期 通期決算説明会資料" },
        { doc: "日本銀行 2025 年経済・物価情勢の展望" },
      ],
    },
    {
      title: "都心再開発の『完成タイミング』が中期株価の最重要 KPI",
      lede:
        "三井（日本橋・八重洲、2027-30 年竣工）・三菱地所（Torch Tower、2028 年竣工）の大型開発が完成すれば賃料収入が段階的拡大。",
      body:
        "三井不動産の日本橋エリア・八重洲エリアでの再開発（1 兆円超）、三菱地所の常盤橋プロジェクト Torch Tower（1.2 兆円規模、日本一の超高層ビル）が 2027-30 年に順次完成。完成後の賃料収入は三井 +1,500-2,000 億円、三菱地所 +700-900 億円規模で、純利益を 20-30% 押し上げる構造変化。完成タイミングが市場予想通りか、遅延するかで PER の評価が変動。",
      citations: [
        { doc: "三井不動産 中期経営計画 2026" },
        { doc: "三菱地所 Torch Tower 開発計画" },
      ],
    },
    {
      title: "物流施設は『E-commerce 拡大の最大の構造的受益者』",
      lede:
        "Amazon・楽天・Yahoo 等の e-commerce 拡大で物流施設の需要は年率 +10% で拡大、賃料も継続上昇。大和ハウス（DPL 1.5 兆円）が国内トップ。",
      body:
        "E-commerce 比率は日本で 9% 程度（米国 16%・中国 30%）でまだ拡大余地大。物流施設の賃料単価は過去 5 年で +25% 上昇、空室率は 2-3% 台で逼迫。大和ハウスの DPL シリーズ（1.5 兆円）は国内トップ、三井不動産の MFLP も 5,000 億円規模で 2 位級。物流施設特化型 REIT（GLP・プロロジス）の好調も傍証。",
      citations: [
        { doc: "大和ハウス 2025年3月期 通期決算説明会資料" },
        { doc: "経済産業省 電子商取引市場調査 2024" },
      ],
    },
    {
      title: "新築戸建住宅市場の構造的縮小 vs リフォーム・ストック市場の拡大",
      lede:
        "日本の新築戸建着工は年率 -3-5% で縮小、住宅大手は物流・海外・リフォームへの分散戦略。",
      body:
        "日本の人口減・若者の住宅離れで新築戸建市場は構造的縮小。一方、6,000 万戸超の住宅ストック市場でのリフォーム・リノベーション需要は拡大基調。積水ハウスのリフォーム事業（1,800 億円）・住友不動産のリフォーム（業界 3 位級）が長期受益者。新築依存からの脱却スピードが住宅大手の長期評価を決める。",
      citations: [
        { doc: "国土交通省 住宅着工統計" },
        { doc: "積水ハウス 中期経営計画 2026" },
      ],
    },
    {
      title: "海外不動産投資（米国・英国・東南アジア）は『日本市場縮小』への保険",
      lede:
        "三井不動産（米英）・大和ハウス（米国・東南アジア）・積水ハウス（米国 MDC 買収）など、海外比率拡大が業界共通の戦略。",
      body:
        "日本国内不動産市場の構造的縮小（人口減・賃料上限）への分散戦略として、3 大デベロッパー + 住宅大手は海外比率拡大を推進。三井不動産 18%、大和ハウス 22%、積水ハウス 22%（MDC 買収後）で、住友不動産だけが国内特化。為替リスク・地政学リスクと引き換えに、米国住宅・物流市場の構造的需要を取り込む。海外事業の利益貢献率拡大が PER 再評価のドライバー。",
      citations: [
        { doc: "積水ハウス MDC Holdings 買収発表資料（2024）" },
        { doc: "三井不動産 2025年3月期 通期決算説明会資料" },
      ],
    },
  ],
};

export const TELECOM: Industry = {
  slug: "telecom",
  name: "通信・AI 投資",
  shortName: "通信",
  description:
    "NTT・KDDI（移動通信＋固定通信、累進配当の安定収益型）と、ソフトバンクグループ（Arm・OpenAI 等 AI 上流投資の持株会社）・楽天グループ（EC × モバイル × 金融経済圏）の対照的な 4 社で構成。前 2 社は『安定配当型』、後 2 社は『成長 & ボラ型』で、同セクターでも投資性格が真逆。",
  theme2025: [
    "国内モバイル市場の完全飽和（人口カバー率 99% 超）と ARPU 競争",
    "Stargate プロジェクト（OpenAI・SBG・Oracle、最大 5,000 億ドル）と AI インフラ投資",
    "楽天モバイル黒字化シナリオ（2026-28 年）の進展",
    "IOWN（NTT）光技術次世代インフラ商業化への投資",
    "Starlink との連携による衛星通信エリア拡大（KDDI 先行）",
    "経済圏 MAU 競争（au 4,800 万 vs 楽天 5,500 万 vs LINE ヤフー 9,500 万）",
  ],
  marketScale: {
    headline: "対象 4 社合計時価総額 約 45.6 兆円",
    growth: "前年比 +25%（SBG 主導、Arm + OpenAI 評価益）",
    breakdown: "SBG 16.8 兆円 / NTT 15.2 兆円 / KDDI 11.3 兆円 / 楽天 2.3 兆円",
  },
  chainColumns: [
    {
      title: "移動通信（モバイル）",
      subtitle: "ドコモ・au・SoftBank・楽天モバイル",
      positions: ["移動通信"],
    },
    {
      title: "固定通信・インターネット",
      subtitle: "FTTH・EC・データセンタ",
      positions: ["固定通信", "インターネット"],
    },
    {
      title: "AI・半導体投資",
      subtitle: "Arm・OpenAI・Stargate",
      positions: ["AI投資"],
    },
  ],
  subClusters: [
    {
      key: "tel-stable",
      name: "通信安定配当 2 社",
      role: "NTT・KDDI、累進配当方針で 22 期連続増配の安定収益型。配当目的投資家の代表的安全資産。",
      companyCodes: ["9432", "9433"],
      position: "移動通信",
    },
    {
      key: "tel-ai-invest",
      name: "AI 投資持株会社（SBG）",
      role: "Arm・OpenAI・Stargate への大型投資で AI 上流バリューチェーンを制圧、通信会社というより投資ファンド。",
      companyCodes: ["9984"],
      position: "AI投資",
    },
    {
      key: "tel-rakuten",
      name: "EC × モバイル経済圏（楽天）",
      role: "EC を起点とする経済圏型企業、モバイル赤字を金融セグメントが支える構造。",
      companyCodes: ["4755"],
      position: "インターネット",
    },
  ],
  competitiveStructure: [
    {
      sub: "通信安定配当 2 社（NTT・KDDI）",
      summary:
        "NTT が時価総額・規模で最大（15.2 兆円）、KDDI はライフデザイン戦略（au PAY・ローソン）で他社差別化。両社とも 22 期連続増配・配当 3% 台で安定。",
      detail:
        "NTT は ドコモ完全子会社化（2020）・NTT データ完全子会社化（2024）で資本構成簡素化、IOWN（光技術）への 1 兆円投資で次世代成長を狙う。海外売上比率 22% は NTT データ起因。KDDI は au PAY 経済圏（MAU 4,800 万）・ローソン買収（2024、三菱商事と共同）で通信＋生活サービス統合、Starlink 連携で楽天モバイルへ牽制。両社とも国内市場の完全成熟下で『非通信収益拡大』が次の競争軸。",
      shares: {
        metric: "国内モバイル契約数シェア（2025/3）",
        entries: [
          { rank: 1, name: "NTT ドコモ（9432）", value: "約 36%", note: "8,800 万契約" },
          { rank: 2, name: "au（KDDI 9433）", value: "約 27%", note: "6,300 万契約" },
          { rank: 3, name: "ソフトバンク（9434・参考）", value: "約 25%", note: "本サービス未収録、SBG 子会社" },
          { rank: 4, name: "楽天モバイル（4755）", value: "約 4%", note: "800 万契約・拡大期" },
        ],
        note: "国内市場は実質的に NTT・KDDI・SoftBank の 3 強寡占 + 楽天という構造。",
      },
    },
    {
      sub: "AI 投資持株会社（SBG）",
      summary:
        "SBG は通信会社ではなく『AI 投資ファンド』。Arm（半導体設計）保有・OpenAI 大型投資（推定 400 億ドル）・Stargate プロジェクト（最大 5,000 億ドル）で AI 上流バリューチェーンを制圧。",
      detail:
        "Arm Holdings（NASDAQ: ARM）の時価約 17-20 兆円のうち SBG 保有 90%、つまり Arm 保有価値だけで SBG 時価 16.8 兆円を超える計算。OpenAI への推定 400 億ドル投資（評価額 3,000 億ドル時）・Stargate プロジェクト（OpenAI・Oracle・MGX 共同）で『モデル＋インフラ＋半導体』の三位一体ポジション。子会社のソフトバンク株式会社（9434）は移動通信事業、SBG とは別法人。SBG 時価は NAV（純資産価値）の 50% 程度ディスカウントが構造的継続。",
    },
    {
      sub: "EC × モバイル経済圏（楽天）",
      summary:
        "楽天は EC（楽天市場）×モバイル×金融の三位一体経済圏。楽天モバイル赤字（年 -3,000 億円）が業績圧迫、フィンテック（楽天銀行・証券）が支える構造。",
      detail:
        "楽天市場は日本 EC 2 位、楽天モバイルは契約 800 万・ARPU 2,200 円で 2026-28 年黒字化計画。楽天銀行（2023 上場、預金 12 兆円）・楽天証券（口座 1,200 万）は金融セグメント営業利益率 24.5% で隠れた金鉱。楽天 ID 1.1 億・MAU 5,500 万は LINE ヤフー（PayPay）に次ぐ巨大経済圏で、購買データ × 金融データの結合密度では業界トップ。モバイル黒字化シナリオの確度上昇で株価 2 倍化余地。",
    },
  ],
  keyKpis: [
    {
      name: "国内モバイル契約数（業界全体）",
      current: "2025 年 約 2.4 億契約",
      desc:
        "人口の約 2 倍で完全飽和、純増は年 +200-300 万契約規模に減速。複数回線契約・サブブランド・MVNO 含む。国内市場は ARPU（顧客単価）競争と非通信収益拡大が主戦場。",
      history: [
        { period: "2020", value: "約 2.0 億契約" },
        { period: "2022", value: "約 2.2 億契約" },
        { period: "2025", value: "約 2.4 億契約", note: "完全飽和" },
      ],
    },
    {
      name: "ARPU（モバイル平均顧客単価）",
      current: "2025 年 約 4,200 円/月",
      desc:
        "業界平均月額 ARPU。NTT・KDDI・SoftBank は 6,000-7,000 円、楽天モバイルは 2,200 円。2020 年の総務省『携帯料金引き下げ』で大幅下落、現在は値上げ局面に転換。",
      history: [
        { period: "2020", value: "約 4,800 円", note: "値下げ前" },
        { period: "2021", value: "約 4,000 円", note: "値下げ実施" },
        { period: "2025", value: "約 4,200 円", note: "上昇局面に転換" },
      ],
    },
    {
      name: "Arm Holdings 時価総額",
      current: "2026 年現在 約 17-20 兆円",
      desc:
        "SBG 保有 90% の半導体設計プラットフォーマー。AI チップ設計のデファクト企業として SOX 指数の上昇に強く連動（β 2.5）。SBG 株価変動の最大要因。",
      history: [
        { period: "2023", value: "約 7 兆円", note: "IPO 直後" },
        { period: "2024", value: "約 13 兆円" },
        { period: "2025", value: "約 17 兆円" },
      ],
    },
    {
      name: "10 年国債利回り（通信株への逆相関）",
      current: "2026 年現在 約 1.5%",
      desc:
        "高配当銘柄である通信株は国債利回りに逆相関、特に NTT（US10Y β -0.42）・KDDI（-0.38）の感応度高い。利回り 1% 上昇で通信株は平均 -6-8% 下落の歴史的傾向。",
    },
    {
      name: "楽天モバイル契約数",
      current: "2025 年 約 800 万契約",
      desc:
        "楽天 G の業績ターニングポイント。1,000 万契約・ARPU 3,000 円で黒字化計画、現在 800 万 ×2,200 円で進捗 80%。2026-28 年の黒字化実現が株価最大のドライバー。",
      history: [
        { period: "2022", value: "約 500 万契約", note: "減少局面" },
        { period: "2024", value: "約 700 万契約", note: "回復" },
        { period: "2025", value: "約 800 万契約" },
      ],
    },
    {
      name: "経済圏 MAU（月間アクティブユーザ）比較",
      current: "2025 年",
      desc:
        "通信＋生活サービスの統合度を示す指標。LINE ヤフー（PayPay）9,500 万、楽天 5,500 万、au（KDDI）4,800 万、d 払い（NTT ドコモ）4,200 万。MAU × クロスユース率が顧客生涯価値を決定。",
    },
  ],
  industryInsights: [
    {
      title: "通信セクターは『安定配当 2 社 vs 成長 & ボラ 2 社』の対照的構造で投資性格が真逆",
      lede:
        "NTT・KDDI は累進配当・配当 3% 台の安全資産、SBG・楽天は AI 投資・モバイル赤字脱却で高ボラ。同セクターでも完全に投資判断軸が異なる。",
      body:
        "通信セクターでは NTT（β 0.68）・KDDI（β 0.62）が市場連動性低く、配当目的の長期保有向け。一方 SBG（β 1.42・SOX β 2.45）・楽天（β 1.25）は AI 半導体・モバイル赤字脱却シナリオで高ボラ。新 NISA で安定配当を求める個人投資家は前者、リスクオン局面でリターンを求めるなら後者という、同セクター内でのバーベル戦略が成立する。投資家は『通信銘柄』と一括りにせず、4 社の性格差を理解する必要がある。",
      citations: [
        { doc: "NTT 2025年3月期 通期決算説明会資料" },
        { doc: "SoftBank G 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "Stargate プロジェクトは『AI 産業の電力・半導体・モデルを丸ごと制圧する』超長期戦略",
      lede:
        "OpenAI・SBG・Oracle・MGX 共同の米国 AI インフラプロジェクト、最大 5,000 億ドル投資計画。SBG にとって NAV を構造的に押し上げる最大要因。",
      body:
        "Stargate は AI モデル（OpenAI）×データセンタ（Oracle）×半導体（Arm・NVIDIA）×ファイナンス（SBG・MGX）の垂直統合 AI インフラ構想、米テキサスを中心に 4 年で 5,000 億ドル投資計画。実現すれば SBG は『AI バリューチェーン全層への持分』を獲得、Arm（半導体）+ OpenAI（モデル）+ Stargate（インフラ）の三位一体ポジション。投資規模は実行率 50% でも 2,500 億ドル、SBG の時価 16.8 兆円を超える規模で、長期的な再評価ドライバーとして機能。",
      citations: [
        { doc: "SoftBank G 2025年3月期 通期決算説明会資料" },
        { doc: "OpenAI Stargate 発表 2025年1月" },
      ],
    },
    {
      title: "IOWN（NTT 光技術）は『AI 時代の電力消費爆発』を解決する構造的長期テーマ",
      lede:
        "光技術で消費電力 1/100・伝送容量 125 倍を狙う次世代通信インフラ。NTT は 2023-2030 年で約 1 兆円投資、2027-30 年商業展開計画。",
      body:
        "AI 推論需要拡大でデータセンタ電力消費は 2030 年に世界の電力 6-8% を占める見込み（現在 2-3%）。IOWN（Innovative Optical and Wireless Network）は電気信号から光信号への置換で電力消費を 1/100 に削減する技術構想で、AI 時代の電力ボトルネックを解決する候補。NTT 単独では事業化に限界、ソニー・インテル等とのアライアンス『IOWN Global Forum』で標準化を推進中。商業展開が始まれば NTT の中核技術として超長期成長軸、現時点では PER に織り込まれていない。",
      citations: [
        { doc: "NTT 2025年3月期 統合報告書" },
        { doc: "IOWN Global Forum 技術ロードマップ 2024" },
      ],
    },
    {
      title: "楽天モバイル黒字化（2026-28 年）は楽天 G 株価の最大の感応度要因",
      lede:
        "5 年間で累計 1.5 兆円超を投資、ARPU 上昇・契約 1,000 万到達で 2026-27 年単月黒字化計画。黒字化確度上昇で株価 2 倍化余地。",
      body:
        "楽天モバイルは 2020 年 4 月サービス開始以降、5 年間で累計 1.5 兆円超を投資。プラチナバンド獲得（2024）で繋がりやすさ問題が大幅改善、人口カバレッジ 99.9% 達成。ARPU は 2,200 円から 3,000 円目標、契約数も 800 万 → 1,000 万を目指す。黒字化シナリオ実現で連結純利益は +3,000 億円押し上げ、株価 2 倍化余地。逆に黒字化遅延で資金繰り懸念再燃のリスクも併存、ハイリスク・ハイリターン銘柄の代表。",
      citations: [
        { doc: "楽天グループ 2025年12月期 通期決算説明会資料" },
        { doc: "総務省 2024 年プラチナバンド再割当て" },
      ],
    },
    {
      title: "経済圏 MAU 競争で『au × ローソン買収（2024）』は通信業界の地殻変動",
      lede:
        "三菱商事 × KDDI のローソン買収（2024、約 5,000 億円）で『通信＋コンビニ＋ポイント』の統合経済圏が成立、楽天・LINE ヤフーへの対抗軸構築。",
      body:
        "コンビニ 14,000 店舗の日常接点 + au モバイル + au PAY 決済 + Ponta ポイントの統合は、楽天経済圏（EC 起点）・LINE ヤフー経済圏（メッセンジャー起点）に次ぐ第三勢力。au 経済圏 MAU 4,800 万人が、ローソン買収で +1,000 万人規模の MAU 上乗せ、KDDI 利益貢献は年 +1,200 億円規模。三菱商事もコンビニ事業の再評価獲得で win-win。経済圏競争は『リアル接点 × デジタル接点 × 金融データ』の三軸統合度合いが勝負軸。",
      citations: [
        { doc: "KDDI 2025年3月期 通期決算説明会資料" },
        { doc: "ローソン TOB 公表資料 2024年2月" },
      ],
    },
  ],
};

export const CHEMICALS: Industry = {
  slug: "chemicals",
  name: "化学・素材",
  shortName: "化学",
  description:
    "総合化学 2 社（三菱ケミカル・住友化学）と機能性素材専業（東レ）の対照的な 3 社で構成。中国の過剰供給による『汎用化学の構造不況』と、半導体材料・炭素繊維・電池セパレータ等『機能性素材の構造拡大』という業界の二極化が本質。信越化学（4063、半導体材料側）と並べて理解すると業界の二軸が見える。",
  theme2025: [
    "汎用化学（スチレン・コークス・基礎石化）の中国過剰供給による構造不況",
    "三菱ケミカル・住友化学の事業ポートフォリオ転換（汎用 → 機能性へ）",
    "半導体材料（信越シリコンウェハ・JSR/東京応化レジスト）の構造拡大",
    "炭素繊維（東レ）の Boeing/Airbus 生産回復による需要回復",
    "リチウムイオン電池用セパレータ（東レ・旭化成）の EV 拡大恩恵",
    "東証 PBR 改善要請（住友化学 0.62 倍・三菱ケミカル 0.92 倍が主要対象）",
  ],
  marketScale: {
    headline: "対象 3 社合計時価総額 約 3.7 兆円（信越化学 14.4 兆円を別途参照）",
    growth: "前年比 -5%（汎用化学不振）",
    breakdown: "東レ 1.6 兆円 / 三菱ケミカル 1.5 兆円 / 住友化学 0.64 兆円",
  },
  chainColumns: [
    {
      title: "汎用化学（構造不況）",
      subtitle: "スチレン・基礎石化・コークス",
      positions: ["汎用化学"],
    },
    {
      title: "機能性化学",
      subtitle: "MMA・電子材料・農薬",
      positions: ["機能性化学"],
    },
    {
      title: "機能性素材・繊維",
      subtitle: "炭素繊維・電池セパレータ・水処理膜",
      positions: ["繊維素材", "半導体材料"],
    },
  ],
  subClusters: [
    {
      key: "chem-conglomerate",
      name: "総合化学（汎用＋機能性のミックス）",
      role: "汎用化学（スチレン・石化）と機能性化学（MMA・電子材料）を併せ持つ大手。汎用部門の構造不況からの転換が長期テーマ。",
      companyCodes: ["4188", "4005"],
      position: "汎用化学",
    },
    {
      key: "chem-functional-material",
      name: "機能性素材専業（東レ）",
      role: "汎用化学から脱却、炭素繊維・電池セパレータ・水処理膜の機能性素材世界トップシェア多数。Boeing/Airbus・EV・水不足の恩恵を直接享受。",
      companyCodes: ["3402"],
      position: "繊維素材",
    },
  ],
  competitiveStructure: [
    {
      sub: "総合化学（三菱ケミカル・住友化学）",
      summary:
        "三菱ケミカルは MMA 世界 1 位 + 産業ガス（Nippon Sanso）で利益基盤強い、PBR 0.92 倍。住友化学は Petro Rabigh 巨額赤字・住友ファーマ失敗で連結赤字、PBR 0.62 倍は化学業界最低水準で再建シナリオ性銘柄。",
      detail:
        "三菱ケミカルは MMA（メタクリル）世界シェア 35% で機能性化学の核を保持、産業ガス子会社 Nippon Sanso は半導体向けで営業利益率 12.5% と業界最高。スチレン・コークス事業の売却検討で構造改革進行中。住友化学はサウジ Petro Rabigh で 2024-25 年累計 -5,000 億円損失、住友ファーマの精神疾患薬パイプライン失敗も追い打ち。Petro Rabigh 撤退（2026 年計画）+ 人員削減 + EUV レジスト育成で 2026-27 年黒字化計画。",
      shares: {
        metric: "PBR と東証 PBR 改善要請対応（2025/5）",
        entries: [
          { rank: 1, name: "住友化学", value: "PBR 0.62", note: "化学業界最低、改善要請対象" },
          { rank: 2, name: "三菱ケミカル", value: "PBR 0.92", note: "改善要請対象、ポートフォリオ転換" },
          { rank: 3, name: "東レ", value: "PBR 1.08", note: "機能性素材で PBR 1 倍超" },
          { rank: 4, name: "信越化学（参考、半導体クラスタ）", value: "PBR 1.75", note: "半導体材料で業界最高" },
        ],
        note: "PBR 1 倍超は信越化学（半導体材料）・東レ（機能性素材）、1 倍割れは汎用化学比率高い 2 社。",
      },
    },
    {
      sub: "機能性素材専業（東レ）",
      summary:
        "炭素繊維（Boeing 787・Airbus A350、世界シェア 35-40%）・リチウムイオン電池用セパレータ（世界 2 位）・水処理 RO 膜（世界 1 位）の機能性素材で世界トップシェア多数。Boeing 生産回復・EV 拡大・気候変動の三層構造で長期成長。",
      detail:
        "東レは 1990 年代以降、汎用化学から完全に脱却し『機能性素材専業』モデルを確立。炭素繊維事業は Boeing 787 機体重量の 50%・Airbus A350 の 53% を CFRP（炭素繊維強化プラスチック）が占める巨大需要。Boeing 品質問題（2024）の生産遅延が業績に直接影響するも、A321XLR・777X 量産で長期需要回復。リチウムイオン電池セパレータは EV 拡大の構造的恩恵、水処理 RO 膜は中東・北アフリカの水不足で構造的拡大。",
    },
  ],
  keyKpis: [
    {
      name: "中国スチレン輸出価格（汎用化学の代表指標）",
      current: "2026 年現在 約 950 USD/トン",
      desc:
        "中国の過剰供給で 2020 年 1,300 USD → 2024 年 900 USD まで下落、汎用化学の構造不況を象徴する指標。三菱ケミカル・住友化学の汎用部門の収益性に直結、+100 USD で各社営業利益 +200-300 億円規模の感応度。",
      history: [
        { period: "2020", value: "1,300 USD/トン", note: "コロナ前ピーク" },
        { period: "2022", value: "1,100 USD/トン" },
        { period: "2024", value: "900 USD/トン", note: "構造不況底" },
        { period: "2025-26", value: "950 USD/トン", note: "若干回復も低位継続" },
      ],
    },
    {
      name: "Boeing 商業機納入数（炭素繊維需要指標）",
      current: "2025 年 約 350 機（コロナ前 800 機）",
      desc:
        "Boeing 787 は機体重量の 50% が CFRP、Airbus A350 は 53%。Boeing 品質問題（2024）で生産遅延、納入数はコロナ前 800 機の 44% 程度。東レ炭素繊維事業の主要市場で、納入数 +100 機で東レ営業利益 +100-150 億円規模の感応度。",
      history: [
        { period: "2019", value: "約 800 機", note: "コロナ前ピーク" },
        { period: "2022", value: "約 480 機" },
        { period: "2024", value: "約 380 機", note: "品質問題で減" },
        { period: "2025", value: "約 350 機" },
      ],
    },
    {
      name: "リチウムイオン電池セパレータ需要（世界、面積ベース）",
      current: "2025 年 約 280 億平米",
      desc:
        "EV・蓄電池用セパレータの世界需要。年率 +18-22% で構造的拡大、東レ・旭化成（3407）・SK イノベーション・LG エネが主要プレイヤー。東レの機能化成品セグメントの主要利益源、価格・シェア競争激化が課題。",
      history: [
        { period: "2022", value: "約 180 億平米" },
        { period: "2024", value: "約 230 億平米" },
        { period: "2025", value: "約 280 億平米" },
        { period: "2030 予想", value: "約 700 億平米", note: "年率 +20%" },
      ],
    },
    {
      name: "EUV レジスト世界市場（半導体材料、住友化学・JSR 等）",
      current: "2025 年 約 1,500 億円",
      desc:
        "EUV 露光プロセス用感光性レジストの市場。住友化学・JSR（4185）・東京応化（4186）・信越化学が世界主要プレイヤー。AI 半導体ブームで 2025-30 年に年率 +15-20% で拡大、住友化学の電子材料セグメント収益の基盤。",
    },
    {
      name: "海水淡水化プラント受注（水処理 RO 膜需要）",
      current: "2025 年 約 60 億 USD",
      desc:
        "気候変動・水不足で中東・北アフリカ・米国西海岸・シンガポール等で淡水化需要拡大。東レ・Dow・GE が RO 膜の世界三強、東レ世界シェア約 30%。年率 +7-10% で構造的拡大、超長期テーマ。",
    },
    {
      name: "三菱・住友 PBR vs 東証要請",
      current: "2025 年（三菱 0.92 / 住友 0.62）",
      desc:
        "2023 年東証『資本コストや株価を意識した経営の実現』要請で PBR 1 倍超改善が求められる。三菱ケミカル・住友化学は明確な改善計画開示が必要、自社株買い・配当維持・事業ポートフォリオ転換で対応中。改善実現で PBR 1.2-1.5 倍への戻りで株価 +30-100% 余地。",
    },
  ],
  industryInsights: [
    {
      title: "化学業界は『汎用化学の構造不況 vs 機能性素材の構造拡大』の二極化が本質",
      lede:
        "中国の過剰供給で汎用化学（スチレン・コークス）は構造不況、機能性化学（半導体材料・炭素繊維・電池セパレータ）は構造拡大。同じ『化学株』でも投資判断が真逆。",
      body:
        "中国は 2015-22 年に石油化学設備を大幅増設、世界の汎用化学供給能力の 50% 超を中国が占める構造になった。これにより汎用化学の世界市場価格は構造的に下落、日本の総合化学（三菱・住友・旭化成）は汎用部門の構造改革を迫られる。一方、半導体材料（信越シリコン・JSR レジスト）・炭素繊維（東レ）・電池セパレータは中国も模倣困難な技術障壁の高い領域で、世界トップシェア企業は構造的恩恵を享受。投資家は『化学株』と一括りにせず、汎用比率と機能性比率を見分ける必要がある。",
      citations: [
        { doc: "三菱ケミカルグループ 2025年3月期 通期決算説明会資料" },
        { doc: "東レ 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "東証 PBR 1 倍割れ改善要請（2023）の最大の対象は化学業界",
      lede:
        "2023 年の東証要請で PBR 1 倍割れ企業は改善計画開示が義務化。住友化学 0.62・三菱ケミカル 0.92 倍は主要対象、自社株買い・事業ポートフォリオ転換で対応中。",
      body:
        "東証は 2023 年 3 月に『資本コストや株価を意識した経営の実現』を要請、特に PBR 1 倍割れ企業に明確な改善計画を求めた。化学業界は汎用化学の構造不況で PBR 1 倍割れが多発、住友化学 0.62 倍は化学業界最低、三菱ケミカル 0.92 倍も改善必要。両社とも事業ポートフォリオ転換（汎用部門売却・撤退）・配当維持・自社株買いで対応中、転換成功で PBR 1.2-1.5 倍への戻りで株価 +30-100% 上昇余地。",
      citations: [
        { doc: "東京証券取引所 2023 年 3 月『資本コストや株価を意識した経営の実現に向けた対応』" },
        { doc: "住友化学 2025年3月期 通期決算説明会資料" },
      ],
    },
    {
      title: "炭素繊維（東レ）は『Boeing/Airbus 生産回復』が業績ターンの最大要因",
      lede:
        "Boeing 787・Airbus A350 の CFRP 比率は機体重量 50% 超。Boeing の品質問題（2024）で生産遅延、納入数はコロナ前の 44% に留まる。",
      body:
        "東レは炭素繊維世界シェア 35-40%、Boeing・Airbus の最大供給元の一つ。Boeing 787 は機体重量の 50%、Airbus A350 は 53% が CFRP。Boeing は 2024 年の品質問題（737 MAX ドアパネル脱落）で生産能力が一時的に低下、月産は 38 機（37 計画）→ 25 機程度に落ち込み。回復が東レ炭素繊維事業の業績ターンの最大要因、月産正常化（2027 年予想）で東レ営業利益 +500-700 億円規模の押し上げ。長期では Airbus A321XLR・Boeing 777X 量産で需要構造的拡大。",
      citations: [
        { doc: "東レ 2025年3月期 通期決算説明会資料" },
        { doc: "Boeing 2024 年生産計画修正発表" },
      ],
    },
    {
      title: "信越化学（4063、半導体クラスタ）は化学業界『勝ち組モデル』の象徴",
      lede:
        "信越化学はシリコンウェハ世界シェア 1 位・PVC 世界シェア 1 位で営業利益率 28%・PBR 1.75 倍、化学業界トップ水準。三菱・住友が目指す『汎用脱却・機能性集中』の到達点。",
      body:
        "信越化学（半導体クラスタ収録）は塩ビ（PVC）の世界シェア 1 位 + 半導体シリコンウェハ世界シェア 1 位で、汎用化学（塩ビ）の高シェアによる規模優位 + 機能性化学（シリコンウェハ）の技術優位の両方を持つ希少モデル。営業利益率 28%・PBR 1.75 倍は化学業界トップ水準、ROE 16% も業界最高。三菱ケミカル・住友化学が目指す『汎用脱却・機能性集中』の最終到達点として、業界全体のベンチマーク機能を果たす。",
      citations: [
        { doc: "信越化学工業 2025年3月期 統合報告書" },
      ],
    },
    {
      title: "気候変動・水不足は『化学業界の超長期上方ドライバー』",
      lede:
        "水処理 RO 膜（東レ世界シェア 30%）・農薬（住友化学）・CO2 削減素材（三菱）など、気候変動関連は化学業界の構造的成長軸。",
      body:
        "気候変動・水不足の深刻化で、海水淡水化（RO 膜）・干ばつ耐性農薬・CO2 削減素材・水素関連素材の需要が構造的に拡大。東レは水処理 RO 膜で世界シェア 30%（Dow・GE と三強）、超長期で年率 +7-10% の需要拡大。住友化学は農薬事業（ベイレトン等）でグローバル展開、CO2 排出削減型農薬の開発も。三菱ケミカルは CO2 由来 MMA・バイオプラスチック・水素貯蔵材料を開発中。これらは 2030 年代以降の業績拡大の隠れたドライバー。",
      citations: [
        { doc: "東レ 2025年3月期 通期決算説明会資料" },
        { doc: "IPCC 第 6 次評価報告書（2023）" },
      ],
    },
  ],
};

export const RETAIL: Industry = {
  slug: "retail",
  name: "外食・小売",
  shortName: "小売",
  description:
    "総合小売（イオン・セブン&アイ）・アパレル（ファストリ・しまむら）・外食（FOOD&LIFE）の対照的な 5 社で構成。インフレ転嫁力・訪日インバウンド・PB（プライベートブランド）強化の三軸が業界共通の論点。ファーストリテイリングが ROE 21.5% で世界アパレル最高水準、対極にイオンが ROE 5.2% で低収益・大規模型の総合小売。",
  theme2025: [
    "インフレ転嫁力（PB 強化・価格転嫁の業態差）",
    "訪日インバウンド 4,000 万人による外食・都心小売の追い風",
    "セブン&アイへの ACT TOB 提案（2024 年 8 月）と業界再編",
    "アパレル世界市場でのユニクロ vs Zara・H&M 競争",
    "イオン × ツルハ HD 統合（2024）によるドラッグストア業界再編",
    "日本人口減・若年層 EC シフトに対する各業態の対応",
  ],
  marketScale: {
    headline: "対象 5 社合計時価総額 約 25.7 兆円",
    growth: "前年比 +18%（ファストリ・FLC 主導）",
    breakdown: "ファストリ 15.5 兆円 / セブン&アイ 5.9 兆円 / イオン 3.4 兆円 / しまむら 0.58 兆円 / FLC 0.50 兆円",
  },
  chainColumns: [
    {
      title: "総合小売（GMS・コンビニ）",
      subtitle: "イオン・セブン&アイ",
      positions: ["総合スーパー", "コンビニ"],
    },
    {
      title: "アパレル小売",
      subtitle: "ユニクロ・しまむら",
      positions: ["アパレル"],
    },
    {
      title: "外食",
      subtitle: "回転寿司・居酒屋",
      positions: ["外食"],
    },
  ],
  subClusters: [
    {
      key: "retail-general",
      name: "総合小売（GMS・コンビニ）",
      role: "GMS・スーパー・コンビニを統合した総合小売、PB 強化とインフレ転嫁力で対抗。",
      companyCodes: ["8267", "3382"],
      position: "総合スーパー",
    },
    {
      key: "retail-apparel",
      name: "アパレル小売",
      role: "世界展開のユニクロと国内特化のしまむらの対照的 2 社、価格帯と顧客層で明確に差別化。",
      companyCodes: ["9983", "8227"],
      position: "アパレル",
    },
    {
      key: "retail-food",
      name: "外食（回転寿司）",
      role: "回転寿司スシローを中核に、訪日インバウンド + 海外展開の二軸成長。ROE 21.5% は外食業界最高水準。",
      companyCodes: ["3563"],
      position: "外食",
    },
  ],
  competitiveStructure: [
    {
      sub: "総合小売（イオン・セブン&アイ）",
      summary:
        "イオン（売上 10 兆円）が国内最大の総合小売だが営業利益率 2.8% の低収益、セブン&アイは国内コンビニ営業利益率 22.5% で高収益。ACT TOB 提案で業界再編加速、両社とも『コンビニ・ドラッグストア』への集中シフトが共通方向。",
      detail:
        "イオンは GMS（イオン本体）・SM（マックスバリュ）・ドラッグストア（ツルハ統合 2024）・モール・金融まで統合する独自モデルで売上 10 兆円超だが、GMS の低収益（営業利益率 0.5%）が全社の足を引っ張る。ツルハ HD 完全子会社化で利益率改善の道筋。セブン&アイは ACT（カナダ Couche-Tard）からの 7 兆円 TOB 提案（2024 年 8 月）でイトーヨーカ堂 GMS 売却を加速、コンビニ集中戦略へ。",
      shares: {
        metric: "営業利益率（2026/2 期）",
        entries: [
          { rank: 1, name: "セブン&アイ", value: "5.2%", note: "コンビニ集中で利益率高" },
          { rank: 2, name: "イオン", value: "2.8%", note: "GMS の低収益が足かせ" },
          { rank: 3, name: "ローソン（参考、KDDI×三菱商事 PE）", value: "推定 5.5%", note: "非公開化（2024）" },
        ],
        note: "コンビニ事業単独の営業利益率は業界全体で 20% 超、GMS は 0-2% で構造的な収益性の差。",
      },
    },
    {
      sub: "アパレル小売（ファーストリテイリング・しまむら）",
      summary:
        "ファーストリテイリングは ROE 21.5%・営業利益率 16.2% で世界アパレル最高水準、しまむらは ROE 9.8%・配当 3.5% の安定型。世界展開 vs 国内特化、SPA vs 仕入販売、機能性 vs 低価格、と全方位で対照的な 2 社。",
      detail:
        "ファーストリテイリングはユニクロ・GU の SPA（製造小売）モデルで世界 3,500 店超、海外売上比率 60% 超で円安レバレッジも享受。ヒートテック・エアリズム等の機能性ファブリック技術（東レ等との共同開発）が世界アパレル小売で唯一の参入障壁。しまむらは国内ロードサイド型の独自ポジションで、低価格帯（単価 1,500-2,000 円）でファミリー・地方シニア層を狙う差別化戦略、海外展開せず国内特化。",
      shares: {
        metric: "世界アパレル小売 売上高（2025）",
        entries: [
          { rank: 1, name: "Zara（Inditex、スペイン）", value: "約 4.5 兆円", note: "ファストファッション世界トップ" },
          { rank: 2, name: "H&M（スウェーデン）", value: "約 3.0 兆円" },
          { rank: 3, name: "ファーストリテイリング", value: "約 3.4 兆円", note: "営業利益では Zara を凌ぐ" },
          { rank: 4, name: "GAP（米）", value: "約 2.2 兆円" },
        ],
      },
    },
    {
      sub: "外食（FOOD&LIFE COMPANIES）",
      summary:
        "回転寿司スシローを中核に、訪日インバウンド + 海外展開（台湾・東南アジア）の二軸成長。ROE 21.5% は外食業界最高水準、原料価格上昇圧迫を価格転嫁・回転率向上で克服。",
      detail:
        "スシロー国内 650 店超 + 海外 145 店超 + 杉玉・京樽の多業態展開で売上 5,000 億円規模。海外スシローの営業利益率 12.5% は国内 9.2% を上回り、海外展開が長期成長軸。マグロ・サケ等寿司原料の国際価格上昇（過去 3 年 +20-30%）に対し、グレード分け価格転嫁（100 円 → 120 円 → 150 円）と IT 化（タッチパネル注文・回転率向上）で対応中。",
    },
  ],
  keyKpis: [
    {
      name: "訪日インバウンド客数（外食・都心小売の主要 KPI）",
      current: "2025 年 約 4,000 万人（過去最高）",
      desc:
        "訪日客数は外食・都心小売の主要収益ドライバー。FOOD&LIFE 訪日客比率 8%・営業利益感応度 +10% → +30-50 億円、ファストリ国内売上で訪日客 +15-20%、セブン&アイ国内コンビニで訪日客 +5-10% の影響度。円安局面で外国人客単価 +30-50% 上昇、構造的追い風。",
      history: [
        { period: "2019", value: "約 3,200 万人", note: "コロナ前ピーク" },
        { period: "2022", value: "約 380 万人", note: "コロナで激減" },
        { period: "2024", value: "約 3,700 万人", note: "回復" },
        { period: "2025", value: "約 4,000 万人", note: "過去最高" },
      ],
    },
    {
      name: "国内 CPI（食料品、インフレ転嫁力の指標）",
      current: "2025 年前年比 +3.5%",
      desc:
        "食料品インフレ率。各社のインフレ転嫁力（価格 +5-10% でも客数維持できるか）の指標。ファストリは『機能性ファブリック』ブランド力で転嫁力高、しまむら・イオンは PB 強化と価格据え置きで対応。FLC は寿司ネタグレード分け価格転嫁で対応。",
      history: [
        { period: "2022", value: "+2.5%" },
        { period: "2023", value: "+8.2%", note: "ピーク" },
        { period: "2024", value: "+5.5%" },
        { period: "2025", value: "+3.5%", note: "鈍化基調" },
      ],
    },
    {
      name: "USD/JPY（ファストリ等海外売上比率高い小売の指標）",
      current: "2026 年現在 約 152 円",
      desc:
        "ファーストリテイリング（海外売上 60%）・FOOD&LIFE（海外売上 17%）の業績変動要因。USD/JPY +10 円でファストリ営業利益 +500-800 億円、FLC +100-150 億円規模の感応度。逆にイオン・しまむら（国内売上 100%）は無関係。",
    },
    {
      name: "PB（プライベートブランド）売上シェア",
      current: "2025 年（イオン トップバリュ 1 兆円超、業界最大）",
      desc:
        "PB 売上シェアは各社のインフレ転嫁力・粗利改善余地を示す。イオン トップバリュ 1 兆円超は日本最大、セブンプレミアム約 7,000 億円、しまむらは独自ブランド比率 60% 超。PB は NB（ナショナルブランド）より粗利 15-20pp 高く、PB 比率上昇でグループ粗利率を構造的に改善。",
    },
    {
      name: "国内アパレル市場規模",
      current: "2025 年 約 9.5 兆円（縮小基調）",
      desc:
        "日本人口減・若年層 EC シフトで国内アパレル市場は年率 -1-2% で構造的縮小、過去 10 年で 12 兆円 → 9.5 兆円。ユニクロ・しまむら・GU の 3 社で市場の 20% 超を占める寡占構造、中小アパレルは構造的に苦境。",
      history: [
        { period: "2015", value: "約 11.5 兆円" },
        { period: "2020", value: "約 10.5 兆円", note: "コロナ影響" },
        { period: "2024", value: "約 9.8 兆円" },
        { period: "2025", value: "約 9.5 兆円" },
      ],
    },
    {
      name: "国内コンビニ売上高（業界全体）",
      current: "2025 年 約 12 兆円",
      desc:
        "国内コンビニ業界全体の売上高。セブン-イレブン約 5 兆円・ローソン約 2.5 兆円・ファミマ約 3 兆円の 3 強で寡占。セブン&アイの国内コンビニ営業利益率 22.5% は業界トップ、寡占による安定収益型。",
    },
  ],
  industryInsights: [
    {
      title: "外食・小売は『インフレ転嫁力・訪日インバウンド・PB 強化』の三軸で投資評価する",
      lede:
        "業態によってインフレ転嫁の余地、訪日比率、PB 比率が大きく異なる。同じ『小売株』でも価格決定力で業績の振れ幅が真逆。",
      body:
        "外食・小売業界では『インフレ転嫁力』が中核論点。ファーストリテイリングは『機能性ファブリック』ブランド力で価格 +5-10% 転嫁可能、しまむらは低価格帯ポジションで転嫁余地小（代わりに節約志向シフトで客数 +3-5% の恩恵）、イオン・セブン&アイは PB 強化で粗利改善。訪日インバウンドは外食・都心小売の追い風で、FOOD&LIFE は訪日客比率 8%・営業利益感応度大。同じ『小売株』でも、これら 3 軸での性格差を見抜くことが投資判断の鍵。",
      citations: [
        { doc: "イオン 2026年2月期 通期決算説明会資料" },
        { doc: "ファーストリテイリング 2025年8月期 通期決算説明会資料" },
      ],
    },
    {
      title: "セブン&アイへの ACT TOB 提案は『世界コンビニ業界の地殻変動』の象徴",
      lede:
        "2024 年 8 月にカナダ Couche-Tard が約 7 兆円規模の TOB 提案、創業家 MBO 検討で構造転換ペース加速。日本コンビニ業界全体への波及効果。",
      body:
        "ACT 提案は世界コンビニ業界の M&A 加速の象徴的事象。セブン&アイは独立維持の方針で創業家による MBO（経営陣による買収）を検討中、ローソン（KDDI×三菱商事で非公開化、2024）・ファミマ（伊藤忠で非公開化、2020）と並んで日本コンビニ大手 3 社のうち 2 社が非公開化、セブン&アイも同様の道を辿る可能性。コンビニ業態の長期成熟・利益率低下リスクへの対応として、PE ファンド・事業会社の TOB 圧力は今後も継続。",
      citations: [
        { doc: "セブン&アイ 2026年2月期 通期決算説明会資料" },
        { doc: "Couche-Tard セブン&アイ TOB 提案発表 2024年8月" },
      ],
    },
    {
      title: "ファーストリテイリングの『世界 3 強』への到達は ROE 21.5% の質的優位が支える",
      lede:
        "Zara（Inditex）の世界売上 4.5 兆円に対し、ファストリは 3.4 兆円で迫る。営業利益では Zara を凌ぐ収益力。",
      body:
        "ファーストリテイリングは世界アパレル小売売上で 3 位（Zara・H&M 続き）だが、営業利益では Zara を凌ぐ収益力。営業利益率 16.2% は世界アパレル小売最高水準で、Zara（11-12%）・H&M（4-6%）を大きく上回る。ヒートテック・エアリズム等の機能性ファブリック技術（東レ等との共同開発）が他社模倣困難な参入障壁、北米・欧州市場での店舗展開加速で 2030 年までに世界 1 位（売上 5 兆円超）を目指す。",
      citations: [
        { doc: "ファーストリテイリング 2025年8月期 統合報告書" },
        { doc: "Inditex 2024 年度年次報告書" },
      ],
    },
    {
      title: "訪日インバウンド 4,000 万人は『外食・都心小売』に構造的追い風",
      lede:
        "訪日客の外食・小売消費は年 1.5 兆円規模、外食 FLC・コンビニ・百貨店・都心商業の収益ドライバー。",
      body:
        "2025 年訪日客 4,000 万人 × 1 人 平均 22 万円消費 = 8.8 兆円のインバウンド消費、うち外食・小売は約 1.5 兆円規模。為替の有利性で外国人客単価は日本人比 +30-100% 上昇、特に円安局面で外食・コンビニ・ドラッグストアの客単価が拡大。FOOD&LIFE スシローは訪日客比率 8%（都心 30-40%）で営業利益感応度大、ファストリ国内売上の 20% 弱も訪日客貢献。長期的には訪日客 6,000 万人目標（2030 年）で構造的拡大継続。",
      citations: [
        { doc: "JNTO 訪日外国人統計 2025" },
        { doc: "FOOD&LIFE COMPANIES 2025年9月期 通期決算説明会資料" },
      ],
    },
    {
      title: "イオン × ツルハ HD 統合（2024）はドラッグストア業界再編の決定打",
      lede:
        "ツルハ HD 完全子会社化でイオンのドラッグストア事業は売上 2.5 兆円超、業界最大規模に。営業利益率 5-7% で全社利益率改善ドライバー。",
      body:
        "ドラッグストア業界は人口高齢化・OTC 医薬品需要拡大で年率 +3-5% の構造的成長セクター、イオンの GMS（営業利益率 0.5%）・SM（1.8%）と比べて 5-7% の高収益。イオンはツルハ HD（3391）の TOB（2024）でグループに統合、既存子会社ウエルシア HD（3141）と合わせて売上 2.5 兆円超の業界最大規模に。マツキヨココカラ（3088）・サンドラッグ（9989）等との寡占競争で価格決定力強化、グループ全体の営業利益率改善の最大ドライバー。",
      citations: [
        { doc: "イオン 2026年2月期 通期決算説明会資料" },
        { doc: "ツルハ HD TOB 発表資料 2024" },
      ],
    },
  ],
};

export const industries: Industry[] = [SEMICONDUCTOR, PHARMA, SAAS, AUTOMOTIVE, TRADING_HOUSE, FINANCE, REAL_ESTATE, TELECOM, CHEMICALS, RETAIL];

export function getIndustry(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug);
}

export function getStocksForCluster(sub: SubCluster): Stock[] {
  return sub.companyCodes
    .map((c) => stocks.find((s) => s.code === c))
    .filter((s): s is Stock => Boolean(s));
}

export function industryAggregates(industry: Industry) {
  const codes = new Set(industry.subClusters.flatMap((s) => s.companyCodes));
  const list = stocks.filter((s) => codes.has(s.code));
  const totalMcap = list.reduce((acc, s) => acc + s.marketCapOku, 0);
  const avgPer = list.reduce((acc, s) => acc + s.per, 0) / list.length;
  const avgRoe = list.reduce((acc, s) => acc + s.roe, 0) / list.length;
  return { count: list.length, totalMcap, avgPer, avgRoe };
}
