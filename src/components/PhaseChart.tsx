import type { PhaseScores } from "@/lib/types";
import { PHASES } from "@/lib/phase";

export function PhaseChart({ scores, rationale }: { scores: PhaseScores; rationale: string }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="grid grid-cols-4 gap-3 mb-3">
        {PHASES.map((p) => {
          const v = scores[p.key];
          return (
            <div key={p.key} className="text-center">
              <div className="text-[11px] text-muted mb-2">{p.label}</div>
              <div className="relative h-24 bg-surface-elev border border-border rounded-sm overflow-hidden flex items-end">
                <div
                  className="w-full bg-foreground transition-all"
                  style={{ height: `${Math.max(v, 1)}%` }}
                />
                <div
                  className="absolute inset-x-0 bottom-1 text-center text-sm font-bold tabular"
                  style={{ color: v >= 40 ? "#fff" : "var(--foreground)" }}
                >
                  {v}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-muted leading-relaxed">{rationale}</p>
    </div>
  );
}
