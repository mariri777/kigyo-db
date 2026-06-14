import Link from "next/link";
import type { Prediction } from "@/content/predictions";

export function AiTrackRecordSection({
  totalPredictions,
  liveOrUpcoming,
  resolvedCount,
  hitCount,
  accuracy,
  recentResolved,
}: {
  totalPredictions: number;
  liveOrUpcoming: number;
  resolvedCount: number;
  hitCount: number;
  accuracy: number;
  recentResolved: Prediction[];
}) {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-1">
            AI Track Record
          </p>
          <h2 className="text-2xl font-bold tracking-tight">AI 予測の答え合わせ</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/predictions/track-record" className="text-muted-foreground hover:text-foreground transition">
            的中率の詳細 →
          </Link>
          <Link href="/predictions" className="text-muted-foreground hover:text-foreground transition">
            予測一覧 →
          </Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-3xl">
        決算ガイダンス・配当方針・適時開示などの結果を AI が事前に予測し、当たりも外れも公開しています。
        外れた予測には「学び」も記録 — 透明性を信頼の前提に。
      </p>

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <StatPanel label="全予測" value={`${totalPredictions}`} suffix="件" />
        <StatPanel label="進行中" value={`${liveOrUpcoming}`} suffix="件" />
        <StatPanel label="答え合わせ済み" value={`${resolvedCount}`} suffix="件" />
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] text-foreground/60 font-bold tracking-[0.15em] uppercase mb-1">的中率</div>
          <div className="text-2xl font-bold tabular text-positive">
            {accuracy.toFixed(0)}<span className="text-sm ml-1">%</span>
            <span className="text-[11px] text-muted-foreground font-normal ml-2">({hitCount}/{resolvedCount})</span>
          </div>
        </div>
      </div>

      {recentResolved.length > 0 && (
        <div>
          <p className="text-[11px] text-foreground/60 font-bold tracking-[0.15em] uppercase mb-2">最近の答え合わせ</p>
          <div className="space-y-2">
            {recentResolved.map((p) => {
              const isHit = p.resolution?.outcomeKey === p.aiReasoning.pick;
              const aiChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);
              return (
                <Link
                  key={p.id}
                  href={`/predictions/${p.id}`}
                  className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold group-hover:underline">{p.eventName}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{p.question}</div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 rounded border ${
                        isHit
                          ? "text-positive border-positive/40 bg-positive/10"
                          : "text-negative border-negative/40 bg-negative/10"
                      }`}
                    >
                      {isHit ? "✓ 的中" : "✗ 外れ"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular">
                    <div>
                      <span className="text-foreground/60">AI 予測：</span>
                      <span className="font-bold">{aiChoice?.label ?? p.aiReasoning.pick}</span>
                      <span className="text-foreground/60 ml-1">（確信度 {p.aiReasoning.confidence}%）</span>
                    </div>
                    <div>
                      <span className="text-foreground/60">実際：</span>
                      <span className="font-bold">{p.resolution?.outcomeLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function StatPanel({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="text-[10px] text-foreground/60 font-bold tracking-[0.15em] uppercase mb-1">{label}</div>
      <div className="text-2xl font-bold tabular">
        {value}
        <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
      </div>
    </div>
  );
}
