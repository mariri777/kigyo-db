import type { Insight } from "@/domain/types";
import { Disclose } from "@/components/Disclose";
import { SourceList } from "@/components/SourceChip";
import { splitInsight } from "@/domain/insight";

/**
 * AI 抽出論点リスト。stocks/[code], industries/[slug] で共通利用可能。
 */
export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-4">
      {insights.map((ins, i) => {
        const { lede, rest } = splitInsight(ins);
        return (
          <div key={i} className="bg-surface border border-border rounded-md p-5">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-foreground/60 text-sm font-mono">0{i + 1}</span>
              <h3 className="font-bold leading-tight">{ins.title}</h3>
            </div>
            <p className="text-sm leading-relaxed">{lede}</p>
            {rest ? (
              <Disclose label="根拠と詳細を読む">
                <p className="text-muted-foreground leading-relaxed mb-3">{rest}</p>
                <SourceList sources={ins.citations} />
              </Disclose>
            ) : (
              <div className="mt-3">
                <SourceList sources={ins.citations} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
