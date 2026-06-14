import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import {
  findById,
  listAllTags,
  listTagsForPostIds,
  parsePostJsonArray,
  type PostRow,
} from "@/server/repo/postRepo";
import { listByCodes } from "@/server/repo/stockRepo";
import { industries } from "@/content/industries";
import {
  deletePostAction,
  updatePostAction,
  type PostFormResult,
} from "@/server/blog/actions";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const db = await getDb();
  const row = await findById(db, id);
  if (!row) notFound();

  const tagMap = await listTagsForPostIds(db, [row.id]);
  const tagSlugs = (tagMap.get(row.id) ?? []).map((t) => t.slug);
  const availableTags = await listAllTags(db);
  const availableIndustries = industries.map((i) => ({ slug: i.slug, name: i.name }));

  // 既存の関連銘柄コードを会社名にマッピングしておく(初期表示用)
  const relatedStockCodes = parsePostJsonArray(row.relatedStocksJson);
  const stockBriefs = await listByCodes(db, relatedStockCodes);
  const briefByCode = new Map(stockBriefs.map((b) => [b.code, b]));
  const relatedStocksLabels: Record<string, string> = {};
  for (const code of relatedStockCodes) {
    const sb = briefByCode.get(code);
    relatedStocksLabels[code] = sb ? `${code} — ${sb.name}` : code;
  }

  const { saved } = await searchParams;

  // Server Action にバインドする 1 引数版
  async function action(prev: PostFormResult | undefined, formData: FormData) {
    "use server";
    return updatePostAction(id, prev, formData);
  }

  async function handleDelete() {
    "use server";
    await deletePostAction(id);
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← 記事一覧へ
      </Link>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">記事を編集</h1>
          <p className="text-xs text-foreground/60 mt-1 font-mono">
            id: {row.id} / 作成: {row.createdAt.slice(0, 10)} / 更新: {row.updatedAt.slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {row.status === "published" && (
            <Link
              href={`/blog/${row.slug}`}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 transition"
              target="_blank"
            >
              公開ページを開く ↗
            </Link>
          )}
          <DeleteButton onSubmit={handleDelete} />
        </div>
      </div>

      {saved === "1" && (
        <div className="mb-6 bg-muted border-l-2 border-foreground rounded-md p-3 text-sm">
          保存しました。
        </div>
      )}

      <PostEditor
        action={action}
        submitLabel="保存中"
        availableTags={availableTags}
        availableIndustries={availableIndustries}
        initial={toInitial(row, tagSlugs, relatedStocksLabels)}
      />
    </div>
  );
}

function toInitial(
  row: PostRow,
  tagSlugs: string[],
  relatedStocksLabels: Record<string, string>,
): React.ComponentProps<typeof PostEditor>["initial"] {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    lede: row.lede,
    bodyHtml: row.bodyHtml,
    category: row.category,
    status: row.status,
    author: row.author,
    fiscalPeriod: row.fiscalPeriod ?? "",
    publishedAt: row.publishedAt ?? "",
    relatedStocks: parsePostJsonArray(row.relatedStocksJson),
    relatedStocksLabels,
    relatedIndustries: parsePostJsonArray(row.relatedIndustriesJson),
    tagSlugs,
  };
}

function DeleteButton({ onSubmit }: { onSubmit: () => Promise<void> }) {
  return (
    <form action={onSubmit}>
      <button
        type="submit"
        className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 rounded-md px-3 py-2 transition"
      >
        削除
      </button>
    </form>
  );
}
