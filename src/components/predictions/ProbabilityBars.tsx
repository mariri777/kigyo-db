import type { PredictionChoice } from "@/content/predictions";
import { Term } from "@/components/Term";

const BAR_TONE = [
  "bg-foreground text-background",
  "bg-foreground/35 text-foreground",
  "bg-foreground/10 text-foreground",
] as const;

const LEGEND_SWATCH = [
  "bg-foreground",
  "bg-foreground/35",
  "bg-foreground/10 border border-foreground/30",
] as const;

/**
 * Yes/No (2 値) または 3 択の確率帯と凡例を描画。AI が選んだ choice に印を付ける。
 */
export function ProbabilityBars({
  choices,
  aiPick,
}: {
  choices: PredictionChoice[];
  aiPick: string;
}) {
  return (
    <div>
      <div className="flex h-6 w-full border border-foreground rounded-sm overflow-hidden mb-2">
        {choices.map((c, i) => (
          <div
            key={c.key}
            className={`flex items-center justify-center text-[11px] font-bold tabular ${
              BAR_TONE[i] ?? BAR_TONE[2]
            }`}
            style={{ width: `${c.probability}%` }}
          >
            {c.probability >= 12 ? `${c.probability}%` : ""}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
        {choices.map((c, i) => {
          const delta =
            c.probabilityWeekAgo !== undefined
              ? c.probability - c.probabilityWeekAgo
              : undefined;
          const isAiPick = c.key === aiPick;
          return (
            <div key={c.key} className="flex items-start gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 mt-1 shrink-0 ${
                  LEGEND_SWATCH[i] ?? LEGEND_SWATCH[2]
                }`}
              />
              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold">{c.label}</span>
                  {isAiPick && (
                    <span className="text-[9px] tracking-wider text-muted-foreground">AI</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="tabular font-mono text-sm font-bold">{c.probability}%</span>
                  {delta !== undefined && delta !== 0 && (
                    <span
                      className={`text-[10px] tabular ${
                        delta > 0 ? "text-foreground" : "text-muted-foreground"
                      }`}
                      title="pp = パーセンテージポイント。確率の差を表す単位。"
                    >
                      ({delta > 0 ? "+" : ""}
                      {delta}
                      <Term term="pp">pp</Term> / 1 週間)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
