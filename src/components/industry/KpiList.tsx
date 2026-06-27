import type { Kpi } from "@/content/industries";
import { Disclose } from "@/components/Disclose";

/**
 * 業界 KPI のディスクロージャ付きリスト。
 */
export function KpiList({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="bg-surface border border-border rounded-md divide-y divide-border">
      {kpis.map((kpi) => (
        <div key={kpi.name} className="px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-1 md:gap-6 items-baseline">
            <div className="font-bold text-sm">{kpi.name}</div>
            <div className="text-sm tabular">{kpi.current}</div>
          </div>
          <div className="md:pl-[244px]">
            <Disclose label="これは何？">
              <p className="text-muted-foreground leading-relaxed">{kpi.desc}</p>
            </Disclose>
            {kpi.history && kpi.history.length > 0 && (
              <Disclose label="推移を見る">
                <ul className="space-y-1.5">
                  {kpi.history.map((h, j) => (
                    <li
                      key={j}
                      className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_180px_1fr] items-baseline gap-2 py-1 border-b border-border last:border-b-0"
                    >
                      <span className="text-foreground/60 text-xs tabular">{h.period}</span>
                      <span className="tabular font-mono">{h.value}</span>
                      {h.note && (
                        <span className="text-[11px] text-muted-foreground col-span-2 sm:col-span-1">
                          {h.note}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Disclose>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
