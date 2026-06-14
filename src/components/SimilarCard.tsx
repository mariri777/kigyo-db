import Link from "next/link";
import type { SimilarStock } from "@/domain/types";
import { ScoreBar } from "./ScoreBar";

export function SimilarCard({ s, scoreLabel = "類似度" }: { s: SimilarStock; scoreLabel?: string }) {
  return (
    <Link
      href={`/stocks/${s.stock.code}`}
      className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] text-dim tabular">{s.stock.code}</div>
          <div className="font-medium leading-tight group-hover:text-accent transition">{s.stock.name}</div>
          <div className="text-[11px] text-muted mt-0.5">{s.stock.industryCluster}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-dim">{scoreLabel}</div>
          <div className="text-lg font-bold tabular text-accent leading-none">{s.score}</div>
        </div>
      </div>
      <div className="mt-3">
        <ScoreBar score={s.score} />
      </div>
      <p className="text-[12px] text-muted mt-3 leading-relaxed">{s.reason}</p>
    </Link>
  );
}
