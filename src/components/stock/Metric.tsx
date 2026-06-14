import type { ReactNode } from "react";

/** 銘柄ページのキー指標カード。 */
export function Metric({
  label,
  labelNode,
  value,
  sub,
  tone,
  accent,
}: {
  label?: string;
  labelNode?: ReactNode;
  value: string;
  sub: string;
  tone?: "positive" | "negative";
  accent?: boolean;
}) {
  const valueClass =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : accent
          ? "text-accent"
          : "text-foreground";
  return (
    <div className="bg-surface border border-border rounded-md px-3 py-2">
      <div className="text-[10px] text-dim tracking-wider">{labelNode ?? label}</div>
      <div className={`text-lg font-bold tabular font-mono ${valueClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-dim">{sub}</div>}
    </div>
  );
}
