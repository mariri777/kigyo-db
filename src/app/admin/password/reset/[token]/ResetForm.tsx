"use client";

import { useActionState } from "react";
import {
  completePasswordResetAction,
  type CompleteResetActionState,
} from "@/server/auth/passwordResetActions";

const INITIAL: CompleteResetActionState = { ok: false };

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    completePasswordResetAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="password">
          新しいパスワード(8 文字以上)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="confirm">
          確認のためもう一度
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "保存中…" : "新しいパスワードを保存"}
      </button>
    </form>
  );
}
