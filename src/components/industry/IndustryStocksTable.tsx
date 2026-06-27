import Link from "next/link";
import type { Industry } from "@/content/industries";
import { getStocksForCluster } from "@/content/industries";
import type { StockBrief } from "@/domain/types";
import { ROUTES } from "@/shared/links";
import { formatPbrOpt, formatPct1Opt, formatPerOpt, formatPriceOpt } from "@/shared/format";

/**
 * 業界詳細ページのサブクラスタ別主要銘柄テーブル。
 */
export function IndustryStocksTable({
  industry,
  briefsByCode,
}: {
  industry: Industry;
  briefsByCode: Map<string, StockBrief>;
}) {
  return (
    <div className="space-y-8">
      {industry.subClusters.map((sub) => {
        const stocks = getStocksForCluster(sub, briefsByCode);
        if (stocks.length === 0) return null;
        return (
          <div key={sub.key}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-bold text-base">{sub.name}</h3>
              <span className="text-[11px] text-foreground/60">{stocks.length} 社</span>
            </div>
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <div className="hidden md:grid grid-cols-[70px_1fr_90px_70px_70px_90px] text-[11px] text-foreground/60 border-b border-border bg-surface-elev px-4 py-2">
                <div>コード</div>
                <div>銘柄</div>
                <div className="text-right">株価</div>
                <div className="text-right">PER</div>
                <div className="text-right">PBR</div>
                <div className="text-right">配当</div>
              </div>
              {stocks.map((s) => (
                <Link
                  key={s.code}
                  href={`${ROUTES.stocks}/${s.code}`}
                  className="grid grid-cols-1 md:grid-cols-[70px_1fr_90px_70px_70px_90px] gap-2 md:gap-0 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm"
                >
                  <div className="text-foreground/60 tabular text-xs">{s.code}</div>
                  <div>
                    <div className="font-medium group-hover:underline">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{s.sectorTSE}</div>
                  </div>
                  <div className="text-right tabular font-mono">{formatPriceOpt(s.priceJpy)}</div>
                  <div className="text-right tabular font-mono">{formatPerOpt(s.per)}</div>
                  <div className="text-right tabular font-mono">{formatPbrOpt(s.pbr)}</div>
                  <div className="text-right tabular font-mono">{formatPct1Opt(s.dividendYield)}</div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
