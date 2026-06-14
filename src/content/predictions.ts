/**
 * 予測カード（= 学習カード）のデータ層。
 *
 * Polymarket の本質的な良いところ — 確率表記・対立サイド・時系列の動き・答え合わせ可能性 — を
 * 投資ドメインに持ち込みつつ、各カードを「学習ユニット」として機能させる。
 *
 * 1 予測 = 1 質問 = 1 ミニレッスン。
 * 各質問には「見るべきポイント」「考え方のフレーム」「過去パターン」「AI 推論」「用語」が紐づき、
 * 結果が出ると「教訓」が追加される。
 */
import type { Source } from "@/domain/types";

export type PredictionStatus = "live" | "upcoming" | "resolved";

export type PredictionEventType =
  | "earnings" // 個別企業の決算発表
  | "disclosure" // 適時開示
  | "macro" // 日銀・FOMC・CPI
  | "news"; // 取引時間中ニュース flow

/** 確率カードの 1 つの選択肢。Yes/No, あるいは 3 択 */
export type PredictionChoice = {
  key: string;
  label: string;
  /** 現在の確率（0-100, 合計 100 になるよう揃える） */
  probability: number;
  /** 1 週間前の確率（差分表示用、optional） */
  probabilityWeekAgo?: number;
};

/** 「見るべきポイント」— どこを見れば予測できるかの入口 */
export type Checkpoint = {
  label: string;
  /** なぜこれを見るべきか、1 行で */
  why: string;
  /** クリックで飛ぶ参照リンク（一次情報 or 用語集 or ブログ） */
  href?: string;
};

/** 「考え方のフレーム」— メンタルモデル */
export type Frame = {
  title: string;
  body: string;
};

/** 「過去のパターン」— 歴史で考える訓練 */
export type HistoryEntry = {
  period: string; // "2024/Q1" など
  outcome: string; // "上方修正" など
  note?: string;
};

/** AI の推論ステップ — 検証用 */
export type ReasoningStep = {
  signal: string; // 例: "為替が会社想定より 7 円円安"
  direction: "+" | "-" | "0";
  weight?: number;
};

/** 確率が動いた瞬間 — ニュース・開示の時系列 */
export type ProbabilityShift = {
  at: string; // 日時 ISO
  delta: number; // +6 / -8 など percentage point
  reason: string;
  choiceKey?: string; // どの選択肢の確率が動いたか
};

/** 結果が出た後の答え合わせ */
export type Resolution = {
  outcomeKey: string; // 正解の choice key
  outcomeLabel: string;
  resolvedAt: string;
  /** なぜそうなったか */
  why: string[];
  /** 想定外要因 */
  surprises: string[];
  /** 見落とされやすかったポイント */
  lessons: string[];
  /** 関連記事への動線 */
  relatedSlugs?: string[];
};

/**
 * 適時開示の生データ + AI 解読。
 * Polymarket の本物の短サイクル体験（5 分予測 → 30 分で決着）を実現するための要素。
 * eventType === "disclosure" の予測に紐づく。
 */
export type DisclosureDetail = {
  /** 開示が公開された時刻（TDnet 配信時刻） */
  releasedAt: string;
  /** 開示の種別タグ */
  disclosureType:
    | "自社株買い"
    | "業績修正"
    | "配当変更"
    | "M&A"
    | "業務提携"
    | "新製品"
    | "その他";
  /** 開示の正式タイトル */
  rawTitle: string;
  /** 本文の抜粋（最初の 200-400 文字） */
  rawSnippet: string;
  /** AI による即時解読 */
  aiInterpretation: {
    /** 強気・弱気・中立の判定 */
    bias: "bullish" | "bearish" | "neutral";
    /** 1-2 文の解読サマリー */
    summary: string;
    /** 抽出した主要ポイント（3-5 個） */
    keyPoints: string[];
    /** 株価への影響予想（定性 + 定量） */
    impactPrediction: string;
    /** AI 解読が完了した時刻 */
    interpretedAt: string;
  };
  /** 結果の実測（resolved 時のみ） */
  resultMeasure?: {
    /** 計測時刻（終値、または開示後 30 分等） */
    measuredAt: string;
    /** 株価変動率（%） */
    priceChange: number;
    /** メモ（例：「終値ベース」「開示後 30 分時点」） */
    note?: string;
  };
};

export type Prediction = {
  id: string;
  /** 紐づく銘柄コード（マクロイベントなど null もあり） */
  stockCode?: string;
  eventType: PredictionEventType;
  /** イベント名 */
  eventName: string;
  /** イベント発生予定時刻 ISO — Countdown のターゲット */
  eventAt: string;
  /** 予測コミット締切（通常 eventAt と同じか少し前） */
  deadlineAt: string;
  status: PredictionStatus;
  /** eventType === "disclosure" のときに紐づく適時開示データ */
  disclosureDetail?: DisclosureDetail;

  /** 質問本文 */
  question: string;
  /** 補足の 1 行（任意） */
  questionNote?: string;

  choices: PredictionChoice[];

  /** 見るべきポイント — 学びの入口 */
  checkpoints: Checkpoint[];
  /** 考え方のフレーム — メンタルモデル */
  frames: Frame[];
  /** 過去パターン */
  history: HistoryEntry[];
  /** AI の推論ステップ */
  aiReasoning: {
    steps: ReasoningStep[];
    /** AI の最終予測 choice key */
    pick: string;
    /** AI の確信度 (0-100) */
    confidence: number;
  };
  /** 関連用語（glossary key） */
  glossaryTerms?: string[];

  /** 確率が動いた瞬間（時系列） */
  shifts: ProbabilityShift[];

  /** 答え合わせ（resolved のときのみ） */
  resolution?: Resolution;

  /** 出典 */
  citations: Source[];
  generatedAt: string;
};

/* ─────────────────────────────────────────────
   サンプルデータ
   ─────────────────────────────────────────────
   試作として TEL (8035) の次回決算予測カードを 1 枚用意。
   日時は固定値（CLAUDE.md の today = 2026-06-03 を基準に、約 2 ヶ月後）。
*/

const TEL_EARNINGS_PREDICTION: Prediction = {
  id: "8035-2027-1q-guidance",
  stockCode: "8035",
  eventType: "earnings",
  eventName: "東京エレクトロン 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-08T16:00:00+09:00",
  deadlineAt: "2026-08-08T15:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、2027/3 期通期ガイダンスの上方修正があるか？",
  questionNote:
    "通期見通しを期初想定より上方に修正するか、据え置きか、下方修正か。発表は 16:00、即時に答え合わせ。",

  choices: [
    { key: "up", label: "上方修正", probability: 41, probabilityWeekAgo: 35 },
    { key: "flat", label: "据え置き", probability: 47, probabilityWeekAgo: 52 },
    { key: "down", label: "下方修正", probability: 12, probabilityWeekAgo: 13 },
  ],

  checkpoints: [
    {
      label: "直近 3 ヶ月の受注残（IR ページ → 月次受注）",
      why: "受注 → 売上 → 利益に 6-9 ヶ月のタイムラグ。受注残が積み上がっていれば 1Q 時点で増額余地",
      href: "https://www.tel.co.jp/ir/",
    },
    {
      label: "TSMC・サムスンの設備投資ガイダンス",
      why: "TEL の上位顧客 2 社で売上の 4 割超。両社の capex 上方修正 → 1-2 四半期遅れで TEL に波及",
    },
    {
      label: "ASML の直近受注（5/15 発表）",
      why: "EUV のリーディングインジケータ。ASML が好調なら成膜・エッチング装置にも需要連動",
    },
    {
      label: "会社想定為替レート（現在 145 円/ドル）",
      why: "現実が 152 円なら 1 円円安あたり営業利益 +60 億円程度の感応度。為替だけで上方修正余地",
    },
    {
      label: "中国向け売上比率（直近 32%、規制リスク）",
      why: "中国向け規制が強化されれば下方圧力。直近の規制対象品目を確認する",
    },
  ],

  frames: [
    {
      title: "「上方修正は 3 つの源泉のどれか」と分解する",
      body:
        "① 為替前提のズレ ② 受注の上振れ ③ コスト改善 — の 3 つに分けて考える。為替だけで自動的に上方修正が出る年もある。複数が同時に効くと大幅修正。",
    },
    {
      title: "「通期残り四半期数」で修正の出やすさが変わる",
      body:
        "1Q 段階では会社は保守的になりがちで、上方修正は出にくい。逆に下方修正は早期に出やすい（後でリスクが顕在化するより、早めに織り込ませた方が市場の信認を保てる）。3Q 以降の上方修正の方が普通。",
    },
    {
      title: "「市場コンセンサスとの差」が株価反応を決める",
      body:
        "上方修正が出ても、市場コンセンサスがすでにそれを織り込んでいれば株価は動かない。逆に据え置きでも、コンセンサスより会社見通しが高ければプラス反応。決算予測は「コンセンサスとのズレ」を予測することと等価。",
    },
  ],

  history: [
    { period: "2025/Q1", outcome: "据え置き", note: "コロナ後の慎重ガイダンス" },
    { period: "2025/Q2", outcome: "上方修正", note: "+8%、為替円安が主因" },
    { period: "2025/Q3", outcome: "据え置き", note: "中国規制の影響を様子見" },
    { period: "2025/Q4", outcome: "下方修正", note: "−5%、中国向け売上減" },
    { period: "2026/Q1", outcome: "据え置き" },
    { period: "2026/Q2", outcome: "上方修正", note: "+12%、HBM 関連受注急増" },
    { period: "2026/Q3", outcome: "据え置き" },
    { period: "2026/Q4", outcome: "上方修正", note: "+6%、為替 + 受注" },
  ],

  aiReasoning: {
    steps: [
      { signal: "為替が会社想定より 7 円円安（145 → 152）", direction: "+", weight: 8 },
      { signal: "直近の受注残が前年比 +18%", direction: "+", weight: 6 },
      { signal: "TSMC が 4 月に capex +10% 上方修正", direction: "+", weight: 7 },
      { signal: "ASML 受注 +14%（5/15 発表）", direction: "+", weight: 5 },
      { signal: "中国規制で中国向け売上 −12%", direction: "-", weight: 6 },
      { signal: "通期 1Q 段階は保守的ガイダンスを出す傾向", direction: "-", weight: 5 },
    ],
    pick: "flat",
    confidence: 47,
  },

  glossaryTerms: ["per", "通期ガイダンス", "受注残", "コンセンサス", "EUV", "HBM"],

  shifts: [
    {
      at: "2026-07-08T10:00:00+09:00",
      delta: -6,
      reason: "中国向け半導体規制の追加報道",
      choiceKey: "up",
    },
    {
      at: "2026-07-15T17:00:00+09:00",
      delta: 9,
      reason: "TSMC 月次売上 +12%",
      choiceKey: "up",
    },
    {
      at: "2026-07-22T08:30:00+09:00",
      delta: 3,
      reason: "為替が一段と円安進行（150 → 152）",
      choiceKey: "up",
    },
  ],

  citations: [
    { doc: "東京エレクトロン IR 月次受注", url: "https://www.tel.co.jp/ir/" },
    { doc: "ASML Q2 2026 Earnings Release", period: "2026-05" },
    { doc: "TSMC Monthly Sales Report", period: "2026-04" },
  ],
  generatedAt: "2026-08-01T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   答え合わせ済み（resolved）サンプル
   2026/5/8 に TEL の通期決算が出て、ガイダンス上方修正で決着した想定。
   「教訓」セクションを見せるためのデモ用データ。
*/
const TEL_RESOLVED_PREDICTION: Prediction = {
  id: "8035-2026-fy-guidance",
  stockCode: "8035",
  eventType: "earnings",
  eventName: "東京エレクトロン 2026/3 期 通期決算発表",
  eventAt: "2026-05-08T16:00:00+09:00",
  deadlineAt: "2026-05-08T15:55:00+09:00",
  status: "resolved",

  question: "通期決算で、来期（2027/3 期）ガイダンスは市場コンセンサスを上回るか？",
  questionNote:
    "発表当日 16:00 までに予測。市場コンセンサス（売上 2.4 兆円、営業利益 6,800 億円）を上回るかどうか。",

  choices: [
    { key: "above", label: "上回る", probability: 33, probabilityWeekAgo: 38 },
    { key: "inline", label: "ほぼ一致", probability: 55, probabilityWeekAgo: 50 },
    { key: "below", label: "下回る", probability: 12, probabilityWeekAgo: 12 },
  ],

  checkpoints: [
    {
      label: "ASML の Q1 業績 + 受注（4/16 発表）",
      why: "TEL の先行指標。ASML 受注が強ければ TEL ガイダンスも強気が出やすい",
    },
    {
      label: "TSMC の年間 capex ガイダンス（4/17 発表）",
      why: "TEL の最大顧客。capex 上方修正なら売上見通しもプラス",
    },
    {
      label: "会社の中期経営計画進捗（前回開示の 2027 売上 3 兆円目標）",
      why: "中計に対する 2027 期見通しの位置取りで、強気/弱気が決まる",
    },
    {
      label: "為替前提（社内想定 145 円 vs 現実 152 円）",
      why: "為替だけで売上 +5% 上振れの可能性",
    },
  ],

  frames: [
    {
      title: "通期ガイダンスはコンセンサスより 5-10% 控えめが基準",
      body:
        "経営者は期初に保守的見通しを出す傾向。コンセンサスと一致 = 強気、上回る = 非常に強気。",
    },
    {
      title: "「中計との整合」で会社の本音が読める",
      body:
        "2027 期目標が中計から逆算した数字に届くか。会社が中計を守りに行くなら 2027 期ガイダンスは中計との整合性で強気になる。",
    },
    {
      title: "決算翌日の株価は「驚き度」で決まる",
      body:
        "コンセンサス上回り = 株価 +3-5%、一致 = ほぼ無風、下回り = -5% 以上。決算予測 = ↑驚き度予測。",
    },
  ],

  history: [
    { period: "2024/Q4", outcome: "上回る", note: "+8%、HBM 関連需要" },
    { period: "2025/Q1", outcome: "ほぼ一致" },
    { period: "2025/Q2", outcome: "ほぼ一致" },
    { period: "2025/Q3", outcome: "下回る", note: "-3%、中国規制" },
    { period: "2025/Q4", outcome: "ほぼ一致" },
  ],

  aiReasoning: {
    steps: [
      { signal: "ASML Q1 受注 +18%（4/16 発表）", direction: "+", weight: 7 },
      { signal: "TSMC capex 据え置き（4/17 発表）", direction: "0", weight: 5 },
      { signal: "為替が会社想定より 7 円円安", direction: "+", weight: 6 },
      { signal: "中国規制で中国向け売上 −10%", direction: "-", weight: 6 },
      { signal: "会社は中計達成にコミット表明（IR 説明会）", direction: "+", weight: 5 },
      { signal: "1Q 段階の保守的ガイダンス傾向", direction: "-", weight: 4 },
    ],
    pick: "inline",
    confidence: 55,
  },

  glossaryTerms: ["コンセンサス", "通期ガイダンス", "中期経営計画", "EUV", "HBM"],

  shifts: [
    {
      at: "2026-04-16T22:00:00+09:00",
      delta: 5,
      reason: "ASML Q1 受注 +18% で「上回る」シナリオが強まる",
      choiceKey: "above",
    },
    {
      at: "2026-04-17T17:00:00+09:00",
      delta: -3,
      reason: "TSMC capex 据え置きで「ほぼ一致」優勢に",
      choiceKey: "above",
    },
    {
      at: "2026-05-07T15:00:00+09:00",
      delta: 2,
      reason: "発表前日の機関投資家ヒアリングで強気観測",
      choiceKey: "above",
    },
  ],

  resolution: {
    outcomeKey: "above",
    outcomeLabel: "上回った（売上 +4.2%、営業利益 +6.8% 上振れ）",
    resolvedAt: "2026-05-08T16:00:00+09:00",
    why: [
      "為替前提を 145 → 150 円に修正（現実は 152 円、それでも保守的）",
      "HBM 向け熱処理装置の受注が想定を上回る（前年比 +40%）",
      "中国規制の影響は規制対象外品目への需要シフトで限定的（売上 -5% 程度に収まる）",
    ],
    surprises: [
      "HBM 関連の伸びが ASML の受注増よりも TEL に効いた（先行指標として ASML より HBM 直接受注を見るべきだった）",
      "中国規制の影響を「中国向け全体」で見ていたが、実際は規制対象品目だけで -20%、対象外は -2%",
    ],
    lessons: [
      "受注残のうち「HBM 関連の比率」を分解して見るべきだった（IR の補足資料に記載あり）",
      "中国規制の影響は「規制対象品目別」で見ないと過大評価しがち",
      "為替前提が現実と乖離するとき、会社は意外と保守的なまま据え置く（株価サプライズの源泉）",
    ],
    relatedSlugs: ["primer-hi-na-euv"],
  },

  citations: [
    { doc: "東京エレクトロン 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "ASML Q1 2026 Earnings Release", period: "2026-04" },
  ],
  generatedAt: "2026-05-09T10:00:00+09:00",
};

/* ─────────────────────────────────────────────
   武田薬品（4502）— パテントクリフ関連の決算予測
*/
const TAKEDA_PREDICTION: Prediction = {
  id: "4502-2027-1q-guidance",
  stockCode: "4502",
  eventType: "earnings",
  eventName: "武田薬品 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-01T16:00:00+09:00",
  deadlineAt: "2026-08-01T15:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、通期コア EPS 見通しを据え置きできるか？",
  questionNote:
    "ENTYVIO のパテントクリフ懸念がある中で、期初ガイダンス（コア EPS 360 円）を据え置けるかどうか。",

  choices: [
    { key: "hold", label: "据え置き", probability: 58, probabilityWeekAgo: 62 },
    { key: "up", label: "上方修正", probability: 12, probabilityWeekAgo: 8 },
    { key: "down", label: "下方修正", probability: 30, probabilityWeekAgo: 30 },
  ],

  checkpoints: [
    {
      label: "ENTYVIO の Q1 売上（前年同期比）",
      why: "パテントクリフ前の駆け込み需要 vs 後発品参入による浸食。前年比 -5% を超えると黄信号",
    },
    {
      label: "新製品（フルザクラ、TAK-755）の処方数",
      why: "ENTYVIO 減収を補う柱。処方数が想定通り立ち上がっているかで通期見通しの維持可否が決まる",
    },
    {
      label: "為替前提（社内 140 円/ドル）",
      why: "海外売上比率 80% 超の武田は円安 = プラス。現実 152 円なら +12 円の上振れ余地",
    },
    {
      label: "新興国の医療制度変更（中国 VBP 等）",
      why: "新興国売上 20% 弱、薬価切り下げ圧力が継続",
    },
  ],

  frames: [
    {
      title: "パテントクリフは「崖」ではなく「斜面」",
      body:
        "特許切れ → 後発品参入後も即座に売上ゼロにはならない。Year 1 で -30%、Year 2 で -50% などの段階的浸食が一般的。武田 ENTYVIO は皮下注剤への切り替えで延命戦略。",
    },
    {
      title: "「コア EPS」と「報告 EPS」を混同しない",
      body:
        "コア EPS = 一過性損益（減損、買収費用）を除いたベース。武田は M&A 多用のため報告ベースは振れやすい。ガイダンスは常にコアベースで確認。",
    },
    {
      title: "経営陣のトーン変化を IR Day で読む",
      body:
        "1Q 決算時点で経営陣が「想定範囲内」「順調」を強調するか、「下半期に集中」と言い出すかで見通しの強気/弱気が分かる。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "据え置き" },
    { period: "2024/Q2", outcome: "据え置き" },
    { period: "2024/Q3", outcome: "下方修正", note: "-7%、中国 VBP 影響" },
    { period: "2024/Q4", outcome: "据え置き" },
    { period: "2025/Q1", outcome: "据え置き" },
    { period: "2025/Q2", outcome: "下方修正", note: "-5%、ENTYVIO 浸食" },
    { period: "2025/Q3", outcome: "据え置き" },
    { period: "2025/Q4", outcome: "下方修正", note: "-3%、新薬立ち上がり遅延" },
  ],

  aiReasoning: {
    steps: [
      { signal: "為替が会社想定 140 円 → 現実 152 円（+12 円）", direction: "+", weight: 8 },
      { signal: "ENTYVIO 直近 6 ヶ月の浸食ペース −8%（想定 -5% より悪化）", direction: "-", weight: 7 },
      { signal: "フルザクラ立ち上がり順調（処方数 +25%）", direction: "+", weight: 5 },
      { signal: "中国 VBP 第 5 弾で対象品目拡大", direction: "-", weight: 6 },
      { signal: "1Q 時点で慎重な据え置きを出す経営トーンの傾向", direction: "0", weight: 5 },
    ],
    pick: "hold",
    confidence: 58,
  },

  glossaryTerms: ["パテントクリフ", "通期ガイダンス", "コアEPS", "VBP", "ADC"],

  shifts: [
    {
      at: "2026-07-10T10:00:00+09:00",
      delta: -4,
      reason: "ENTYVIO の米国シェア -3pp の業界レポート",
      choiceKey: "hold",
    },
    {
      at: "2026-07-20T08:30:00+09:00",
      delta: -3,
      reason: "為替が一段と円安進行で「上方修正」期待がじわり",
      choiceKey: "hold",
    },
  ],

  citations: [
    { doc: "武田薬品 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "Veeva Compass 業界処方データ", period: "2026-06" },
  ],
  generatedAt: "2026-07-25T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   Sansan（4443）— SaaS の KPI 予測（ARR 成長）
*/
const SANSAN_PREDICTION: Prediction = {
  id: "4443-2027-1q-arr",
  stockCode: "4443",
  eventType: "earnings",
  eventName: "Sansan 2027/5 期 1Q 決算発表",
  eventAt: "2026-07-15T16:00:00+09:00",
  deadlineAt: "2026-07-15T15:55:00+09:00",
  status: "upcoming",

  question: "1Q の ARR が前年同期比 25% 成長を維持するか？",
  questionNote:
    "直近 3 四半期で 28% → 26% → 25% と鈍化基調。25% を維持できるか、20% 台前半に減速するか。",

  choices: [
    { key: "yes", label: "25% 以上を維持", probability: 42, probabilityWeekAgo: 48 },
    { key: "no", label: "25% を下回る", probability: 58, probabilityWeekAgo: 52 },
  ],

  checkpoints: [
    {
      label: "月次新規契約数（IR ページ → 月次 KPI）",
      why: "ARR 先行指標。直近 3 ヶ月の新規契約が四半期 +20% 超なら ARR 維持の可能性",
    },
    {
      label: "NRR（Net Revenue Retention）",
      why: "既存顧客からの追加売上 + 解約。120% 超なら ARR 成長の半分を既存で支えられる",
    },
    {
      label: "Bill One（請求書 SaaS）のユーザー数推移",
      why: "新規成長領域。Bill One の伸びが Sansan 本体の鈍化を相殺できるか",
    },
    {
      label: "従業員数 vs 営業生産性",
      why: "営業マーケ投資の効率。従業員あたり ARR が伸びていれば成長余地",
    },
  ],

  frames: [
    {
      title: "SaaS の成長は「3 つの段階」で減速する",
      body:
        "ローンチ期（50%+）→ 拡大期（30-50%）→ 成熟期（10-30%）。鈍化は必然で、問題は「いつ何 % に着地するか」。25% は拡大期の終盤・成熟期の入り口。",
    },
    {
      title: "ARR 成長 = 新規 + 既存拡張 - 解約",
      body:
        "新規が鈍ったら NRR（既存）でカバーできるか。NRR 120% なら既存だけで 20% 成長。新規がゼロでも維持可能になる。",
    },
    {
      title: "Rule of 40 で「成長 vs 利益」のバランスを見る",
      body:
        "売上成長率 + 営業利益率 ≥ 40% が SaaS の健康指標。25% 成長 + 15% 営業利益率 = 40 → OK。逆に 30% 成長 + 5% 利益 = 35 → 黄信号。",
    },
  ],

  history: [
    { period: "2026/Q2", outcome: "達成", note: "28%（前年 30%）" },
    { period: "2026/Q3", outcome: "達成", note: "26%" },
    { period: "2026/Q4", outcome: "達成", note: "25%、ぎりぎり" },
  ],

  aiReasoning: {
    steps: [
      { signal: "直近 3 ヶ月の新規契約 +18%（鈍化）", direction: "-", weight: 6 },
      { signal: "NRR 117%（直近 115% から微増）", direction: "+", weight: 5 },
      { signal: "Bill One 売上 +60%（高成長維持）", direction: "+", weight: 6 },
      { signal: "営業生産性（従業員あたり ARR）+3%", direction: "0", weight: 3 },
      { signal: "SaaS 業界全体の成長鈍化マクロ", direction: "-", weight: 5 },
    ],
    pick: "no",
    confidence: 58,
  },

  glossaryTerms: ["arr", "nrr", "rule-of-40", "churn", "saas"],

  shifts: [
    {
      at: "2026-07-05T10:00:00+09:00",
      delta: -6,
      reason: "競合 freee の 1Q 速報で SaaS 業界の鈍化観測",
      choiceKey: "yes",
    },
  ],

  citations: [
    { doc: "Sansan 月次 KPI 開示", period: "2026-06" },
    { doc: "Sansan 2026/5 期 通期決算説明会資料", period: "2026-07" },
  ],
  generatedAt: "2026-07-10T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   日銀政策決定会合 — マクロイベント（stockCode なし）
*/
const BOJ_PREDICTION: Prediction = {
  id: "boj-2026-07",
  stockCode: undefined,
  eventType: "macro",
  eventName: "日銀政策決定会合（2026 年 7 月会合）",
  eventAt: "2026-07-31T13:00:00+09:00",
  deadlineAt: "2026-07-31T12:55:00+09:00",
  status: "upcoming",

  question: "今会合で、追加利上げを示唆する声明があるか？",
  questionNote:
    "「次回会合での利上げを検討」「タカ派的修正」など、9 月会合での利上げ示唆につながる声明・記者会見の発言があるか。",

  choices: [
    { key: "yes", label: "示唆あり", probability: 38, probabilityWeekAgo: 32 },
    { key: "no", label: "示唆なし", probability: 62, probabilityWeekAgo: 68 },
  ],

  checkpoints: [
    {
      label: "直近 CPI（コアコア）の推移",
      why: "2% 超持続が利上げの主因。直近 3 ヶ月平均 2.4% は利上げ正当化材料",
    },
    {
      label: "為替（USD/JPY）水準",
      why: "150 円超の円安持続が政治的に利上げ圧力。152 円なら示唆確率上昇",
    },
    {
      label: "賃金動向（春闘結果 + 厚労省毎月勤労統計）",
      why: "持続的賃金上昇は利上げの根拠。+3% 維持なら強気",
    },
    {
      label: "FRB の利下げペース",
      why: "FRB が利下げ加速すると日米金利差縮小 → 円高 → 日銀利上げの必要性低下",
    },
  ],

  frames: [
    {
      title: "日銀の利上げサインは「3 段階」で出る",
      body:
        "① 議事要旨でタカ派少数意見 → ② 主要メンバーの講演で言及 → ③ 会合声明で明示。3 段階目が「示唆あり」",
    },
    {
      title: "利上げで影響を受ける銘柄は「金利感応度」で 3 群に分かれる",
      body:
        "プラス：銀行（金利上昇で収益改善）/ 保険。マイナス：不動産 REIT / 高 PER グロース株。中立：消費財・素材。",
    },
    {
      title: "予想と発表のギャップが株価反応の源泉",
      body:
        "市場が示唆ありを 50% 織り込んでいる時、実際に示唆あり = 中立反応。示唆なし = 円安加速 + 株高。事前確率を見極めることが重要。",
    },
  ],

  history: [
    { period: "2025-12", outcome: "示唆なし", note: "据え置き、ハト寄り" },
    { period: "2026-01", outcome: "示唆あり", note: "1 月利上げ実行" },
    { period: "2026-03", outcome: "示唆なし", note: "様子見継続" },
    { period: "2026-04", outcome: "示唆あり", note: "次回利上げ言及" },
    { period: "2026-06", outcome: "示唆なし", note: "為替様子見" },
  ],

  aiReasoning: {
    steps: [
      { signal: "コアコア CPI 3 ヶ月平均 2.4%", direction: "+", weight: 7 },
      { signal: "USD/JPY 152 円台の円安持続", direction: "+", weight: 6 },
      { signal: "春闘賃上げ +3.4%（前年 +3.2%）", direction: "+", weight: 5 },
      { signal: "FRB が 9 月利下げを示唆", direction: "-", weight: 6 },
      { signal: "総裁会見の前回トーンは慎重", direction: "-", weight: 5 },
    ],
    pick: "no",
    confidence: 62,
  },

  glossaryTerms: ["コアCPI", "金利感応度", "REIT"],

  shifts: [
    {
      at: "2026-07-19T08:30:00+09:00",
      delta: 4,
      reason: "コアコア CPI が想定上回る（2.6%）",
      choiceKey: "yes",
    },
    {
      at: "2026-07-22T16:00:00+09:00",
      delta: 2,
      reason: "総裁講演でタカ派的トーン",
      choiceKey: "yes",
    },
  ],

  citations: [
    { doc: "日本銀行 政策決定会合 議事要旨", period: "2026-06" },
    { doc: "総務省 消費者物価指数", period: "2026-06" },
  ],
  generatedAt: "2026-07-23T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   レーザーテック（6920）— Hi-NA EUV の受注関連
*/
const LASERTEC_PREDICTION: Prediction = {
  id: "6920-2026-4q-orders",
  stockCode: "6920",
  eventType: "earnings",
  eventName: "レーザーテック 2026/6 期 通期決算発表",
  eventAt: "2026-08-12T16:00:00+09:00",
  deadlineAt: "2026-08-12T15:55:00+09:00",
  status: "upcoming",

  question: "通期決算で、Hi-NA EUV 検査装置の受注が公表されるか？",
  questionNote:
    "次世代 Hi-NA EUV 向けの「ACTIS A300」（または同等品）の正式受注が決算資料で開示されるか。",

  choices: [
    { key: "yes", label: "開示あり", probability: 31, probabilityWeekAgo: 28 },
    { key: "no", label: "開示なし", probability: 69, probabilityWeekAgo: 72 },
  ],

  checkpoints: [
    {
      label: "ASML の Hi-NA EUV 装置（EXE:5000）出荷スケジュール",
      why: "Hi-NA 装置が顧客に届く前後でレーザーテック装置の発注が入る。ASML 出荷タイミングが先行指標",
    },
    {
      label: "TSMC の A14 ノード量産時期発表",
      why: "Hi-NA は A14 で本格採用予定。TSMC の量産時期が前倒し = レーザーテック受注前倒し",
    },
    {
      label: "競合 KLA の決算ガイダンス（同時期に発表）",
      why: "KLA が EUV 検査装置で攻勢 → レーザーテック独占崩れる可能性",
    },
    {
      label: "中国向け売上規制動向",
      why: "Hi-NA は安全保障輸出規制対象。中国向け売上比率の変化を確認",
    },
  ],

  frames: [
    {
      title: "Hi-NA EUV 検査装置はレーザーテックの「次の成長ドライバー」",
      body:
        "現在の主力 EUV マスク検査装置の市場が成熟する 2027 年以降、Hi-NA 装置が成長の柱に。受注時期 = 成長角度の傾き",
    },
    {
      title: "受注開示には「契約開示の閾値」がある",
      body:
        "東証ルールで連結売上高の 10% 超の受注は適時開示義務。Hi-NA 装置は 1 台 100 億円超なら閾値超え。閾値を超えるかが開示有無を決める",
    },
    {
      title: "競合がいない領域でも「タイミング」は市場期待依存",
      body:
        "レーザーテックは EUV マスク検査でほぼ独占だが、開示が市場期待より遅れるとサプライズは「悪い方」。期待値の管理が重要",
    },
  ],

  history: [
    { period: "2025/Q4", outcome: "開示あり", note: "EUV マスク検査 +30 台受注" },
    { period: "2025/通期", outcome: "開示なし", note: "Hi-NA は研究開発段階" },
    { period: "2026/Q1", outcome: "開示あり", note: "EUV 検査の追加受注" },
    { period: "2026/Q2", outcome: "開示なし" },
    { period: "2026/Q3", outcome: "開示なし" },
    { period: "2026/Q4", outcome: "?（今回）" },
  ],

  aiReasoning: {
    steps: [
      { signal: "ASML EXE:5000 の TSMC 向け出荷を 2026 後半に確認", direction: "+", weight: 6 },
      { signal: "TSMC A14 量産時期は 2027 後半（半年遅延報道）", direction: "-", weight: 5 },
      { signal: "サムスンが Hi-NA 採用を 2028 後半に延期", direction: "-", weight: 6 },
      { signal: "中国向け規制強化で受注地域が限定", direction: "-", weight: 4 },
      { signal: "会社 IR で「Hi-NA 検査の引き合いあり」とのコメント（5 月）", direction: "+", weight: 5 },
    ],
    pick: "no",
    confidence: 69,
  },

  glossaryTerms: ["EUV", "Hi-NA", "適時開示", "ASML", "TSMC"],

  shifts: [
    {
      at: "2026-07-25T20:00:00+09:00",
      delta: 3,
      reason: "ASML 決算で Hi-NA 出荷台数の上方修正",
      choiceKey: "yes",
    },
  ],

  citations: [
    { doc: "レーザーテック 2026/6 期 3Q 決算説明会資料", period: "2026-05" },
    { doc: "ASML Q2 2026 Earnings", period: "2026-07" },
  ],
  generatedAt: "2026-07-28T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   適時開示ライブ予測 #1（resolved サンプル）
   2026/5/15 14:32 にアドバンテストが自社株買いを開示。
   開示後 5 分で予測締切、15:00 終値で答え合わせ。
   Polymarket の超短期サイクルを投資ドメインで再現する例。
*/
const ADVANTEST_RESOLVED_DISCLOSURE: Prediction = {
  id: "6857-2026-05-buyback",
  stockCode: "6857",
  eventType: "disclosure",
  eventName: "アドバンテスト 自社株買い開示・終値反応",
  eventAt: "2026-05-15T15:00:00+09:00",
  deadlineAt: "2026-05-15T14:37:00+09:00",
  status: "resolved",

  question: "この自社株買い開示で、本日終値時点で株価は +2% 以上動くか？",
  questionNote:
    "14:32:18 に開示。締切 14:37（開示後 5 分）、15:00 終値で答え合わせ。",

  choices: [
    { key: "yes", label: "+2% 以上動く", probability: 42 },
    { key: "no", label: "動かない", probability: 58 },
  ],

  disclosureDetail: {
    releasedAt: "2026-05-15T14:32:18+09:00",
    disclosureType: "自社株買い",
    rawTitle: "自己株式の取得に関するお知らせ",
    rawSnippet:
      "当社は、本日開催の取締役会において、会社法第 156 条第 1 項及び当社定款の規定に基づき、自己株式取得に関する事項を以下のとおり決議いたしましたので、お知らせいたします。\n\n" +
      "1. 自己株式の取得を行う理由\n" +
      "  ステークホルダーへの還元強化及び資本効率の向上を図るため\n\n" +
      "2. 取得に係る事項の内容\n" +
      "  ・取得対象株式の種類： 当社普通株式\n" +
      "  ・取得する株式の総数： 1,000,000 株（上限）\n" +
      "  ・株式の取得価額の総額： 100 億円（上限）\n" +
      "  ・取得期間： 2026 年 5 月 19 日〜2026 年 9 月 30 日",
    aiInterpretation: {
      bias: "neutral",
      summary:
        "規模 100 億円は時価総額の約 1.5%、市場期待の範囲内。3 回目で新規性も薄い。",
      keyPoints: [
        "取得規模 100 億円 ≒ 時価総額の 1.5% で標準的",
        "取得期間 4.5 ヶ月で買い圧は分散",
        "過去 2 年で 3 回目、新規性は低い",
        "EPS 改善効果は +1.5% 程度",
        "発表前 1 週間で株価既に +5%、織り込み進行",
      ],
      impactPrediction:
        "サプライズなし。+1〜+1.5% 程度の反応が妥当。+2% は超えにくい。",
      interpretedAt: "2026-05-15T14:33:22+09:00",
    },
    resultMeasure: {
      measuredAt: "2026-05-15T15:00:00+09:00",
      priceChange: 0.8,
      note: "終値ベース、前日比",
    },
  },

  checkpoints: [
    {
      label: "発表前 1 週間の株価推移",
      why: "織り込み済みかどうかの判定。直近上昇していれば反応は鈍る",
    },
    {
      label: "取得規模 ÷ 時価総額の比率",
      why: "1% 未満 = 反応薄、1-3% = 中程度、3% 超 = 大きな反応",
    },
    {
      label: "過去 1 年の同社による自社株買い実績",
      why: "頻度高いほど新規性が薄く、反応は鈍る",
    },
    {
      label: "取得期間の長さ",
      why: "短期間（数週間）なら買い圧集中、長期間（半年以上）なら買い圧分散",
    },
  ],
  frames: [
    {
      title: "自社株買いインパクトは『規模 × 新規性 × 織り込み』で決まる",
      body:
        "規模が時価総額の 3% 超で過去にやっていない会社が突然発表した時のみ +5% 超の反応。それ以外は +1〜2% 程度に収まることが多い。",
    },
    {
      title: "「閾値」を超えるかどうかで質問を設計すると面白い",
      body:
        "「動くか」ではなく「+2% 以上動くか」と閾値を切ると、AI の精緻な数値予想（+1.5%）と質問閾値（+2%）の境界に勝負が乗る。",
    },
  ],
  history: [
    { period: "2024-05", outcome: "+1.2%", note: "前回自社株買い 80 億円" },
    { period: "2025-04", outcome: "+0.5%", note: "前々回 120 億円" },
    { period: "2025-11", outcome: "+0.3%", note: "増配と同時発表" },
  ],
  aiReasoning: {
    steps: [
      { signal: "規模が時価総額の 1.5%（標準範囲）", direction: "0", weight: 6 },
      { signal: "過去 2 年で 3 回目（新規性低）", direction: "-", weight: 5 },
      { signal: "取得期間 4.5 ヶ月（買い圧分散）", direction: "-", weight: 4 },
      { signal: "発表前 1 週間で +5%（織り込み済み）", direction: "-", weight: 6 },
      { signal: "EPS 改善効果は +1.5% 程度", direction: "+", weight: 3 },
    ],
    pick: "no",
    confidence: 58,
  },
  glossaryTerms: ["自社株買い", "EPS", "適時開示", "時価総額"],
  shifts: [
    {
      at: "2026-05-15T14:34:00+09:00",
      delta: 4,
      reason: "出来高急増、ヘッジファンドの初動買い観測",
      choiceKey: "yes",
    },
    {
      at: "2026-05-15T14:36:00+09:00",
      delta: -6,
      reason: "+1.3% 超えたあたりで売り（織り込み売り）",
      choiceKey: "yes",
    },
  ],
  resolution: {
    outcomeKey: "no",
    outcomeLabel: "+0.8% で着地（動かない）",
    resolvedAt: "2026-05-15T15:00:00+09:00",
    why: [
      "規模 100 億円は時価総額の 1.5% で、市場が想定する範囲内",
      "アドバンテストは過去 2 年で 3 回目の自社株買い、新規性が薄れていた",
      "発表前 1 週間で株価が +5% 上昇しており、織り込みが進んでいた",
    ],
    surprises: [
      "出来高は普段の 1.3 倍に増加。反応自体はあったが株価には織り込み済み",
    ],
    lessons: [
      "自社株買いの株価インパクトは『規模 ÷ 時価総額』と『直近頻度』で大きく変わる",
      "発表前 1 週間の株価動向で『織り込み度』を判定するクセをつける",
      "AI の精緻な数値予想（+1.5%）と質問閾値（+2%）の差で勝負が決まることもある",
    ],
  },
  citations: [
    { doc: "アドバンテスト 適時開示", period: "2026-05-15", url: "https://www.advantest.com/ir" },
  ],
  generatedAt: "2026-05-15T14:33:22+09:00",
};

/* ─────────────────────────────────────────────
   適時開示ライブ予測 #2（live サンプル）
   今日（2026/6/3）13:45 に第一三共が業績修正開示。
   AI が 13:46 に即時解読。締切 13:50（開示後 5 分）、14:15（開示後 30 分）で答え合わせ。
   このカードは TODAY_ISO（13:45 に設定）から見て「直前」なので live になる。
*/
const DAIICHI_LIVE_DISCLOSURE: Prediction = {
  id: "4568-2026-06-revision",
  stockCode: "4568",
  eventType: "disclosure",
  eventName: "第一三共 業績修正開示・30 分後反応",
  eventAt: "2026-06-03T14:15:00+09:00",
  deadlineAt: "2026-06-03T13:50:00+09:00",
  status: "upcoming",

  question: "この業績上方修正で、開示後 30 分（14:15）の時点で +1.5% 以上動くか？",
  questionNote:
    "13:45:08 に開示、AI が 13:46 に解読完了。締切 13:50（開示後 5 分）、14:15 で答え合わせ。",

  choices: [
    { key: "yes", label: "+1.5% 以上動く", probability: 64, probabilityWeekAgo: 64 },
    { key: "no", label: "動かない", probability: 36, probabilityWeekAgo: 36 },
  ],

  disclosureDetail: {
    releasedAt: "2026-06-03T13:45:08+09:00",
    disclosureType: "業績修正",
    rawTitle: "業績予想の修正に関するお知らせ",
    rawSnippet:
      "当社は、本日開催の取締役会において、2026 年 3 月期の連結業績予想を以下のとおり修正することを決議いたしましたので、お知らせいたします。\n\n" +
      "1. 連結業績予想の修正（2025 年 4 月 1 日〜2026 年 3 月 31 日）\n\n" +
      "  売上収益： 前回予想 1,750,000 百万円 → 修正後 1,810,000 百万円（+3.4%）\n" +
      "  コア営業利益： 前回予想 285,000 百万円 → 修正後 320,000 百万円（+12.3%）\n" +
      "  当期利益： 前回予想 220,000 百万円 → 修正後 245,000 百万円（+11.4%）\n\n" +
      "2. 修正の理由\n" +
      "  ENHERTU の米国・欧州市場における処方拡大が想定を上回り、ロイヤリティ収入及び自社販売の売上が増加したことが主因です。",
    aiInterpretation: {
      bias: "bullish",
      summary:
        "ENHERTU 主導の上方修正。売上 +3.4%、コア営業利益 +12.3% は明確な強気サプライズ。",
      keyPoints: [
        "売上 +3.4%、コア営業利益 +12.3% の上方修正",
        "ENHERTU の米欧での処方拡大が主因（ADC 領域の成長加速の証左）",
        "コア営業利益率の改善は固定費レバレッジが効いている兆候",
        "中期計画進捗にとってポジティブ、来期ガイダンスも強気の可能性",
        "市場コンセンサスは売上 +1.5% 程度を見込んでいた → サプライズ +1.9pp",
      ],
      impactPrediction:
        "市場コンセンサスより +5% 程度上の上方修正。30 分以内の反応は +2-4% が妥当。" +
        "ただし、発表前の株価が直近上昇基調なら織り込み済みで +1% 程度の可能性も。",
      interpretedAt: "2026-06-03T13:46:14+09:00",
    },
  },

  checkpoints: [
    {
      label: "コンセンサス vs 修正後数値の差分",
      why: "市場期待を超えた分が株価サプライズの源泉。+1pp 超なら強い反応",
    },
    {
      label: "修正理由が一過性か構造的か",
      why: "為替や一過性要因は短期反応で終わるが、構造的（ENHERTU 拡大など）は長期に効く",
    },
    {
      label: "発表前 3 営業日の株価動向",
      why: "発表前に上昇していれば織り込み済み、横ばいならサプライズ余地大",
    },
    {
      label: "決算ガイダンスとの整合性",
      why: "中計の目標達成ペースとどう整合するか。中計超え = 来期も強気",
    },
  ],
  frames: [
    {
      title: "「コンセンサスとの差」が短期反応の本質",
      body:
        "上方修正 = 株価上昇、ではない。市場が既に同水準を織り込んでいれば反応なし。市場予想と修正値の差分が反応の源泉。",
    },
    {
      title: "「一過性」vs「構造的」を見極める",
      body:
        "為替や一過性売上は短期反応のみ。製品成長（ENHERTU など）由来は短期だけでなく長期にも効く。",
    },
    {
      title: "30 分以内の反応は「ヘッドライン読み」が支配",
      body:
        "詳細な分析が出る前のヘッドラインだけで動く。「上方修正 +12%」のような数字インパクトが大きいほど 30 分以内の反応も大きい。",
    },
  ],
  history: [
    { period: "2025-08", outcome: "+2.8%", note: "前回上方修正 +8%（一過性）" },
    { period: "2025-11", outcome: "+4.5%", note: "ENHERTU 関連の好決算" },
    { period: "2026-02", outcome: "+0.5%", note: "下方修正、織り込み済み" },
  ],
  aiReasoning: {
    steps: [
      { signal: "コア営業利益 +12.3% の修正は強い数字インパクト", direction: "+", weight: 8 },
      { signal: "ENHERTU 主導 = 構造的、長期に効く", direction: "+", weight: 7 },
      { signal: "コンセンサスから +1.9pp のサプライズ", direction: "+", weight: 6 },
      { signal: "発表前 3 営業日の株価 +2.1%（織り込み一部進行）", direction: "-", weight: 5 },
      { signal: "ヘッドラインの数字インパクト大 = ヘッドライン読み有利", direction: "+", weight: 5 },
    ],
    pick: "yes",
    confidence: 64,
  },
  glossaryTerms: ["業績修正", "コンセンサス", "ADC", "ENHERTU", "適時開示"],
  shifts: [
    {
      at: "2026-06-03T13:46:30+09:00",
      delta: 8,
      reason: "AI 解読が「強気サプライズ」と判定",
      choiceKey: "yes",
    },
    {
      at: "2026-06-03T13:47:00+09:00",
      delta: 4,
      reason: "ヘッドラインで +12% の数字が拡散",
      choiceKey: "yes",
    },
    {
      at: "2026-06-03T13:48:00+09:00",
      delta: -3,
      reason: "「発表前に既に上昇」との指摘が SNS で広まる",
      choiceKey: "yes",
    },
  ],
  citations: [
    { doc: "第一三共 適時開示", period: "2026-06-03" },
  ],
  generatedAt: "2026-06-03T13:46:14+09:00",
};

/* ─────────────────────────────────────────────
   トヨタ自動車（7203）— 通期決算予測
   為替円安局面で上方修正があるかを問う。USD/JPY 感応度の代表例。
*/
const TOYOTA_PREDICTION: Prediction = {
  id: "7203-2027-1q-guidance",
  stockCode: "7203",
  eventType: "earnings",
  eventName: "トヨタ自動車 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-06T15:30:00+09:00",
  deadlineAt: "2026-08-06T15:25:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、通期営業利益見通しを上方修正するか？",
  questionNote:
    "会社想定為替 145 円/ドル vs 現実 152 円。為替円安だけで +3,000 億円超の上振れ余地。",

  choices: [
    { key: "up", label: "上方修正", probability: 52, probabilityWeekAgo: 45 },
    { key: "flat", label: "据え置き", probability: 42, probabilityWeekAgo: 48 },
    { key: "down", label: "下方修正", probability: 6, probabilityWeekAgo: 7 },
  ],

  checkpoints: [
    {
      label: "会社想定為替 vs 現実（145 円 → 152 円）",
      why: "為替前提を保守的のままなら、為替だけで +3,000 億円超の上振れ余地。通期での織り込み度を確認",
    },
    {
      label: "中国販売台数 月次（4-6 月）",
      why: "BYD 等の現地メーカーシェア拡大で中国販売台数は前年比 -8% 進行中。下方圧力",
    },
    {
      label: "北米販売単価とインセンティブ水準",
      why: "北米は台数より単価で稼ぐ構造。インセンティブ（販売奨励金）の上昇は利益圧迫サイン",
    },
    {
      label: "Lexus シェアと『高価格帯シフト』の進捗",
      why: "中国・北米で台数より利益を取る戦略の検証。Lexus 売上比率が上昇なら戦略成功",
    },
    {
      label: "Arene（次世代車載 OS）搭載車種数",
      why: "ソフトウェアファースト戦略の実装スピード。市場期待を IR Day での言及で確認",
    },
  ],

  frames: [
    {
      title: "トヨタの 1Q ガイダンス修正は『為替』だけで自動的に出やすい",
      body:
        "USD/JPY ベータ 1.42 で、1 円円安あたり通期営業利益 +450 億円程度の感応度。会社想定 145 円が現実より 7 円乖離なら、為替だけで +3,150 億円の上振れ余地。1Q 段階で会社が為替前提を引き上げれば即座に上方修正。",
    },
    {
      title: "『地域別ミックス』を確認すると上方修正の質が分かる",
      body:
        "為替による上方修正は質が低い（市場が織り込み済み）。北米単価上昇・Lexus シェア拡大による上方修正は質が高い（持続的）。IR 説明会で『どの要因による上方修正か』の説明が重要。",
    },
    {
      title: "中国・北米のバランスが『短期 vs 長期』のシナリオを分ける",
      body:
        "短期：為替＋北米堅調で上方修正可能性高。長期：中国シェア低下・EV 戦略の遅れが収益力に影を落とす可能性。1Q ガイダンスがどちらのストーリーで説明されるかで、株価反応の質が変わる。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "上方修正", note: "+12%、為替円安" },
    { period: "2024/Q2", outcome: "据え置き" },
    { period: "2024/Q3", outcome: "上方修正", note: "+5%、北米単価" },
    { period: "2024/Q4", outcome: "据え置き" },
    { period: "2025/Q1", outcome: "上方修正", note: "+8%、為替＋北米" },
    { period: "2025/Q2", outcome: "据え置き" },
    { period: "2025/Q3", outcome: "据え置き" },
    { period: "2025/Q4", outcome: "上方修正", note: "+4%、円安継続" },
  ],

  aiReasoning: {
    steps: [
      { signal: "為替が会社想定 145 円 → 現実 152 円（+7 円円安）", direction: "+", weight: 9 },
      { signal: "北米販売 +3%、単価上昇継続", direction: "+", weight: 7 },
      { signal: "中国販売 -8%、現地メーカー台頭", direction: "-", weight: 6 },
      { signal: "Lexus シェア +1pp 拡大", direction: "+", weight: 5 },
      { signal: "1Q 段階の保守的ガイダンス傾向", direction: "-", weight: 4 },
      { signal: "原油価格高止まり（コスト圧）", direction: "-", weight: 3 },
    ],
    pick: "up",
    confidence: 52,
  },

  glossaryTerms: ["USD/JPY", "通期ガイダンス", "Lexus", "Arene", "HEV"],

  shifts: [
    {
      at: "2026-07-15T08:30:00+09:00",
      delta: 6,
      reason: "USD/JPY が一段と円安進行（150 → 152）",
      choiceKey: "up",
    },
    {
      at: "2026-07-20T17:00:00+09:00",
      delta: -3,
      reason: "中国乗用車協会発表で中国販売 -10%",
      choiceKey: "up",
    },
    {
      at: "2026-07-28T10:00:00+09:00",
      delta: 4,
      reason: "北米 7 月販売 +5%、Lexus +12%",
      choiceKey: "up",
    },
  ],

  citations: [
    { doc: "トヨタ自動車 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "中国乗用車協会（CPCA）月次データ", period: "2026-06" },
  ],
  generatedAt: "2026-07-30T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   三菱商事（8058）— 1Q 決算予測
   バフェット保有上限接近 + 資源価格・コンセンサスとの差で予測する。
*/
const MITSUBISHI_C_PREDICTION: Prediction = {
  id: "8058-2027-1q-guidance",
  stockCode: "8058",
  eventType: "earnings",
  eventName: "三菱商事 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-04T15:30:00+09:00",
  deadlineAt: "2026-08-04T15:25:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、通期純利益見通しを上方修正するか？",
  questionNote:
    "前期実績 1.12 兆円 → 今期見通し 1.05 兆円（保守的）。LNG・銅価格と中国経済次第で上方余地あるが、保守ガイダンスが障壁。",

  choices: [
    { key: "up", label: "上方修正", probability: 33, probabilityWeekAgo: 28 },
    { key: "flat", label: "据え置き", probability: 56, probabilityWeekAgo: 60 },
    { key: "down", label: "下方修正", probability: 11, probabilityWeekAgo: 12 },
  ],

  checkpoints: [
    {
      label: "LNG 価格動向（JKM スポット、現在 12 ドル/MMBtu）",
      why: "三菱商事の純利益の 20-25% は LNG。1 ドル変動で純利益 ±150 億円規模の感応度",
    },
    {
      label: "銅価格（LME 銅、現在 9,500 ドル/トン）",
      why: "Quellaveco（ペルー）・Escondida（チリ）の銅権益で大きな収益柱。中国景気の先行指標",
    },
    {
      label: "中国不動産・鋼材需要（4-6 月）",
      why: "鉄鉱石・原料炭の需要は中国に依存。鋼材生産量で先行確認",
    },
    {
      label: "ローソン非公開化後の業績",
      why: "2024 年 KDDI 共同 TOB で非公開化、初年度収益貢献の質を確認",
    },
    {
      label: "バフェット動向（バークシャー）",
      why: "保有比率 9% 超で上限近づくが、買い増し継続コメントがあれば株価押し上げ要因",
    },
  ],

  frames: [
    {
      title: "商社のガイダンス修正は『資源価格 × 為替』の合成感応度で見る",
      body:
        "LNG +1 ドル/MMBtu = 純利益 +150 億円、銅 +500 ドル/トン = +100 億円、USD/JPY +1 円 = +60 億円程度。各要素を合成して、通期予想に対する上振れ余地を試算する。",
    },
    {
      title: "『保守的ガイダンス』が上方修正出やすさを決める",
      body:
        "商社は期初に保守的見通しを出す傾向。今期見通し 1.05 兆円（前期比 -6%）は現実より保守的で、為替・資源価格が現状維持なら通年で +1,000-2,000 億円の上振れ余地。だが 1Q 段階で出すか、2Q-3Q に持ち越すかは経営判断次第。",
    },
    {
      title: "バフェット効果は『下値の支え』、上方修正は『資源価格次第』",
      body:
        "バフェット保有は株価下値を支える要因（PER 12 倍水準）。上方修正の有無は資源価格動向次第で、バフェットとは別ロジック。両者を混同しないことが重要。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "据え置き", note: "保守的ガイダンス維持" },
    { period: "2024/Q2", outcome: "上方修正", note: "+5%、LNG・銅高" },
    { period: "2024/Q3", outcome: "据え置き" },
    { period: "2024/Q4", outcome: "上方修正", note: "+8%、ローソン買収" },
    { period: "2025/Q1", outcome: "据え置き" },
    { period: "2025/Q2", outcome: "上方修正", note: "+4%、為替円安" },
    { period: "2025/Q3", outcome: "据え置き" },
    { period: "2025/Q4", outcome: "据え置き" },
  ],

  aiReasoning: {
    steps: [
      { signal: "LNG 価格が会社想定 10 ドル → 現実 12 ドル", direction: "+", weight: 6 },
      { signal: "銅価格は会社想定通り推移", direction: "0", weight: 3 },
      { signal: "鉄鉱石価格は中国需要弱含み", direction: "-", weight: 4 },
      { signal: "USD/JPY 145 円想定 → 現実 152 円", direction: "+", weight: 6 },
      { signal: "ローソン初年度収益貢献は会社想定の範囲内", direction: "0", weight: 3 },
      { signal: "1Q 段階の保守的ガイダンス傾向", direction: "-", weight: 6 },
    ],
    pick: "flat",
    confidence: 56,
  },

  glossaryTerms: ["バフェット", "LNG", "鉄鉱石", "通期ガイダンス", "事業投資"],

  shifts: [
    {
      at: "2026-07-12T17:00:00+09:00",
      delta: 5,
      reason: "JKM LNG 価格が一段と上昇（11 → 13 ドル）",
      choiceKey: "up",
    },
    {
      at: "2026-07-20T08:30:00+09:00",
      delta: -3,
      reason: "中国 6 月鋼材生産 -8%、鉄鉱石需要懸念",
      choiceKey: "up",
    },
  ],

  citations: [
    { doc: "三菱商事 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "JKM LNG スポット価格データ", period: "2026-06" },
  ],
  generatedAt: "2026-07-25T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   三菱 UFJ FG（8306）— 1Q 決算予測
   日銀利上げサイクル中の利上げペース感応度を問う。
*/
const MUFG_PREDICTION: Prediction = {
  id: "8306-2027-1q-guidance",
  stockCode: "8306",
  eventType: "earnings",
  eventName: "三菱 UFJ FG 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-04T15:00:00+09:00",
  deadlineAt: "2026-08-04T14:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、通期当期純利益見通しを上方修正するか？",
  questionNote:
    "前期 1.49 兆円 → 今期見通し 1.55 兆円（+4%）。日銀 7 月利上げ織り込みなら上方余地、利上げ見送りで横ばい。",

  choices: [
    { key: "up", label: "上方修正", probability: 47, probabilityWeekAgo: 38 },
    { key: "flat", label: "据え置き", probability: 45, probabilityWeekAgo: 52 },
    { key: "down", label: "下方修正", probability: 8, probabilityWeekAgo: 10 },
  ],

  checkpoints: [
    {
      label: "日銀 7 月会合の利上げ有無（7/31 発表）",
      why: "MUFG の純利益感応度は +0.25% 利上げで +500-700 億円。利上げの有無が直接ガイダンスに影響",
    },
    {
      label: "貸出残高の伸び率（4-6 月）",
      why: "預貸利ザヤ × 貸出残高で純利益が決まる。残高 +3% 以上なら強気",
    },
    {
      label: "Morgan Stanley 持分法損益",
      why: "MUFG 純利益の 20-25% を占める。MS の Q2 業績が先行指標",
    },
    {
      label: "東南アジア子会社業績（Bank of Ayudhya 等）",
      why: "海外比率 22% の収益貢献、為替円安で更に拡大",
    },
    {
      label: "信用コスト動向",
      why: "貸倒引当金の動向。経済情勢悪化なら引当増で利益圧迫",
    },
  ],

  frames: [
    {
      title: "メガバンクの利上げ感応度は『1Q では一部のみ』反映される",
      body:
        "7 月利上げが実施されても、1Q（4-6 月）の実績にはほぼ反映されない。1Q ガイダンスでの上方修正は『これからの利上げ見通し』を反映するもので、利上げ前後の通期見通し修正のタイミングを慎重に観察する。",
    },
    {
      title: "Morgan Stanley 持分法は『隠れた業績変動要因』",
      body:
        "MUFG は Morgan Stanley 20% を持分法で計上、その業績が四半期ごとに収益として反映。Morgan Stanley の Q2 業績（7/16 発表）を見れば MUFG の 1Q への持分法寄与が推定できる。",
    },
    {
      title: "『利上げ織り込み度』を市場期待値と比較する",
      body:
        "市場が既に通期 1.65 兆円程度を予想している場合、会社が 1.65 兆円に修正しても株価反応はゼロ。市場予想を超えるサプライズが出るかが株価変動の本質。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "据え置き" },
    { period: "2024/Q2", outcome: "上方修正", note: "+5%、利上げ恩恵" },
    { period: "2024/Q3", outcome: "上方修正", note: "+3%、貸出拡大" },
    { period: "2024/Q4", outcome: "据え置き" },
    { period: "2025/Q1", outcome: "据え置き" },
    { period: "2025/Q2", outcome: "上方修正", note: "+4%、Morgan Stanley 寄与" },
    { period: "2025/Q3", outcome: "据え置き" },
    { period: "2025/Q4", outcome: "上方修正", note: "+6%、利上げ織り込み" },
  ],

  aiReasoning: {
    steps: [
      { signal: "日銀 7 月利上げ織り込み（0.5% → 0.75% 想定）", direction: "+", weight: 8 },
      { signal: "貸出残高 4-6 月で +3.5% 拡大", direction: "+", weight: 6 },
      { signal: "Morgan Stanley Q2 業績堅調", direction: "+", weight: 5 },
      { signal: "USD/JPY 152 円で東南アジア収益円換算プラス", direction: "+", weight: 4 },
      { signal: "信用コスト微増（経済情勢の不確実性）", direction: "-", weight: 3 },
      { signal: "1Q 段階の保守的ガイダンス傾向", direction: "-", weight: 5 },
    ],
    pick: "up",
    confidence: 47,
  },

  glossaryTerms: ["メガバンク", "預貸利ザヤ", "通期ガイダンス", "Morgan Stanley", "持分法"],

  shifts: [
    {
      at: "2026-07-15T17:00:00+09:00",
      delta: 6,
      reason: "日銀 7 月利上げ確率が市場で上昇",
      choiceKey: "up",
    },
    {
      at: "2026-07-22T08:30:00+09:00",
      delta: 3,
      reason: "MUFG 月次貸出残高が前年比 +3.8% に上昇",
      choiceKey: "up",
    },
  ],

  citations: [
    { doc: "三菱 UFJ FG 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "日本銀行 金融政策決定会合 議事要旨", period: "2026-06" },
  ],
  generatedAt: "2026-07-25T09:00:00+09:00",
};

/* ─────────────────────────────────────────────
   三井不動産（8801）— 1Q 決算予測
   日銀利上げの逆受益者 vs インフレ恩恵の合成感応度を問う。
*/
const MITSUI_F_PREDICTION: Prediction = {
  id: "8801-2027-1q-guidance",
  stockCode: "8801",
  eventType: "earnings",
  eventName: "三井不動産 2027/3 期 1Q 決算発表",
  eventAt: "2026-08-07T15:00:00+09:00",
  deadlineAt: "2026-08-07T14:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、通期営業利益見通しを上方修正するか？",
  questionNote:
    "日銀利上げはマイナス要因、インフレでの賃料上昇はプラス要因。日本橋・八重洲再開発進捗 + インバウンド回復も評価軸。",

  choices: [
    { key: "up", label: "上方修正", probability: 38, probabilityWeekAgo: 32 },
    { key: "flat", label: "据え置き", probability: 54, probabilityWeekAgo: 58 },
    { key: "down", label: "下方修正", probability: 8, probabilityWeekAgo: 10 },
  ],

  checkpoints: [
    {
      label: "都心 5 区オフィス賃料単価（4-6 月実績）",
      why: "三井不動産のオフィス賃料は単価上昇分が即時に利益貢献。+5% 上昇で営業利益 +200-300 億円規模",
    },
    {
      label: "日銀 7 月会合の利上げ有無",
      why: "10 年国債利回り上昇で不動産株は逆風、PER 切り下げリスク",
    },
    {
      label: "ららぽーと売上（4-6 月、インバウンド比率）",
      why: "訪日インバウンド回復が商業施設売上に直結、歩合賃料拡大",
    },
    {
      label: "ホテル稼働率・ADR（平均客室単価）",
      why: "ホテルセグメントの 80% 稼働率超 / ADR +10% 超で利益貢献急拡大",
    },
    {
      label: "日本橋・八重洲再開発の進捗（IR 開示）",
      why: "2027-30 年竣工の大型開発、進捗の前倒し情報があれば中期利益見通し改善",
    },
  ],

  frames: [
    {
      title: "不動産株は『金利上昇 vs インフレ』の合成感応度で見る",
      body:
        "市場は『利上げ = 不動産マイナス』と単純に捉えがちだが、インフレ局面では賃料・資産価値が上昇する。合成効果として、インフレ率 2% + 利上げ 1% なら、純利益への影響はネット中立～ややプラスになる可能性。",
    },
    {
      title: "三井不動産の 1Q は『分譲売上のタイミング』で振れ大",
      body:
        "三井不動産の売上の 40% 超は分譲事業、これは引き渡しタイミングで売上が立つ。1Q 偏重年と 4Q 偏重年があり、ガイダンス修正のタイミングが分譲売上の進捗で決まる。",
    },
    {
      title: "再開発の『竣工タイミング前倒し』があれば PER 再評価のドライバー",
      body:
        "市場は日本橋・八重洲再開発の完成タイミング（2027-30 年）を中期投資判断の中心に置いている。1Q IR 説明会で進捗の前倒し情報があれば、賃料収入の前倒し計上で PER 上昇余地。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "据え置き" },
    { period: "2024/Q2", outcome: "上方修正", note: "+5%、インバウンド回復" },
    { period: "2024/Q3", outcome: "据え置き" },
    { period: "2024/Q4", outcome: "上方修正", note: "+7%、分譲売上集中" },
    { period: "2025/Q1", outcome: "据え置き" },
    { period: "2025/Q2", outcome: "据え置き" },
    { period: "2025/Q3", outcome: "上方修正", note: "+4%、ホテル稼働率" },
    { period: "2025/Q4", outcome: "据え置き" },
  ],

  aiReasoning: {
    steps: [
      { signal: "都心 5 区オフィス賃料 +3% 上昇継続", direction: "+", weight: 6 },
      { signal: "訪日インバウンド +12%、ホテル稼働率 82%", direction: "+", weight: 7 },
      { signal: "ららぽーと売上 +5%（インバウンド比率上昇）", direction: "+", weight: 5 },
      { signal: "日銀 7 月利上げ織り込み（0.5% → 0.75%）", direction: "-", weight: 6 },
      { signal: "分譲売上は 2H 偏重の年度想定（保守的）", direction: "-", weight: 4 },
      { signal: "1Q 段階の保守的ガイダンス傾向", direction: "-", weight: 5 },
    ],
    pick: "flat",
    confidence: 54,
  },

  glossaryTerms: ["オフィス賃料", "通期ガイダンス", "10年国債", "REIT", "インバウンド"],

  shifts: [
    {
      at: "2026-07-10T10:00:00+09:00",
      delta: 4,
      reason: "都心オフィス空室率が 5.0% 切り、賃料上昇期待",
      choiceKey: "up",
    },
    {
      at: "2026-07-20T08:30:00+09:00",
      delta: -3,
      reason: "10 年国債利回りが 1.5% → 1.7% に上昇",
      choiceKey: "up",
    },
    {
      at: "2026-07-28T15:00:00+09:00",
      delta: 5,
      reason: "JNTO 6 月訪日客 +15%、過去最高更新",
      choiceKey: "up",
    },
  ],

  citations: [
    { doc: "三井不動産 2026/3 期 通期決算説明会資料", period: "2026-05" },
    { doc: "三鬼商事 オフィスマーケットレポート", period: "2026-06" },
    { doc: "JNTO 訪日外国人統計", period: "2026-06" },
  ],
  generatedAt: "2026-07-30T09:00:00+09:00",
};

const SBG_PREDICTION: Prediction = {
  id: "9984-2026-arm-nav-discount",
  stockCode: "9984",
  eventType: "earnings",
  eventName: "ソフトバンク G 2026/3 期 1Q 決算発表",
  eventAt: "2026-08-11T15:30:00+09:00",
  deadlineAt: "2026-08-11T15:25:00+09:00",
  status: "upcoming",

  question: "1Q 決算開示時点で、NAV ディスカウントが 40% 未満に縮小するか？",
  questionNote:
    "現在 SBG 株価は NAV（純資産価値、約 35 兆円）の 50% ディスカウントで推移。Arm 評価益・OpenAI 投資の進展・Stargate 進捗で縮小の可能性。",

  choices: [
    { key: "shrink", label: "ディスカウント縮小（< 40%）", probability: 32, probabilityWeekAgo: 28 },
    { key: "stable", label: "現状維持（40-55%）", probability: 56, probabilityWeekAgo: 58 },
    { key: "widen", label: "ディスカウント拡大（> 55%）", probability: 12, probabilityWeekAgo: 14 },
  ],

  checkpoints: [
    {
      label: "Arm Holdings 株価（NASDAQ）の 4-6 月期推移",
      why: "SBG NAV の最大構成要素。Arm 時価 +10% で SBG NAV +1.7 兆円規模の押し上げ",
    },
    {
      label: "OpenAI 評価額の最新水準（IR 開示・第三者割当）",
      why: "OpenAI 評価額 3,000 億 → 5,000 億ドルでの新ラウンドあれば SBG 持分時価が +2,500 億ドル規模で上昇",
    },
    {
      label: "Stargate プロジェクトの進捗発表（建設着工・調達ラウンド）",
      why: "5,000 億ドル計画の実行率上昇は SBG の AI 投資ストーリーの信頼性向上に直結",
    },
    {
      label: "自社株買い枠の拡大・実施ペース",
      why: "SBG の自社株買いは NAV ディスカウント縮小の最も直接的なツール、過去 1 兆円規模の実績",
    },
    {
      label: "SoftBank Vision Fund 損益（時価評価）",
      why: "VF 損益は SBG 連結業績のボラ最大要因、+/- 1 兆円規模で振れる",
    },
  ],

  frames: [
    {
      title: "SBG は『通信会社』ではなく『AI 投資持株会社』として評価する",
      body:
        "通信セクターのつもりで PER 14.2 倍を評価するのは誤り。SBG の本質は Arm（90% 保有）+ OpenAI 投資 + VF 投資先の SOTP（Sum of the Parts）評価。NAV 35 兆円 × ディスカウント 50% で時価 16.8 兆円という構造を理解すれば、Arm 株価変動が SBG 株価の主因と見える。",
    },
    {
      title: "NAV ディスカウントは『市場の SBG への信頼指標』",
      body:
        "ディスカウント縮小 = 市場が SBG の投資判断を信頼している、拡大 = 不信任。過去 10 年でディスカウントは 30-70% の間を変動、平均 50% 程度。Arm 上場（2023）成功で一時的に 30% 台まで縮小、その後再拡大。OpenAI・Stargate 成果次第で再び 30% 台への接近余地。",
    },
    {
      title: "自社株買いはディスカウント縮小の最強ツールだが、AI 投資資金との二律背反",
      body:
        "SBG は自社株買いで NAV ディスカウントを直接縮小できる（買い消却で 1 株あたり NAV 上昇）。過去 1 兆円規模の実績あり。しかし AI 投資（Stargate に最大 5,000 億ドル）の資金需要との二律背反、孫氏が AI 投資を優先する選択をする可能性が高く、自社株買いは限定的との見方が市場コンセンサス。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "現状維持", note: "ディスカウント 48%" },
    { period: "2024/Q2", outcome: "ディスカウント縮小", note: "39%、Arm 上場効果" },
    { period: "2024/Q3", outcome: "現状維持", note: "44%" },
    { period: "2024/Q4", outcome: "現状維持", note: "47%" },
    { period: "2025/Q1", outcome: "ディスカウント縮小", note: "38%、Stargate 発表効果" },
    { period: "2025/Q2", outcome: "現状維持", note: "45%" },
    { period: "2025/Q3", outcome: "現状維持", note: "50%" },
    { period: "2025/Q4", outcome: "現状維持", note: "52%" },
  ],

  aiReasoning: {
    steps: [
      { signal: "Arm 株価 4-5 月 +8%（AI 半導体ブーム継続）", direction: "+", weight: 7 },
      { signal: "OpenAI 6 月評価額 5,000 億ドル報道", direction: "+", weight: 6 },
      { signal: "Stargate 第 1 期テキサスデータセンタ着工", direction: "+", weight: 5 },
      { signal: "AI 投資資金需要で自社株買い実施余地小", direction: "-", weight: 5 },
      { signal: "10 年国債利回り 1.5% で割引率上昇圧力", direction: "-", weight: 4 },
      { signal: "VF 投資先（中国系）地政学リスク継続", direction: "-", weight: 4 },
    ],
    pick: "stable",
    confidence: 56,
  },

  glossaryTerms: ["NAVディスカウント", "SOTP評価", "Arm Holdings", "Vision Fund", "Stargate"],

  shifts: [
    {
      at: "2026-07-08T16:30:00+09:00",
      delta: 3,
      reason: "Arm 5 月決算で AI ライセンス収入 +35%、株価 +12%",
      choiceKey: "shrink",
    },
    {
      at: "2026-07-18T20:00:00+09:00",
      delta: 5,
      reason: "OpenAI 評価額 5,000 億ドル新ラウンド報道（FT）",
      choiceKey: "shrink",
    },
    {
      at: "2026-07-30T09:30:00+09:00",
      delta: -2,
      reason: "Vision Fund 中国 EV 投資先評価減（推定 -2,000 億円）",
      choiceKey: "shrink",
    },
  ],

  citations: [
    { doc: "SoftBank G 2025年3月期 通期決算説明会資料", period: "2025-05" },
    { doc: "Arm Holdings Q1 2026 業績資料", period: "2026-05" },
    { doc: "Financial Times OpenAI funding round 報道", period: "2026-06" },
  ],
  generatedAt: "2026-08-04T09:00:00+09:00",
};

const MITSUBISHI_CHEM_PREDICTION: Prediction = {
  id: "4188-2026-portfolio-restructure",
  stockCode: "4188",
  eventType: "earnings",
  eventName: "三菱ケミカル 2026/3 期 1Q 決算 + 事業ポートフォリオ再編発表",
  eventAt: "2026-08-04T15:00:00+09:00",
  deadlineAt: "2026-08-04T14:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、汎用化学（スチレン・コークス）の売却・撤退が正式発表されるか？",
  questionNote:
    "東証 PBR 改善要請対応・中国過剰供給による構造不況・産業ガス子会社上場（2024）の三軸で、事業ポートフォリオ転換が市場の最大の関心事。",

  choices: [
    { key: "announce", label: "正式発表（売却先含む）", probability: 28, probabilityWeekAgo: 22 },
    { key: "direction", label: "方向性のみ提示", probability: 52, probabilityWeekAgo: 55 },
    { key: "delay", label: "保留・年度後半送り", probability: 20, probabilityWeekAgo: 23 },
  ],

  checkpoints: [
    {
      label: "中国スチレン輸出価格（4-6 月推移）",
      why: "950 USD/トン水準が続けば汎用化学黒字化困難、売却判断を加速させる要因",
    },
    {
      label: "石化セグメント営業利益（1Q 実績）",
      why: "1Q で営業赤字なら通期で 1,000 億円超の赤字確実、撤退判断の引き金",
    },
    {
      label: "Nippon Sanso（産業ガス子会社）の業績進捗",
      why: "産業ガス事業の好調なら全社黒字維持、汎用化学売却の余裕を作る",
    },
    {
      label: "競合動向（住友化学 Petro Rabigh 撤退・旭化成石化方針）",
      why: "業界全体で汎用化学撤退の波が来ているか、三菱だけが取り残されているか",
    },
    {
      label: "IR 説明会での記者質問・経営陣回答",
      why: "『売却検討中』『候補先と協議中』等の踏み込んだ表現があれば近い将来発表のシグナル",
    },
  ],

  frames: [
    {
      title: "化学業界の事業売却は『損失計上 → PBR 回復』のセットで進行する",
      body:
        "汎用化学事業の売却には固定資産の減損損失（数千億円規模）が一時的に計上される。これは短期的には PBR を一段押し下げるが、汎用部門撤退で営業利益率が改善し、ROE 回復で PBR 1 倍超への戻りに繋がる。市場はこの『短期マイナス・長期プラス』を時間軸で評価する必要がある。",
    },
    {
      title: "1Q 段階での正式発表は『候補先との合意』が前提",
      body:
        "ポートフォリオ転換の正式発表には、売却先（買い手）との合意・取締役会決議・規制当局承認の手順が必要。1Q 段階で全てが揃うのは難易度高く、『方向性提示』にとどまる確率が高い。住友化学 Petro Rabigh も撤退検討から正式発表まで 2 年以上の準備期間。",
    },
    {
      title: "PBR 0.92 倍は『東証 PBR 改善要請』の主要対象",
      body:
        "2023 年 3 月の東証要請で PBR 1 倍割れ企業は改善計画開示が義務化。三菱ケミカル 0.92 倍は明確な改善計画開示が求められ、1Q 決算 IR で具体的な数値目標（PBR・ROE）を提示する圧力が高まる。",
    },
  ],

  history: [
    { period: "2023/Q1", outcome: "方向性のみ提示", note: "ポートフォリオ見直し言及" },
    { period: "2023/Q3", outcome: "保留", note: "市況回復期待" },
    { period: "2024/Q1", outcome: "方向性のみ提示", note: "中期計画で『機能化学集中』明示" },
    { period: "2024/Q3", outcome: "保留", note: "売却候補先絞り込み" },
    { period: "2025/Q1", outcome: "方向性のみ提示" },
    { period: "2025/Q3", outcome: "保留", note: "Nippon Sanso 上場準備優先" },
    { period: "2025/Q4", outcome: "方向性のみ提示" },
  ],

  aiReasoning: {
    steps: [
      { signal: "中国スチレン価格 4-5 月 950 USD で構造不況継続", direction: "+", weight: 6 },
      { signal: "Nippon Sanso 完全子会社上場（2024）でグループ簡素化", direction: "+", weight: 5 },
      { signal: "東証 PBR 改善要請の圧力が継続", direction: "+", weight: 5 },
      { signal: "住友化学 Petro Rabigh 撤退発表で業界の流れ加速", direction: "+", weight: 4 },
      { signal: "1Q 段階での正式発表には買い手合意が必要、時間不足", direction: "-", weight: 7 },
      { signal: "売却損失計上で短期 PBR 一段下落のリスク回避", direction: "-", weight: 5 },
      { signal: "過去 5 期連続で『方向性のみ提示』のパターン", direction: "-", weight: 6 },
    ],
    pick: "direction",
    confidence: 52,
  },

  glossaryTerms: ["PBR改善要請", "スチレン", "MMA", "Nippon Sanso", "事業ポートフォリオ"],

  shifts: [
    {
      at: "2026-07-15T16:30:00+09:00",
      delta: 4,
      reason: "住友化学 Petro Rabigh 撤退正式発表で業界トレンド加速",
      choiceKey: "announce",
    },
    {
      at: "2026-07-25T09:00:00+09:00",
      delta: 3,
      reason: "アジア化学誌で『三菱、欧州 PE 系ファンドと売却交渉』報道",
      choiceKey: "announce",
    },
    {
      at: "2026-08-01T15:00:00+09:00",
      delta: -2,
      reason: "中国スチレン価格 +5% 反発、構造改革の緊急性低下",
      choiceKey: "announce",
    },
  ],

  citations: [
    { doc: "三菱ケミカルグループ 2025年3月期 通期決算説明会資料", period: "2025-05" },
    { doc: "三菱ケミカル 中期経営計画 2026-30", period: "2025-09" },
    { doc: "化学工業日報 業界動向", period: "2026-06" },
  ],
  generatedAt: "2026-07-28T09:00:00+09:00",
};

const SEVEN_PREDICTION: Prediction = {
  id: "3382-2026-ito-yokado-sale",
  stockCode: "3382",
  eventType: "earnings",
  eventName: "セブン&アイ 2026/2 期 1Q 決算 + イトーヨーカ堂売却進捗発表",
  eventAt: "2026-07-09T15:00:00+09:00",
  deadlineAt: "2026-07-09T14:55:00+09:00",
  status: "upcoming",

  question: "1Q 決算で、イトーヨーカ堂の売却先・売却価格が正式発表されるか？",
  questionNote:
    "ACT（カナダ Couche-Tard）TOB 提案（2024 年 8 月）から 11 か月、創業家 MBO 検討と並行してイトーヨーカ堂 GMS 事業の売却計画が進行中。",

  choices: [
    { key: "announced", label: "売却先・価格を正式発表", probability: 35, probabilityWeekAgo: 28 },
    { key: "partial", label: "売却先絞り込み・最終調整中", probability: 48, probabilityWeekAgo: 52 },
    { key: "delayed", label: "保留・年度後半送り", probability: 17, probabilityWeekAgo: 20 },
  ],

  checkpoints: [
    {
      label: "イトーヨーカ堂 1Q 営業損益",
      why: "1Q で営業赤字が拡大すれば売却判断を加速、黒字化なら売却の緊急性低下",
    },
    {
      label: "ACT（Couche-Tard）の動向（追加提案・取下げ）",
      why: "ACT が追加 TOB 提案を行えば、セブン&アイの対応として売却ペース加速",
    },
    {
      label: "創業家 MBO 検討の進捗（伊藤家・三井物産連携の報道）",
      why: "MBO 成立で非公開化、株主圧力からの解放で売却判断の自由度向上",
    },
    {
      label: "1Q 決算 IR 説明会での経営陣の発言トーン",
      why: "『複数候補と最終調整中』『近く発表予定』等の踏み込んだ表現があれば近い将来発表のシグナル",
    },
    {
      label: "国内コンビニ事業の 1Q 既存店売上",
      why: "コンビニ集中戦略の成功シナリオの裏付け、+3% 超なら戦略の正当性強化",
    },
  ],

  frames: [
    {
      title: "セブン&アイの構造転換は『コンビニ集中 vs 総合小売』の選択",
      body:
        "セブン&アイの株主・経営陣の議論は『コンビニ集中で利益率改善（PER 上昇）』vs『総合小売でリスク分散（安定）』の選択。ACT 提案・創業家 MBO 検討の両方が前者を志向、株式市場もコンビニ集中シナリオに賭けている。イトーヨーカ堂売却完了で全社営業利益 +500-800 億円、ROE 7.8% → 10% 超への到達が PER 再評価のドライバー。",
    },
    {
      title: "売却先候補は『国内 PE・他小売・物流系』の三軸",
      body:
        "イトーヨーカ堂の買い手候補は ①国内 PE（KKR・ベインキャピタル等）、②他小売（イオン・パン・パシフィック等）、③物流・倉庫業（GLP 等）の三軸。①は事業再生型、②は店舗網統合型、③は不動産価値特化型でそれぞれ売却価格・シナジーが異なる。1Q IR 説明会で『候補先絞り込み』が示されれば株価織り込み進捗。",
    },
    {
      title: "ACT TOB 提案の進展次第で『プレミアム獲得』の機会",
      body:
        "ACT 提案の TOB 価格は約 18.5 兆円（株あたり 22,000 円）、現在の株価 22,800 円は ACT 提案価格を既に上回る。これは『創業家 MBO で更に高値』を市場が織り込んでいる証拠。創業家 MBO 価格は 25,000-28,000 円規模との観測あり、MBO 成立シナリオで +10-20% のプレミアム獲得余地。",
    },
  ],

  history: [
    { period: "2024/Q1", outcome: "方向性のみ提示", note: "売却検討表明" },
    { period: "2024/Q2", outcome: "保留", note: "ACT TOB 提案受領" },
    { period: "2024/Q3", outcome: "売却先絞り込み", note: "国内 PE 候補 3 社に絞り込み" },
    { period: "2024/Q4", outcome: "保留", note: "創業家 MBO 検討開始" },
    { period: "2025/Q1", outcome: "売却先絞り込み" },
    { period: "2025/Q2", outcome: "売却先絞り込み", note: "ベインキャピタル候補報道" },
    { period: "2025/Q3", outcome: "保留", note: "MBO 価格の協議継続" },
    { period: "2025/Q4", outcome: "売却先絞り込み", note: "発表近いとの報道" },
  ],

  aiReasoning: {
    steps: [
      { signal: "ACT 提案から 11 か月、市場の発表期待高い", direction: "+", weight: 6 },
      { signal: "イトーヨーカ堂 1Q 営業赤字 -50 億円規模で売却必要性継続", direction: "+", weight: 6 },
      { signal: "ベインキャピタル・KKR 等候補先絞り込み報道", direction: "+", weight: 5 },
      { signal: "創業家 MBO と売却の同時進行で複雑化", direction: "-", weight: 5 },
      { signal: "売却損失計上で短期 PBR 一段下落のリスク回避", direction: "-", weight: 4 },
      { signal: "ACT 第 2 次提案待ちで意思決定遅延の可能性", direction: "-", weight: 4 },
    ],
    pick: "partial",
    confidence: 48,
  },

  glossaryTerms: ["TOB", "MBO", "GMS", "コンビニ集中戦略", "PER再評価"],

  shifts: [
    {
      at: "2026-06-15T15:00:00+09:00",
      delta: 5,
      reason: "日経新聞『セブン&アイ、ベインキャピタルと最終交渉』報道",
      choiceKey: "announced",
    },
    {
      at: "2026-06-25T16:00:00+09:00",
      delta: 3,
      reason: "ACT が TOB 価格 +5% の追加提案、株主圧力強まる",
      choiceKey: "announced",
    },
    {
      at: "2026-07-02T10:00:00+09:00",
      delta: -2,
      reason: "創業家 MBO 価格の協議継続報道、決定遅延の見方",
      choiceKey: "announced",
    },
  ],

  citations: [
    { doc: "セブン&アイ 2026年2月期 通期決算説明会資料", period: "2026-04" },
    { doc: "セブン&アイ ACT TOB 提案受領に関するお知らせ", period: "2024-08" },
    { doc: "日経新聞 セブン&アイ売却交渉報道", period: "2026-06" },
  ],
  generatedAt: "2026-07-02T09:00:00+09:00",
};

const ALL_PREDICTIONS: Prediction[] = [
  ADVANTEST_RESOLVED_DISCLOSURE,
  DAIICHI_LIVE_DISCLOSURE,
  TEL_RESOLVED_PREDICTION,
  TEL_EARNINGS_PREDICTION,
  TAKEDA_PREDICTION,
  SANSAN_PREDICTION,
  BOJ_PREDICTION,
  LASERTEC_PREDICTION,
  TOYOTA_PREDICTION,
  MITSUBISHI_C_PREDICTION,
  MUFG_PREDICTION,
  MITSUI_F_PREDICTION,
  SBG_PREDICTION,
  MITSUBISHI_CHEM_PREDICTION,
  SEVEN_PREDICTION,
];

export function listPredictions(): Prediction[] {
  return ALL_PREDICTIONS;
}

export function getPredictionsByStock(code: string): Prediction[] {
  return ALL_PREDICTIONS.filter((p) => p.stockCode === code);
}

export function getPrediction(id: string): Prediction | undefined {
  return ALL_PREDICTIONS.find((p) => p.id === id);
}

/** 確率が一番高い choice */
export function topChoice(p: Prediction): PredictionChoice {
  return [...p.choices].sort((a, b) => b.probability - a.probability)[0];
}

/** 1 週間で動いた合計（絶対値の合計、参考指標） */
export function weeklyMovement(p: Prediction): number {
  return p.choices.reduce(
    (acc, c) =>
      c.probabilityWeekAgo !== undefined
        ? acc + Math.abs(c.probability - c.probabilityWeekAgo)
        : acc,
    0,
  );
}

/**
 * 「今日」を基準にして、予測カードのライブ状態を判定する。
 * - resolved 状態は元データの status を尊重
 * - eventAt が今日中、または直前 24h 以内 → live
 * - それ以外（未来） → upcoming
 * 今日の基準は CLAUDE.md の today = 2026-06-03 ベース。
 * 本番では new Date() を使うが、SSG 安定のため明示的な「現在」を使用。
 */
const TODAY_ISO = "2026-06-03T13:48:00+09:00";

export function predictionWithLiveStatus(p: Prediction): Prediction {
  if (p.status === "resolved") return p;
  const now = new Date(TODAY_ISO).getTime();
  const target = new Date(p.eventAt).getTime();
  const diffHours = (target - now) / (1000 * 60 * 60);
  if (diffHours >= 0 && diffHours <= 4) {
    return { ...p, status: "live" };
  }
  return { ...p, status: "upcoming" };
}

/** 今日からの相対日数（負の値は過去） */
export function daysFromToday(iso: string): number {
  const now = new Date(TODAY_ISO).getTime();
  const target = new Date(iso).getTime();
  return Math.floor((target - now) / (1000 * 60 * 60 * 24));
}

/** ハブページ用：状態別グルーピング */
export type PredictionBucket =
  | "live"
  | "today"
  | "this-week"
  | "next-week"
  | "later"
  | "resolved";

export function bucketOf(p: Prediction): PredictionBucket {
  if (p.status === "resolved") return "resolved";
  const d = daysFromToday(p.eventAt);
  if (d < 0) return "resolved"; // 過去だが resolution 未設定はとりあえずここに
  if (d === 0) return "today";
  if (d <= 7) return "this-week";
  if (d <= 14) return "next-week";
  return "later";
}

export function groupedPredictions(): Record<PredictionBucket, Prediction[]> {
  const buckets: Record<PredictionBucket, Prediction[]> = {
    live: [],
    today: [],
    "this-week": [],
    "next-week": [],
    later: [],
    resolved: [],
  };
  for (const raw of ALL_PREDICTIONS) {
    const p = predictionWithLiveStatus(raw);
    if (p.status === "live") {
      buckets.live.push(p);
    } else {
      buckets[bucketOf(p)].push(p);
    }
  }
  // 各バケットを eventAt 昇順（resolved は降順）
  for (const k of Object.keys(buckets) as PredictionBucket[]) {
    buckets[k].sort((a, b) => {
      const av = new Date(a.eventAt).getTime();
      const bv = new Date(b.eventAt).getTime();
      return k === "resolved" ? bv - av : av - bv;
    });
  }
  return buckets;
}

// ──────────────────────────────────────────────
// Track Record（AI 的中率ダッシュボード用集計）
// ──────────────────────────────────────────────

export type TrackRecordRow = {
  group: string;
  total: number;
  hits: number;
  accuracy: number; // 0-100
};

/** 全体スタッツ */
export function trackRecordOverall(): {
  total: number;
  hits: number;
  misses: number;
  accuracy: number;
} {
  const resolved = ALL_PREDICTIONS.filter((p) => p.status === "resolved" && p.resolution);
  const hits = resolved.filter((p) => p.aiReasoning.pick === p.resolution!.outcomeKey).length;
  const total = resolved.length;
  return {
    total,
    hits,
    misses: total - hits,
    accuracy: total > 0 ? (hits / total) * 100 : 0,
  };
}

/** イベント種別ごとの的中率 */
export function trackRecordByEventType(): TrackRecordRow[] {
  const resolved = ALL_PREDICTIONS.filter((p) => p.status === "resolved" && p.resolution);
  const labelMap: Record<PredictionEventType, string> = {
    earnings: "決算",
    disclosure: "適時開示",
    macro: "マクロ",
    news: "ニュース",
  };
  const groups: Record<PredictionEventType, { total: number; hits: number }> = {
    earnings: { total: 0, hits: 0 },
    disclosure: { total: 0, hits: 0 },
    macro: { total: 0, hits: 0 },
    news: { total: 0, hits: 0 },
  };
  for (const p of resolved) {
    groups[p.eventType].total += 1;
    if (p.aiReasoning.pick === p.resolution!.outcomeKey) {
      groups[p.eventType].hits += 1;
    }
  }
  return (Object.keys(groups) as PredictionEventType[]).map((key) => ({
    group: labelMap[key],
    total: groups[key].total,
    hits: groups[key].hits,
    accuracy: groups[key].total > 0 ? (groups[key].hits / groups[key].total) * 100 : 0,
  }));
}

/** AI 確信度別の的中率（キャリブレーション） */
export function trackRecordByConfidence(): TrackRecordRow[] {
  const buckets: Array<{ label: string; min: number; max: number }> = [
    { label: "確信度 90%以上", min: 90, max: 100 },
    { label: "確信度 70-89%", min: 70, max: 90 },
    { label: "確信度 50-69%", min: 50, max: 70 },
    { label: "確信度 50%未満", min: 0, max: 50 },
  ];
  const resolved = ALL_PREDICTIONS.filter((p) => p.status === "resolved" && p.resolution);
  return buckets.map((b) => {
    const inBucket = resolved.filter(
      (p) => p.aiReasoning.confidence >= b.min && p.aiReasoning.confidence < b.max,
    );
    const hits = inBucket.filter((p) => p.aiReasoning.pick === p.resolution!.outcomeKey).length;
    return {
      group: b.label,
      total: inBucket.length,
      hits,
      accuracy: inBucket.length > 0 ? (hits / inBucket.length) * 100 : 0,
    };
  });
}

/** 全 resolved 予測を新しい順で返す */
export function allResolvedPredictions(): Prediction[] {
  return ALL_PREDICTIONS.filter((p) => p.status === "resolved" && p.resolution).sort((a, b) => {
    const av = new Date(a.resolution!.resolvedAt).getTime();
    const bv = new Date(b.resolution!.resolvedAt).getTime();
    return bv - av;
  });
}
