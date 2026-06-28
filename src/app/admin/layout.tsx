import type { Metadata } from "next";
import Link from "next/link";

// 管理画面の chrome は公開サイトの (main)/layout.tsx から完全に独立している。
// root layout は <html><body> しか持たないので、admin 配下では公開サイトの
// ヘッダー・フッター・JSON-LD・SearchBox・Web Analytics が一切ロードされない。
export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-sm gap-4">
          <Link href="/admin" className="font-bold tracking-tight">
            超!企業DB <span className="text-foreground/60 font-normal">管理画面</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs">
            <Link href="/admin/articles" className="text-muted-foreground hover:text-foreground transition">
              記事
            </Link>
            <Link
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground transition"
            >
              ユーザー
            </Link>
            <Link
              href="/admin/account"
              className="text-muted-foreground hover:text-foreground transition"
            >
              アカウント
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition">
              公開サイト ↗
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
