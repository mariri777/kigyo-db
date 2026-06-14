import Link from "next/link";
import type { ReactNode } from "react";
import type { Stock } from "@/domain/types";

/** 「割安」「拡大期」ハイライト共通カード。Badge とメトリクス 3 つを描画。 */
export function HighlightCard({
  stock,
  badge,
  metrics,
}: {
  stock: Stock;
  badge: ReactNode;
  metrics: { label: string; value: ReactNode }[];
}) {
  return (
    <Link
      key={stock.code}
      href={`/stocks/${stock.code}`}
      className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] text-dim tabular">{stock.code}</span>
        {badge}
      </div>
      <div className="font-bold leading-tight mb-1 group-hover:underline">{stock.name}</div>
      <div className="text-[11px] text-muted mb-3 truncate">{stock.industryCluster}</div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-dim">{m.label}</div>
            <div className="tabular font-mono font-bold">{m.value}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}
