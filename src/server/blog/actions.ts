"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db/client";
import {
  endCurrentSession,
  requireAdmin,
  startSessionForUser,
} from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { findUserByEmail } from "@/server/repo/authRepo";
import {
  createPost,
  deletePost,
  findById,
  type PostWriteInput,
} from "@/server/repo/postRepo";
import { updatePost } from "@/server/repo/postRepo";
import { sanitizePostHtml } from "@/server/blog/sanitize";
import { estimateReadingMin } from "@/shared/readingTime";

const VALID_CATEGORIES = new Set([
  "earnings",
  "industry-watch",
  "analysis",
  "disclosure",
  "primer",
]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

export type AdminActionResult = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, error: "メールアドレスとパスワードを入力してください。" };
  }
  const db = await getDb();
  const user = await findUserByEmail(db, email);
  if (!user) {
    return { ok: false, error: "メールアドレスまたはパスワードが正しくありません。" };
  }
  const ok = await verifyPassword(password, {
    hashB64: user.passwordHash,
    saltB64: user.passwordSalt,
    iterations: user.passwordIterations,
  });
  if (!ok) {
    return { ok: false, error: "メールアドレスまたはパスワードが正しくありません。" };
  }
  await startSessionForUser(user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endCurrentSession();
  redirect("/admin/login");
}

export type PostFormResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  postId?: number;
};

function parsePostForm(formData: FormData): {
  ok: true;
  values: PostWriteInput;
  intent: "draft" | "publish";
} | {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const lede = String(formData.get("lede") ?? "").trim();
  const bodyHtml = String(formData.get("bodyHtml") ?? "");
  const category = String(formData.get("category") ?? "");
  const author = String(formData.get("author") ?? "editor");
  const fiscalPeriodRaw = String(formData.get("fiscalPeriod") ?? "").trim();
  const relatedStocksRaw = String(formData.get("relatedStocks") ?? "");
  const relatedIndustriesRaw = String(formData.get("relatedIndustries") ?? "");
  const tagSlugsRaw = String(formData.get("tagSlugs") ?? "");
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
  const intentStr = String(formData.get("intent") ?? "draft");

  if (!SLUG_RE.test(slug)) {
    fieldErrors.slug =
      "スラッグは英小文字・数字・ハイフンで 1-80 文字にしてください。";
  }
  if (!title) fieldErrors.title = "タイトルを入力してください。";
  if (!lede) fieldErrors.lede = "リード文を入力してください。";
  if (!VALID_CATEGORIES.has(category)) {
    fieldErrors.category = "カテゴリを選択してください。";
  }
  if (!bodyHtml.trim()) {
    fieldErrors.bodyHtml = "本文を入力してください。";
  }
  const intent: "draft" | "publish" = intentStr === "publish" ? "publish" : "draft";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "入力内容を確認してください。", fieldErrors };
  }

  const splitTokens = (s: string): string[] =>
    s
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

  const relatedStocks = splitTokens(relatedStocksRaw).map((s) => s).slice(0, 30);
  const relatedIndustries = splitTokens(relatedIndustriesRaw).slice(0, 30);
  const tagSlugs = splitTokens(tagSlugsRaw)
    .map((t) => t.toLowerCase())
    .slice(0, 30);

  const sanitizedHtml = sanitizePostHtml(bodyHtml);
  const readTimeMin = estimateReadingMin(sanitizedHtml);

  return {
    ok: true,
    intent,
    values: {
      slug,
      title,
      lede,
      bodyHtml: sanitizedHtml,
      category: category as PostWriteInput["category"],
      status: intent === "publish" ? "published" : "draft",
      author: author === "ai-editor" ? "ai-editor" : "editor",
      readTimeMin,
      fiscalPeriod: fiscalPeriodRaw || null,
      relatedStocks,
      relatedIndustries,
      publishedAt:
        intent === "publish"
          ? (publishedAtRaw || new Date().toISOString().slice(0, 10))
          : (publishedAtRaw || null),
      authorUserId: null, // 後で requireAdmin の userId を埋める
      tagSlugs,
    },
  };
}

export async function createPostAction(
  _prev: PostFormResult | undefined,
  formData: FormData,
): Promise<PostFormResult> {
  const admin = await requireAdmin();
  const parsed = parsePostForm(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }
  const db = await getDb();
  try {
    const id = await createPost(db, {
      ...parsed.values,
      authorUserId: admin.userId,
    });
    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.values.slug}`);
    revalidatePath("/admin");
    redirect(`/admin/posts/${id}?saved=1`);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message.includes("UNIQUE")
          ? "同じスラッグの記事が既に存在します。"
          : "保存に失敗しました。",
    };
  }
}

export async function updatePostAction(
  postId: number,
  _prev: PostFormResult | undefined,
  formData: FormData,
): Promise<PostFormResult> {
  await requireAdmin();
  const parsed = parsePostForm(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }
  const db = await getDb();
  const existing = await findById(db, postId);
  if (!existing) return { ok: false, error: "記事が見つかりません。" };

  try {
    await updatePost(db, postId, parsed.values);
    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.values.slug}`);
    if (parsed.values.slug !== existing.slug) {
      revalidatePath(`/blog/${existing.slug}`);
    }
    revalidatePath("/admin");
    redirect(`/admin/posts/${postId}?saved=1`);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message.includes("UNIQUE")
          ? "同じスラッグの記事が既に存在します。"
          : "保存に失敗しました。",
    };
  }
}

export async function deletePostAction(postId: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const existing = await findById(db, postId);
  if (!existing) redirect("/admin");
  await deletePost(db, postId);
  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/admin");
  redirect("/admin?deleted=1");
}
