import Link from "next/link";
import { CROSS_INDUSTRY_PAIRS } from "@/content/homeHighlights";

export function CrossIndustryPairsSection() {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Cross-Industry Discoveries
          </p>
          <h2 className="text-2xl font-bold tracking-tight">AI 注目発見 — 業種を越えた事業類似</h2>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-3xl">
        表面的な業種分類では見えない、ビジネスモデル・収益構造・参入障壁の類似性を AI が抽出。
        スクリーニングでは出てこない「分散して見える、実は同じ要因に動かされる」ペアを発見します。
      </p>
      <div className="grid lg:grid-cols-3 gap-3">
        {CROSS_INDUSTRY_PAIRS.map((pair) => (
          <div key={pair.theme} className="bg-surface border border-border rounded-md p-4">
            <div className="text-[10px] text-foreground font-bold tracking-[0.15em] uppercase mb-3">
              {pair.theme}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/stocks/${pair.aCode}`}
                className="flex-1 block bg-surface-elev border border-border rounded p-2 hover:border-border-strong transition group"
              >
                <div className="text-[10px] text-foreground/60 tabular mb-0.5">{pair.aCode}</div>
                <div className="text-sm font-bold leading-tight group-hover:underline">{pair.aName}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{pair.aIndustry}</div>
              </Link>
              <div className="text-foreground/60 text-xs shrink-0">×</div>
              <Link
                href={`/stocks/${pair.bCode}`}
                className="flex-1 block bg-surface-elev border border-border rounded p-2 hover:border-border-strong transition group"
              >
                <div className="text-[10px] text-foreground/60 tabular mb-0.5">{pair.bCode}</div>
                <div className="text-sm font-bold leading-tight group-hover:underline">{pair.bName}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{pair.bIndustry}</div>
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{pair.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
