import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Sparkles } from "lucide-react";

import { resolveMediaSrc, shouldSkipImageOptimization } from "@/shared/media";
import {
  ANGLE_META,
  angleFromCategorySlug,
  type Subject as ArticleSubject,
} from "../articles/_lib/posts";
import type { ArticleListItem } from "@/server/repo/articleRepo";
import { ArticleSubjectChip } from "./ArticleSubjectChip";

export function ArticlesSection({ posts }: { posts: ArticleListItem[] }) {
  return (
    <section id="articles" className="scroll-mt-20" aria-label="記事">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">記事</h2>
        <Link
          href="/articles"
          className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
        >
          すべての記事
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          公開済みの記事はまだありません。
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((p) => (
            <li key={p.id}>
              <ArticleCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function articleSubject(p: ArticleListItem): ArticleSubject {
  if (p.subjectKind === "company") {
    return { kind: "company", code: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "industry") {
    return { kind: "industry", slug: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "theme") {
    return { kind: "theme", slug: p.subjectRef, name: p.subjectName };
  }
  return { kind: "metric", slug: p.subjectRef, name: p.subjectName };
}

function articleAngleMeta(p: ArticleListItem) {
  const key = angleFromCategorySlug(p.categorySlug);
  if (key) return ANGLE_META[key];
  return { label: p.categoryName, icon: Sparkles, color: "bg-neutral-100 text-neutral-700" };
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function ArticleCard({ post }: { post: ArticleListItem }) {
  const angle = articleAngleMeta(post);
  const AngleIcon = angle.icon;
  const thumbSrc = post.heroImageKey
    ? resolveMediaSrc(post.heroImageKey, { w: 480, h: 320 }) ?? ""
    : null;
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="group flex gap-3 sm:gap-4 bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden h-full"
    >
      {thumbSrc && (
        <div className="relative w-28 sm:w-36 shrink-0 bg-neutral-100">
          <Image
            src={thumbSrc}
            alt=""
            fill
            sizes="(min-width: 640px) 144px, 112px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={shouldSkipImageOptimization(thumbSrc)}
          />
        </div>
      )}
      <div
        className={`flex-1 min-w-0 py-3 pr-3 sm:pr-4 ${thumbSrc ? "" : "pl-3 sm:pl-4"} flex flex-col gap-1.5`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
          >
            <AngleIcon className="w-2.5 h-2.5" />
            {angle.label}
          </span>
          <ArticleSubjectChip subject={articleSubject(post)} compact />
        </div>
        <h3 className="text-[14px] sm:text-[15px] font-bold tracking-tight leading-snug group-hover:text-neutral-900 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[12px] text-neutral-600 leading-relaxed line-clamp-2">{post.lede}</p>
        <div className="mt-auto pt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {formatPublishedAt(post.publishedAt)} · {post.readMinutes}分
        </div>
      </div>
    </Link>
  );
}
