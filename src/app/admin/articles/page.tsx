import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listAll, type ArticleStatus } from "@/server/repo/articleRepo";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: "下書き",
  published: "公開中",
  scheduled: "予約",
  archived: "アーカイブ",
};
const STATUS_COLOR: Record<ArticleStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  published: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-blue-50 text-blue-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export default async function AdminArticlesIndex() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const db = await getDb();
  const articles = await listAll(db);
  const drafts = articles.filter((a) => a.status === "draft");
  const published = articles.filter((a) => a.status === "published");

  return (
    <div>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-2">
            Admin / Articles
          </p>
          <h1 className="text-2xl font-bold tracking-tight">記事</h1>
          <p className="text-xs text-neutral-500 mt-2">
            下書き {drafts.length} 本 · 公開中 {published.length} 本
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-neutral-900 text-white font-bold text-sm rounded-md px-4 py-2 hover:bg-neutral-800 transition"
        >
          新規記事を作成
        </Link>
      </div>

      {articles.length === 0 ? (
        <EmptyState />
      ) : (
        <ArticleTable articles={articles} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center">
      <p className="text-sm text-neutral-600">まだ記事がありません。</p>
      <Link
        href="/admin/articles/new"
        className="inline-block mt-3 text-xs font-bold text-neutral-900 hover:underline"
      >
        最初の記事を作成 →
      </Link>
    </div>
  );
}

function ArticleTable({
  articles,
}: {
  articles: Awaited<ReturnType<typeof listAll>>;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-200 text-left">
          <tr>
            <Th>タイトル</Th>
            <Th>主役</Th>
            <Th>カテゴリ</Th>
            <Th>ステータス</Th>
            <Th>更新</Th>
            <Th>著者</Th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr
              key={a.id}
              className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50 transition"
            >
              <td className="px-4 py-3 min-w-[260px]">
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="font-semibold text-neutral-900 hover:underline line-clamp-1"
                >
                  {a.title}
                </Link>
                <div className="text-[11px] font-mono text-neutral-500 mt-0.5 truncate">
                  /{a.slug}
                </div>
              </td>
              <td className="px-4 py-3 text-[12px] text-neutral-700">
                <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600 mr-1.5">
                  {a.subjectKind}
                </span>
                {a.subjectName}
              </td>
              <td className="px-4 py-3 text-[12px] text-neutral-700">
                {a.categoryName}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[a.status]}`}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-[11px] font-mono tabular text-neutral-500">
                {a.updatedAt.slice(0, 10)}
              </td>
              <td className="px-4 py-3 text-[12px] text-neutral-700">
                {a.authorName ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
      {children}
    </th>
  );
}
