import type { Stock } from "@/domain/types";

export type CompareRow = {
  label: string;
  get: (s: Stock) => string;
  tone?: (s: Stock) => "positive" | "negative" | undefined;
  /** ハイライト対象となる stock.code を返す。同点や算出不能なら undefined。 */
  highlight?: (stocks: Stock[]) => string | undefined;
};

const TONE_CLASS = {
  positive: "text-positive",
  negative: "text-negative",
} as const;

/** 「指標 × 銘柄」マトリクス。最良値の銘柄に `best` チップを付ける。 */
export function CompareTable({ rows, stocks }: { rows: CompareRow[]; stocks: Stock[] }) {
  const gridStyle = {
    gridTemplateColumns: `140px repeat(${stocks.length}, minmax(0, 1fr))`,
  };
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div
        className="grid items-center px-4 py-2 border-b border-border bg-surface-elev gap-3"
        style={gridStyle}
      >
        <div className="text-[11px] text-foreground/60">指標</div>
        {stocks.map((s) => (
          <div key={s.code} className="text-[11px] font-bold truncate">
            {s.name}
          </div>
        ))}
      </div>
      {rows.map((row) => {
        const highlightCode = row.highlight?.(stocks);
        return (
          <div
            key={row.label}
            className="grid items-baseline px-4 py-2.5 border-b border-border last:border-b-0 text-sm gap-3"
            style={gridStyle}
          >
            <div className="text-[12px] text-muted-foreground">{row.label}</div>
            {stocks.map((s) => {
              const tone = row.tone?.(s);
              const isHighlight = highlightCode === s.code;
              return (
                <div
                  key={s.code}
                  className={`tabular font-mono text-sm flex items-baseline gap-1.5 ${
                    tone ? TONE_CLASS[tone] : ""
                  }`}
                >
                  <span className={isHighlight ? "font-bold" : ""}>{row.get(s)}</span>
                  {isHighlight && (
                    <span className="text-[9px] uppercase tracking-wider text-foreground bg-foreground/10 border border-foreground/20 rounded px-1 py-0.5">
                      best
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
