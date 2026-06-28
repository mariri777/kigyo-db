"use server";

import { redirect } from "next/navigation";
import {
  completePasswordReset,
  requestPasswordReset,
} from "@/server/auth/passwordReset";

export type RequestResetResult = {
  ok: boolean;
  error?: string;
};

export async function requestPasswordResetAction(
  _prev: RequestResetResult | undefined,
  formData: FormData,
): Promise<RequestResetResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, error: "メールアドレスを入力してください。" };
  }
  try {
    await requestPasswordReset(email);
    return { ok: true };
  } catch (e) {
    console.error("[password-reset] request failed", e);
    return {
      ok: false,
      error:
        "リクエストの送信に失敗しました。時間をおいて再度お試しください。",
    };
  }
}

export type CompleteResetActionState = {
  ok: boolean;
  error?: string;
};

export async function completePasswordResetAction(
  _prev: CompleteResetActionState | undefined,
  formData: FormData,
): Promise<CompleteResetActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!token) {
    return { ok: false, error: "トークンが指定されていません。" };
  }
  if (!password || password.length < 8) {
    return { ok: false, error: "パスワードは 8 文字以上で入力してください。" };
  }
  if (password !== confirm) {
    return { ok: false, error: "確認用パスワードが一致しません。" };
  }
  const result = await completePasswordReset(token, password);
  if (!result.ok) {
    if (result.error === "invalid_token") {
      return {
        ok: false,
        error: "リンクが無効または期限切れです。再度パスワード再設定をリクエストしてください。",
      };
    }
    return { ok: false, error: "パスワードの保存に失敗しました。" };
  }
  redirect("/admin/login?reset=ok");
}
