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
import {
  postsSorted,
  themeEntries,
  ANGLE_META,
  type Post,
  type Subject,
} from "./_lib/posts";
import { ArticlesView } from "./_ArticlesView";

export const metadata: Metadata = {
  title: "記事 — v2",
  description: "企業DBに紐づく解釈と分析記事。",
  robots: { index: false, follow: false },
};

function unsplashUrl(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "75" });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/${id}?${p.toString()}`;
}

export default function ArticlesIndex() {
  const all = postsSorted();
  const [today, ...rest] = all;

  // Server→Client 境界では関数 (LucideIcon コンポーネント) を渡せないため、
  // 純粋なデータだけのshape (PostListItem / ThemeChip) に整形する。
  const postsForClient = rest.map((p) => ({
    slug: p.slug,
    angle: p.angle,
    title: p.title,
    subject: p.subject,
    lede: p.lede,
    publishedAt: p.publishedAt,
    publishedAtIso: p.publishedAtIso,
    readMin: p.readMin,
    image: p.image,
    tagLabels: p.tags.map((t) => t.label),
    industry: inferIndustry(p.subject),
  }));
  const themeChips = themeEntries.map((t) => ({
    slug: t.slug,
    name: t.name,
    count: t.count.posts,
  }));

  // カテゴリ (=angle) の件数
  const categories = (
    ["earnings", "industry_overview", "theme_dive", "primer"] as const
  ).map((key) => ({
    key,
    label: ANGLE_META[key].label,
    count: rest.filter((p) => p.angle === key).length,
  }));

  // 業界 (主役の subject.kind === "industry" もしくは企業の場合は所属業界)
  // モックでは記事に直接「業界名」が紐付けられないので、登場した業界・企業名から
  // 簡易マップで集計する。
  const industryCounts = new Map<string, number>();
  for (const p of rest) {
    const ind = inferIndustry(p.subject);
    if (!ind) continue;
    industryCounts.set(ind, (industryCounts.get(ind) ?? 0) + 1);
  }
  const industries = [...industryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-5 space-y-6">
        <Breadcrumb />

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">記事</h1>

        <TodayHero post={today} />

        <ArticlesView
          posts={postsForClient}
          themes={themeChips}
          categories={categories}
          industries={industries}
        />
      </div>
    </div>
  );
}

/** 主役から所属業界名を推定 (モック)。実運用ではDBから引く。 */
function inferIndustry(subject: Subject): string | null {
  if (subject.kind === "industry") return subject.name;
  if (subject.kind === "company") {
    const map: Record<string, string> = {
      "9984": "情報・通信",
      "6594": "電気機器",
      "8058": "総合商社",
      "8035": "電気機器",
      "7203": "輸送用機器",
      "9501": "電気・ガス",
      "9983": "小売",
    };
    return map[subject.code] ?? null;
  }
  if (subject.kind === "theme") {
    // テーマ深掘り記事は業界に紐付けない (テーマrailで拾う)
    return null;
  }
  if (subject.kind === "metric") return null;
  return null;
}

// ─────────────────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <nav className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
      <Link href="/v2" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" />
        v2 ホーム
      </Link>
      <span>/</span>
      <span className="text-neutral-900 font-semibold">記事</span>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// TodayHero (SSR; フィルタ対象外)
// ─────────────────────────────────────────────────────────

function TodayHero({ post }: { post: Post }) {
  const angle = ANGLE_META[post.angle];
  const AngleIcon = angle.icon;
  return (
    <Link
      href={`/v2/articles/${post.slug}`}
      className="group block rounded-2xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
        <div className="p-5 sm:p-7 flex flex-col gap-3 min-w-0 order-2 md:order-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
            >
              <AngleIcon className="w-3 h-3" />
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
          {post.image && (
            <Image
              src={unsplashUrl(post.image, 640, 480)}
              alt=""
              fill
              sizes="(min-width: 768px) 320px, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          )}
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
