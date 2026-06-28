"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type RequestResetResult,
} from "@/server/auth/passwordResetActions";

const INITIAL: RequestResetResult = { ok: false };

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    INITIAL,
  );
  if (state.ok) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-relaxed">
        入力されたメールアドレスが登録されている場合、再設定リンクをお送りしました。メールをご確認ください。
      </div>
    );
  }
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-400 leading-relaxed">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground text-background font-bold rounded-md py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? "送信中…" : "再設定リンクを送信"}
      </button>
    </form>
  );
}
