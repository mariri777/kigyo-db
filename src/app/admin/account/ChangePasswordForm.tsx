"use client";

import { useActionState } from "react";
import {
  changeMyPasswordAction,
  type UserFormResult,
} from "@/server/blog/userActions";

const INITIAL: UserFormResult = { ok: false };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeMyPasswordAction, INITIAL);
  return (
    <form action={formAction} className="space-y-4">
      <PwField
        label="現在のパスワード"
        name="currentPassword"
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
      />
      <PwField
        label="新しいパスワード (8 文字以上)"
        name="newPassword"
        autoComplete="new-password"
        error={state.fieldErrors?.newPassword}
      />
      <PwField
        label="新しいパスワード (確認)"
        name="confirmPassword"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      {state.error && !state.fieldErrors && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background font-bold rounded-md py-2 px-4 text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? "変更中…" : "パスワードを変更"}
      </button>
    </form>
  );
}

function PwField({
  label,
  name,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block" htmlFor={name}>
        {label}
      </label>
      <input
        type="password"
        id={name}
        name={name}
        required
        autoComplete={autoComplete}
        className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
