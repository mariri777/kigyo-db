// ─────────────────────────────────────────────────────────
// マーケット表示用の小さなUIアトム
//   - <Sparkline>:    軽量SVGスパークライン
//   - <QuoteTicker>:  「いま動いている」をフラッシュ感込みで表示
//   - <LivePulse>:    LIVE ステータスドット
// ─────────────────────────────────────────────────────────

import { TrendingUp, TrendingDown } from "lucide-react";
import type { Quote } from "./marketData";

// ─── Sparkline ────────────────────────────────────────
export function Sparkline({
  data,
  positive,
  width = 80,
  height = 22,
}: {
  data: readonly number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((d, i) => `${(i * step).toFixed(1)},${(height - ((d - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");
  const stroke = positive ? "#10b981" : "#f43f5e";
  // 末端の位置 (現在値マーカー)
  const lastX = (data.length - 1) * step;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="overflow-visible shrink-0"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 末端のドット (LIVEっぽさを出す) */}
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} className="motion-safe:animate-pulse" />
    </svg>
  );
}

// ─── QuoteTicker (sparkline + 数値 + 矢印) ────────────
export function QuoteTicker({
  quote,
  density = "default",
}: {
  quote: Quote;
  /** "compact" は数値だけ、 "default" は spark + 数値 + 矢印 */
  density?: "default" | "compact";
}) {
  const Icon = quote.positive ? TrendingUp : TrendingDown;
  const color = quote.positive ? "text-emerald-600" : "text-rose-600";
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {density === "default" && (
        <Sparkline data={quote.spark} positive={quote.positive} />
      )}
      <span className="font-mono tabular text-[13px] font-bold tracking-tight text-neutral-900">
        {quote.value}
      </span>
      <span className={`inline-flex items-center gap-0.5 font-mono tabular text-[11px] font-bold ${color}`}>
        <Icon className="w-3 h-3" />
        {quote.change}
      </span>
    </span>
  );
}

// ─── LIVE Pulse ───────────────────────────────────────
export function LivePulse({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-500">
      <span className="relative w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full bg-rose-500 motion-safe:animate-ping opacity-60" />
        <span className="absolute inset-0 rounded-full bg-rose-500" />
      </span>
      {label}
    </span>
  );
}
