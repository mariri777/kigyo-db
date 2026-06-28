"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/server/db/client";
import {
  endCurrentSession,
  startSessionForUser,
} from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { findUserByEmail } from "@/server/repo/authRepo";

// 後方互換: ファイル名は @/server/blog/actions のまま (admin のログイン画面が import)。
// 旧 blog の posts CRUD はここから削除済み。新しい articles 用 Server Actions は
// `@/server/articles/actions` に置く。

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
