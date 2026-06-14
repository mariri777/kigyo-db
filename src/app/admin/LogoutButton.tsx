"use client";

import { logoutAction } from "@/server/blog/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 transition"
      >
        ログアウト
      </button>
    </form>
  );
}
