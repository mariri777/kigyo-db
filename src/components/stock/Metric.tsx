import type { ReactNode } from "react";

const TONE_CLASS = {
  positive: "text-positive",
  negative: "text-negative",
} as const;

/** 銘柄ページのキー指標カード。 */
export function Metric({
  label,
  labelNode,
  value,
  sub,
  tone,
}: {
  label?: string;
  labelNode?: ReactNode;
  value: string;
  sub?: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <div className="bg-surface border border-border rounded-md px-3 py-2">
      <div className="text-[10px] text-foreground/60 tracking-wider">{labelNode ?? label}</div>
      <div
        className={`text-lg font-bold tabular font-mono ${tone ? TONE_CLASS[tone] : "text-foreground"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-foreground/60">{sub}</div>}
    </div>
  );
}
