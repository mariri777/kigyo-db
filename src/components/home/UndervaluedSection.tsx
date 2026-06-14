import Link from "next/link";
import type { Stock } from "@/lib/types";
import { formatPct1 } from "@/lib/format";
import { HighlightCard } from "./HighlightCard";

export function UndervaluedSection({ stocks }: { stocks: Stock[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Highlights — Undervalued
          </p>
          <h2 className="text-2xl font-bold tracking-tight">いま「割安」判定の銘柄</h2>
        </div>
        <Link href="/screens/undervalued" className="text-sm text-muted hover:text-foreground transition">
          割安銘柄一覧へ →
        </Link>
      </div>
      <p className="text-sm text-muted mb-3 leading-relaxed max-w-3xl">
        利益・資産から見て、株価が<strong className="text-foreground">割安水準</strong>と AI 総合判定。
      </p>
      <details className="mb-5 group">
        <summary className="text-[11px] text-dim hover:text-muted cursor-pointer inline-flex items-center gap-1 select-none">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          指標の見方
        </summary>
        <div className="text-[11px] text-dim leading-relaxed mt-2 pl-4 border-l border-border max-w-2xl space-y-1">
          <div><strong className="text-muted font-bold">PER</strong> 株価÷1株利益（市場平均15倍）</div>
          <div><strong className="text-muted font-bold">配当</strong> 年配当÷株価</div>
          <div><strong className="text-muted font-bold">ROE</strong> 純利益÷自己資本（10%超で優秀）</div>
        </div>
      </details>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stocks.map((s) => (
          <HighlightCard
            key={s.code}
            stock={s}
            badge={
              <span className="text-[10px] text-positive border border-positive/40 bg-positive/10 rounded px-1.5 py-0.5">
                {s.valuationCall.verdict}
              </span>
            }
            metrics={[
              { label: "PER", value: s.per.toFixed(1) },
              { label: "配当", value: formatPct1(s.dividendYield) },
              { label: "ROE", value: formatPct1(s.roe) },
            ]}
          />
        ))}
      </div>
    </section>
  );
}
