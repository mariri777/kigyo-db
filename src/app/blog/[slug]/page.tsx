import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORY_LABEL, getPost, posts as allPosts, listPosts } from "@/lib/posts";
import { getStock } from "@/lib/data";
import { getIndustry } from "@/lib/industries";
import { PostContent } from "@/components/PostContent";
import { PostCard } from "@/components/PostCard";

export function generateStaticParams() {
  return allPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return { title: "見つかりません" };
  return { title: p.title, description: p.lede };
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00+09:00");
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const relatedStocks = post.relatedStocks
    .map((c) => getStock(c))
    .filter((s): s is NonNullable<ReturnType<typeof getStock>> => Boolean(s));
  const relatedIndustries = post.relatedIndustries
    .map((s) => getIndustry(s))
    .filter((s): s is NonNullable<ReturnType<typeof getIndustry>> => Boolean(s));

  const others = listPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/blog"
        className="inline-block text-xs text-muted hover:text-foreground transition mb-8"
      >
        ← ブログ一覧へ
      </Link>

      <header className="mb-10 pb-8 border-b border-border">
        <div className="flex items-center gap-3 mb-5 text-[11px]">
          <span className="text-foreground font-bold border border-foreground rounded-full px-2.5 py-0.5">
            {CATEGORY_LABEL[post.category]}
          </span>
          <span className="text-dim">{formatDate(post.publishedAt)}</span>
          <span className="text-dim">·</span>
          <span className="text-dim">読了 {post.readTimeMin} 分</span>
          {post.author === "ai-editor" && (
            <>
              <span className="text-dim">·</span>
              <span className="text-dim">AI + 編集部レビュー</span>
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-5">
          {post.title}
        </h1>

        <p className="text-base text-muted leading-relaxed">{post.lede}</p>

        {post.fiscalPeriod && (
          <div className="mt-6 text-[11px] text-dim">
            対象決算期：{post.fiscalPeriod}
          </div>
        )}
      </header>

      <PostContent blocks={post.body} />

      {/* 関連銘柄・業界 */}
      {(relatedStocks.length > 0 || relatedIndustries.length > 0) && (
        <section className="mt-16 pt-8 border-t border-border max-w-2xl">
          <h2 className="text-sm font-bold tracking-widest text-muted uppercase mb-4">
            この記事と関連する
          </h2>

          {relatedStocks.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] text-dim mb-2">銘柄</div>
              <div className="flex flex-wrap gap-2">
                {relatedStocks.map((s) => (
                  <Link
                    key={s.code}
                    href={`/stocks/${s.code}`}
                    className="inline-flex items-center gap-2 border border-border-strong rounded-md px-3 py-2 hover:bg-surface-elev transition group"
                  >
                    <span className="text-[11px] text-dim tabular">{s.code}</span>
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
              <div className="text-[11px] text-dim mb-2">業界</div>
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
        <h2 className="text-sm font-bold tracking-widest text-muted uppercase mb-4">他の記事</h2>
        <div className="space-y-3">
          {others.map((p) => (
            <PostCard key={p.slug} post={p} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
