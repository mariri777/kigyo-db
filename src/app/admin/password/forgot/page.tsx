import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/session";
import { ForgotForm } from "./ForgotForm";

export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  const current = await getCurrentAdmin();
  if (current) redirect("/admin");
  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-2">パスワードを再設定</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        登録メールアドレスを入力してください。再設定リンクをメールでお送りします。
      </p>
      <ForgotForm />
      <p className="text-xs text-muted-foreground mt-8">
        <Link href="/admin/login" className="hover:text-foreground transition">
          ← ログイン画面へ戻る
        </Link>
      </p>
    </div>
  );
}
