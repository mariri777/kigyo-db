import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listAllTags, listPosts } from "@/content/posts";
import { PostCard } from "@/components/PostCard";
import { Eyebrow } from "@/components/ui/eyebrow";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tags = await listAllTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) return NOT_FOUND_METADATA;
  return pageMetadata({
    title: `タグ:${tag.name} — ブログ`,
    description: `『${tag.name}』タグが付いたブログ記事の一覧`,
    path: `${ROUTES.blog}/tag/${tag.slug}`,
  });
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tags = await listAllTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const posts = await listPosts({ tagSlug: slug });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href={ROUTES.blog}
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-8"
      >
        ← ブログ一覧へ
      </Link>
      <header className="pb-8 border-b border-border mb-10">
        <Eyebrow className="mb-3 text-[11px]">Tag</Eyebrow>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">#{tag.name}</h1>
        <p className="text-foreground/60 text-sm mt-3">{posts.length} 件</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">このタグの記事はまだありません。</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
