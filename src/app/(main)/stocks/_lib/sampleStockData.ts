// 銘柄詳細ページのサンプルデータ (トヨタ 7203 を題材にした手作り実値ベース)。
//
// 役割は 2 つ:
//  1. 7203 の履歴値など、D1 にまだ無いカラムの fallback ソース。
//  2. D1 が空のとき、全セクションの見た目を開発中に確認するためのサンプル。
//     ただし本物のように誤認させないため、サンプル使用時はヒーローに
//     「サンプルデータ」バッジを出す (loadStockPageData の usesSampleData フラグ)。
//
// storyDeck の slides は image / imageAlt フィールドを持つが、StorySlider は
// タイポグラフィ主体の設計に移行したため画像は表示に使わない (型互換のため残置)。

export const basics = {
  code: "7203",
  name: "トヨタ自動車",
  nameEn: "Toyota Motor Corporation",
  exchange: "プライム",
  sectorTSE: "輸送用機器",
  founded: "1937年8月28日",
  listed: "1949年5月",
  headquarters: "愛知県豊田市トヨタ町1番地",
  employees: "約 38万人 (連結)",
  ceo: "佐藤 恒治",
  website: "https://global.toyota/jp/",
  logoColor: "#e60012",
};

export const summary =
  "年間販売1,000万台を売り続ける世界最大級の自動車メーカー。HV・PHV・BEV・FCEVを並走させる「マルチパスウェイ」戦略で、EV一辺倒に振れた業界の中で独自路線を貫いてきた。看板はやはりTPS(トヨタ生産方式)による圧倒的なオペレーション力。一時はBEV後発で「周回遅れ」と叩かれたが、ハイブリッドの再評価と北米市場の追い風で復活。次世代BEVと水素の本気度がこれからの試金石になる。";

export const latestEarnings = {
  period: "2025年3月期 通期",
  revenueOku: 480367,
  operatingProfitOku: 47955,
  netProfitOku: 47649,
  operatingMargin: 9.98,
  roe: 14.7,
  eps: 364.4,
  dividend: 90.0,
  highlights: [
    "売上高48兆円超、過去最高を更新",
    "営業利益は前期比10%減 — 円高想定と材料費・労務費の上昇が重荷",
    "ハイブリッド比率がさらに上昇、北米で台数好調",
    "BEVは第2世代モデルで2026年度から本格展開へ",
  ],
};

export type YearlyFinancials = {
  period: string;
  revenueOku: number;
  operatingProfitOku: number;
  operatingMargin: number;
};

export const history10y: YearlyFinancials[] = [
  { period: "2016/3", revenueOku: 284031, operatingProfitOku: 28539, operatingMargin: 10.05 },
  { period: "2017/3", revenueOku: 275971, operatingProfitOku: 19943, operatingMargin: 7.23 },
  { period: "2018/3", revenueOku: 293795, operatingProfitOku: 23998, operatingMargin: 8.17 },
  { period: "2019/3", revenueOku: 302256, operatingProfitOku: 24675, operatingMargin: 8.16 },
  { period: "2020/3", revenueOku: 299300, operatingProfitOku: 24428, operatingMargin: 8.16 },
  { period: "2021/3", revenueOku: 272145, operatingProfitOku: 21977, operatingMargin: 8.08 },
  { period: "2022/3", revenueOku: 313795, operatingProfitOku: 29956, operatingMargin: 9.55 },
  { period: "2023/3", revenueOku: 371542, operatingProfitOku: 27250, operatingMargin: 7.33 },
  { period: "2024/3", revenueOku: 450953, operatingProfitOku: 53529, operatingMargin: 11.87 },
  { period: "2025/3", revenueOku: 480367, operatingProfitOku: 47955, operatingMargin: 9.98 },
];

export const stockTrend = {
  currentPrice: 2782,
  change1d: "+1.8%",
  change1m: "+4.2%",
  change1y: "-3.1%",
  marketCapOku: 363000,
  per: 8.4,
  pbr: 1.05,
  dividendYield: 3.23,
  positive: true,
  aiAnalysis:
    "3ヶ月チャートはレンジ上限を試す動き。決算発表後に一旦売られたが、北米HV販売の堅調さと自己株買いの観測でじり高に切り返した。マルチパスウェイ戦略は「BEV一本足打法でなくてよかった」という形で再評価が進む一方、第2世代BEVの市場評価と中国市場での競争激化が下押し材料。1円円安で営業利益500億円というFX感応度の高さも引き続き株価のドライバー。PBR 1倍前後・PER 8倍台はG7自動車セクター比で割安に映るが、資本効率の改善ストーリーがどこまで本気かが論点。",
  factors: [
    { label: "USD/JPY 感応度", value: "+0.85", note: "1円円安で営業利益 +500億円" },
    { label: "BEV移行リスク", value: "中立〜やや弱気", note: "第2世代BEVの市場評価次第" },
    { label: "TPS再評価", value: "強い", note: "ハイブリッドの収益性で再評価" },
    { label: "PER 8倍台", value: "割安サイド", note: "G7自動車セクター比で割引" },
  ],
  // ダミー株価 (90日)
  priceSeries: makePriceSeries(),
};

function makePriceSeries() {
  // 安定した擬似乱数で90日ぶん。
  const out: number[] = [];
  let v = 2680;
  let seed = 7203;
  for (let i = 0; i < 90; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (seed / 0x7fffffff - 0.5) * 60; // -30 〜 +30
    v = Math.max(2400, Math.min(2900, v + r));
    out.push(Math.round(v));
  }
  // 末尾を current price に寄せる
  out[out.length - 1] = 2782;
  return out;
}

export const positioning = {
  headline:
    "世界販売台数10年以上首位を守る巨人。HV・BEV・FCVのマルチパスウェイで全方位の脱炭素に挑む。",
  analysis:
    "トヨタは2023年に1,030万台超、2024年も約1,082万台で世界販売首位を維持し、VW・現代起亜を引き離す圧倒的スケールを誇る。収益面ではHVプリウス以来四半世紀の蓄積で1台あたり粗利を稼ぐ構造を確立し、TPS(トヨタ生産方式)による低い損益分岐点と相まって営業利益率は欧米勢を凌駕する水準にある。一方BEVではbZ4XのリコールでつまずきBYD・Teslaに大きく後れを取ったが、2026年投入予定の第2世代BEVと2027〜28年実用化を掲げる全固体電池で巻き返しを狙う。グループにはデンソー、アイシン、豊田自動織機、豊田合成といったTier1の主力が連なり、半導体・電池・モーターまで内製可能な垂直統合は他社にない武器。競合はVW、現代起亜、Stellantis、BYD、Tesla、Honda、日産。",
  strengths: [
    "世界販売10年以上首位の圧倒的スケールと、170以上の国・地域に張り巡らせた販売・サービス網による現地適応力の高さ。",
    "HV比率の高さで脱炭素需要を取り込みつつ、平均販売単価上昇と為替追い風で歴代最高益を更新する稼ぐ力。",
    "TPS(トヨタ生産方式)に代表される製造技術と、改善文化に裏打ちされた業界トップクラスの営業利益率。",
    "デンソー・アイシン・豊田自動織機・豊田合成を擁する企業集団による、半導体から電池まで及ぶ垂直統合の強さ。",
  ],
  challenges: [
    "BEV専用プラットフォームの立ち上げ遅れにより、急成長する中国・欧州のEV市場でBYDやTeslaに先行を許している点。",
    "SDV(ソフトウェア・ディファインド・ビークル)領域で米中勢に劣後し、Arene OSと車載半導体の内製化が急務。",
    "世界最大市場である中国で現地EVメーカーの台頭により販売シェアが低下し、合弁事業の再編を迫られている点。",
  ],
};

export type Peer = {
  code: string;
  name: string;
  marketCapOku: number;
  per: number;
  changePct: number;
};

export const peers: Peer[] = [
  { code: "6902", name: "デンソー", marketCapOku: 62000, per: 18.5, changePct: 0.8 },
  { code: "7267", name: "ホンダ", marketCapOku: 78000, per: 7.2, changePct: -0.4 },
  { code: "7269", name: "スズキ", marketCapOku: 38000, per: 11.8, changePct: 1.2 },
  { code: "6201", name: "豊田自動織機", marketCapOku: 35000, per: 9.5, changePct: 0.3 },
  { code: "7259", name: "アイシン", marketCapOku: 18500, per: 12.4, changePct: -0.6 },
  { code: "7270", name: "SUBARU", marketCapOku: 17200, per: 7.8, changePct: 0.5 },
  { code: "7201", name: "日産自動車", marketCapOku: 15800, per: -0.9, changePct: -1.8 },
  { code: "7202", name: "いすゞ自動車", marketCapOku: 15500, per: 10.6, changePct: 0.2 },
  { code: "7261", name: "マツダ", marketCapOku: 7400, per: 7.9, changePct: -1.1 },
  { code: "7282", name: "豊田合成", marketCapOku: 3800, per: 11.2, changePct: -0.1 },
];

export const industryLinkSlug = "automobile";
export const industryName = "自動車・輸送用機器";

// ─────────────────────────────────────────────────────────
// 沿革紙芝居 (subagent C 出力)
// ─────────────────────────────────────────────────────────

export type Slide = {
  n: number;
  era: string;
  year: string;
  title: string;
  lead: string;
  body: string;
  image: string;
  imageAlt: string;
  highlight: string | null;
};

export type StoryDeck = {
  deckTitle: string;
  subtitle: string;
  source: string;
  slides: Slide[];
};

// ─────────────────────────────────────────────────────────
// 投資判断データ (subagent 出力)
// ─────────────────────────────────────────────────────────

export type ValuationMetric = {
  label: string;
  value: string;
  industryAvg: string;
  self5yAvg: string;
  comment: string;
};

export const valuation = {
  verdict: "ほぼ妥当" as "割安" | "ほぼ妥当" | "やや割高" | "割高",
  score: 62,
  rationale:
    "PER予9倍前後・PBR0.9〜1倍と国内平均(PER15倍/PBR1.3倍)対比で割安サイド。ROE10%・ROIC8%水準は世界自動車大手で上位だが、北米関税影響と26/3期営業利益21%減で成長期待は後退。4.3兆円規模の自社株買いと資本効率改善が下支えし、現水準はディフェンシブな実需価値圏。",
  metrics: [
    { label: "PER (実績)", value: "9.4倍", industryAvg: "11.8倍", self5yAvg: "10.8倍", comment: "業界・自社過去比でも割安サイド" },
    { label: "PER (予想)", value: "11.8倍", industryAvg: "12.6倍", self5yAvg: "10.5倍", comment: "今期減益見通しで前期比は悪化、業界比はやや割安" },
    { label: "PBR", value: "0.89倍", industryAvg: "1.05倍", self5yAvg: "1.12倍", comment: "PBR1倍割れ、東証要請の改善対象圏" },
    { label: "PSR", value: "0.84倍", industryAvg: "0.72倍", self5yAvg: "1.05倍", comment: "売上対比では業界平均よりやや高め" },
    { label: "EV/EBITDA", value: "7.6倍", industryAvg: "8.4倍", self5yAvg: "8.2倍", comment: "金融事業除く本業ベースでも割安" },
    { label: "PEG", value: "1.4倍", industryAvg: "1.1倍", self5yAvg: "0.9倍", comment: "成長鈍化でPEGは平均超え、割安感は限定的" },
    { label: "ROE", value: "10.2%", industryAvg: "8.4%", self5yAvg: "13.6%", comment: "業界平均は上回るが過去自社比では低下" },
  ] as ValuationMetric[],
  peerComparison: [
    { code: "7203", name: "トヨタ", per: 9.4, pbr: 0.89, marketCapOku: 424000, isSelf: true },
    { code: "7267", name: "ホンダ", per: 12.2, pbr: 0.62, marketCapOku: 75000, isSelf: false },
    { code: "7201", name: "日産", per: null as number | null, pbr: 0.31, marketCapOku: 13800, isSelf: false },
    { code: "7270", name: "SUBARU", per: 8.1, pbr: 0.78, marketCapOku: 18200, isSelf: false },
    { code: "7261", name: "マツダ", per: 7.9, pbr: 0.55, marketCapOku: 7600, isSelf: false },
    { code: "7269", name: "スズキ", per: 13.6, pbr: 1.62, marketCapOku: 40500, isSelf: false },
    { code: "6902", name: "デンソー", per: 18.4, pbr: 1.48, marketCapOku: 62000, isSelf: false },
    { code: "HYMTF", name: "現代自動車", per: 5.2, pbr: 0.52, marketCapOku: 58000, isSelf: false },
  ],
};

export const dividend = {
  annualPerShare: 100,
  yield: 3.68,
  payoutRatio: 34.2,
  totalReturnYield: 6.4,
  buybackOku: 12000,
  consecutiveYears: 16,
  history: [
    { fy: "2016/3", amount: 42 },
    { fy: "2017/3", amount: 42 },
    { fy: "2018/3", amount: 44 },
    { fy: "2019/3", amount: 44 },
    { fy: "2020/3", amount: 44 },
    { fy: "2021/3", amount: 52 },
    { fy: "2022/3", amount: 52 },
    { fy: "2023/3", amount: 60 },
    { fy: "2024/3", amount: 75 },
    { fy: "2025/3", amount: 90 },
  ],
  schedule: {
    exDate: "2026/9/28",
    recordDate: "2026/9/30",
    payDate: "2026/12/3",
    estimate: "中間 ¥45、期末 ¥55 (年間予想 ¥100)",
  },
};

export type Shareholder = {
  rank: number;
  name: string;
  share: number;
  type: string;
};

export const shareholders = {
  foreignOwnership: 26.4,
  individualOwnership: 11.2,
  stableOwnership: 36.8,
  top: [
    { rank: 1, name: "日本マスタートラスト信託銀行 (信託口)", share: 15.42, type: "信託口" },
    { rank: 2, name: "日本カストディ銀行 (信託口)", share: 5.71, type: "信託口" },
    { rank: 3, name: "豊田自動織機", share: 3.65, type: "法人 (グループ)" },
    { rank: 4, name: "トヨタ不動産", share: 3.21, type: "法人 (グループ)" },
    { rank: 5, name: "日本生命保険", share: 2.84, type: "法人 (生保)" },
    { rank: 6, name: "デンソー", share: 2.31, type: "法人 (グループ)" },
    { rank: 7, name: "State Street Bank and Trust Company", share: 1.92, type: "外国機関" },
    { rank: 8, name: "東京海上日動火災保険", share: 1.74, type: "法人 (損保)" },
    { rank: 9, name: "JPMorgan Chase Bank 385781", share: 1.65, type: "外国機関" },
    { rank: 10, name: "アイシン", share: 1.42, type: "法人 (グループ)" },
  ] as Shareholder[],
};

export const analystTargets = {
  consensus: 3150,
  high: 4500,
  low: 2400,
  currentPrice: 2768,
  upsidePct: 13.8,
  ratingCount: { buy: 13, hold: 6, sell: 1 },
  analystComment:
    "強気派はHEVシェアの世界的拡大、4.3兆円自社株買いによる資本効率改善、円安耐性を評価。弱気派は米国関税影響、BEV市場での出遅れ、中国市場でのシェア低下を指摘。総じて配当・買戻し利回り含むトータルリターンは魅力。",
};

export const technical = {
  ma25: 2725,
  ma75: 2680,
  ma200: 2810,
  high52w: 3400,
  low52w: 2480,
  avgVolume: "28.6M",
  creditBuy: "86M",
  creditSell: "11M",
  creditRatio: 7.8,
  rsi14: 54,
  comment: "MA25・MA75を上回り堅調、MA200は上値抵抗。信用買残が高水準で需給は重め、RSIは中立圏。",
};

export type Catalyst = {
  title: string;
  when: string;
  impact: "強" | "中" | "弱";
  note: string;
};

export const catalysts = {
  upside: [
    { title: "4.3兆円自社株買い完了によるEPSブースト", when: "2026年Q2", impact: "強", note: "豊田自動織機の保有株消却で発行済株式数9%減、1株利益が機械的に押し上げ" },
    { title: "次世代EVプラットフォーム量産開始", when: "2026年Q4〜2027年", impact: "中", note: "航続距離800km級の新世代BEVが市場評価獲得すればBEV出遅れ懸念を払拭" },
    { title: "全固体電池の搭載モデル投入", when: "2027年〜2028年", impact: "強", note: "商業化先行で電池技術の主導権獲得、ライセンス収益期待もアップサイド" },
    { title: "米国新車販売の関税緩和・FTA進展", when: "2026年下期", impact: "中", note: "対米関税の正常化で営業利益が数千億円規模で改善余地" },
  ] as Catalyst[],
  downside: [
    { title: "米国市場での関税継続・実質増税", when: "通年", impact: "強", note: "通商環境次第で営業利益が最大1兆円規模で削られるシナリオ" },
    { title: "中国市場でのシェア低下とBEV競争激化", when: "継続", impact: "中", note: "BYD・テスラ・現地メーカーとの価格競争で中国事業の収益悪化リスク" },
    { title: "円高反転による為替差損", when: "金融政策次第", impact: "中", note: "対ドル10円の円高で営業利益約4,500億円押し下げ" },
    { title: "品質問題・認証不正の再発", when: "不定", impact: "強", note: "ダイハツ・豊田自動織機での不正問題に続く事案発生でブランド毀損リスク" },
  ] as Catalyst[],
};

export const ownerActivism = [
  { title: "4.3兆円規模の自社株TOB完了", note: "豊田自動織機保有のトヨタ株9.15%を1株3,067円で取得、政策保有株縮減と資本効率改善を同時実行する歴史的還元" },
  { title: "ROE目標と資本効率改善のコミット", note: "中長期でROE20%水準を目標に掲げ、現状10%からの引き上げに向け事業ポートフォリオ再編と還元強化を継続" },
  { title: "豊田自動織機の非公開化とグループ再編", note: "織機TOBを通じたグループ統治の再構築、政策保有株式比率を連結純資産の20%以下へ削減する方針" },
];

export const storyDeck: StoryDeck = {
  deckTitle: "トヨタ自動車 — 100年の物語",
  subtitle: "豊田佐吉の自動織機から、世界1位の自動車メーカーへ",
  source:
    "参考文献: ウィキペディア「トヨタ自動車」「豊田佐吉」「豊田喜一郎」「トヨタ自動車の歴史」「トヨタ生産方式」「プリウス」「レクサス」(2026年6月時点)",
  slides: [
    {
      n: 1,
      era: "創業前夜",
      year: "1867",
      title: "発明王・豊田佐吉、誕生",
      lead: "遠州の大工の長男が、世界の織機を変える発明家になる。",
      body:
        "1867年(慶応3年)2月14日、遠江国敷知郡山口村(現・静岡県湖西市)に大工・豊田伊吉の長男として生まれた豊田佐吉。明治の文明開化の波の中で、母が手織機の前で過酷に働く姿を見て育ち、「もっと楽に、もっと速く布を織る機械を作る」と志した。これがトヨタ100年の物語の出発点である。",
      image: "photo-1485827404703-89b55fcc595e",
      imageAlt: "Old wooden industrial machinery",
      highlight: "1867年、湖西市に誕生",
    },
    {
      n: 2,
      era: "創業前夜",
      year: "1890",
      title: "豊田式木製人力織機",
      lead: "23歳、最初の特許。母を楽にしたい一心で。",
      body:
        "1890年、東京・上野で開かれた第3回内国勧業博覧会を訪れた佐吉は、機械への情熱を確信する。同年、独学で「豊田式木製人力織機」を発明し、初めての特許(専売特許第1195号)を取得。片手で動かせ、布の生産性を従来の4〜5割向上させたこの機械が、後の豊田グループの礎となった。",
      image: "photo-1502672023488-70e25813eb80",
      imageAlt: "Old wooden mechanical device",
      highlight: "特許第1195号、初取得",
    },
    {
      n: 3,
      era: "創業前夜",
      year: "1896",
      title: "動力織機の革命",
      lead: "日本初の動力織機が、佐吉の手から生まれた。",
      body:
        "1896年、佐吉は日本人として初めて動力織機「豊田式汽力織機」を発明。さらに横糸が切れると自動で機械が止まる「自動停止装置」を組み込み、1台で複数台を見守れる仕組みを実現した。この「異常があれば止まる」思想こそ、後のトヨタ生産方式の二本柱の一つ「ニンベンのついた自働化(じどうか)」の原点である。",
      image: "photo-1487754180451-c456f719a1fc",
      imageAlt: "Old factory interior",
      highlight: "「自働化」の原点ここに",
    },
    {
      n: 4,
      era: "創業前夜",
      year: "1924",
      title: "G型自動織機、世界を魅了",
      lead: "「魔法の織機」が英プラット社へ100万円で。",
      body:
        "佐吉と長男・喜一郎が完成させた「無停止杼換式豊田自動織機(G型)」は、糸が切れても織機を止めずに杼(ひ)を自動交換する世界初の機構を備えていた。1929年、英国の老舗機械メーカー・プラット社にこの特許権を約100万円(当時)で譲渡。その資金が、喜一郎の自動車開発を後押しすることになる。",
      image: "photo-1568667256531-3379a4076b1e",
      imageAlt: "Industrial machinery close-up",
      highlight: "特許権譲渡額 約100万円",
    },
    {
      n: 5,
      era: "創業期",
      year: "1926",
      title: "豊田自動織機製作所、創立",
      lead: "佐吉の遺志を継ぐ、織機の会社が産声をあげる。",
      body:
        "1926年(大正15年)11月、豊田佐吉は名古屋市西区に「株式会社豊田自動織機製作所」を設立。社長には佐吉の娘婿・豊田利三郎が就任した。表向きは織機メーカーだが、佐吉は喜一郎に「自動車をやれ」と命じ、織機の利益で次の時代の事業を始めるよう託す。佐吉は1930年に死去するが、その遺志は確かに息子に受け継がれた。",
      image: "photo-1487754180451-c456f719a1fc",
      imageAlt: "Factory exterior taisho era",
      highlight: "資本金100万円で創立",
    },
    {
      n: 6,
      era: "創業期",
      year: "1933",
      title: "自動車部、誕生",
      lead: "「日本人の頭と腕で、日本人の車を作る」",
      body:
        "1933年9月、喜一郎は豊田自動織機製作所の本社工場内に「自動車部」を設置。当時の日本は米国フォードやGMの組立車に席巻され、純国産車は夢物語だった。喜一郎は技師たちと共にシボレーのエンジンを分解研究し、たった2年で試作型A1乗用車とトラックG1型を完成させる。日本の自動車産業は、織機工場の片隅から始まった。",
      image: "photo-1542362567-b07e54358753",
      imageAlt: "Vintage classic car",
      highlight: "資金45万円、社員わずか数十名",
    },
    {
      n: 7,
      era: "創業期",
      year: "1936",
      title: "AA型乗用車、ついに発売",
      lead: "クライスラー・エアフローを参考にした流線型セダン。",
      body:
        "1936年9月、純国産の本格的乗用車「トヨダAA型」が発売された。価格は3,350円、ボディは米クライスラー・エアフローを範とした流線型。エンジンはシボレー直6を改良した3.4Lで65馬力。同年「自動車製造事業法」が施行され、トヨタはフォード・GMと並ぶ自動車製造事業者として国に許可される。日本車産業の独立宣言だった。",
      image: "photo-1532974297617-c0f05fe48bff",
      imageAlt: "Classic 1930s automobile",
      highlight: "AA型 価格3,350円",
    },
    {
      n: 8,
      era: "創業期",
      year: "1937",
      title: "トヨタ自動車工業、独立",
      lead: "織機からの分社。社名は「トヨタ」に。",
      body:
        "1937年8月28日、自動車部は「トヨタ自動車工業株式会社」として独立。資本金1,200万円、初代社長は豊田利三郎、副社長に喜一郎が就いた。創業家の名「豊田(とよだ)」を、カタカナ8画で縁起がよく、デザイン的に美しい「トヨタ」へと改めたのもこの時期。世界に通じるブランドの誕生である。",
      image: "photo-1614200187524-dc4b892acf16",
      imageAlt: "Old garage with vintage cars",
      highlight: "8画の「トヨタ」誕生",
    },
    {
      n: 9,
      era: "創業期",
      year: "1938",
      title: "挙母工場、稼働開始",
      lead: "愛知県挙母町(現・豊田市)に世界水準の工場。",
      body:
        "1938年11月、愛知県西加茂郡挙母町に新設された挙母工場(現・本社工場)が稼働。延床面積23万㎡、月産2,000台を目指した当時最先端の流れ作業ラインを備えた。喜一郎はここで「ジャストインタイム」の構想を初めて口にする。「必要なものを、必要な時に、必要なだけ」——後のTPSの種が、この日蒔かれた。",
      image: "photo-1487754180451-c456f719a1fc",
      imageAlt: "Industrial factory floor",
      highlight: "ジャストインタイム構想",
    },
    {
      n: 10,
      era: "創業期",
      year: "1945-1949",
      title: "戦後の絶望と倒産危機",
      lead: "敗戦、ドッジ・ライン、そして大争議。",
      body:
        "戦中はトラックを軍需生産したが、1945年の敗戦で生産停止。GHQの指令と1949年のドッジ・ラインで激しいデフレに襲われ、月収を売上が下回る事態に。1950年、銀行団の支援条件として2,146名の人員整理を断行、責任を取り喜一郎は社長を辞任した。「人を切らない経営」へのトラウマと誓いが、この時刻まれた。",
      image: "photo-1485827404703-89b55fcc595e",
      imageAlt: "Post-war industrial decline",
      highlight: "2,146名の人員整理",
    },
    {
      n: 11,
      era: "成長期",
      year: "1950",
      title: "朝鮮特需が会社を救う",
      lead: "倒産寸前のトヨタに、米軍からの大量発注。",
      body:
        "1950年6月、朝鮮戦争が勃発。米軍から大型トラック数千台の特需注文が舞い込み、瀕死のトヨタは息を吹き返す。「天佑」と石田退三社長は呼んだ。同年、販売を分離して「トヨタ自動車販売(トヨタ自販)」を設立し、製造のトヨタ自動車工業(トヨタ自工)と二社体制に。販売の神様・神谷正太郎が販社網を全国に張り巡らせていく。",
      image: "photo-1503376780353-7e6692767b70",
      imageAlt: "Truck production line",
      highlight: "朝鮮特需で月産5,000台",
    },
    {
      n: 12,
      era: "成長期",
      year: "1955",
      title: "初代クラウン、誕生",
      lead: "「日本人の頭と腕でつくった純国産」第二章。",
      body:
        "1955年1月、純国産技術で開発された初代トヨペット・クラウン(RS型)が発売。価格は101万4,860円。観音開きのドア、フロアシフト、当時の日本車として群を抜く乗り心地で、官公庁・タクシー需要を席巻する。翌1957年には2台のクラウンが米国へ初輸出。一台は故障で峠を越えられず——苦い経験が、品質への執念に火をつける。",
      image: "photo-1542362567-b07e54358753",
      imageAlt: "Classic 1950s Japanese sedan",
      highlight: "初代クラウン 101万円",
    },
    {
      n: 13,
      era: "成長期",
      year: "1957",
      title: "米国上陸、惨敗から始まる",
      lead: "トヨタ・モーター・セールスU.S.A.設立。",
      body:
        "1957年10月、ロサンゼルスに販売会社「トヨタ・モーター・セールスU.S.A.」を設立。輸出した初代クラウンはハイウェイで非力さを露呈し、初年度の販売はわずか288台。「米国の道路は日本車を拒絶した」——惨敗を機に、トヨタは「現地のニーズを徹底的に研究する」という原則を骨身に刻む。雌伏の時代が始まった。",
      image: "photo-1503376780353-7e6692767b70",
      imageAlt: "Highway with classic cars",
      highlight: "初年度販売 たった288台",
    },
    {
      n: 14,
      era: "成長期",
      year: "1966",
      title: "カローラ登場、国民車へ",
      lead: "「80点+α主義」のベストセラーが街にあふれる。",
      body:
        "1966年11月、長谷川龍雄主査が開発した初代カローラ(KE10)が発売。価格43万2,000円、1.1L エンジン、フロアシフトとフルトランジスタラジオを標準装備。「すべての項目で80点以上、そこに+αの魅力を」という設計思想は、競合の日産サニーを退け年間販売40万台超のモンスターに育つ。マイカー時代の主役、世界累計5,000万台への道はここから始まった。",
      image: "photo-1492144534655-ae79c964c9d7",
      imageAlt: "Classic compact car detail",
      highlight: "累計販売 世界5,000万台超",
    },
    {
      n: 15,
      era: "成長期",
      year: "1973",
      title: "TPSの理論化、大野耐一",
      lead: "「カンバン」と「自働化」、二本柱が結実。",
      body:
        "副社長・大野耐一らが現場で磨き上げた生産方式が、1973年のオイルショックを契機に「トヨタ生産方式(TPS)」として理論化される。在庫を最小化する「ジャストインタイム」、異常で必ず止まる「自働化」、後工程引取りの「カンバン」、7つのムダ排除——燃料高で他社が苦しむ中、トヨタは黒字を維持。世界の製造業がトヨタを学びに来る時代が始まった。",
      image: "photo-1568667256531-3379a4076b1e",
      imageAlt: "Industrial production system",
      highlight: "TPS、世界標準へ",
    },
    {
      n: 16,
      era: "成長期",
      year: "1980",
      title: "国内生産300万台超え",
      lead: "「世界のトヨタ」、輸出大国の主役に。",
      body:
        "1980年、トヨタの国内生産は330万台を超え、米GM・フォードに次ぐ世界3位に躍り出る。輸出は約180万台。しかし日米貿易摩擦が激化し、米国議会では「日本車をハンマーで叩き壊すパフォーマンス」まで飛び出した。「アメリカで売るなら、アメリカで作るしかない」——トヨタの次の決断は、海外現地生産への大転換だった。",
      image: "photo-1568605114967-8130f3a36994",
      imageAlt: "Modern car",
      highlight: "世界生産3位、330万台",
    },
    {
      n: 17,
      era: "成長期",
      year: "1984",
      title: "NUMMI、GMとの合弁",
      lead: "「敵地」カリフォルニアでTPSを試す。",
      body:
        "1984年、トヨタとGMはカリフォルニア州フリーモントに合弁工場「NUMMI」を設立。閉鎖された旧GM工場、解雇された組合員を再雇用し、TPSをそのまま導入する大胆な実験だった。結果、生産性は閉鎖時の2倍、品質はGM最高水準に。「文化は移植できる」ことを世界に証明し、米国現地生産時代の幕開けとなった。",
      image: "photo-1487754180451-c456f719a1fc",
      imageAlt: "Modern assembly line",
      highlight: "生産性が旧GM時代の2倍",
    },
    {
      n: 18,
      era: "グローバル巨人化",
      year: "1989",
      title: "レクサス、北米デビュー",
      lead: "高級車に正面から殴り込み。LS400、衝撃の登場。",
      body:
        "1989年9月、米国市場に高級ブランド「LEXUS」を投入。旗艦LS400は3万5,000ドルでベンツ・BMWを驚愕させる静粛性と精度を実現し、6年の開発期間と1,000億円超を投じた執念の結晶だった。「F1プロジェクト」と呼ばれた極秘開発は、450名のエンジニアと24台の試作車を費やし、世界の高級車セグメントの常識を塗り替えた。",
      image: "photo-1568605114967-8130f3a36994",
      imageAlt: "Luxury sedan",
      highlight: "LS400、衝撃の3.5万ドル",
    },
    {
      n: 19,
      era: "グローバル巨人化",
      year: "1992",
      title: "ケンタッキー工場 100万台達成",
      lead: "米国現地生産が、本気の段階へ。",
      body:
        "1986年に着工した米ケンタッキー州ジョージタウン工場(TMMK)が、1988年から稼働。1992年には累計生産100万台を達成し、米国カムリの主力生産拠点となる。「現地のことは現地で」のげんち・げんぶつ主義は、雇用と部品調達を地元に根づかせ、政治的批判をかわす盾にもなった。トヨタの「グローバル巨人化」が本格化する。",
      image: "photo-1503376780353-7e6692767b70",
      imageAlt: "Modern automobile production",
      highlight: "TMMK 累計100万台",
    },
    {
      n: 20,
      era: "グローバル巨人化",
      year: "1997",
      title: "プリウス、世界初の量産HV",
      lead: "「21世紀に間に合いました」",
      body:
        "1997年12月、世界初の量産ハイブリッド乗用車「プリウス」(NHW10)発売。価格215万円、燃費28.0km/L、CMコピーは「21世紀に間に合いました」。エンジンとモーターを協調制御する「THS」は赤字覚悟の戦略商品だったが、地球温暖化への関心の高まりとともに評価が反転。後の20年、累計2,000万台超のHV帝国へ。",
      image: "photo-1606664515524-ed2f786a0bd6",
      imageAlt: "Hybrid vehicle",
      highlight: "「21世紀に間に合いました」",
    },
    {
      n: 21,
      era: "グローバル巨人化",
      year: "2002",
      title: "F1参戦、ヨーロッパで勝つために",
      lead: "「もっといいクルマづくり」を世界最高峰で。",
      body:
        "2002年、トヨタはF1世界選手権に自社チーム「パナソニック・トヨタ・レーシング」で参戦。年間予算500億円、独ケルンに本拠を構える総力戦だったが、勝利には恵まれず2009年に撤退。「商売にならぬモータースポーツに巨費を投じる意義」を問われ続けたが、ここでの挫折と人材が、後のWRC・WEC連覇とGRブランドへの礎となる。",
      image: "photo-1492144534655-ae79c964c9d7",
      imageAlt: "Race car detail",
      highlight: "年間予算500億円",
    },
    {
      n: 22,
      era: "グローバル巨人化",
      year: "2008",
      title: "ついに世界1位、GMを抜く",
      lead: "創業71年、世界販売トップに到達。",
      body:
        "2008年、トヨタの世界販売台数は897万台に達し、77年間トップを守り続けた米GMを抜いて世界一に。長年の悲願「世界一」を達成した瞬間だったが、同年9月のリーマンショックで需要は一気に蒸発。2009年3月期は連結営業損益が4,610億円の赤字へと転落。創業以来初の営業赤字、急成長の代償を払うことになる。",
      image: "photo-1568605114967-8130f3a36994",
      imageAlt: "Modern automobile",
      highlight: "世界販売 897万台で1位",
    },
    {
      n: 23,
      era: "グローバル巨人化",
      year: "2009",
      title: "リコール危機、章男の涙",
      lead: "創業家3代目、最大の試練と共に登壇。",
      body:
        "2009年6月、創業家から豊田章男が社長に就任。直後に米国でアクセルペダル問題を巡る大規模リコール(累計1,000万台超)が発生し、2010年2月には米下院公聴会で証言。「全責任は私にあります」と涙ながらに語った姿は世界に伝わった。「いいクルマづくり」「もっといいクルマづくり」へ立ち戻る、長い反省の旅が始まる。",
      image: "photo-1503376780353-7e6692767b70",
      imageAlt: "Modern automobile in crisis",
      highlight: "累計リコール 1,000万台超",
    },
    {
      n: 24,
      era: "次世代モビリティ",
      year: "2011",
      title: "東日本大震災、サプライチェーン総点検",
      lead: "ジャストインタイムが、最大の弱点に。",
      body:
        "2011年3月11日、東日本大震災。半導体・電装部品の被災により国内生産は一時8割減、世界生産も大きく落ち込んだ。在庫を持たないJIT思想が裏目に出た形だった。トヨタは1次サプライヤーから数千社の4次・5次孫請けまで部品供給網を再マッピングし、危機に強い「Rescue」体制を構築。レジリエンス経営への大転換が始まる。",
      image: "photo-1487754180451-c456f719a1fc",
      imageAlt: "Supply chain industrial",
      highlight: "国内生産 一時8割減",
    },
    {
      n: 25,
      era: "次世代モビリティ",
      year: "2015",
      title: "TNGA、設計思想の大改革",
      lead: "車種ごとに作り分けない、共通プラットフォーム革命。",
      body:
        "2015年、新世代の設計思想「Toyota New Global Architecture(TNGA)」が4代目プリウスから順次適用。プラットフォーム・エンジン・トランスミッションを共通モジュール化し、開発コストを2〜3割削減しながら走りと燃費を抜本改善。「もっといいクルマをつくる」を技術で具現化する基盤となり、現在もRAV4・カムリ・GR系まで全車に展開される。",
      image: "photo-1606664515524-ed2f786a0bd6",
      imageAlt: "Modern hybrid car",
      highlight: "開発コスト 2〜3割削減",
    },
    {
      n: 26,
      era: "次世代モビリティ",
      year: "2018",
      title: "CASEの時代、CES参戦",
      lead: "「クルマ会社」からモビリティ・カンパニーへ。",
      body:
        "2018年1月、章男社長は米CESで「トヨタはクルマ会社からモビリティ・カンパニーへと変わる」と宣言。MaaS専用車「e-Palette」を発表し、Uber・滴滴・Amazon・Pizza Hutとのパートナー像を披露した。同年Softbankとの合弁「MONET Technologies」設立。「移動」を再定義する戦いの号砲だった。",
      image: "photo-1581092921461-eab62e97a780",
      imageAlt: "Technology semiconductors",
      highlight: "e-Palette、MaaS宣言",
    },
    {
      n: 27,
      era: "次世代モビリティ",
      year: "2020",
      title: "Woven City、富士山麓に着工",
      lead: "実証実験のための「未来都市」、社員2,000人が暮らす。",
      body:
        "2020年1月、章男社長はCESで「Woven City」構想を発表。閉鎖した東富士工場跡地(静岡県裾野市・約70万㎡)に、自動運転・ロボット・水素エネルギー・AIホームを実証する「実証都市」を建設すると宣言した。2021年に起工式、2024年から段階稼働が始まり、社員と研究者2,000人超が暮らしながら未来のモビリティを試す——世界唯一の試みである。",
      image: "photo-1581092921461-eab62e97a780",
      imageAlt: "Future city technology",
      highlight: "敷地 約70万㎡",
    },
    {
      n: 28,
      era: "次世代モビリティ",
      year: "2023",
      title: "佐藤恒治、新体制スタート",
      lead: "章男から世代交代、技術屋トップへ。",
      body:
        "2023年4月、豊田章男は会長へ退き、レクサス出身の53歳・佐藤恒治が社長に就任。中嶋裕樹CTO、宮崎洋一CFOらと若い経営陣を組成し、「継承と進化」を掲げた。マルチパスウェイ(HEV・PHEV・BEV・FCEV)戦略を堅持しつつ、BEV専用設計の次世代EVへ本気で踏み込む——技術立脚の新時代が始まった。",
      image: "photo-1568605114967-8130f3a36994",
      imageAlt: "Modern automotive leadership",
      highlight: "53歳、技術屋トップ",
    },
    {
      n: 29,
      era: "次世代モビリティ",
      year: "2025",
      title: "BEV第2世代と全固体電池",
      lead: "ギガキャストで作る、新世代EV。",
      body:
        "2025年、トヨタは次世代BEV専用プラットフォームを投入。アルミ一体成形「ギガキャスト」で部品点数を激減、自走組立ラインで工場面積を半減させる。並行して悲願の全固体電池は2027〜2028年の実用化を目指し、航続1,000km・10分充電の実現が視野に。「マルチパスウェイの忍耐」が、ようやく次の景色を見せ始めた。",
      image: "photo-1581092921461-eab62e97a780",
      imageAlt: "Battery technology",
      highlight: "航続1,000km 充電10分",
    },
    {
      n: 30,
      era: "次世代モビリティ",
      year: "2026〜",
      title: "これからのトヨタは",
      lead: "「自動車をつくる会社」から「幸せを量産する会社」へ。",
      body:
        "創業から間もなく100年。豊田佐吉の織機、喜一郎のAA型、カローラ、プリウス、そしてWoven City——一貫しているのは「人の役に立つものを、現場の知恵で作り続ける」哲学だ。年間販売1,100万台、グループ売上45兆円、世界36万人を抱える巨人は今、CO2ゼロと移動の自由をどう両立させるか問われている。次の100年も、答えはきっと現場にある。",
      image: "photo-1606664515524-ed2f786a0bd6",
      imageAlt: "Future of mobility",
      highlight: "年間販売 1,100万台超",
    },
  ],
};
