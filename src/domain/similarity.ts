import type {
  BusinessTag,
  FactorBetas,
  PhaseScores,
  SimilarStock,
  Stock,
  TagDimension,
} from "./types";
import { dominantPhase } from "./phase";

// A 軸：タグ次元ごとの重み（開発者決め打ち）
const DIM_WEIGHTS: Record<TagDimension, number> = {
  product: 0.32,
  value_chain: 0.22,
  customer: 0.18,
  revenue_model: 0.14,
  geography: 0.08,
  channel: 0.06,
};

// 半導体クラスタの正規化コンセプト語彙。タグ文字列が独自表記でも
// この語彙を含めばコンセプト集合として照合される。本番ではタグマスターで
// 入力側を統制するが、プロトタイプではここで吸収する。
const CONCEPTS: string[] = [
  // バリューチェーン・工程
  "前工程", "後工程", "WFE", "マスク検査", "マスク", "計測", "テスト", "テスタ",
  "材料", "シリコンウェハ", "ウェハ", "レジスト", "PVC", "装置部材", "部材",
  // 顧客
  "ファウンドリ", "DRAM", "NAND", "OSAT", "IDM", "ファブレス",
  "自動車", "EV", "OEM", "Tier1", "産業機器", "通信機器", "キャリア",
  "データセンタ", "ハイパースケーラー", "民生機器", "建築", "建材",
  "半導体製造装置メーカー", "装置メーカー", "ネットワーク機器",
  // チャネル
  "直販", "商社", "代理店", "現地法人", "サービス網",
  // 収益モデル
  "装置売り切り", "売り切り", "保守", "フィールドソリューション", "アフター",
  "消耗品", "リカーリング", "ブレード",
  "ロイヤルティ", "LTA", "長期契約", "NRE", "設計受託", "受託",
  "デバイス売り切り", "素材",
  // 地理
  "中国", "台湾", "韓国", "北米", "日本", "欧州", "アジア",
];

function expandValue(v: string): string[] {
  const tokens: string[] = [v];
  for (const c of CONCEPTS) if (v.includes(c)) tokens.push(c);
  return tokens;
}

function tagsByDim(tags: BusinessTag[]): Record<TagDimension, Set<string>> {
  const out = {
    product: new Set<string>(),
    customer: new Set<string>(),
    channel: new Set<string>(),
    revenue_model: new Set<string>(),
    value_chain: new Set<string>(),
    geography: new Set<string>(),
  } satisfies Record<TagDimension, Set<string>>;
  for (const t of tags) for (const tk of expandValue(t.value)) out[t.dimension].add(tk);
  return out;
}

function rawTagsByDim(tags: BusinessTag[]): Record<TagDimension, BusinessTag[]> {
  const out: Record<TagDimension, BusinessTag[]> = {
    product: [], customer: [], channel: [], revenue_model: [], value_chain: [], geography: [],
  };
  for (const t of tags) out[t.dimension].push(t);
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// A 軸スコア：次元ごとの jaccard 加重平均、0–100 整数
export function businessSimilarity(a: Stock, b: Stock): number {
  const A = tagsByDim(a.tags);
  const B = tagsByDim(b.tags);
  let s = 0;
  for (const dim of Object.keys(DIM_WEIGHTS) as TagDimension[]) {
    s += DIM_WEIGHTS[dim] * jaccard(A[dim], B[dim]);
  }
  return Math.round(s * 100);
}

// A 軸の類似根拠：コンセプトレベルで一致した次元を 1-2 個ピック
export function businessReason(a: Stock, b: Stock): string {
  const A = rawTagsByDim(a.tags);
  const B = rawTagsByDim(b.tags);
  const matched: { dim: TagDimension; values: string[] }[] = [];
  for (const dim of Object.keys(DIM_WEIGHTS) as TagDimension[]) {
    const aConcepts = new Set<string>();
    const bConcepts = new Set<string>();
    for (const t of A[dim]) for (const c of CONCEPTS) if (t.value.includes(c)) aConcepts.add(c);
    for (const t of B[dim]) for (const c of CONCEPTS) if (t.value.includes(c)) bConcepts.add(c);
    const overlap = [...aConcepts].filter((c) => bConcepts.has(c));
    if (overlap.length > 0) matched.push({ dim, values: overlap });
  }
  matched.sort((x, y) => DIM_WEIGHTS[y.dim] - DIM_WEIGHTS[x.dim]);
  const pick = matched.slice(0, 2);
  if (pick.length === 0) return "事業構造の重なりは限定的";

  const dimLabel: Record<TagDimension, string> = {
    product: "製品",
    customer: "顧客",
    channel: "販売チャネル",
    revenue_model: "収益モデル",
    value_chain: "バリューチェーン",
    geography: "地理的売上構成",
  };
  return pick
    .map((m) => `${dimLabel[m.dim]}が一致（${m.values.slice(0, 2).join("、")}）`)
    .join("、");
}

// C 軸：フェーズスコアベクトル間の cos 類似 → 0–100
function phaseVec(p: PhaseScores) {
  return [p.launch, p.expansion, p.mature, p.decline];
}
function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
export function phaseSimilarity(a: Stock, b: Stock): number {
  if (!a.phaseScores || !b.phaseScores) return 0;
  return Math.round(
    cosine(phaseVec(a.phaseScores), phaseVec(b.phaseScores)) * 100,
  );
}

// C 軸の対比:「同じ成長フェーズ・異なる業界の銘柄」を選ぶ
export function phaseSimilarDifferentIndustry(
  self: Stock,
  pool: Stock[],
  top = 4,
): SimilarStock[] {
  if (!self.phaseScores) return [];
  return pool
    .filter(
      (s) =>
        s.code !== self.code &&
        s.industryCluster !== self.industryCluster &&
        s.phaseScores !== null,
    )
    .map((s) => ({
      stock: s,
      score: phaseSimilarity(self, s),
      reason: phaseReason(self, s),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, top);
}

function phaseReason(a: Stock, b: Stock): string {
  if (!a.phaseScores) return `異なる業界(${b.industryCluster})の銘柄`;
  return `両社とも ${dominantPhase(a.phaseScores, true)} 寄り。異なる業界(${b.industryCluster})で同じフェーズの動きを示している`;
}

// D 軸：ファクター感応度ベクトル間のユークリッド距離 → 0–100（近い）
function factorVec(f: FactorBetas) {
  return [f.usdjpy, f.us10y, f.oil, f.sox, f.china, f.market, f.size, f.value, f.momentum];
}
function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
export function factorSimilarity(a: Stock, b: Stock): number {
  if (!a.factorBetas || !b.factorBetas) return 0;
  const d = euclid(factorVec(a.factorBetas), factorVec(b.factorBetas));
  // 経験的に 0〜5 のスケール想定でスコアリング
  const score = Math.max(0, 1 - d / 5);
  return Math.round(score * 100);
}
// 補完的(逆方向)スコア:両ベクトルの内積が負ほど高得点
export function factorComplementarity(a: Stock, b: Stock): number {
  if (!a.factorBetas || !b.factorBetas) return 0;
  const A = factorVec(a.factorBetas);
  const B = factorVec(b.factorBetas);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < A.length; i++) {
    dot += A[i] * B[i];
    na += A[i] * A[i];
    nb += B[i] * B[i];
  }
  if (na === 0 || nb === 0) return 0;
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb));
  return Math.round(((1 - cos) / 2) * 100);
}

function factorReason(a: Stock, b: Stock): string {
  if (!a.factorBetas || !b.factorBetas) {
    return "ファクター感応度が未取得";
  }
  const A = a.factorBetas;
  const B = b.factorBetas;
  // 差が大きいファクターを 2 つ拾って描写
  const labels: { key: keyof FactorBetas; ja: string }[] = [
    { key: "usdjpy", ja: "ドル円" },
    { key: "us10y", ja: "米 10 年金利" },
    { key: "oil", ja: "原油" },
    { key: "sox", ja: "SOX" },
    { key: "china", ja: "中国" },
    { key: "market", ja: "市場ベータ" },
    { key: "size", ja: "サイズ" },
    { key: "value", ja: "バリュー" },
    { key: "momentum", ja: "モメンタム" },
  ];
  const opposing = labels
    .map((l) => ({
      ja: l.ja,
      a: A[l.key],
      b: B[l.key],
      signFlip: A[l.key] * B[l.key] < 0,
      gap: Math.abs(A[l.key] - B[l.key]),
    }))
    .filter((x) => x.signFlip)
    .sort((x, y) => y.gap - x.gap)
    .slice(0, 2);
  if (opposing.length === 0) {
    const close = labels
      .map((l) => ({ ja: l.ja, gap: Math.abs(A[l.key] - B[l.key]) }))
      .sort((x, y) => x.gap - y.gap)
      .slice(0, 2);
    return `感応度が近い:${close.map((c) => c.ja).join("、")} で同方向の動き`;
  }
  return `感応度が逆方向:${opposing
    .map((o) => `${o.ja}(${o.a.toFixed(2)} ↔ ${o.b.toFixed(2)})`)
    .join("、")}`;
}

// メイン関数(類似計算の対象プール pool を呼び出し側から渡す。通常はオーバーレイ済み 68 銘柄)
export function similarStocksByBusiness(
  self: Stock,
  pool: Stock[],
  top = 5,
): SimilarStock[] {
  return pool
    .filter((s) => s.code !== self.code)
    .map((s) => ({
      stock: s,
      score: businessSimilarity(self, s),
      reason: businessReason(self, s),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, top);
}

// D 軸:類似と補完を両方返す(補完が中級以上への訴求)
export function riskComplementStocks(
  self: Stock,
  pool: Stock[],
  top = 4,
): SimilarStock[] {
  if (!self.factorBetas) return [];
  return pool
    .filter((s) => s.code !== self.code && s.factorBetas !== null)
    .map((s) => ({
      stock: s,
      score: factorComplementarity(self, s),
      reason: factorReason(self, s),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, top);
}

export function riskSimilarStocks(
  self: Stock,
  pool: Stock[],
  top = 4,
): SimilarStock[] {
  if (!self.factorBetas) return [];
  return pool
    .filter((s) => s.code !== self.code && s.factorBetas !== null)
    .map((s) => ({
      stock: s,
      score: factorSimilarity(self, s),
      reason: factorReason(self, s),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, top);
}
