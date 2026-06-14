import Link from "next/link";
import { CATEGORY_LABEL, type Post } from "@/content/posts";
import { formatJaDate } from "@/shared/format";

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-surface border border-border rounded-md p-5 hover:border-border-strong transition"
    >
      <div className="flex items-center gap-3 mb-3 text-[11px]">
        <span className="text-foreground font-bold border border-foreground rounded-full px-2 py-0.5">
          {CATEGORY_LABEL[post.category]}
        </span>
        <span className="text-dim">{formatJaDate(post.publishedAt)}</span>
        <span className="text-dim">·</span>
        <span className="text-dim">読了 {post.readTimeMin} 分</span>
        {post.author === "ai-editor" && (
          <span className="text-dim">· AI + 編集</span>
        )}
      </div>

      <h3
        className={`font-bold leading-tight group-hover:underline ${
          compact ? "text-base" : "text-xl tracking-tight"
        }`}
      >
        {post.title}
      </h3>

      {!compact && (
        <p className="text-sm text-muted leading-relaxed mt-3">{post.lede}</p>
      )}
    </Link>
  );
}
