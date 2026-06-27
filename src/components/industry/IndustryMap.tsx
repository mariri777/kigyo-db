import Link from "next/link";
import type { Industry } from "@/content/industries";
import { getStocksForCluster } from "@/content/industries";
import type { StockBrief } from "@/domain/types";
import { ROUTES } from "@/shared/links";

/**
 * 業界マップ:バリューチェーン列にサブクラスタを並べたグリッド。
 */
export function IndustryMap({
  industry,
  briefsByCode,
}: {
  industry: Industry;
  briefsByCode: Map<string, StockBrief>;
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {industry.chainColumns.map((col) => {
        const subs = industry.subClusters.filter((s) => col.positions.includes(s.position));
        return (
          <div key={col.title} className="bg-surface border border-border rounded-md p-5">
            <div className="border-b border-border pb-3 mb-4">
              <div className="text-[11px] text-foreground/60 tracking-wider">{col.subtitle}</div>
              <h3 className="text-xl font-bold mt-1">{col.title}</h3>
            </div>
            <div className="space-y-4">
              {subs.map((sub) => {
                const stocks = getStocksForCluster(sub, briefsByCode);
                return (
                  <div key={sub.key}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm">{sub.name}</h4>
                      <span className="text-[10px] text-foreground/60 tabular">{stocks.length} 社</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{sub.role}</p>
                    <div className="flex flex-wrap gap-1">
                      {stocks.map((s) => (
                        <Link
                          key={s.code}
                          href={`${ROUTES.stocks}/${s.code}`}
                          className="inline-flex items-center gap-1 text-[11px] border border-border rounded px-2 py-0.5 hover:bg-surface-elev hover:border-border-strong transition"
                        >
                          <span className="text-foreground/60 tabular">{s.code}</span>
                          <span className="font-medium">{s.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
