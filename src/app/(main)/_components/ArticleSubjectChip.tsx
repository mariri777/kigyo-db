import { Activity, Building2, Sparkles, type Cpu } from "lucide-react";

import type { Subject as ArticleSubject } from "../articles/_lib/posts";

const SUBJECT_META: Record<
  ArticleSubject["kind"],
  { icon: typeof Cpu; label: string; color: string }
> = {
  company: {
    icon: Building2,
    label: "企業",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  industry: {
    icon: Building2,
    label: "業界",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  theme: {
    icon: Sparkles,
    label: "テーマ",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  metric: {
    icon: Activity,
    label: "指標",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
};

export function ArticleSubjectChip({
  subject,
  compact = false,
}: {
  subject: ArticleSubject;
  compact?: boolean;
}) {
  const meta = SUBJECT_META[subject.kind];
  const Icon = meta.icon;
  const text =
    subject.kind === "company" ? `${subject.code} ${subject.name}` : subject.name;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${meta.color}`}
    >
      <Icon className="w-3 h-3" />
      {compact ? text : `${meta.label}: ${text}`}
    </span>
  );
}
