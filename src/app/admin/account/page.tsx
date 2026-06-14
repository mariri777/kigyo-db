import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const { changed } = await searchParams;

  return (
    <div className="max-w-md">
      <Link
        href="/admin"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← 記事一覧へ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-2">アカウント設定</h1>
      <p className="text-xs text-foreground/60 mb-8">
        ログイン中: {admin.name} ({admin.email})
      </p>
      {changed === "1" && (
        <div className="mb-6 bg-muted border-l-2 border-foreground rounded-md p-3 text-sm">
          パスワードを変更しました。
        </div>
      )}
      <section className="bg-surface border border-border rounded-md p-6">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">
          パスワード変更
        </h2>
        <ChangePasswordForm />
      </section>

      <section className="mt-8 bg-surface border border-border rounded-md p-6">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">
          ユーザー管理
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          新しい管理者ユーザーを発行できます。
        </p>
        <Link
          href="/admin/users"
          className="inline-block text-sm border border-border-strong rounded-md px-4 py-2 hover:bg-surface-elev transition"
        >
          ユーザー一覧 →
        </Link>
      </section>
    </div>
  );
}
