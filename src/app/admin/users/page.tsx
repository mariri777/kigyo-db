import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listUsers } from "@/server/repo/userRepo";
import { CreateUserForm } from "./CreateUserForm";
import { DeleteUserButton } from "./DeleteUserButton";
import { UsersFlashToast } from "./UsersFlashToast";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const db = await getDb();
  const users = await listUsers(db);

  return (
    <div className="max-w-3xl">
      <Suspense fallback={null}>
        <UsersFlashToast />
      </Suspense>
      <Link
        href="/admin"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← 記事一覧へ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">管理者ユーザー</h1>

      <section className="bg-surface border border-border rounded-md overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3">名前</th>
              <th className="px-4 py-3">メール</th>
              <th className="px-4 py-3 w-32">作成日</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isSelf = u.id === admin.userId;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {isSelf && (
                      <span className="text-[10px] text-foreground/60 ml-2">(自分)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-foreground/60 tabular">
                    {u.createdAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && <DeleteUserButton userId={u.id} name={u.name} />}
                  </td>
                </tr>
              );
            })}
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
