import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const current = await getCurrentAdmin();
  if (current) redirect("/admin");

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-2">管理画面ログイン</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        メールアドレスとパスワードでログインしてください。
      </p>
      <LoginForm />
    </div>
  );
}
