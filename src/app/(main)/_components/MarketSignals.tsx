import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";

import { SIGNAL_META } from "../articles/_lib/signals";
import type { Subject as ArticleSubject } from "../articles/_lib/posts";
import type { HighlightView } from "../_lib/homeData";
import { ArticleSubjectChip } from "./ArticleSubjectChip";

export function MarketSignals({
  highlights,
  today,
}: {
  highlights: HighlightView[];
  today: string | null;
}) {
  return (
    <section id="signals" className="scroll-mt-20" aria-label="本日のハイライト">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">本日のハイライト</h2>
        {today && (
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
            {today}
          </span>
        )}
      </div>
      {highlights.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          本日のハイライトは集計中です。市場の動きを反映してまもなく更新されます。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
          {highlights.map((h) => (
            <li key={h.id}>
              <SignalRow highlight={h} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignalRow({ highlight: h }: { highlight: HighlightView }) {
  const meta = SIGNAL_META[h.kind];
  const MetaIcon = meta.icon;
  const positive = h.keyMetric.positive;
  const subject: ArticleSubject =
    h.subjectKind === "company" && h.subjectCode
      ? { kind: "company", code: h.subjectCode, name: h.subjectName.replace(/^\d{4}\s*/, "") }
      : h.subjectKind === "industry"
        ? { kind: "industry", slug: "industry", name: h.subjectName }
        : h.subjectKind === "theme"
          ? { kind: "theme", slug: "theme", name: h.subjectName }
          : { kind: "metric", slug: "metric", name: h.subjectName };
  const href = h.relatedHref ?? "/articles";
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-neutral-50 transition"
    >
      <div className="text-[10px] font-mono tabular text-neutral-500 w-12 shrink-0">
        {h.publishedAt}
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600 w-28 shrink-0">
        <MetaIcon className="w-3 h-3" />
        {meta.label}
      </div>
      <ArticleSubjectChip subject={subject} compact />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-neutral-800 leading-snug line-clamp-1 group-hover:text-neutral-900">
          {h.oneLiner}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className={`font-mono tabular text-sm font-black tracking-tight inline-flex items-center gap-0.5 ${
            positive === null
              ? "text-neutral-900"
              : positive
                ? "text-emerald-600"
                : "text-rose-600"
          }`}
        >
          {positive === true && <TrendingUp className="w-3 h-3" />}
          {positive === false && <TrendingDown className="w-3 h-3" />}
          {h.keyMetric.value}
        </div>
        <div className="text-[9px] text-neutral-500 font-mono">{h.keyMetric.label}</div>
      </div>
      {h.relatedHref && h.relatedHref.startsWith("/articles/") && (
        <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-widest text-emerald-700 shrink-0">
          解釈あり
        </span>
      )}
    </Link>
  );
}
