import type { Stock } from "@/domain/types";

/**
 * 業界横断テーマ（特集）の定義。
 * スクリーン（純定量フィルタ）と異なり、マクロ・ナラティブ駆動の業界横断特集。
 * 『円安』『AI 受益』『金利上昇』など、投資判断の起点となるマクロ・テーマ毎に、
 * 編集部キュレーションの銘柄と、ファクターベースのランキングを併せて提示する。
 */

export type ThemePickRationale = {
  /** 銘柄コード（必ず stocks に存在する） */
  code: string;
  /** このテーマでの推奨理由（1-2 文） */
  reason: string;
};

export type ThemeSection = {
  heading: string;
  body: string;
};

export type Theme = {
  slug: string;
  name: string;
  shortName: string;
  /** ハブカードで使う要約（1 行） */
  oneLiner: string;
  /** 詳細ページのリード文（2-3 文） */
  lede: string;
  /** マクロ・コンテキスト（現在の指標値・最新動向） */
  macroContext: { label: string; value: string; note?: string }[];
  /** 編集部キュレーションの推奨銘柄（順序が推奨順） */
  picks: ThemePickRationale[];
  /** テーマ本文の各セクション */
  sections: ThemeSection[];
  /** ランキングに使うファクター（情報目的、表示にも使用） */
  rankBy:
    | "usdjpy"
    | "us10y"
    | "sox"
    | "china"
    | "dividendYield"
    | "pbr"
    | "roe"
    | "valuationScore";
  /** ランキングの方向（true: 昇順、false: 降順） */
  rankAsc: boolean;
  /** ランキング時のフィルタ（テーマに関連しない銘柄を除外） */
  rankFilter: (s: Stock) => boolean;
  /** ランキングで強調する数値の表示ラベル */
  rankLabel: string;
  /** 関連業界 slug */
  relatedIndustries: string[];
  /** 関連ブログ slug */
  relatedPosts: string[];
  /** リスク・注意点 */
  risks: string[];
  /** 最終更新日 */
  updatedAt: string;
};

export const themes: Theme[] = [
  {
    slug: "weak-yen",
    name: "円安レバレッジ銘柄",
    shortName: "円安",
    oneLiner: "海外売上比率が高く、円安局面で営業利益が直接拡大する銘柄群",
    lede:
      "USD/JPY 152 円水準の継続を受けて、海外売上比率の高い企業の業績押し上げ効果が市場で再評価されている。USD/JPY 感応度（β）が 1.0 を超える銘柄は、円安 +10 円で営業利益が数百〜数千億円押し上げられる構造。為替トレンドの追い風を直接享受する銘柄を業界横断でキュレーション。",
    macroContext: [
      { label: "USD/JPY 現在値", value: "約 152 円", note: "2026 年 5 月時点" },
      { label: "USD/JPY 過去 1 年", value: "145-158 円" },
      { label: "日米金利差（10 年）", value: "約 +2.8pp", note: "米 4.3% vs 日 1.5%" },
      { label: "日銀利上げサイクル", value: "2026 年 1.0% 想定" },
    ],
    picks: [
      {
        code: "9983",
        reason:
          "海外売上比率 60% 超のユニクロ世界展開、USD/JPY +10 円で営業利益 +500-800 億円規模の感応度。為替＋インフレ転嫁の二段追い風。",
      },
      {
        code: "7203",
        reason:
          "USD/JPY ベータ 1.42 で全銘柄中トップクラス。海外生産比率高めも、円ベース利益計上で USD/JPY +1 円 = +400 億円規模。",
      },
      {
        code: "7270",
        reason:
          "SUBARU の米国売上比率 70% 超は OEM 最大、USD/JPY ベータ 1.85 で全 OEM トップ。輸出比率も 60% 超で円安レバレッジ最大級。",
      },
      {
        code: "9984",
        reason:
          "Arm Holdings 90% 保有 + OpenAI 投資 + 米国売上 65%。USD/JPY 1.85 のベータは AI 投資資産の円換算評価を直接押し上げ。",
      },
      {
        code: "7261",
        reason:
          "マツダの米国売上比率 50%、USD/JPY ベータ 1.65。CX シリーズの北米プレミアム成功で円安効果が利益で直接表れる。",
      },
      {
        code: "6857",
        reason:
          "アドバンテストの海外売上比率 90% 超、半導体 ATE で世界トップシェア。USD/JPY ベータ 1.45 で SOX 連動性も高い。",
      },
    ],
    sections: [
      {
        heading: "USD/JPY ベータ高い銘柄の構造的優位",
        body:
          "海外売上比率が高く、生産も海外現地調達ではなく日本本社で集約計上する企業は、USD/JPY +10 円で営業利益が数百〜数千億円押し上げられる構造を持つ。トヨタ（β 1.42）・スバル（1.85）・マツダ（1.65）・ファーストリテイリング（1.25）・SBG（1.85）が代表例。逆に、海外生産・現地完結型の企業（日産・本田の一部）は円安の恩恵が薄い。",
      },
      {
        heading: "円安の構造的継続性 vs 逆風転換リスク",
        body:
          "日米金利差（米 10 年 4.3% vs 日 1.5% = +2.8pp）が円安の最大要因。FRB 利下げ・日銀利上げで金利差縮小すれば円高転換、その場合これらの円安レバレッジ銘柄は逆風に。2026-27 年の日米金融政策見通し（FRB 利下げペース・日銀 1.0% 到達タイミング）が円安持続の鍵。",
      },
      {
        heading: "為替ヘッジの程度で実効感応度が変わる",
        body:
          "USD/JPY ベータの絶対値だけでなく、各社の為替ヘッジ方針も重要。トヨタは円安効果を年間ヘッジで一部相殺、SUBARU は短期ヘッジで効果を直接享受。半年〜1 年スパンでヘッジが切れる時期に業績が大きく動く構造。",
      },
    ],
    rankBy: "usdjpy",
    rankAsc: false,
    rankFilter: (s) => (s.factorBetas?.usdjpy ?? -Infinity) >= 0.6,
    rankLabel: "USD/JPY ベータ",
    relatedIndustries: ["automotive", "retail", "semiconductor"],
    relatedPosts: ["primer-usdjpy-auto", "primer-factor-beta"],
    risks: [
      "FRB 利下げ加速で日米金利差縮小、円高転換リスク",
      "日銀利上げペース加速での円高転換リスク",
      "各社の為替ヘッジ方針差で実効効果に差",
      "現地生産比率が高い企業は円安効果が薄い",
    ],
    updatedAt: "2026-06-03",
  },

  {
    slug: "ai-beneficiary",
    name: "AI 受益銘柄",
    shortName: "AI 受益",
    oneLiner: "生成 AI・AI 半導体ブームの構造的需要拡大を直接享受する銘柄群",
    lede:
      "Arm・NVIDIA を中心とした AI 半導体ブームで、SOX 指数連動性の高い日本企業が構造的追い風を受けている。前工程・後工程・テスト・材料の各レイヤーで、世界トップシェアを持つ日本企業は AI 半導体投資の直接受益者。SBG の Arm 保有・OpenAI 投資・Stargate プロジェクトも『AI 上流投資』の代表格。",
    macroContext: [
      { label: "SOX 指数（過去 1 年）", value: "+45%", note: "AI ブームで急騰" },
      { label: "NVIDIA 時価総額", value: "約 4.5 兆ドル", note: "世界 2 位" },
      { label: "Arm Holdings 時価", value: "約 17-20 兆円" },
      { label: "Stargate プロジェクト", value: "最大 5,000 億ドル計画", note: "OpenAI×SBG×Oracle" },
    ],
    picks: [
      {
        code: "9984",
        reason:
          "Arm（90% 保有）+ OpenAI 大型投資 + Stargate プロジェクトで AI 上流バリューチェーンを完全制圧。SOX β 2.45 は全銘柄トップ。",
      },
      {
        code: "6857",
        reason:
          "アドバンテストは AI 半導体テスト装置で世界シェア 1 位、HBM テスト需要が爆発的拡大。SOX β 1.85 で AI 連動性最高水準。",
      },
      {
        code: "6920",
        reason:
          "レーザーテックは EUV マスク検査装置で独占シェア、AI 半導体の先端ノード需要で構造的恩恵。SOX β 2.05。",
      },
      {
        code: "8035",
        reason:
          "TEL は前工程装置で世界 3 位、3D NAND・HBM・ロジック先端ノードで AI 半導体ブームを直接受益。SOX β 1.65。",
      },
      {
        code: "4063",
        reason:
          "信越化学はシリコンウェハ世界シェア 1 位、AI 半導体の数量拡大による構造的恩恵。営業利益率 28% は化学業界最高。",
      },
      {
        code: "6146",
        reason:
          "ディスコは後工程ダイシング・グラインダーで世界トップシェア、HBM 積層・CoWoS パッケージで需要拡大。",
      },
    ],
    sections: [
      {
        heading: "AI 半導体ブームの構造的続く理由",
        body:
          "ChatGPT 登場（2022 年 11 月）以降、生成 AI の推論・学習需要は指数関数的に拡大。NVIDIA データセンタ売上は年率 +200% 超で推移、AI チップ需要は 2030 年まで構造的拡大が確実視される。日本企業は前工程装置（TEL・SCREEN）・後工程（ディスコ・アドバンテスト）・材料（信越シリコン・JSR レジスト）の各レイヤーで世界トップシェアを持ち、AI 半導体投資の直接受益者。",
      },
      {
        heading: "Stargate プロジェクトと SBG の特殊なポジション",
        body:
          "OpenAI・SBG・Oracle 共同の Stargate プロジェクト（米国 AI インフラ、最大 5,000 億ドル計画）は AI バリューチェーン全層への投資。SBG は Arm（半導体）+ OpenAI（モデル）+ Stargate（インフラ）の三位一体ポジション。実行率 50% でも 2,500 億ドル、SBG 時価 16.8 兆円を超える規模で、長期的に NAV を大幅押し上げる潜在性。",
      },
      {
        heading: "HBM・先端パッケージング需要の波及",
        body:
          "AI チップでは HBM（高帯域メモリ）の積層・CoWoS（TSMC の先端パッケージング）が必須技術。日本企業ではディスコ（ダイシング）・アドバンテスト（HBM テスト）が直接受益、TEL も後工程装置で関連。HBM 市場は 2024-30 年で年率 +50% 超の超高成長が見込まれる。",
      },
    ],
    rankBy: "sox",
    rankAsc: false,
    rankFilter: (s) => (s.factorBetas?.sox ?? -Infinity) >= 0.4,
    rankLabel: "SOX ベータ",
    relatedIndustries: ["semiconductor", "telecom"],
    relatedPosts: ["primer-hi-na-euv", "primer-nav-discount-sbg"],
    risks: [
      "AI 投資ブームの過熱・調整局面入りリスク",
      "中国の AI 半導体国産化加速で日本シェア低下リスク",
      "米中半導体規制強化で対中売上が制約",
      "SOX β 高い銘柄は下落局面でも振れ幅大",
    ],
    updatedAt: "2026-06-03",
  },

  {
    slug: "rate-hike-beneficiary",
    name: "金利上昇受益銘柄",
    shortName: "金利上昇",
    oneLiner: "日銀利上げサイクルで預貸利ザヤ拡大・運用収益向上を直接享受する金融銘柄",
    lede:
      "日銀政策金利 2024 年マイナス金利解除以降、段階的に利上げを進める。2026 年に 1.0% 到達想定で、メガバンク 3 行の純利益は累計 +5,000-7,000 億円規模で押し上げ。10 年国債利回り 1.5% は保険会社の運用収益にも好影響。利上げサイクルの構造的受益セクターを業界横断でキュレーション。",
    macroContext: [
      { label: "日銀政策金利", value: "0.5%", note: "2026 年現在" },
      { label: "10 年国債利回り", value: "約 1.5%", note: "2024 年 0.5% から急上昇" },
      { label: "利上げサイクル", value: "2024-26 年で +1%", note: "完了想定" },
      { label: "新 NISA 口座数", value: "約 2,300 万口座", note: "2025 年末" },
    ],
    picks: [
      {
        code: "8306",
        reason:
          "三菱 UFJ FG は預金 200 兆円超で国内最大、政策金利 +1% で純利益 +2,500 億円規模の感応度。Morgan Stanley 20% 出資の隠れた価値。",
      },
      {
        code: "8316",
        reason:
          "三井住友 FG は売上成長 +7.4% でメガバンクリード、Olive 統合 App で新 NISA リテール拡大。配当 4.2% で 3 メガ最高。",
      },
      {
        code: "8411",
        reason:
          "みずほ FG は PBR 0.85 倍で改善要請対象、Greenhill 買収・楽天証券提携でリテール拡大、改善実現で PBR 1.2 倍への戻り余地。",
      },
      {
        code: "8766",
        reason:
          "東京海上 HD は海外比率 50% 超でグローバル分散、10 年国債利回り上昇で運用収益拡大。ROE 13.5% は損保業界トップ。",
      },
      {
        code: "8725",
        reason:
          "MS&AD は PBR 改善要請対象、配当 4.8% は損保業界最高。利上げサイクルの保険業界受益銘柄。",
      },
      {
        code: "8604",
        reason:
          "野村 HD は新 NISA 拡大期のリテール再評価期待、利上げ局面の証券業界受益銘柄。",
      },
    ],
    sections: [
      {
        heading: "メガバンク利益感応度の構造",
        body:
          "政策金利 +0.25% でメガバンクの当期純利益は +500-700 億円規模の押し上げ感応度。2024 年 0% → 2026 年 1.0% 想定の利上げサイクル中、3 メガバンク合計で純利益 +5,000-7,000 億円規模の押し上げ効果。市場はこの織り込みを段階的に進めているが、利上げペースが想定より早い／遅いで PER が変動する構造。",
      },
      {
        heading: "10 年国債利回り上昇の保険業界への波及",
        body:
          "10 年国債利回り 1.0% → 1.5% の上昇で、保険会社の運用収益は +500-800 億円規模で改善。長期の生命保険負債を持つ生命保険・年金分野で特に好影響、損害保険も投資ポートフォリオの再投資収益向上で恩恵。10 年国債が 2.0% 超に向かえば、保険業界全体の構造的収益性が一段改善。",
      },
      {
        heading: "新 NISA 拡大による証券・運用業界の構造的恩恵",
        body:
          "2024 年改正で生涯 1,800 万円の非課税枠が設定、年間 +500-700 万口座のペースで拡大。SMFG（Olive）・野村 HD・楽天証券（みずほ提携）が主要受益者として手数料収益拡大。新 NISA は『証券・運用業界の 5-10 年の構造的拡大期』を実現、利上げサイクルと並ぶ金融セクターの二段の追い風。",
      },
    ],
    rankBy: "us10y",
    rankAsc: true,
    rankFilter: (s) => s.sectorTSE === "銀行業" || s.sectorTSE === "保険業" || s.sectorTSE === "証券、商品先物取引業",
    rankLabel: "US10Y ベータ（負ほど金利上昇に強い）",
    relatedIndustries: ["finance"],
    relatedPosts: ["primer-boj-rate-bank", "primer-insurance-climate", "primer-progressive-dividend"],
    risks: [
      "日銀利上げペース減速・後退でメガバンク利益感応度が後退",
      "景気減速で貸出残高伸び悩み・与信費用増加",
      "10 年国債利回り上昇は不動産・REIT・グロース株への逆風",
      "新 NISA 流入の減速・解約増加リスク",
    ],
    updatedAt: "2026-06-03",
  },

  {
    slug: "inbound-tourism",
    name: "訪日インバウンド受益銘柄",
    shortName: "訪日",
    oneLiner: "訪日客 4,000 万人超の構造的需要拡大を直接享受する外食・小売・不動産",
    lede:
      "訪日外国人客数は 2025 年に約 4,000 万人で過去最高、円安局面で外国人客単価は日本人比 +30-100% 上昇。外食（FOOD&LIFE）・コンビニ（セブン&アイ）・百貨店・都心商業（三井不動産）が構造的追い風。政府は 2030 年に 6,000 万人目標、長期的な訪日インバウンド成長セクター。",
    macroContext: [
      { label: "訪日客数（2025）", value: "約 4,000 万人", note: "過去最高" },
      { label: "コロナ前比", value: "+125%", note: "2019 年 3,200 万人比" },
      { label: "USD/JPY", value: "約 152 円", note: "円安継続で外国人客単価上昇" },
      { label: "政府目標", value: "6,000 万人（2030）", note: "長期成長余地" },
    ],
    picks: [
      {
        code: "3563",
        reason:
          "FOOD&LIFE スシローは訪日客比率 8%（都心 30-40%）、訪日客 +10% で営業利益 +30-50 億円規模の感応度。ROE 21.5% は外食業界最高。",
      },
      {
        code: "8801",
        reason:
          "三井不動産はららぽーと・三井アウトレットモール等で訪日客集客、ホテル稼働率 82% で外国人比率 +拡大中。",
      },
      {
        code: "9983",
        reason:
          "ファーストリテイリングは銀座・新宿等都心店舗で外国人購入比率 30% 超、訪日客の客単価が日本人比 +50%。",
      },
      {
        code: "3382",
        reason:
          "セブン&アイは国内コンビニで外国人客比率拡大、ATM 利用・PB 商品で外国人客単価 +20-30%。",
      },
      {
        code: "8267",
        reason:
          "イオンは GMS・SM・モールで広範な訪日客取り込み、ホテル・モールテナント賃料の外国人比率上昇。",
      },
    ],
    sections: [
      {
        heading: "訪日客 4,000 万人の業界別波及効果",
        body:
          "2025 年訪日客 4,000 万人 × 1 人 平均 22 万円消費 = 8.8 兆円のインバウンド消費。業界別では宿泊 2.5 兆円・買物 2.1 兆円・飲食 1.5 兆円・交通 1.5 兆円・娯楽 1.2 兆円。外食 FLC は飲食 1.5 兆円の中で寿司カテゴリが約 8%（120 億円）を捕捉、三井不動産はモール・ホテルでの買物・宿泊で構造的恩恵。",
      },
      {
        heading: "円安局面で外国人客単価が日本人比 +30-100% 上昇",
        body:
          "USD/JPY 152 円水準では外国人にとって日本での消費が『お得』に感じられ、客単価が日本人比 +30-100% 上昇。FLC 訪日客は『プレミアム寿司体験』として日本人 1,500 円 → 外国人 3,000 円超の客単価、ファストリ訪日客は『ヒートテック・ユニクロ T シャツの爆買い』で日本人比 +50% 客単価。為替＋ブランド体験の二重恩恵。",
      },
      {
        heading: "2030 年 6,000 万人目標の長期成長余地",
        body:
          "政府は 2030 年に訪日客 6,000 万人を目標、現在の 4,000 万人から +50% 拡大計画。中国（現在 25%）・東南アジア（15%）・欧米（20%）・韓国（22%）の全方位拡大、特に欧米富裕層の長期滞在型観光が客単価押し上げ要因。長期的には外食・小売・不動産・運輸の構造的成長セクターとして位置付け。",
      },
    ],
    rankBy: "valuationScore",
    rankAsc: false,
    rankFilter: (s) =>
      ["3563", "3382", "8267", "9983", "8227", "8801", "8802", "8830"].includes(s.code),
    rankLabel: "バリュエーションスコア",
    relatedIndustries: ["retail", "real-estate"],
    relatedPosts: ["primer-rate-vs-realestate", "primer-inflation-pass-through"],
    risks: [
      "中国・韓国の地政学リスクで訪日客減のリスク",
      "急激な円高転換で外国人客単価が悪化",
      "オーバーツーリズム規制（京都・富士山等）で都市集中の制約",
      "感染症パンデミック再発で訪日客激減のリスク",
    ],
    updatedAt: "2026-06-03",
  },

  {
    slug: "progressive-dividend",
    name: "累進配当銘柄",
    shortName: "累進配当",
    oneLiner: "減配しない配当方針を明文化、新 NISA 流入の安全資産として機能",
    lede:
      "累進配当（progressive dividend）とは『前年配当を下回らないことを企業が明文化した配当方針』。NTT・KDDI は 22 期連続増配で日本市場の代表格、メガバンク 3 行・総合商社・JR 東日本も累進配当方針を採用。配当目的投資家にとって減配リスクなしは最大の安心材料、新 NISA で長期保有志向と一致。",
    macroContext: [
      { label: "10 年国債利回り", value: "約 1.5%", note: "累進配当の利回り魅力" },
      { label: "新 NISA 口座数", value: "約 2,300 万口座", note: "2025 年末" },
      { label: "代表 4 社平均配当", value: "約 3.6%", note: "NTT・KDDI・MUFG・SMFG" },
      { label: "東証 PBR 改善要請", value: "2023 年 3 月", note: "配当方針強化の触媒" },
    ],
    picks: [
      {
        code: "9432",
        reason:
          "NTT は 22 期連続増配・配当 3.2%・配当性向 35%、IOWN（光技術）の長期成長と累進配当の安心の両立。",
      },
      {
        code: "9433",
        reason:
          "KDDI は 22 期連続増配・配当 3.4%、au PAY 経済圏・ローソン買収でライフデザイン戦略の優位。",
      },
      {
        code: "8306",
        reason:
          "三菱 UFJ FG は累進配当明文化（2023）・配当 3.4%、利上げサイクル受益で配当の持続性確実。",
      },
      {
        code: "8316",
        reason:
          "三井住友 FG は累進配当方針・配当 4.2% で 3 メガ最高、Olive 統合 App でリテール拡大も。",
      },
      {
        code: "8058",
        reason:
          "三菱商事は累進配当方針・配当 3.8%、5 大商社でバフェット保有 + 利上げ恩恵 + 円安受益の三軸。",
      },
      {
        code: "8031",
        reason:
          "三井物産は累進配当方針・配当 3.5%、資源価格上昇局面で配当維持の余裕大、新 NISA 流入の典型受益。",
      },
    ],
    sections: [
      {
        heading: "累進配当の構造的優位",
        body:
          "累進配当は『業績が一時的に悪化しても配当を維持または増配する』明示的コミットメント。配当目的投資家にとって減配リスクなしは最大の安心材料、10 年国債利回り 1.5% に対して累進配当 3-4% は明確な利回り魅力で、ディフェンシブ性格の長期保有先として機能。",
      },
      {
        heading: "新 NISA との相性",
        body:
          "2024 年改正で生涯 1,800 万円の非課税枠が設定、累進配当銘柄は『配当を非課税で永続的に受け取れる』ため新 NISA の典型的な受け皿。NTT・KDDI・メガバンク・総合商社の 6-8 社で構成する『累進配当ポートフォリオ』が人気投資戦略の一つ、年率 3-4% の配当 + 緩やかな増配 + 株価上昇 で安定リターンを狙う。",
      },
      {
        heading: "東証 PBR 改善要請が累進配当宣言の触媒",
        body:
          "2023 年 3 月の東証要請で PBR 1 倍割れ企業は明確な改善計画開示が求められ、累進配当宣言が PBR 改善ツールとして急速に普及。MUFG・SMFG は 2023 年に正式に累進配当を明文化、これにより配当の信頼性が法的にも市場的にも強化された。今後も新規累進配当宣言企業が拡大する見込み、PBR 改善要請の継続的な触媒として機能。",
      },
    ],
    rankBy: "dividendYield",
    rankAsc: false,
    rankFilter: (s) =>
      ["9432", "9433", "8306", "8316", "8411", "8058", "8031", "8001", "8053", "8002"].includes(s.code),
    rankLabel: "予想配当利回り",
    relatedIndustries: ["telecom", "finance", "trading-house"],
    relatedPosts: ["primer-progressive-dividend", "primer-boj-rate-bank", "primer-buffett-trading"],
    risks: [
      "業績悪化長期化で配当の持続可能性が問われる可能性（東日本大震災時東電のような事例）",
      "金利上昇加速で配当利回りの相対魅力低下（10 年国債利回り > 配当利回りのクロスオーバー）",
      "成長投資との二律背反で長期成長機会の損失",
      "明文化していない『暗黙の累進配当』はコミットメントとして弱い",
    ],
    updatedAt: "2026-06-03",
  },

  {
    slug: "pbr-improvement",
    name: "PBR 改善期待銘柄",
    shortName: "PBR改善",
    oneLiner: "東証要請（2023）で PBR 1 倍超への戻りに向けた構造改革を進める銘柄",
    lede:
      "2023 年 3 月の東証『資本コストや株価を意識した経営の実現』要請以降、PBR 1 倍割れ企業は改善計画開示を義務付けられた。住友化学（PBR 0.62）・三菱ケミカル（0.92）・みずほ FG（0.85）・MS&AD（0.95）が代表的な改善要請対象。事業ポートフォリオ転換・自社株買い・配当強化で PBR 1.2-1.5 倍への戻りで株価 +30-100% 余地。",
    macroContext: [
      { label: "東証要請", value: "2023 年 3 月", note: "資本コスト経営" },
      { label: "PBR 1 倍割れ", value: "東証プライム約 40%", note: "業界別に偏在" },
      { label: "対象企業の自社株買い", value: "年 5-10 兆円規模", note: "業界全体" },
      { label: "改善計画開示状況", value: "対象 70% 超開示済", note: "2025 年末" },
    ],
    picks: [
      {
        code: "4005",
        reason:
          "住友化学は PBR 0.62 倍で化学業界最低、Petro Rabigh 撤退 + 人員削減 + EUV レジスト育成で再建シナリオ。成功で PBR 1.0 倍まで +60%。",
      },
      {
        code: "4188",
        reason:
          "三菱ケミカルは PBR 0.92 倍・MMA 世界 1 位 + Nippon Sanso 統括、スチレン・コークス売却で利益率改善・PBR 1.2 倍への戻り余地。",
      },
      {
        code: "8411",
        reason:
          "みずほ FG は PBR 0.85 倍・Greenhill 買収・楽天証券提携でリテール拡大、累進配当宣言で配当 4.5%。改善実現で PBR 1.0 倍 +18%。",
      },
      {
        code: "8725",
        reason:
          "MS&AD は PBR 0.95 倍・配当 4.8% は損保業界最高、東南アジア展開・代理店改革進行中。",
      },
      {
        code: "7201",
        reason:
          "日産自動車は PBR 0.40 倍で自動車業界最低、ホンダとの経営統合協議・北米工場再編で構造改革加速、再建成功で +50% 余地。",
      },
    ],
    sections: [
      {
        heading: "東証 PBR 改善要請の構造的影響",
        body:
          "2023 年 3 月の東証要請で PBR 1 倍割れ企業は『改善計画の開示』が義務化され、対象企業の 70% 超が 2025 年末までに改善計画を開示済み。改善ツールは ①自社株買い・配当強化（PBR 直接押し上げ）、②事業ポートフォリオ転換（ROE 改善）、③IR 強化（資本コスト議論）の 3 軸。改善計画開示企業の平均株価リターンは TOPIX を 3-5pp 上回るパフォーマンス、構造的アルファ源として機能。",
      },
      {
        heading: "化学業界の構造改革（住友化学・三菱ケミカル）",
        body:
          "化学業界は中国の汎用化学過剰供給で構造不況、PBR 1 倍割れ企業が多発。住友化学（0.62）は Petro Rabigh 撤退・住友ファーマ縮小・EUV レジスト育成で再建中、三菱ケミカル（0.92）はスチレン・コークス売却・Nippon Sanso 統括で機能化学集中シフト。両社とも 2026-27 年の構造改革完了で PBR 1.0-1.2 倍への戻り余地、再建シナリオの宝くじ性格を持つ銘柄。",
      },
      {
        heading: "金融業界の累進配当 + 自社株買いダブル攻勢",
        body:
          "メガバンク 3 行（PBR 0.85-1.15）・損保 MS&AD（0.95）は累進配当宣言 + 自社株買い拡大で PBR 改善を推進。みずほ FG は年 3,000 億円規模の自社株買い、SMFG は配当 4.2% + 自社株買いで総還元性向 60% 超。利上げサイクル受益で利益拡大もセット、改善実現で 5 年でも PBR 1.0 → 1.5 倍への戻り余地。",
      },
    ],
    rankBy: "pbr",
    rankAsc: true,
    rankFilter: (s) => s.pbr !== null && s.pbr < 1.0,
    rankLabel: "PBR（低いほど改善余地大）",
    relatedIndustries: ["chemicals", "finance", "automotive"],
    relatedPosts: ["primer-chemical-polarization", "primer-factor-beta"],
    risks: [
      "改善計画の実行が想定より遅延するリスク",
      "事業ポートフォリオ転換で短期的な減損損失・株価圧迫",
      "市場全体の下落局面で PBR 改善期待が後退",
      "個別企業の構造的問題（住友化学 Petro Rabigh 等）の長期化リスク",
    ],
    updatedAt: "2026-06-03",
  },
];

export function getTheme(slug: string): Theme | undefined {
  return themes.find((t) => t.slug === slug);
}

export function listThemes(): Theme[] {
  return themes;
}

export type RankBy = Theme["rankBy"];

/** rankBy で示されたファクター値を返す。データ未取得なら null。 */
export function themeRankValue(s: Stock, rankBy: RankBy): number | null {
  switch (rankBy) {
    case "usdjpy":
      return s.factorBetas?.usdjpy ?? null;
    case "us10y":
      return s.factorBetas?.us10y ?? null;
    case "sox":
      return s.factorBetas?.sox ?? null;
    case "china":
      return s.factorBetas?.china ?? null;
    case "dividendYield":
      return s.dividendYield;
    case "pbr":
      return s.pbr;
    case "roe":
      return s.roe;
    case "valuationScore":
      return s.valuationCall?.score ?? null;
  }
}

/** ランキング表で表示する文字列。データ未取得なら "—"。 */
export function formatThemeRankValue(s: Stock, rankBy: RankBy): string {
  const v = themeRankValue(s, rankBy);
  if (v === null) return "—";
  switch (rankBy) {
    case "usdjpy":
    case "us10y":
    case "sox":
    case "china":
      return v.toFixed(2);
    case "dividendYield":
    case "roe":
      return `${v.toFixed(1)}%`;
    case "pbr":
      return `${v.toFixed(2)} 倍`;
    case "valuationScore":
      return `${v}/100`;
  }
}

/**
 * ランキング対象のテーマで、銘柄を rankFilter で絞り込んで sort する。
 * 呼び出し側は詳細型の銘柄一覧(オーバーレイ済み)を渡す。
 * ランク値が null の銘柄は除外する(順序付けできないため)。
 */
export function rankedStocksForTheme(theme: Theme, all: Stock[]): Stock[] {
  return all
    .filter(theme.rankFilter)
    .filter((s) => themeRankValue(s, theme.rankBy) !== null)
    .sort((a, b) => {
      const av = themeRankValue(a, theme.rankBy) as number;
      const bv = themeRankValue(b, theme.rankBy) as number;
      return theme.rankAsc ? av - bv : bv - av;
    });
}

/**
 * テーマの picks(編集部キュレーション)を Stock オブジェクトに解決して返す。
 * 詳細型の銘柄一覧(オーバーレイ済み)を渡す。picks に該当する銘柄が無い場合は除外される。
 */
export function pickedStocksForTheme(
  theme: Theme,
  all: Stock[],
): { stock: Stock; reason: string }[] {
  const byCode = new Map(all.map((s) => [s.code, s]));
  return theme.picks
    .map((p) => {
      const stock = byCode.get(p.code);
      return stock ? { stock, reason: p.reason } : null;
    })
    .filter((x): x is { stock: Stock; reason: string } => x !== null);
}
