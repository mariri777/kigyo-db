import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description:
    "お探しのページは見つかりませんでした。URL が変更されたか、削除された可能性があります。",
  robots: { index: false, follow: false },
};

// ルートレベルの not-found は (main)/layout.tsx の chrome を継承しないので、
// ヘッダー/フッターをここで直接描画する。
export default function NotFound() {
  return (
    <>
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight">超!企業DB</span>
            <span className="text-foreground/60 text-xs hidden sm:inline">Cho! Kigyo DB</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm">
            <Link
              href="/stocks"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              銘柄
            </Link>
            <Link
              href="/screens"
              className="text-muted-foreground hover:text-foreground transition hidden md:inline"
            >
              スクリーン
            </Link>
            <Link
              href="/industries"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              業界
            </Link>
            <Link
              href="/themes"
              className="text-foreground hover:text-muted-foreground transition hidden md:inline font-bold"
            >
              特集
            </Link>
            <Link
              href="/predictions"
              className="text-foreground hover:text-muted-foreground transition hidden sm:inline font-bold"
            >
              予測
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              ブログ
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition hidden lg:inline"
            >
              超!企業DBとは
            </Link>
            <SearchBox />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <article className="max-w-2xl mx-auto px-6 py-20 text-center leading-relaxed">
          <p className="text-muted-foreground text-sm tracking-widest mb-4">404</p>
          <h1 className="text-3xl font-bold mb-3">ページが見つかりません</h1>
          <p className="text-muted-foreground mb-10">
            お探しのページは存在しないか、URL が変更されている可能性があります。
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm">
            <Link
              href="/"
              className="text-foreground hover:text-muted-foreground transition font-bold"
            >
              トップへ戻る →
            </Link>
            <Link
              href="/stocks"
              className="text-muted-foreground hover:text-foreground transition"
            >
              銘柄一覧
            </Link>
            <Link
              href="/industries"
              className="text-muted-foreground hover:text-foreground transition"
            >
              業界
            </Link>
            <Link
              href="/themes"
              className="text-muted-foreground hover:text-foreground transition"
            >
              特集
            </Link>
            <Link
              href="/predictions"
              className="text-muted-foreground hover:text-foreground transition"
            >
              予測
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition"
            >
              ブログ
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
