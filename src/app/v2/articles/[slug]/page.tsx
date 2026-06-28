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
import { findBySlug } from "@/server/repo/articleRepo";
import { extractToc, renderArticleContent } from "../_lib/contentRenderer";
import { loadTickerSnapshots } from "../_lib/serverData";
import { Toc } from "./_Toc";

type SubjectKind = "company" | "industry" | "theme" | "metric";

export const dynamic = "force-dynamic";

function unsplashUrl(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "75" });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/${id}?${p.toString()}`;
}

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
    title: `${article.title} — v2 記事`,
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
              <ActionFooter actions={article.actions} />
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
    subjectKind === "company" ? `/v2/stocks/${subjectRef}` : "/v2/articles";
  const subjectLabel =
    subjectKind === "company" ? `${subjectRef} ${subjectName}` : subjectName;
  return (
    <nav
      aria-label="パンくず"
      className="text-[13px] text-neutral-500 flex items-center gap-x-2 gap-y-1 flex-wrap leading-relaxed"
    >
      <Link href="/v2" className="hover:text-neutral-900 inline-flex items-center gap-1 font-medium">
        <ChevronLeft className="w-3.5 h-3.5" />
        v2 ホーム
      </Link>
      <span className="text-neutral-300">/</span>
      <Link href="/v2/articles" className="hover:text-neutral-900 font-medium">
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
  heroImageCredit: string | null;
  angle: { label: string; color: string };
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  publishedAt: string | null;
  readMinutes: number;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 text-white">
      {heroImageKey && (
        <Image
          src={unsplashUrl(heroImageKey, 1800, 900)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/70 to-neutral-950/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-neutral-950/40" />

      <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16">
        <div className="max-w-[820px]">
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <AIBadge />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${angle.color}`}
            >
              {angle.label}
            </span>
            <SubjectChipDark
              kind={subjectKind}
              subjectRef={subjectRef}
              subjectName={subjectName}
            />
          </div>
          <h1
            className="font-black tracking-tight text-3xl sm:text-5xl lg:text-[56px] leading-[1.15]"
            style={{ fontFamily: "var(--font-serif, ui-serif, Georgia, serif)" }}
          >
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-200 leading-relaxed max-w-2xl">
            {lede}
          </p>
          <div className="mt-7 flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest text-neutral-400 flex-wrap">
            {publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishedAt}
              </span>
            )}
            <span className="text-neutral-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readMinutes}分
            </span>
            {heroImageCredit && (
              <>
                <span className="text-neutral-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline text-[10px] text-neutral-500">
                  {heroImageCredit}
                </span>
              </>
            )}
          </div>
        </div>
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

function SubjectChipDark({
  kind,
  subjectRef,
  subjectName,
}: {
  kind: SubjectKind;
  subjectRef: string;
  subjectName: string;
}) {
  const map: Record<SubjectKind, { icon: typeof Building2 }> = {
    company: { icon: Building2 },
    industry: { icon: Globe },
    theme: { icon: Sparkles },
    metric: { icon: Activity },
  };
  const Icon = map[kind].icon;
  const text = kind === "company" ? `${subjectRef} ${subjectName}` : subjectName;
  const href = kind === "company" ? `/v2/stocks/${subjectRef}` : "/v2/articles";
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/20 bg-white/5 backdrop-blur text-[11px] font-bold text-white hover:bg-white/15 hover:border-white/40 transition"
    >
      <Icon className="w-3 h-3" />
      {text}
      <ArrowUpRight className="w-3 h-3 opacity-60" />
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

// ─── Action footer ───────────────────────────────────────

function ActionFooter({
  actions,
}: {
  actions: { label: string; href: string; hint?: string }[];
}) {
  if (!actions || actions.length === 0) return null;
  return (
    <section className="mt-16 pt-8 border-t border-neutral-200">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-4">
        この記事のあとに
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className="group flex items-start gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold leading-snug truncate text-neutral-900">
                {a.label}
              </div>
              {a.hint && (
                <div className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                  {a.hint}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
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
