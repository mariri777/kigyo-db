import type { IndustryInsight } from "@/content/industries";
import { Disclose } from "@/components/Disclose";
import { SourceList } from "@/components/SourceChip";

/**
 * 業界レベル見落とし論点リスト。InsightList と似ているが、citations が
 * `{ doc; period }` 形式の `IndustryInsight` 用なので別実装にしている。
 */
export function IndustryInsightList({ insights }: { insights: IndustryInsight[] }) {
  return (
    <div className="space-y-4">
      {insights.map((ins, i) => (
        <div key={i} className="bg-surface border border-border rounded-md p-5">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-foreground/60 text-sm font-mono">0{i + 1}</span>
            <h3 className="font-bold leading-tight">{ins.title}</h3>
          </div>
          <p className="text-sm leading-relaxed">{ins.lede}</p>
          <Disclose label="根拠を読む">
            <p className="text-muted-foreground leading-relaxed mb-3">{ins.body}</p>
            <SourceList
              sources={ins.citations.map((c) => ({ doc: c.doc, period: c.period }))}
            />
          </Disclose>
        </div>
      ))}
    </div>
  );
}
