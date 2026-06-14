import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listUsers } from "@/server/repo/userRepo";
import { CreateUserForm } from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const db = await getDb();
  const users = await listUsers(db);
  const { created } = await searchParams;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← 記事一覧へ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">管理者ユーザー</h1>

      {created === "1" && (
        <div className="mb-6 bg-muted border-l-2 border-foreground rounded-md p-3 text-sm">
          新しいユーザーを発行しました。
        </div>
      )}

      <section className="bg-surface border border-border rounded-md overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3">名前</th>
              <th className="px-4 py-3">メール</th>
              <th className="px-4 py-3 w-32">作成日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {u.id === admin.userId && (
                    <span className="text-[10px] text-foreground/60 ml-2">(自分)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-[12px] text-foreground/60 tabular">
                  {u.createdAt.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-surface border border-border rounded-md p-6">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">
          新規ユーザー発行
        </h2>
        <CreateUserForm />
      </section>
    </div>
  );
}
