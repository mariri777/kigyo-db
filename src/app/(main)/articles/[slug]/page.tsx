import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  ArrowUpRight,
  Calendar,
  Building2,
  Globe,
  Sparkles,
  Activity,
} from "lucide-react";
import { getDb } from "@/server/db/client";
import {
  findBySlug,
  listByCategory,
  listBySubject,
  type ArticleListItem,
} from "@/server/repo/articleRepo";
import { extractToc, renderArticleContent } from "../_lib/contentRenderer";
import { loadTickerSnapshots } from "../_lib/serverData";
import { Toc } from "./_Toc";
import { resolveMediaSrc, shouldSkipImageOptimization } from "@/shared/media";

type SubjectKind = "company" | "industry" | "theme" | "metric";

export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const article = await findBySlug(db, slug);
  if (!article) return { title: "記事が見つかりません" };
  return {
    title: `${article.title}`,
    description: article.lede,
    robots: { index: false, follow: false },
  };
}

const ANGLE_META: Record<string, { label: string; color: string }> = {
  earnings: { label: "決算解釈", color: "bg-blue-50 text-blue-700" },
  industry_overview: { label: "業界俯瞰", color: "bg-amber-50 text-amber-700" },
  theme_dive: { label: "テーマ深掘り", color: "bg-purple-50 text-purple-700" },
  primer: { label: "プライマー", color: "bg-emerald-50 text-emerald-700" },
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await getDb();
  const article = await findBySlug(db, slug);
  if (!article) notFound();

  // 公開済以外は admin 以外見せない(認証無視で 404 扱い)
  if (article.status !== "published") notFound();

  // 本文中の ticker code を集めて、銘柄スナップショットを引く
  // (Tiptap JSON を巡回して ticker.attrs.code を抽出)
  const tickerCodes = collectTickerCodes(article.contentJson);
  // 関連企業 (記事メタ) も合算
  const allCodes = Array.from(new Set([...tickerCodes, ...article.companyCodes]));
  const tickerByCode = await loadTickerSnapshots(allCodes);

  const toc = extractToc(article.contentJson);
  const angle = ANGLE_META[article.categoryName] ?? {
    label: article.categoryName,
    color: "bg-neutral-100 text-neutral-700",
  };

  const relatedCompanyTickers = article.companyCodes
    .map((c) => tickerByCode[c])
    .filter(Boolean);

  // 「この記事のあとに」用: 同じ主役 / 同じカテゴリの記事を取得
  const [bySubject, byCategory] = await Promise.all([
    listBySubject(db, article.subjectKind, article.subjectRef, {
      excludeId: article.id,
      limit: 4,
    }),
    listByCategory(db, article.categoryId, {
      excludeId: article.id,
      limit: 4,
    }),
  ]);
  // 主役記事を優先 + カテゴリ記事で補完 (slug 重複は除く)
  const seenSlugs = new Set<string>([article.slug]);
  const nextArticles: ArticleListItem[] = [];
  for (const r of [...bySubject, ...byCategory]) {
    if (seenSlugs.has(r.slug)) continue;
    seenSlugs.add(r.slug);
    nextArticles.push(r);
    if (nextArticles.length >= 3) break;
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <Breadcrumb
          subjectKind={article.subjectKind}
          subjectRef={article.subjectRef}
          subjectName={article.subjectName}
          angleLabel={angle.label}
        />
      </div>

      <Hero
        title={article.title}
        lede={article.lede}
        heroImageKey={article.heroImageKey}
        heroImageAlt={article.heroImageAlt}
        heroImageCredit={article.heroImageCredit}
        angle={angle}
        subjectKind={article.subjectKind}
        subjectRef={article.subjectRef}
        subjectName={article.subjectName}
        publishedAt={article.publishedAt}
        readMinutes={article.readMinutes}
      />

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <article className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-14">
          <main className="min-w-0">
            <div className="max-w-[680px] mx-auto">
              <Body contentJson={article.contentJson} tickerByCode={tickerByCode} />
              <ActionFooter
                articles={nextArticles}
                subjectName={article.subjectName}
                categoryName={article.categoryName}
              />
            </div>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {toc.length > 0 && <Toc items={toc} />}
              {relatedCompanyTickers.length > 0 && (
                <RelatedCompanies tickers={relatedCompanyTickers} />
              )}
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}

// ─── Tiptap JSON から ticker のコードを集める (server 内 util) ──

function collectTickerCodes(contentJson: string): string[] {
  try {
    const doc = JSON.parse(contentJson);
    const codes: string[] = [];
    const visit = (n: { type?: string; attrs?: { code?: string }; content?: unknown[] }) => {
      if (n.type === "ticker" && typeof n.attrs?.code === "string") {
        codes.push(n.attrs.code);
      }
      if (Array.isArray(n.content)) {
        for (const c of n.content) visit(c as Parameters<typeof visit>[0]);
      }
    };
    visit(doc);
    return Array.from(new Set(codes));
  } catch {
    return [];
  }
}

// ─── Breadcrumb ──────────────────────────────────────────

function Breadcrumb({
  subjectKind,
  subjectRef,
  subjectName,
  angleLabel,
}: {
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  angleLabel: string;
}) {
  const subjectHref =
    subjectKind === "company" ? `/stocks/${subjectRef}` : "/articles";
  const subjectLabel =
    subjectKind === "company" ? `${subjectRef} ${subjectName}` : subjectName;
  return (
    <nav
      aria-label="パンくず"
      className="text-[13px] text-neutral-500 flex items-center gap-x-2 gap-y-1 flex-wrap leading-relaxed"
    >
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1 font-medium">
        <ChevronLeft className="w-3.5 h-3.5" />
        ホーム
      </Link>
      <span className="text-neutral-300">/</span>
      <Link href="/articles" className="hover:text-neutral-900 font-medium">
        記事
      </Link>
      <span className="text-neutral-300">/</span>
      <Link
        href={subjectHref}
        className="hover:text-neutral-900 font-medium truncate max-w-[18rem]"
        title={subjectLabel}
      >
        {subjectLabel}
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="text-neutral-800 font-semibold">{angleLabel}</span>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────

function Hero({
  title,
  lede,
  heroImageKey,
  heroImageAlt,
  heroImageCredit,
  angle,
  subjectKind,
  subjectRef,
  subjectName,
  publishedAt,
  readMinutes,
}: {
  title: string;
  lede: string;
  heroImageKey: string | null;
  heroImageAlt: string | null;
  heroImageCredit: string | null;
  angle: { label: string; color: string };
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  publishedAt: string | null;
  readMinutes: number;
}) {
  const heroSrc = heroImageKey
    ? resolveMediaSrc(heroImageKey, { w: 1600, h: 900 }) ?? ""
    : null;
  return (
    <section className="w-full">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        {/* テキストエリア (画像の上) */}
        <div className="text-center max-w-[760px] mx-auto pb-6 sm:pb-8">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <AIBadge />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${angle.color}`}
            >
              {angle.label}
            </span>
            <SubjectChipLight
              kind={subjectKind}
              subjectRef={subjectRef}
              subjectName={subjectName}
            />
          </div>
          <h1
            className="font-black tracking-tight text-3xl sm:text-5xl lg:text-[52px] leading-[1.15] text-neutral-900"
            style={{ fontFamily: "var(--font-serif, ui-serif, Georgia, serif)" }}
          >
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            {lede}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-widest text-neutral-500 flex-wrap">
            {publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishedAt}
              </span>
            )}
            <span className="text-neutral-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readMinutes}分
            </span>
          </div>
        </div>

        {/* 大きな画像カード (オーバーレイなし、画像そのまま) */}
        {heroSrc && (
          <figure className="rounded-xl overflow-hidden bg-neutral-100 shadow-sm">
            <div className="relative aspect-[16/9]">
              <Image
                src={heroSrc}
                alt={heroImageAlt ?? ""}
                fill
                sizes="(min-width: 960px) 960px, 100vw"
                className="object-cover"
                priority
                unoptimized={shouldSkipImageOptimization(heroSrc)}
              />
            </div>
            {heroImageCredit && (
              <figcaption className="px-4 py-2 text-[11px] text-neutral-500 bg-neutral-50 border-t border-neutral-100 text-right">
                {heroImageCredit}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  );
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/30">
      <Sparkles className="w-3 h-3" />
      AI Picks
    </span>
  );
}

function SubjectChipLight({
  kind,
  subjectRef,
  subjectName,
}: {
  kind: SubjectKind;
  subjectRef: string;
  subjectName: string;
}) {
  const map: Record<SubjectKind, { icon: typeof Building2; color: string }> = {
    company: { icon: Building2, color: "text-blue-700 bg-blue-50 border-blue-100" },
    industry: { icon: Globe, color: "text-amber-700 bg-amber-50 border-amber-100" },
    theme: { icon: Sparkles, color: "text-purple-700 bg-purple-50 border-purple-100" },
    metric: { icon: Activity, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  };
  const meta = map[kind];
  const Icon = meta.icon;
  const text = kind === "company" ? `${subjectRef} ${subjectName}` : subjectName;
  const href = kind === "company" ? `/stocks/${subjectRef}` : "/articles";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold hover:underline ${meta.color}`}
    >
      <Icon className="w-3 h-3" />
      {text}
      <ArrowUpRight className="w-3 h-3 opacity-70" />
    </Link>
  );
}


// ─── Body ────────────────────────────────────────────────

function Body({
  contentJson,
  tickerByCode,
}: {
  contentJson: string;
  tickerByCode: Record<string, import("../_lib/contentRenderer").TickerSnapshot>;
}) {
  return <div>{renderArticleContent(contentJson, { tickerByCode })}</div>;
}

// ─── Action footer (主役/カテゴリ別の関連記事) ──────────

function ActionFooter({
  articles: nextArticles,
  subjectName,
  categoryName,
}: {
  articles: ArticleListItem[];
  subjectName: string;
  categoryName: string;
}) {
  if (nextArticles.length === 0) return null;
  return (
    <section className="mt-16 pt-8 border-t border-neutral-200">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-4">
        この記事のあとに読む
        <span className="text-neutral-400 normal-case font-mono font-bold ml-2 tracking-normal">
          {subjectName} / {categoryName}
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {nextArticles.map((r) => (
          <Link
            key={r.slug}
            href={`/articles/${r.slug}`}
            className="group flex flex-col rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition overflow-hidden"
          >
            {r.heroImageKey && <RelatedThumb keyOrUrl={r.heroImageKey} />}
            <div className="p-4 flex-1 flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                {r.categoryName}
              </div>
              <h4 className="text-[14px] font-bold leading-snug tracking-tight text-neutral-900 group-hover:text-neutral-900 line-clamp-3">
                {r.title}
              </h4>
              <div className="mt-auto pt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                {r.publishedAt} · {r.readMinutes}分
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedThumb({ keyOrUrl }: { keyOrUrl: string }) {
  const src = resolveMediaSrc(keyOrUrl, { w: 480, h: 270 }) ?? "";
  if (!src) return null;
  return (
    <div className="relative aspect-[16/9] bg-neutral-100">
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 640px) 320px, 100vw"
        className="object-cover"
        unoptimized={shouldSkipImageOptimization(src)}
      />
    </div>
  );
}

// ─── Related companies ───────────────────────────────────

function RelatedCompanies({
  tickers,
}: {
  tickers: import("../_lib/contentRenderer").TickerSnapshot[];
}) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-3 inline-flex items-center gap-1.5">
        <Building2 className="w-3 h-3" />
        紐づく企業
      </h3>
      <ul className="space-y-2">
        {tickers.map((t) => (
          <li key={t.code}>
            <Link
              href={t.href}
              className="group flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: t.logoColor }}
              >
                {t.initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-neutral-500 font-bold">
                  {t.code}
                </div>
                <div className="text-[12px] font-bold leading-tight truncate text-neutral-900">
                  {t.name}
                </div>
              </div>
              {t.priceAtPublish && (
                <div className="text-right shrink-0">
                  <div className="font-mono tabular text-[12px] font-bold text-neutral-900">
                    {t.priceAtPublish}
                  </div>
                  {t.changeAtPublish && (
                    <div
                      className={`font-mono tabular text-[10px] font-bold ${
                        t.positive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {t.changeAtPublish}
                    </div>
                  )}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
