import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  Globe,
  Sparkles,
  Activity,
} from "lucide-react";
import { post, blocks, tickerMap, type Block } from "./_data";
import {
  getPost,
  findRelated,
  ANGLE_META,
  type Subject,
} from "../_lib/posts";
import { Toc } from "./_Toc";

const meta = getPost("softbank-ai-quality");

export const metadata: Metadata = {
  title: `${post.title} — v2 記事`,
  description: post.subtitle,
  robots: { index: false, follow: false },
};

function unsplashUrl(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "75" });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/${id}?${p.toString()}`;
}

const toc = blocks
  .filter((b): b is Extract<Block, { kind: "h2" }> => b.kind === "h2")
  .map((b) => ({ id: b.id, label: b.text }));

// 本文ticker (tickerMap) のうち、「紐づく企業」として右サイドに出すもの
const relatedTickers = Object.values(tickerMap);

export default function ArticleDetailPage() {
  if (!meta) {
    return <div className="p-12 text-sm text-neutral-500">記事メタが見つかりません</div>;
  }
  const related = findRelated(meta, 3);
  const angle = ANGLE_META[meta.angle];

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* breadcrumb は max幅で。Hero との間に余白 */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <Breadcrumb subject={meta.subject} angleLabel={angle.label} />
      </div>

      {/* Hero: 全幅で大判 (ダーク + 写真) */}
      <Hero subject={meta.subject} angle={angle} />

      {/* 本体 + サイド */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <article className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-14">
          <main className="min-w-0">
            <div className="max-w-[680px] mx-auto">
              <Body />
              <ActionFooter />
            </div>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {toc.length > 0 && <Toc items={toc} />}
              {relatedTickers.length > 0 && <RelatedCompanies />}
              {related.length > 0 && <RelatedRail related={related} />}
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────────────────

function Breadcrumb({ subject, angleLabel }: { subject: Subject; angleLabel: string }) {
  const subjectHref =
    subject.kind === "company" ? `/v2/stocks/${subject.code}` : "/v2/articles";
  const subjectLabel =
    subject.kind === "company" ? `${subject.code} ${subject.name}` : subject.name;
  return (
    <nav
      aria-label="パンくず"
      className="text-[13px] text-neutral-500 flex items-center gap-x-2 gap-y-1 flex-wrap leading-relaxed"
    >
      <Link
        href="/v2"
        className="hover:text-neutral-900 inline-flex items-center gap-1 font-medium"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        v2 ホーム
      </Link>
      <span className="text-neutral-300" aria-hidden>
        /
      </span>
      <Link href="/v2/articles" className="hover:text-neutral-900 font-medium">
        記事
      </Link>
      <span className="text-neutral-300" aria-hidden>
        /
      </span>
      <Link
        href={subjectHref}
        className="hover:text-neutral-900 font-medium truncate max-w-[18rem]"
        title={subjectLabel}
      >
        {subjectLabel}
      </Link>
      <span className="text-neutral-300" aria-hidden>
        /
      </span>
      <span className="text-neutral-800 font-semibold">{angleLabel}</span>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// Hero (大判の写真 + ダーク + AIバッジ)
// ─────────────────────────────────────────────────────────

function Hero({
  subject,
  angle,
}: {
  subject: Subject;
  angle: { label: string; icon: typeof Sparkles; color: string };
}) {
  const AngleIcon = angle.icon;
  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 text-white">
      {/* 背景写真 */}
      <Image
        src={unsplashUrl(post.heroImage, 1800, 900)}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-40"
        priority
      />
      {/* オーバーレイ: 下が濃いめ */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/70 to-neutral-950/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-neutral-950/40" />

      {/* ノイズ感 (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0, transparent 50%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.4) 0, transparent 50%)",
        }}
      />

      <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16">
        <div className="max-w-[820px]">
          {/* AI badge + カテゴリ + 主役chip */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <AIBadge />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${angle.color}`}
            >
              <AngleIcon className="w-3 h-3" />
              {angle.label}
            </span>
            <SubjectChipDark subject={subject} />
          </div>

          {/* タイトル (Serif で格式) */}
          <h1
            className="font-black tracking-tight text-3xl sm:text-5xl lg:text-[56px] leading-[1.15]"
            style={{ fontFamily: "var(--font-serif, ui-serif, Georgia, 'Times New Roman', serif)" }}
          >
            {post.title}
          </h1>

          {/* リード */}
          <p className="mt-5 text-base sm:text-lg text-neutral-200 leading-relaxed max-w-2xl">
            {post.subtitle}
          </p>

          {/* メタ */}
          <div className="mt-7 flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {post.publishedAt}
            </span>
            <span className="text-neutral-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readMin}分
            </span>
            <span className="text-neutral-600 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-[10px] text-neutral-500">
              {post.heroImageCredit}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AIBadge() {
  return (
    <span className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/30">
      <Sparkles className="w-3 h-3" />
      AI Picks
    </span>
  );
}

function SubjectChipDark({ subject }: { subject: Subject }) {
  const map: Record<Subject["kind"], { icon: typeof Building2; label: string }> = {
    company: { icon: Building2, label: "企業" },
    industry: { icon: Globe, label: "業界" },
    theme: { icon: Sparkles, label: "テーマ" },
    metric: { icon: Activity, label: "指標" },
  };
  const m = map[subject.kind];
  const Icon = m.icon;
  const text = subject.kind === "company" ? `${subject.code} ${subject.name}` : subject.name;
  const href = subject.kind === "company" ? `/v2/stocks/${subject.code}` : "/v2/articles";
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

// ─────────────────────────────────────────────────────────
// Body
// ─────────────────────────────────────────────────────────

function Body() {
  return (
    <div>
      {blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "lead":
      return (
        <p className="mt-2 text-[17px] sm:text-[19px] font-bold leading-[1.85] tracking-tight text-neutral-900 border-l-4 border-emerald-500 pl-5">
          {block.text}
        </p>
      );

    case "h2":
      return (
        <h2
          id={block.id}
          className="mt-14 mb-3 text-2xl sm:text-[26px] font-black tracking-tight scroll-mt-20 text-neutral-900"
        >
          {block.text}
        </h2>
      );

    case "p":
      return (
        <p className="mt-5 text-[15.5px] leading-[1.95] tracking-[0.005em] text-neutral-800">
          {block.text}
        </p>
      );

    case "callout":
      return (
        <aside className="mt-8 rounded-xl bg-amber-50 border-l-4 border-amber-400 p-5 flex gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-amber-900 mb-1">{block.title}</div>
            <p className="text-sm text-neutral-800 leading-relaxed">{block.text}</p>
          </div>
        </aside>
      );

    case "table":
      return (
        <figure className="mt-8">
          {block.caption && (
            <figcaption className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
              {block.caption}
            </figcaption>
          )}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-neutral-50 text-left border-b border-neutral-200">
                <tr>
                  {block.headers.map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 ${
                        i === 0 ? "" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-neutral-100 last:border-b-0 ${
                      row[0] === "合計" ? "bg-neutral-50 font-bold" : ""
                    }`}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-2.5 text-[13px] ${
                          j === 0
                            ? "font-semibold text-neutral-900"
                            : "text-right font-mono tabular text-neutral-700"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case "stat-grid":
      return (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
          {block.items.map((s) => (
            <div key={s.label} className="bg-white px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {s.label}
              </div>
              <div
                className="font-black tracking-tight mt-1 text-neutral-900 text-2xl"
                style={{
                  fontFamily:
                    "var(--font-serif, ui-serif, Georgia, 'Times New Roman', serif)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.value}
              </div>
              {s.sub && (
                <div className="text-[11px] font-mono text-neutral-500 mt-0.5">{s.sub}</div>
              )}
            </div>
          ))}
        </div>
      );

    case "ticker":
      return <TickerCard code={block.code} />;
  }
}

function TickerCard({ code }: { code: string }) {
  const t = tickerMap[code as keyof typeof tickerMap];
  if (!t) return null;
  return (
    <Link
      href={t.href}
      className="not-prose group mt-8 flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/70 transition"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
        style={{ background: t.logoColor }}
      >
        {t.initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
          <span className="font-bold">{t.code}</span>
          <span>·</span>
          <span>時価総額 {t.marketCap}</span>
          {t.per !== "—" && (
            <>
              <span>·</span>
              <span>PER {t.per}</span>
            </>
          )}
        </div>
        <div className="text-sm font-bold truncate text-neutral-900">{t.name}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono tabular text-base font-bold tracking-tight text-neutral-900">
          {t.priceAtPublish}
        </div>
        <div
          className={`font-mono tabular text-xs font-bold inline-flex items-center gap-0.5 ${
            t.positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {t.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {t.changeAtPublish}
        </div>
        <div className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest mt-0.5">
          {t.note}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition shrink-0" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// Action footer
// ─────────────────────────────────────────────────────────

function ActionFooter() {
  if (!meta) return null;
  return (
    <section className="mt-16 pt-8 border-t border-neutral-200">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-4">
        この記事のあとに
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {meta.actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <Link
              key={i}
              href={a.href}
              className="group flex items-start gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition shrink-0">
                <Icon className="w-4 h-4" />
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
              <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// 右サイド: 紐づく企業
// ─────────────────────────────────────────────────────────

function RelatedCompanies() {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-3 inline-flex items-center gap-1.5">
        <Building2 className="w-3 h-3" />
        紐づく企業
      </h3>
      <ul className="space-y-2">
        {relatedTickers.map((t) => (
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
              <div className="text-right shrink-0">
                <div className="font-mono tabular text-[12px] font-bold text-neutral-900">
                  {t.priceAtPublish}
                </div>
                <div
                  className={`font-mono tabular text-[10px] font-bold inline-flex items-center ${
                    t.positive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.changeAtPublish}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 text-[10px] text-neutral-400 font-mono leading-snug">
        ※ 価格は記事公開時のスナップショット
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 右サイド: 紐づく記事 (AIによる推薦)
// ─────────────────────────────────────────────────────────

function RelatedRail({ related }: { related: ReturnType<typeof findRelated> }) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-3 inline-flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-600" />
        紐づく記事
      </h3>
      <ul className="space-y-3">
        {related.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/v2/articles/${r.slug}`}
              className="group block -mx-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-0.5">
                {ANGLE_META[r.angle].label}
              </div>
              <h4 className="text-[13px] font-bold leading-snug tracking-tight line-clamp-2 group-hover:text-neutral-900">
                {r.title}
              </h4>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono">
                {r.publishedAt} · {r.readMin}分
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
