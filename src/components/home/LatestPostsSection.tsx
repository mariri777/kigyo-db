import Link from "next/link";
import type { Post } from "@/content/posts";
import { PostCard } from "@/components/PostCard";

export function LatestPostsSection({ posts }: { posts: Post[] }) {
  return (
    <section className="mt-20 pt-12 border-t border-border">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-2">
            Latest Posts
          </p>
          <h2 className="text-2xl font-bold tracking-tight">最新の分析</h2>
        </div>
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition">
          すべて見る →
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </section>
  );
}
