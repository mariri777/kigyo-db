import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ArrowUpRight,
  Building2,
  Globe,
  Sparkles,
  Activity,
} from "lucide-react";
import { getDb } from "@/server/db/client";
import { listAll } from "@/server/repo/articleRepo";
import { ANGLE_META, angleFromCategorySlug, type Subject } from "./_lib/posts";
import { ArticlesView, type PostListItem } from "./_ArticlesView";
import { resolveMediaSrc, shouldSkipImageOptimization } from "@/shared/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI銘柄分析・業界深掘り記事",
  description:
    "決算解釈・業界深掘り・テーマ分析・入門記事まで、AIと編集部が日本株の見落とし論点を掘り下げる記事一覧。",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "AI銘柄分析・業界深掘り記事 | 超!企業DB",
    description:
      "決算解釈・業界深掘り・テーマ分析・入門記事まで、AIと編集部が日本株の見落とし論点を掘り下げる記事一覧。",
    url: "/articles",
    type: "website",
  },
};


export default async function ArticlesIndex() {
  const db = await getDb();
  const rows = await listAll(db);
  const published = rows.filter((r) => r.status === "published");

  if (published.length === 0) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-5 space-y-6">
          <Breadcrumb />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">記事</h1>
          <EmptyState />
        </div>
      </div>
    );
  }

  const items: PostListItem[] = published.map((r) => ({
    slug: r.slug,
    title: r.title,
    lede: r.lede,
    publishedAt: r.publishedAt ?? r.updatedAt.slice(0, 10),
    publishedAtIso: r.publishedAt ?? r.updatedAt,
    readMin: r.readMinutes,
    image: r.heroImageKey ?? undefined,
    subject: buildSubject(r.subjectKind, r.subjectRef, r.subjectName),
    angleSlug: r.categorySlug,
    tagLabels: [],
    industry: null,
  }));

  const [today, ...rest] = items;

  const categories = Array.from(
    items.reduce((m, p) => {
      m.set(p.angleSlug, (m.get(p.angleSlug) ?? 0) + 1);
      return m;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const key = angleFromCategorySlug(slug);
      return {
        key: slug,
        label: key ? ANGLE_META[key].label : slug,
        count,
      };
    });

  // 関連業界は subjectKind が industry のものだけ集計
  const industryMap = new Map<string, number>();
  for (const it of items) {
    if (it.subject.kind === "industry") {
      industryMap.set(it.subject.name, (industryMap.get(it.subject.name) ?? 0) + 1);
    }
  }
  const industries = Array.from(industryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-5 space-y-6">
        <Breadcrumb />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">記事</h1>
        <TodayHero post={today} />
        <ArticlesView
          posts={rest}
          themes={[]}
          categories={categories}
          industries={industries}
        />
      </div>
    </div>
  );
}

function buildSubject(
  kind: "company" | "industry" | "theme" | "metric",
  ref: string,
  name: string,
): Subject {
  switch (kind) {
    case "company":
      return { kind: "company", code: ref, name };
    case "industry":
      return { kind: "industry", slug: ref, name };
    case "theme":
      return { kind: "theme", slug: ref, name };
    case "metric":
      return { kind: "metric", slug: ref, name };
  }
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
      <p className="text-sm text-neutral-600">まだ公開された記事がありません。</p>
      <Link
        href="/admin/articles"
        className="inline-block mt-3 text-xs font-bold text-neutral-900 hover:underline"
      >
        管理画面で記事を作成 →
      </Link>
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" />
        ホーム
      </Link>
      <span>/</span>
      <span className="text-neutral-900 font-semibold">記事</span>
    </nav>
  );
}

function TodayHero({ post }: { post: PostListItem }) {
  const angleKey = angleFromCategorySlug(post.angleSlug);
  const angle = angleKey
    ? { label: ANGLE_META[angleKey].label, color: ANGLE_META[angleKey].color }
    : { label: post.angleSlug, color: "bg-neutral-100 text-neutral-700" };
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="group block rounded-2xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
        <div className="p-5 sm:p-7 flex flex-col gap-3 min-w-0 order-2 md:order-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
            >
              {angle.label}
            </span>
            <SubjectChip subject={post.subject} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 ml-auto">
              {post.publishedAt} · {post.readMin}分
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-snug group-hover:text-neutral-900">
            {post.title}
          </h2>
          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed line-clamp-3">
            {post.lede}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-neutral-900 group-hover:gap-2 transition-all">
            読む <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="relative aspect-[16/10] md:aspect-auto bg-neutral-100 order-1 md:order-2">
          {post.image && (() => {
            const src = resolveMediaSrc(post.image, { w: 640, h: 480 }) ?? "";
            return (
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 768px) 320px, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
                unoptimized={shouldSkipImageOptimization(src)}
              />
            );
          })()}
        </div>
      </div>
    </Link>
  );
}

function SubjectChip({ subject }: { subject: Subject }) {
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
      {meta.label}: {text}
    </span>
  );
}
