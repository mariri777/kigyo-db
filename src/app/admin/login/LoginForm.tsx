"use client";

import { useActionState } from "react";
import { loginAction, type AdminActionResult } from "@/server/blog/actions";

const INITIAL: AdminActionResult = { ok: false };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);
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
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
