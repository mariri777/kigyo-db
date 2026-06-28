/**
 * /forecasts と /forecasts/[id] で共有する可視化部品。
 * Server Component 互換 (純粋 SVG)。
 */
import { Activity, Check, TrendingDown, TrendingUp, X } from "lucide-react";

import type { ForecastShiftPoint } from "@/server/repo/forecastRepo";

/** Polymarket 風 tone (Yes/No/中立)。後方互換のために up/down/neutral も受ける */
export type Tone = "yes" | "no" | "neutral" | "up" | "down";

function toneToHex(tone: Tone): string {
  if (tone === "yes" || tone === "up") return "#10b981";
  if (tone === "no" || tone === "down") return "#f43f5e";
  return "#737373";
}

export function VerdictGlyph({
  tone,
  size = "md",
}: {
  tone: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const iconSize = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  if (tone === "yes" || tone === "up") {
    return (
      <div className={`${dim} rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm`}>
        {tone === "yes" ? (
          <Check className={iconSize} strokeWidth={3} />
        ) : (
          <TrendingUp className={iconSize} strokeWidth={2.5} />
        )}
      </div>
    );
  }
  if (tone === "no" || tone === "down") {
    return (
      <div className={`${dim} rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm`}>
        {tone === "no" ? (
          <X className={iconSize} strokeWidth={3} />
        ) : (
          <TrendingDown className={iconSize} strokeWidth={2.5} />
        )}
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full bg-neutral-500 text-white flex items-center justify-center shadow-sm`}>
      <Activity className={iconSize} strokeWidth={2.5} />
    </div>
  );
}

/**
 * Polymarket 風の Yes/No 大型表示。
 * yesLabel / noLabel と probability から、AI が取った側を強調する。
 *
 * - probability は YES 側の確率 (0-100)
 * - position は AI が選んだ側 (null は neutral)
 */
export function YesNoBlock({
  probability,
  position,
  yesLabel,
  noLabel,
  variant = "md",
}: {
  probability: number;
  position: "yes" | "no" | null;
  yesLabel: string;
  noLabel: string;
  variant?: "sm" | "md" | "lg";
}) {
  const yes = Math.max(0, Math.min(100, probability));
  const no = 100 - yes;
  const yesActive = position === "yes" || (position === null && yes > no);
  const noActive = position === "no" || (position === null && no > yes);
  const sizes =
    variant === "lg"
      ? { num: "text-5xl sm:text-6xl", label: "text-xs sm:text-sm", chip: "py-3 px-4" }
      : variant === "sm"
        ? { num: "text-2xl", label: "text-[10px]", chip: "py-2 px-3" }
        : { num: "text-3xl sm:text-4xl", label: "text-[11px]", chip: "py-2.5 px-4" };

  return (
    <div className="grid grid-cols-2 gap-2">
      <OutcomeChip
        side="yes"
        active={yesActive}
        labelText={yesLabel}
        percent={yes}
        sizes={sizes}
      />
      <OutcomeChip
        side="no"
        active={noActive}
        labelText={noLabel}
        percent={no}
        sizes={sizes}
      />
    </div>
  );
}

function OutcomeChip({
  side,
  active,
  labelText,
  percent,
  sizes,
}: {
  side: "yes" | "no";
  active: boolean;
  labelText: string;
  percent: number;
  sizes: { num: string; label: string; chip: string };
}) {
  if (active && side === "yes") {
    return (
      <div className={`rounded-xl ${sizes.chip} ring-2 ring-emerald-500/60 bg-emerald-50 flex flex-col`}>
        <div className={`flex items-center gap-1 ${sizes.label} font-bold uppercase tracking-widest text-emerald-700`}>
          <Check className="w-3 h-3" strokeWidth={3} />
          YES ・ {labelText}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`font-mono tabular ${sizes.num} font-black tracking-tight text-emerald-600`}>
            {percent}
          </span>
          <span className="text-lg font-bold text-emerald-600">%</span>
        </div>
      </div>
    );
  }
  if (active && side === "no") {
    return (
      <div className={`rounded-xl ${sizes.chip} ring-2 ring-rose-500/60 bg-rose-50 flex flex-col`}>
        <div className={`flex items-center gap-1 ${sizes.label} font-bold uppercase tracking-widest text-rose-700`}>
          <X className="w-3 h-3" strokeWidth={3} />
          NO ・ {labelText}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`font-mono tabular ${sizes.num} font-black tracking-tight text-rose-600`}>
            {percent}
          </span>
          <span className="text-lg font-bold text-rose-600">%</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-xl ${sizes.chip} bg-neutral-50 ring-1 ring-neutral-200 flex flex-col`}>
      <div className={`flex items-center gap-1 ${sizes.label} font-bold uppercase tracking-widest text-neutral-500`}>
        {side === "yes" ? "YES" : "NO"} ・ {labelText}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`font-mono tabular ${sizes.num} font-black tracking-tight text-neutral-500`}>
          {percent}
        </span>
        <span className="text-lg font-bold text-neutral-400">%</span>
      </div>
    </div>
  );
}

export function ShiftBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
        → 変わらず
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? "↑ 強気に" : "↓ 弱気に"} {Math.abs(delta)}pt
    </span>
  );
}

/**
 * Polymarket 風のゲージ。Yes / No それぞれの確率を 1 本のバーに収め、
 * 左下に Yes、右下に No のラベル + パーセントを置く。
 */
export function ProbabilityGauge({
  probability,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  probability: number;
  yesLabel?: string;
  noLabel?: string;
}) {
  const p = Math.max(0, Math.min(100, probability));
  const inverse = 100 - p;
  return (
    <div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-white/60">
        <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
        <div className="h-full bg-rose-500" style={{ width: `${inverse}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-emerald-700 inline-flex items-center gap-1">
          <Check className="w-3 h-3" strokeWidth={3} />
          Yes・{yesLabel} <span className="font-mono tabular">{p}%</span>
        </span>
        <span className="text-rose-700 inline-flex items-center gap-1">
          <X className="w-3 h-3" strokeWidth={3} />
          No・{noLabel} <span className="font-mono tabular">{inverse}%</span>
        </span>
      </div>
    </div>
  );
}

/**
 * 24h ぶんの確率推移をスパークラインとして描く。
 * 同じものをカード版と詳細版で使えるよう、サイズと密度をオプションに。
 */
export function ShiftSparkline({
  shifts,
  tone,
  variant = "card",
}: {
  shifts: ForecastShiftPoint[];
  tone: Tone;
  variant?: "card" | "wide";
}) {
  if (shifts.length < 2) return null;
  const W = variant === "wide" ? 720 : 320;
  const H = variant === "wide" ? 120 : 56;
  const probs = shifts.map((s) => s.probability);
  const min = Math.min(...probs, 30);
  const max = Math.max(...probs, 70);
  const span = Math.max(max - min, 1);
  const stroke = toneToHex(tone);
  const fillId = `shift-fill-${tone}-${variant}`;
  const baseY = H - ((50 - min) / span) * (H - 12) - 6;
  const pts = shifts.map((s, i) => {
    const x = (i / (shifts.length - 1)) * W;
    const y = H - ((s.probability - min) / span) * (H - 12) - 6;
    return { x, y, p: s.probability };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={variant === "wide" ? 0.35 : 0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 50% 基準線 */}
      <line
        x1="0"
        x2={W}
        y1={baseY}
        y2={baseY}
        stroke="#e5e5e5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth={variant === "wide" ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? (variant === "wide" ? 5 : 3.5) : variant === "wide" ? 3 : 2}
          fill={stroke}
        />
      ))}
      <text
        x={Math.min(last.x + 8, W - 36)}
        y={Math.max(last.y - 8, 14)}
        fontSize={variant === "wide" ? "14" : "10"}
        fontWeight="700"
        fill={stroke}
      >
        {last.p}%
      </text>
    </svg>
  );
}

/**
 * シナリオ 3 本の確率を 1 本の積み上げバーで見せる (base/bull/bear)。
 */
export function ScenarioStack({
  base,
  bull,
  bear,
}: {
  base: number;
  bull: number;
  bear: number;
}) {
  // 合計が 100 に揃わなくても見た目だけ正規化
  const total = Math.max(base + bull + bear, 1);
  const b1 = (bull / total) * 100;
  const b2 = (base / total) * 100;
  const b3 = (bear / total) * 100;
  return (
    <div className="h-2.5 rounded-full overflow-hidden flex bg-neutral-100">
      <div className="h-full bg-emerald-500" style={{ width: `${b1}%` }} />
      <div className="h-full bg-neutral-400" style={{ width: `${b2}%` }} />
      <div className="h-full bg-rose-500" style={{ width: `${b3}%` }} />
    </div>
  );
}
