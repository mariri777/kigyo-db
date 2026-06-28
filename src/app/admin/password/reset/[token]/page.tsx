import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/server/db/client";
import { findUsablePasswordReset } from "@/server/repo/authRepo";
import { sha256Hex } from "@/server/auth/password";
import { getCurrentAdmin } from "@/server/auth/session";
import { ResetForm } from "./ResetForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export default async function ResetPage({ params }: { params: Params }) {
  const { token } = await params;
  const current = await getCurrentAdmin();
  if (current) redirect("/admin");

  const db = await getDb();
  const tokenHash = await sha256Hex(token);
  const reset = await findUsablePasswordReset(db, tokenHash);

  if (!reset) {
    return (
      <div className="max-w-sm mx-auto py-16">
        <h1 className="text-2xl font-bold tracking-tight mb-2">リンクが無効です</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          このパスワード再設定リンクは期限切れか、既に使用されています。改めてリクエストしてください。
        </p>
        <Link
          href="/admin/password/forgot"
          className="inline-block bg-foreground text-background font-bold rounded-md px-4 py-2 text-sm hover:opacity-90 transition"
        >
          再設定リンクをリクエスト
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-2">新しいパスワードを設定</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        新しいパスワードを 8 文字以上で入力してください。保存後、ログイン中の全セッションは解除されます。
      </p>
      <ResetForm token={token} />
    </div>
  );
}
