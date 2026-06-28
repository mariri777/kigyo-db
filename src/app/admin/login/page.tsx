import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ reset?: string }>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const current = await getCurrentAdmin();
  if (current) redirect("/admin");
  const sp = (await searchParams) ?? {};
  const resetOk = sp.reset === "ok";

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-2">管理画面ログイン</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        メールアドレスとパスワードでログインしてください。
      </p>
      {resetOk && (
        <div className="mb-6 rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-foreground">
          パスワードを再設定しました。新しいパスワードでログインしてください。
        </div>
      )}
      <LoginForm />
      <p className="text-xs text-muted-foreground mt-6 text-right">
        <Link
          href="/admin/password/forgot"
          className="hover:text-foreground transition"
        >
          パスワードをお忘れですか?
        </Link>
      </p>
    </div>
  );
}
