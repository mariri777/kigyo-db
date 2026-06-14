import Link from "next/link";
import type { Stock } from "@/domain/types";
import { formatPct1Opt, formatSignedPct1Opt, formatPerOpt } from "@/shared/format";
import { HighlightCard } from "./HighlightCard";

export function ExpansionSection({ stocks }: { stocks: Stock[] }) {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Highlights — Expansion Phase
          </p>
          <h2 className="text-2xl font-bold tracking-tight">いま拡大期の銘柄</h2>
        </div>
        <Link href="/screens/expansion-phase" className="text-sm text-muted hover:text-foreground transition">
          拡大期銘柄一覧へ →
        </Link>
      </div>
      <p className="text-sm text-muted mb-3 leading-relaxed max-w-3xl">
        売上・利益が伸びる<strong className="text-foreground">成長フェーズ</strong>を AI が業界内正規化で判定。
      </p>
      <details className="mb-5 group">
        <summary className="text-[11px] text-dim hover:text-muted cursor-pointer inline-flex items-center gap-1 select-none">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          指標の見方
        </summary>
        <div className="text-[11px] text-dim leading-relaxed mt-2 pl-4 border-l border-border max-w-2xl space-y-1">
          <div><strong className="text-muted font-bold">売上成長</strong> 過去3年の年平均成長率</div>
          <div><strong className="text-muted font-bold">営業利益率</strong> 本業利益÷売上（15%超で優良）</div>
          <div><strong className="text-muted font-bold">PER</strong> 株価÷1株利益</div>
        </div>
      </details>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stocks.map((s) => (
          <HighlightCard
            key={s.code}
            stock={s}
            badge={
              <span className="text-[10px] text-foreground border border-foreground/40 bg-foreground/5 rounded px-1.5 py-0.5">
                拡大期
              </span>
            }
            metrics={[
              {
                label: "売上成長",
                value: (
                  <span
                    className={
                      s.revenueGrowth3y !== null && s.revenueGrowth3y >= 0
                        ? "text-positive"
                        : "text-negative"
                    }
                  >
                    {formatSignedPct1Opt(s.revenueGrowth3y)}
                  </span>
                ),
              },
              { label: "営業利益率", value: formatPct1Opt(s.operatingMargin) },
              { label: "PER", value: formatPerOpt(s.per) },
            ]}
          />
        ))}
      </div>
    </section>
  );
}
