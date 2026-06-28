import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/session";
import { Toaster } from "@/components/ui/sonner";
import { AdminAccountMenu } from "./AdminAccountMenu";

// 管理画面の chrome は公開サイトの (main)/layout.tsx から完全に独立している。
// root layout は <html><body> しか持たないので、admin 配下では公開サイトの
// ヘッダー・フッター・JSON-LD・SearchBox・Web Analytics が一切ロードされない。
export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 未ログインのページ (/admin/login, /admin/password/*) でも layout は走るので
  // null を許容する。アバターは admin が居る時だけ出す。
  const admin = await getCurrentAdmin();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-sm gap-4">
          <Link href="/admin" className="font-bold tracking-tight">
            超!企業DB <span className="text-foreground/60 font-normal">管理画面</span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            {admin && (
              <nav className="flex items-center gap-4">
                <Link
                  href="/admin/articles"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  記事
                </Link>
                <Link
                  href="/admin/users"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  ユーザー
                </Link>
              </nav>
            )}
            {admin ? (
              <AdminAccountMenu name={admin.name} email={admin.email} />
            ) : (
              <Link
                href="/admin/login"
                className="text-muted-foreground hover:text-foreground transition"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
