"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  ArrowUpRight,
  Building2,
  Globe,
  Sparkles,
  Activity,
  Hash,
} from "lucide-react";
import { ANGLE_META, angleFromCategorySlug, type Subject } from "./_lib/posts";

/** _lib/posts.ts の Post / ThemeEntry は関数 (icon コンポーネント) を含むので、
 *  Server→Client 境界では渡せない。Client 用にプレーンな shape を定義する。 */
export type PostListItem = {
  slug: string;
  /** categories.name (例: "決算解釈"). ANGLE_META が対応していれば色も引ける */
  angleSlug: string;
  title: string;
  subject: Subject;
  lede: string;
  publishedAt: string;
  publishedAtIso: string;
  readMin: number;
  image?: string;
  tagLabels: string[];
  /** 推定業界名 (絞り込み用) */
  industry: string | null;
};
export type ThemeChip = { slug: string; name: string; count: number };
export type CategoryFacet = { key: string; label: string; count: number };
export type IndustryFacet = { name: string; count: number };

function unsplashUrl(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "75" });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/${id}?${p.toString()}`;
}

export function ArticlesView({
  posts,
  themes,
  categories,
  industries,
}: {
  posts: PostListItem[];
  themes: ThemeChip[];
  categories: CategoryFacet[];
  industries: IndustryFacet[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (selectedCategories.size > 0 && !selectedCategories.has(p.angleSlug)) return false;
      if (selectedIndustries.size > 0) {
        if (!p.industry || !selectedIndustries.has(p.industry)) return false;
      }
      if (q) {
        const haystack = [
          p.title,
          p.lede,
          p.subject.name,
          ...("code" in p.subject ? [p.subject.code] : []),
          ...p.tagLabels,
          p.industry ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [posts, query, selectedCategories, selectedIndustries]);

  const groups = useMemo(() => groupByDayInline(filtered), [filtered]);
  const activeFilterCount =
    (query ? 1 : 0) + selectedCategories.size + selectedIndustries.size;

  const toggleCategory = (a: string) =>
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  const toggleIndustry = (name: string) =>
    setSelectedIndustries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const clearAll = () => {
    setQuery("");
    setSelectedCategories(new Set());
    setSelectedIndustries(new Set());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-12">
      <main className="min-w-0">
        {activeFilterCount > 0 && (
          <ActiveFilterBar
            count={filtered.length}
            activeFilterCount={activeFilterCount}
            onClear={clearAll}
          />
        )}
        {groups.length === 0 ? (
          <EmptyResult onClear={clearAll} />
        ) : (
          <ol className="space-y-8">
            {groups.map((g) => (
              <li key={g.date}>
                <DayHeading label={g.label} iso={g.date} />
                <ul className="divide-y divide-neutral-200">
                  {g.items.map((p) => (
                    <li key={p.slug}>
                      <ArticleRow post={p} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </main>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-5">
          <SearchBox value={query} onChange={setQuery} />
          <FacetList
            title="カテゴリ"
            items={categories.map((c) => ({ key: c.key, label: c.label, count: c.count }))}
            selected={selectedCategories as Set<string>}
            onToggle={(k) => toggleCategory(k)}
          />
          <FacetList
            title="業界"
            items={industries.map((i) => ({ key: i.name, label: i.name, count: i.count }))}
            selected={selectedIndustries}
            onToggle={toggleIndustry}
          />
          <ThemeChips themes={themes} />
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 上部アクティブフィルタバー
// ─────────────────────────────────────────────────────────

function ActiveFilterBar({
  count,
  activeFilterCount,
  onClear,
}: {
  count: number;
  activeFilterCount: number;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs">
      <span className="font-mono tabular">
        {count} 件 ·{" "}
        <span className="text-neutral-300">フィルタ {activeFilterCount}</span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-[11px] font-bold hover:text-neutral-200 transition"
      >
        <X className="w-3 h-3" />
        クリア
      </button>
    </div>
  );
}

function EmptyResult({ onClear }: { onClear: () => void }) {
  return (
    <div className="py-12 text-center text-sm text-neutral-500">
      <p className="mb-3">条件に合う記事はありません。</p>
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-bold underline text-neutral-700 hover:text-neutral-900"
      >
        フィルタをクリア
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="article-search" className="sr-only">
        記事を検索
      </label>
      <div className="flex items-center bg-white border border-neutral-300 rounded-lg pl-2.5 pr-1 focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:border-neutral-500 transition">
        <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <input
          id="article-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="銘柄・キーワード"
          className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm placeholder:text-neutral-400 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1 text-neutral-400 hover:text-neutral-700 shrink-0"
            aria-label="クリア"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FacetList (カテゴリ / 業界 共用)
// ─────────────────────────────────────────────────────────

function FacetList({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { key: string; label: string; count: number }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-2">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {items.map((it) => {
          const on = selected.has(it.key);
          return (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => onToggle(it.key)}
                className={`group flex items-center gap-2 w-full px-2 py-1.5 -mx-2 rounded-lg text-left transition ${
                  on ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                }`}
              >
                <span className="text-sm font-medium truncate flex-1">{it.label}</span>
                <span
                  className={`font-mono tabular text-[10px] shrink-0 ${
                    on ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {it.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// テーマrail (チップ群)
// ─────────────────────────────────────────────────────────

function ThemeChips({ themes }: { themes: ThemeChip[] }) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-2">
        <Hash className="w-3 h-3 text-emerald-600" />
        テーマ
      </h3>
      <div className="flex flex-wrap gap-1">
        {themes.map((t) => (
          <Link
            key={t.slug}
            href="#"
            className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold transition inline-flex items-center gap-1"
          >
            {t.name}
            <span className="font-mono tabular text-[10px] opacity-60">{t.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Article row / DayHeading / SubjectChip
// ─────────────────────────────────────────────────────────

function DayHeading({ label, iso }: { label: string; iso: string }) {
  return (
    <div className="flex items-baseline gap-3 pb-2 mb-1 border-b-2 border-neutral-900">
      <h3 className="text-sm font-black tracking-widest uppercase">{label}</h3>
      <span className="text-[10px] font-mono tabular text-neutral-400 uppercase">{iso}</span>
    </div>
  );
}

function ArticleRow({ post }: { post: PostListItem }) {
  const angleKey = angleFromCategorySlug(post.angleSlug);
  const angle = angleKey
    ? ANGLE_META[angleKey]
    : { label: post.angleSlug, color: "bg-neutral-100 text-neutral-700", icon: null as null };
  return (
    <Link
      href={`/v2/articles/${post.slug}`}
      className="group flex items-start gap-3 sm:gap-4 py-4 hover:bg-neutral-100/40 -mx-2 px-2 rounded-lg transition"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
        {post.image && (
          <Image
            src={unsplashUrl(post.image, 160, 160)}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
          >
            {angle.icon && (() => {
              const Icon = angle.icon;
              return <Icon className="w-2.5 h-2.5" />;
            })()}
            {angle.label}
          </span>
          <SubjectChip subject={post.subject} compact />
        </div>
        <h4 className="text-[15px] sm:text-base font-bold tracking-tight leading-snug group-hover:text-neutral-900 line-clamp-2">
          {post.title}
        </h4>
        <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed line-clamp-2 mt-1">
          {post.lede}
        </p>
        <div className="mt-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {post.publishedAt.slice(5)} · {post.readMin}分
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition shrink-0 mt-1" />
    </Link>
  );
}

function SubjectChip({ subject, compact = false }: { subject: Subject; compact?: boolean }) {
  const map: Record<Subject["kind"], { icon: typeof Building2; label: string; color: string }> = {
    company: { icon: Building2, label: "企業", color: "text-blue-700 bg-blue-50 border-blue-100" },
    industry: { icon: Globe, label: "業界", color: "text-amber-700 bg-amber-50 border-amber-100" },
    theme: { icon: Sparkles, label: "テーマ", color: "text-purple-700 bg-purple-50 border-purple-100" },
    metric: { icon: Activity, label: "指標", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  };
  const meta = map[subject.kind];
  const Icon = meta.icon;
  const text = subject.kind === "company" ? `${subject.code} ${subject.name}` : subject.name;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${meta.color}`}
    >
      <Icon className="w-3 h-3" />
      {compact ? text : `${meta.label}: ${text}`}
    </span>
  );
}

// _lib/posts.ts の groupByDay と同等。Client用に inline 化 (関数の境界跨ぎを避ける)。
function groupByDayInline(
  list: PostListItem[]
): { label: string; date: string; items: PostListItem[] }[] {
  const map = new Map<string, PostListItem[]>();
  for (const p of list) {
    const date = p.publishedAtIso.slice(0, 10);
    const arr = map.get(date) ?? [];
    arr.push(p);
    map.set(date, arr);
  }
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  const today = "2026-06-28";
  const yesterday = "2026-06-27";
  return sortedKeys.map((date) => {
    let label: string;
    if (date === today) label = "今日";
    else if (date === yesterday) label = "昨日";
    else {
      const [, m, d] = date.split("-");
      label = `${Number(m)}/${Number(d)}`;
    }
    return { date, label, items: map.get(date)! };
  });
}
