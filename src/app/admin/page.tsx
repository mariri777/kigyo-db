import Link from "next/link";
import { redirect } from "next/navigation";
import { CATEGORY_LABEL, listPostsForAdmin } from "@/content/posts";
import { formatJaDate } from "@/shared/format";
import { getCurrentAdmin } from "@/server/auth/session";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminTop({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const { saved, deleted } = await searchParams;
  const posts = await listPostsForAdmin();
  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status === "published");

  return (
    <div>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
            Admin / Blog
          </p>
          <h1 className="text-3xl font-bold tracking-tight">記事一覧</h1>
          <p className="text-xs text-foreground/60 mt-2">
            ログイン中: {admin.name} ({admin.email})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/new"
            className="bg-foreground text-background font-bold text-sm rounded-md px-4 py-2 hover:opacity-90 transition"
          >
            新規記事を作成
          </Link>
          <LogoutButton />
        </div>
      </div>

      {(saved === "1" || deleted === "1") && (
        <div className="mb-6 bg-muted border-l-2 border-foreground rounded-md p-3 text-sm">
          {saved === "1" ? "保存しました。" : "削除しました。"}
        </div>
      )}

      <PostsTable
        title="下書き"
        emptyText="下書きはありません。"
        items={drafts}
      />
      <div className="h-8" />
      <PostsTable
        title="公開済み"
        emptyText="公開済みの記事はまだありません。"
        items={published}
      />
    </div>
  );
}

function PostsTable({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Awaited<ReturnType<typeof listPostsForAdmin>>;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-3">
        {title} <span className="text-foreground/60 ml-2">{items.length} 件</span>
      </h2>
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3 w-32">カテゴリ</th>
              <th className="px-4 py-3 w-32">公開日</th>
              <th className="px-4 py-3 w-32">更新日</th>
              <th className="px-4 py-3 w-16 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground/60 text-sm">
                  {emptyText}
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-surface-elev transition">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="text-[11px] text-foreground/60 mt-1 font-mono">{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-[12px]">{CATEGORY_LABEL[p.category]}</td>
                <td className="px-4 py-3 text-[12px] text-foreground/60 tabular">
                  {p.publishedAt ? formatJaDate(p.publishedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-[12px] text-foreground/60 tabular">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    編集 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
