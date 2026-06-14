import Link from "next/link";
import type { Industry } from "@/lib/industries";
import { formatTrillionFromOku } from "@/lib/format";

type Coverage = {
  industry: Industry;
  agg: { count: number; totalMcap: number; avgPer: number };
};

export function CoverageMap({
  coverage,
  totalStocks,
}: {
  coverage: Coverage[];
  totalStocks: number;
}) {
  const maxMcap = Math.max(...coverage.map((c) => c.agg.totalMcap));
  return (
    <section className="mb-16 pt-12 border-t border-border">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Coverage Map
          </p>
          <h2 className="text-2xl font-bold tracking-tight">業界カバレッジ — {totalStocks} 社 / {coverage.length} 業界</h2>
        </div>
        <Link href="/industries" className="text-sm text-muted hover:text-foreground transition">
          業界一覧へ →
        </Link>
      </div>
      <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
        現在カバーする業界と、業界ごとの集計バリュエーション。バーは時価総額合計の相対スケール。
        クリックで競争構造マップ・主要 KPI・関連銘柄が見られます。
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {coverage.map(({ industry, agg }) => (
          <Link
            key={industry.slug}
            href={`/industries/${industry.slug}`}
            className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong hover:bg-surface-elev transition group"
          >
            <div className="flex items-baseline justify-between mb-2">
              <div className="font-bold text-sm group-hover:underline">{industry.shortName}</div>
              <div className="text-[10px] text-dim tabular">{agg.count} 社</div>
            </div>
            <div className="text-[10px] mb-2">
              <div className="text-dim">平均 PER</div>
              <div className="tabular font-mono font-bold">{agg.avgPer.toFixed(1)}</div>
            </div>
            <div className="text-[10px] text-muted tabular">
              時価総額 {formatTrillionFromOku(agg.totalMcap)}
            </div>
            <div className="h-1 bg-border rounded-sm mt-1 overflow-hidden">
              <div
                className="h-full bg-foreground/60"
                style={{ width: `${(agg.totalMcap / maxMcap) * 100}%` }}
              />
            </div>
            <div className="mt-2 pt-2 border-t border-border text-[10px] text-dim group-hover:text-foreground transition flex items-center justify-end gap-1">
              競争構造を見る <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
