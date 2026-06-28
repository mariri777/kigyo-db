/**
 * /forecasts 配下の表示ヘルパ。
 *
 * page.tsx でも詳細でも一覧でも使う。
 */

export type Verdict = {
  tone: "up" | "down" | "neutral";
  label: string;
  color: string;
  bg: string;
  ring: string;
  glyph: "up" | "down" | "neutral";
};

export function readVerdict(p: number): Verdict {
  if (p >= 60) {
    return {
      tone: "up",
      label: "上がる寄り",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      glyph: "up",
    };
  }
  if (p <= 40) {
    return {
      tone: "down",
      label: "下がる寄り",
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-100",
      glyph: "down",
    };
  }
  return {
    tone: "neutral",
    label: "五分五分",
    color: "text-neutral-700",
    bg: "bg-neutral-100",
    ring: "ring-neutral-200",
    glyph: "neutral",
  };
}

export function dominantProbability(p: number): { value: number; direction: "up" | "down" } {
  if (p >= 50) return { value: p, direction: "up" };
  return { value: 100 - p, direction: "down" };
}

/**
 * Polymarket 風の Yes/No 表示用。
 *
 * - probability は「YES 側 (= 上がる/起こる) の 0-100」
 * - position は AI が取った side。null は 50:50 のときのみ
 * - sideProbability は AI が取った側の自信度 (= UI で大きく見せる数字)
 */
export type Stance = {
  side: "yes" | "no" | "neutral";
  /** AI が取った側の確率 (大型表示用) */
  sideProbability: number;
  /** 反対側の確率 */
  oppositeProbability: number;
  /** UI で使う Polymarket 風カラー */
  color: string;
  bg: string;
  ring: string;
  glyph: "yes" | "no" | "neutral";
};

export function readStance(
  probability: number,
  position: "yes" | "no" | null,
): Stance {
  const fallbackSide: "yes" | "no" | "neutral" =
    probability >= 51 ? "yes" : probability <= 49 ? "no" : "neutral";
  const side = position ?? fallbackSide;
  if (side === "yes") {
    return {
      side: "yes",
      sideProbability: probability,
      oppositeProbability: 100 - probability,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      glyph: "yes",
    };
  }
  if (side === "no") {
    return {
      side: "no",
      sideProbability: 100 - probability,
      oppositeProbability: probability,
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
      glyph: "no",
    };
  }
  return {
    side: "neutral",
    sideProbability: 50,
    oppositeProbability: 50,
    color: "text-neutral-700",
    bg: "bg-neutral-100",
    ring: "ring-neutral-200",
    glyph: "neutral",
  };
}

export function formatResolveAtJp(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso.slice(0, 16);
  const [, , mm, dd, hh, mi] = m;
  return `${Number(mm)}/${Number(dd)} ${Number(hh)}:${mi}`;
}

export function formatResolveAtLong(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso;
  const [, y, mm, dd, hh, mi] = m;
  const d = new Date(`${y}-${mm}-${dd}T${hh}:${mi}:00+09:00`);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${Number(mm)}月${Number(dd)}日 (${wd}) ${Number(hh)}:${mi}`;
}

export function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const local = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mi = String(local.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function timeUntilResolveJp(iso: string, nowMs = Date.now()): string {
  const resolveMs = Date.parse(iso);
  if (Number.isNaN(resolveMs)) return "";
  const diffMs = resolveMs - nowMs;
  if (diffMs <= 0) return "解決済";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `あと${minutes}分`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `あと${hours}時間`;
  const days = Math.floor(hours / 24);
  return `あと${days}日`;
}

export function takeKindMeta(kind: string): {
  label: string;
  accent: string;
  iconColor: string;
} {
  switch (kind) {
    case "macro":
      return { label: "マクロ", accent: "border-l-emerald-500", iconColor: "text-emerald-600" };
    case "technical":
      return { label: "テクニカル", accent: "border-l-sky-500", iconColor: "text-sky-600" };
    case "sentiment":
      return { label: "センチメント", accent: "border-l-violet-500", iconColor: "text-violet-600" };
    case "bull":
      return { label: "強気シナリオ", accent: "border-l-amber-500", iconColor: "text-amber-600" };
    case "bear":
      return { label: "弱気シナリオ", accent: "border-l-rose-500", iconColor: "text-rose-600" };
    case "contrarian":
      return { label: "逆張り視点", accent: "border-l-fuchsia-500", iconColor: "text-fuchsia-600" };
    case "key-data":
      return { label: "キーデータ", accent: "border-l-neutral-700", iconColor: "text-neutral-700" };
    default:
      return { label: kind, accent: "border-l-neutral-300", iconColor: "text-neutral-500" };
  }
}

export function confidenceMeta(c: string): { label: string; color: string } {
  switch (c) {
    case "high":
      return { label: "自信度 高", color: "bg-emerald-600 text-white" };
    case "low":
      return { label: "自信度 低", color: "bg-neutral-200 text-neutral-700" };
    default:
      return { label: "自信度 中", color: "bg-neutral-900 text-white" };
  }
}
