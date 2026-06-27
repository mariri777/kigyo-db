import type { Prediction } from "@/content/predictions";
import { Countdown } from "@/components/Countdown";
import { Disclose } from "@/components/Disclose";
import { VoteButtons } from "@/components/VoteButtons";
import { DisclosurePanel } from "@/components/predictions/DisclosurePanel";
import { LearningPanels } from "@/components/predictions/LearningPanels";
import { ProbabilityBars } from "@/components/predictions/ProbabilityBars";
import { ResolutionPanel } from "@/components/predictions/ResolutionPanel";
import { eventLabelFull } from "@/domain/predictionLabels";
import { formatShortDateTime } from "@/shared/format";

/**
 * 予測カード = 学習カード。
 *
 * 表示モード:
 *   - upcoming/live: 予測可能、確率と動いた瞬間を表示
 *   - resolved:      結果と「教訓」を表示
 *
 * 個別の disclosure/学習/結果セクションは `components/predictions/` に分離してある。
 */
export function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const isResolved = p.status === "resolved" && p.resolution;
  const aiPickChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);

  return (
    <div className="border-2 border-foreground rounded-md bg-surface overflow-hidden">
      <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase">
            {p.status === "live" ? "🔴 LIVE" : isResolved ? "✓ Resolved" : "Upcoming"}
          </span>
          <span className="text-[11px] text-background/70">|</span>
          <span className="text-[11px] text-background/80">{eventLabelFull(p.eventType)}</span>
        </div>
        {!isResolved && (
          <div className="bg-background text-foreground px-2.5 py-1 rounded-sm">
            <Countdown target={p.deadlineAt} />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="text-[11px] text-muted-foreground mb-2 tracking-wide">{p.eventName}</div>
        <h3 className="text-base sm:text-lg font-bold leading-snug tracking-tight mb-1">
          Q. {p.question}
        </h3>
        {p.questionNote && (
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">{p.questionNote}</p>
        )}

        {p.disclosureDetail && <DisclosurePanel detail={p.disclosureDetail} />}

        <div className="mt-4 mb-3">
          <ProbabilityBars choices={p.choices} aiPick={p.aiReasoning.pick} />
        </div>

        {aiPickChoice && !isResolved && (
          <div className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border border-foreground bg-ai-soft" />
            AI の見立て:<span className="font-bold text-foreground">{aiPickChoice.label}</span>
            <span className="text-foreground/60">(確信度 {p.aiReasoning.confidence}%)</span>
          </div>
        )}

        {isResolved && p.resolution && (
          <div className="mt-4 mb-4 border border-foreground bg-muted px-4 py-3 rounded-sm">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
              結果 / Result
            </div>
            <div className="text-lg font-bold mb-1">{p.resolution.outcomeLabel}</div>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span className="text-[11px] text-foreground/60">
                {formatShortDateTime(p.resolution.resolvedAt)}
              </span>
              {aiPickChoice && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                    p.aiReasoning.pick === p.resolution.outcomeKey
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground border border-foreground"
                  }`}
                >
                  AI: {aiPickChoice.label}
                  <span className="ml-1">
                    {p.aiReasoning.pick === p.resolution.outcomeKey ? "✓ 的中" : "✗ 外し"}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {p.shifts.length > 0 && !isResolved && (
          <Disclose label={`動いた瞬間(${p.shifts.length} 件)を見る`} openLabel="折りたたむ">
            <ul className="space-y-2 text-[13px]">
              {p.shifts.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[10px] text-foreground/60 tabular mt-1 shrink-0 w-24">
                    {formatShortDateTime(s.at)}
                  </span>
                  <span
                    className={`text-[11px] font-bold tabular shrink-0 w-12 ${
                      s.delta >= 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.delta >= 0 ? "+" : ""}
                    {s.delta}pp
                  </span>
                  <span className="text-muted-foreground">{s.reason}</span>
                </li>
              ))}
            </ul>
          </Disclose>
        )}

        <LearningPanels prediction={p} />

        {isResolved && p.resolution && <ResolutionPanel resolution={p.resolution} />}

        <VoteButtons prediction={p} />

        <p className="text-[10px] text-foreground/60 mt-5 pt-4 border-t border-border leading-relaxed">
          ※ 本予測は編集部 + AI による公開情報ベースの予測であり、投資助言・投資推奨ではありません。投資判断はご自身の責任で行ってください。
        </p>
      </div>
    </div>
  );
}
