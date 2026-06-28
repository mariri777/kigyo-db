/**
 * /forecasts と /forecasts/[id] で共有する可視化部品。
 * Server Component 互換 (純粋 SVG)。
 */
import { Activity, TrendingDown, TrendingUp } from "lucide-react";

import type { ForecastShiftPoint } from "@/server/repo/forecastRepo";

export function VerdictGlyph({ tone, size = "md" }: { tone: "up" | "down" | "neutral"; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const iconSize = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  if (tone === "up") {
    return (
      <div className={`${dim} rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm`}>
        <TrendingUp className={iconSize} strokeWidth={2.5} />
      </div>
    );
  }
  if (tone === "down") {
    return (
      <div className={`${dim} rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm`}>
        <TrendingDown className={iconSize} strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full bg-neutral-500 text-white flex items-center justify-center shadow-sm`}>
      <Activity className={iconSize} strokeWidth={2.5} />
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

export function ProbabilityGauge({ probability }: { probability: number }) {
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
          <TrendingUp className="w-3 h-3" />
          上がる <span className="font-mono tabular">{p}%</span>
        </span>
        <span className="text-rose-700 inline-flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          下がる <span className="font-mono tabular">{inverse}%</span>
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
  tone: "up" | "down" | "neutral";
  variant?: "card" | "wide";
}) {
  if (shifts.length < 2) return null;
  const W = variant === "wide" ? 720 : 320;
  const H = variant === "wide" ? 120 : 56;
  const probs = shifts.map((s) => s.probability);
  const min = Math.min(...probs, 30);
  const max = Math.max(...probs, 70);
  const span = Math.max(max - min, 1);
  const stroke = tone === "up" ? "#10b981" : tone === "down" ? "#f43f5e" : "#737373";
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
