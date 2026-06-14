"use client";

import { useActionState } from "react";
import {
  createAdminUserAction,
  type UserFormResult,
} from "@/server/blog/userActions";

const INITIAL: UserFormResult = { ok: false };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createAdminUserAction, INITIAL);
  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="表示名"
        name="name"
        autoComplete="off"
        error={state.fieldErrors?.name}
      />
      <Field
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="off"
        error={state.fieldErrors?.email}
      />
      <Field
        label="初期パスワード (8 文字以上)"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
      />
      {state.error && !state.fieldErrors && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background font-bold rounded-md py-2 px-4 text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? "発行中…" : "ユーザーを発行"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block" htmlFor={name}>
        {label}
      </label>
      <input
        type={type}
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
