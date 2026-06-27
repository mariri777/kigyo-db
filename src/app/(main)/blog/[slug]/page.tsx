import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORY_LABEL, getPost, listPosts } from "@/content/posts";
import { getStockBriefsByCodes } from "@/server/usecase";
import { getIndustry } from "@/content/industries";
import { PostContent } from "@/components/PostContent";
import { PostCard } from "@/components/PostCard";
import { StructuredData } from "@/components/StructuredData";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo/metadata";
import { articleLd, breadcrumbList } from "@/lib/seo/structuredData";
import { ROUTES } from "@/shared/links";
import { SITE_NAME } from "@/shared/site";
import { formatJaDate } from "@/shared/format";

export const dynamic = "force-dynamic";

const AUTHOR_LABEL = {
  editor: "編集部",
  "ai-editor": "AI + 編集部レビュー",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return NOT_FOUND_METADATA;
  return pageMetadata({
    title: p.title,
    description: p.lede,
    path: `${ROUTES.blog}/${p.slug}`,
    keywords: [CATEGORY_LABEL[p.category], "ブログ", "決算分析", "業界ウォッチ"],
    publishedTime: p.publishedAt,
    modifiedTime: p.publishedAt,
    authors: [AUTHOR_LABEL[p.author]],
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedStocks = await getStockBriefsByCodes(post.relatedStocks);
  const relatedIndustries = post.relatedIndustries
    .map((s) => getIndustry(s))
    .filter((s): s is NonNullable<ReturnType<typeof getIndustry>> => Boolean(s));

  const others = (await listPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);
  const path = `${ROUTES.blog}/${post.slug}`;
  const authorOrg =
    post.author === "ai-editor"
      ? `${SITE_NAME} 編集部(AI + レビュー)`
      : `${SITE_NAME} 編集部`;
  const postJsonLd = [
    breadcrumbList([
      { name: "ブログ", href: ROUTES.blog },
      { name: post.title, href: path },
    ]),
    articleLd({
      title: post.title,
      description: post.lede,
      path,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      articleSection: CATEGORY_LABEL[post.category],
      keywords: [CATEGORY_LABEL[post.category], "投資", "銘柄分析"],
      authorName: authorOrg,
    }),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <StructuredData data={postJsonLd} />
      <Link
        href={ROUTES.blog}
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-8"
      >
        ← ブログ一覧へ
      </Link>

      <header className="mb-10 pb-8 border-b border-border">
        <div className="flex items-center gap-3 mb-5 text-[11px]">
          <span className="text-foreground font-bold border border-foreground rounded-full px-2.5 py-0.5">
            {CATEGORY_LABEL[post.category]}
          </span>
          <span className="text-foreground/60">{formatJaDate(post.publishedAt)}</span>
          <span className="text-foreground/60">·</span>
          <span className="text-foreground/60">読了 {post.readTimeMin} 分</span>
          {post.author === "ai-editor" && (
            <>
              <span className="text-foreground/60">·</span>
              <span className="text-foreground/60">AI + 編集部レビュー</span>
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-5">
          {post.title}
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">{post.lede}</p>

        {post.fiscalPeriod && (
          <div className="mt-6 text-[11px] text-foreground/60">
            対象決算期：{post.fiscalPeriod}
          </div>
        )}
      </header>

      <PostContent html={post.bodyHtml} />

      {post.tags.length > 0 && (
        <div className="mt-8 max-w-2xl flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link
              key={t.id}
              href={`/blog/tag/${t.slug}`}
              className="text-[11px] border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-foreground hover:border-border-strong transition"
            >
              #{t.name}
            </Link>
          ))}
        </div>
      )}

      {/* 関連銘柄・業界 */}
      {(relatedStocks.length > 0 || relatedIndustries.length > 0) && (
        <section className="mt-16 pt-8 border-t border-border max-w-2xl">
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">
            この記事と関連する
          </h2>

          {relatedStocks.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] text-foreground/60 mb-2">銘柄</div>
              <div className="flex flex-wrap gap-2">
                {relatedStocks.map((s) => (
                  <Link
                    key={s.code}
                    href={`/stocks/${s.code}`}
                    className="inline-flex items-center gap-2 border border-border-strong rounded-md px-3 py-2 hover:bg-surface-elev transition group"
                  >
                    <span className="text-[11px] text-foreground/60 tabular">{s.code}</span>
                    <span className="text-sm font-medium group-hover:text-foreground">
                      {s.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedIndustries.length > 0 && (
            <div>
              <div className="text-[11px] text-foreground/60 mb-2">業界</div>
              <div className="flex flex-wrap gap-2">
                {relatedIndustries.map((i) => (
                  <Link
                    key={i.slug}
                    href={`/industries/${i.slug}`}
                    className="inline-flex items-center border border-border-strong rounded-md px-3 py-2 hover:bg-surface-elev transition text-sm font-medium"
                  >
                    {i.name}業界マップ →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 他の記事 */}
      <section className="mt-16 pt-8 border-t border-border">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">他の記事</h2>
        <div className="space-y-3">
          {others.map((p) => (
            <PostCard key={p.slug} post={p} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
