import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABEL, listPosts, type PostCategory } from "@/content/posts";
import { PostCard } from "@/components/PostCard";

const blogTitle = "ブログ — 投資の論点を日々追う";
const blogDescription =
  "決算分析・業界ウォッチ・テーマ解説・3 分でわかるシリーズ。AI が一次情報を読み込み、編集部がレビューしてから公開します。";

export const metadata: Metadata = {
  title: blogTitle,
  description: blogDescription,
  keywords: ["ブログ", "決算分析", "業界ウォッチ", "投資コラム", "プライマー"],
  alternates: { canonical: "/blog" },
  openGraph: { title: blogTitle, description: blogDescription, url: "/blog", type: "website" },
  twitter: { card: "summary_large_image", title: blogTitle, description: blogDescription },
};

const CATEGORIES: PostCategory[] = ["earnings", "industry-watch", "analysis", "disclosure", "primer"];

export default function BlogIndex() {
  const all = listPosts();
  const primers = all.filter((p) => p.category === "primer");
  const longForm = all.filter((p) => p.category !== "primer");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">Blog</p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          投資の論点を、
          <br />
          日々追う。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          決算分析・業界ウォッチ・オリジナル論点をブログ形式で。AI が一次情報を読み込み、編集部がレビューしてから公開します。
          開示後 15 分以内反映を目標に運用予定。
        </p>
      </header>

      {/* カテゴリラベル */}
      <section className="mb-10 flex flex-wrap gap-2">
        <span className="text-[11px] text-dim mr-2">カテゴリ</span>
        {CATEGORIES.map((c) => {
          const count = all.filter((p) => p.category === c).length;
          return (
            <span
              key={c}
              className={`text-[11px] border rounded-full px-3 py-1 ${
                count > 0 ? "border-border-strong" : "border-border text-dim"
              }`}
            >
              {CATEGORY_LABEL[c]} <span className="text-dim tabular ml-1">{count}</span>
            </span>
          );
        })}
      </section>

      {/* 「3 分でわかる」シリーズ */}
      {primers.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-muted text-[11px] font-bold tracking-[0.2em] uppercase mb-1">
                Primer Series
              </p>
              <h2 className="text-xl font-bold tracking-tight">3 分でわかる、業界の基本概念</h2>
            </div>
            <span className="text-[11px] text-dim">{primers.length} 本</span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed mb-5 max-w-2xl">
            「ADC とは」「Hi-NA EUV とは」「Rule of 40 とは」など、本サイトに頻出する業界用語や概念を、
            読了 2-3 分の短編で解説します。詳細な分析記事の前に読むと理解が深まります。
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {primers.map((p) => (
              <PostCard key={p.slug} post={p} compact />
            ))}
          </div>
        </section>
      )}

      {/* 通常の記事フィード */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-muted text-[11px] font-bold tracking-[0.2em] uppercase mb-1">
              Latest Posts
            </p>
            <h2 className="text-xl font-bold tracking-tight">分析・ウォッチ・読み解き</h2>
          </div>
          <span className="text-[11px] text-dim">{longForm.length} 本</span>
        </div>
        <div className="space-y-4">
          {longForm.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <section className="mt-16 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">関連</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/" className="text-muted hover:text-foreground transition">
            銘柄一覧へ →
          </Link>
          <Link
            href="/industries/semiconductor"
            className="text-muted hover:text-foreground transition"
          >
            半導体業界マップへ →
          </Link>
          <Link
            href="/industries/saas"
            className="text-muted hover:text-foreground transition"
          >
            SaaS 業界マップへ →
          </Link>
          <Link
            href="/industries/pharmaceutical"
            className="text-muted hover:text-foreground transition"
          >
            医薬品業界マップへ →
          </Link>
        </div>
      </section>
    </div>
  );
}
