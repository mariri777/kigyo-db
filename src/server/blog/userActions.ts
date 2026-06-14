"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/server/db/client";
import { requireAdmin } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  createUser,
  findUserById,
  updateUserPassword,
} from "@/server/repo/userRepo";
import {
  deleteUserSessionsExcept,
  findUserByEmail,
} from "@/server/repo/authRepo";

export type UserFormResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongEnough(password: string): boolean {
  return password.length >= 8 && password.length <= 256;
}

export async function changeMyPasswordAction(
  _prev: UserFormResult | undefined,
  formData: FormData,
): Promise<UserFormResult> {
  const admin = await requireAdmin();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.currentPassword = "現在のパスワードを入力してください。";
  if (!isStrongEnough(next)) {
    fieldErrors.newPassword = "新しいパスワードは 8 文字以上で設定してください。";
  }
  if (next !== confirm) {
    fieldErrors.confirmPassword = "確認用パスワードが一致しません。";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "入力内容を確認してください。", fieldErrors };
  }

  const db = await getDb();
  const user = await findUserById(db, admin.userId);
  if (!user) return { ok: false, error: "ユーザーが見つかりません。" };

  const okCurrent = await verifyPassword(current, {
    hashB64: user.passwordHash,
    saltB64: user.passwordSalt,
    iterations: user.passwordIterations,
  });
  if (!okCurrent) {
    return {
      ok: false,
      fieldErrors: { currentPassword: "現在のパスワードが正しくありません。" },
    };
  }

  const hashed = await hashPassword(next);
  await updateUserPassword(db, admin.userId, {
    passwordHash: hashed.hashB64,
    passwordSalt: hashed.saltB64,
    passwordIterations: hashed.iterations,
  });
  // 自分の現セッション以外を全て無効化(盗まれているかもしれない他端末からのアクセスを締め出す)
  await deleteUserSessionsExcept(db, admin.userId, admin.sessionId);

  redirect("/admin/account?changed=1");
}

export async function createAdminUserAction(
  _prev: UserFormResult | undefined,
  formData: FormData,
): Promise<UserFormResult> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) {
    fieldErrors.email = "有効なメールアドレスを入力してください。";
  }
  if (!name) fieldErrors.name = "表示名を入力してください。";
  if (!isStrongEnough(password)) {
    fieldErrors.password = "パスワードは 8 文字以上で設定してください。";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "入力内容を確認してください。", fieldErrors };
  }

  const db = await getDb();
  const existing = await findUserByEmail(db, email);
  if (existing) {
    return {
      ok: false,
      fieldErrors: { email: "このメールアドレスは既に登録されています。" },
    };
  }

  const hashed = await hashPassword(password);
  await createUser(db, {
    email,
    name,
    passwordHash: hashed.hashB64,
    passwordSalt: hashed.saltB64,
    passwordIterations: hashed.iterations,
  });

  redirect("/admin/users?created=1");
}
