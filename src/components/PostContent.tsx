import type { Block } from "@/content/posts";
import { Disclose } from "@/components/Disclose";

function renderBlock(b: Block, key: string) {
  switch (b.type) {
    case "p":
      return (
        <p key={key} className="text-[15px] leading-[1.9] my-4 text-foreground/90">
          {b.text}
        </p>
      );
    case "h2":
      return (
        <h2 key={key} className="text-2xl font-bold tracking-tight mt-12 mb-4 pb-2 border-b border-border">
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={key} className="text-lg font-bold tracking-tight mt-8 mb-3">
          {b.text}
        </h3>
      );
    case "callout":
      return (
        <aside
          key={key}
          className={`my-6 p-4 rounded-md border-l-2 ${
            b.tone === "warn"
              ? "bg-surface-elev border-foreground/30"
              : "bg-accent-soft border-foreground"
          }`}
        >
          {b.title && (
            <div className="text-[11px] font-bold tracking-widest text-muted mb-1">
              {b.title}
            </div>
          )}
          <p className="text-sm leading-relaxed">{b.text}</p>
        </aside>
      );
    case "ul":
      return (
        <ul key={key} className="my-4 space-y-2 list-disc pl-5">
          {b.items.map((item, i) => (
            <li key={i} className="text-[15px] leading-relaxed text-foreground/90">
              {item}
            </li>
          ))}
        </ul>
      );
    case "kv":
      return (
        <div key={key} className="my-5 bg-surface border border-border rounded-md divide-y divide-border">
          {b.pairs.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[160px_1fr] sm:grid-cols-[200px_1fr_1fr] items-baseline gap-3 px-4 py-3"
            >
              <div className="text-[12px] text-muted">{p.key}</div>
              <div className="text-base font-bold tabular font-mono">{p.value}</div>
              {p.sub && <div className="text-[11px] text-dim col-span-2 sm:col-span-1">{p.sub}</div>}
            </div>
          ))}
        </div>
      );
    case "quote":
      return (
        <blockquote
          key={key}
          className="my-6 pl-4 border-l-2 border-foreground/60 text-foreground/80 italic"
        >
          <p className="text-[15px] leading-relaxed">{b.text}</p>
          {b.cite && <cite className="block text-[11px] text-dim mt-2 not-italic">— {b.cite}</cite>}
        </blockquote>
      );
    case "disclose":
      return (
        <div key={key} className="my-5">
          <Disclose label={b.label}>
            <div className="border-l-2 border-border pl-4 -ml-1">
              {b.blocks.map((sub, i) => renderBlock(sub, `${key}-${i}`))}
            </div>
          </Disclose>
        </div>
      );
  }
}

export function PostContent({ blocks }: { blocks: Block[] }) {
  return <article className="max-w-2xl">{blocks.map((b, i) => renderBlock(b, `b${i}`))}</article>;
}
