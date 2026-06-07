import type { Source } from "@/lib/types";

export function SourceChip({ source }: { source: Source }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-dim border border-border rounded px-1.5 py-0.5 align-middle">
      <span className="text-accent">出典</span>
      <span>
        {source.doc}
        {source.page ? ` p.${source.page}` : ""}
      </span>
    </span>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <SourceChip key={i} source={s} />
      ))}
    </div>
  );
}
