"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db/client";
import { requireAdmin } from "@/server/auth/session";
import {
  createArticle,
  deleteArticle,
  findById,
  updateArticle,
  type ArticleStatus,
  type ArticleWriteInput,
} from "@/server/repo/articleRepo";

export type SaveResult =
  | { ok: true; id: number; slug: string; savedAt: string }
  | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

function validateInput(input: ArticleWriteInput): string | null {
  if (!SLUG_RE.test(input.slug)) {
    return "スラッグは英小文字・数字・ハイフンで 1-80 文字。";
  }
  if (!input.title.trim()) return "タイトルが空です。";
  if (!input.subjectRef.trim() || !input.subjectName.trim()) {
    return "主役 (subject) が未設定です。";
  }
  if (!input.contentJson) return "本文 JSON が空です。";
  if (input.actions.length > 3) return "アクションは最大 3 つまで。";
  return null;
}

export async function saveArticleAction(
  id: number | null,
  raw: Omit<ArticleWriteInput, "authorId">,
): Promise<SaveResult> {
  const admin = await requireAdmin();
  const input: ArticleWriteInput = { ...raw, authorId: admin.userId };
  const err = validateInput(input);
  if (err) return { ok: false, error: err };

  const db = await getDb();
  try {
    let savedId: number;
    if (id == null) {
      savedId = await createArticle(db, input);
    } else {
      const existing = await findById(db, id);
      if (!existing) return { ok: false, error: "記事が見つかりません。" };
      await updateArticle(db, id, input);
      savedId = id;
    }
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${savedId}`);
    revalidatePath(`/articles/${input.slug}`);
    revalidatePath("/articles");
    return {
      ok: true,
      id: savedId,
      slug: input.slug,
      savedAt: new Date().toISOString(),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "保存に失敗しました。";
    if (msg.includes("UNIQUE")) {
      return { ok: false, error: "同じスラッグの記事が既に存在します。" };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteArticleAction(id: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const existing = await findById(db, id);
  if (!existing) redirect("/admin/articles");
  await deleteArticle(db, id);
  revalidatePath("/admin/articles");
  revalidatePath(`/articles/${existing.slug}`);
  revalidatePath("/articles");
  redirect("/admin/articles?deleted=1");
}

/** 公開状態切り替え (auto-save とは別に明示的に呼ぶ) */
export async function updateStatusAction(
  id: number,
  status: ArticleStatus,
): Promise<SaveResult> {
  await requireAdmin();
  const db = await getDb();
  const existing = await findById(db, id);
  if (!existing) return { ok: false, error: "記事が見つかりません。" };
  await updateArticle(db, id, {
    ...existing,
    actions: existing.actions,
    publishedAt:
      status === "published" && !existing.publishedAt
        ? new Date().toISOString().slice(0, 10)
        : existing.publishedAt,
    status,
    authorId: null, // 触らない
  });
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath(`/articles/${existing.slug}`);
  revalidatePath("/articles");
  return {
    ok: true,
    id,
    slug: existing.slug,
    savedAt: new Date().toISOString(),
  };
}
