"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteAdminUserAction } from "@/server/blog/userActions";

const CONFIRM_WORD = "削除";

export function DeleteUserButton({ userId, name }: { userId: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      // モーダル表示直後にフォーカス
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canConfirm = value === CONFIRM_WORD && !pending;

  const submit = () => {
    if (!canConfirm) return;
    const fd = new FormData();
    fd.set("userId", String(userId));
    startTransition(() => {
      // Server Action はリダイレクトでレスポンスするため await は不要。
      deleteAdminUserAction(fd);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-muted-foreground hover:text-red-400 transition"
        aria-label={`${name} を削除`}
      >
        削除
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-user-${userId}-title`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-surface border border-border rounded-md p-6 w-full max-w-md shadow-xl">
            <h2
              id={`delete-user-${userId}-title`}
              className="text-base font-bold tracking-tight mb-2"
            >
              ユーザーを削除
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              <span className="text-foreground font-medium">{name}</span> を完全に削除します。
              この操作は取り消せません。続行するには下のボックスに
              <span className="mx-1 px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
                {CONFIRM_WORD}
              </span>
              と入力してください。
            </p>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong mb-4"
              placeholder={CONFIRM_WORD}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canConfirm}
                className="text-sm font-bold px-3 py-1.5 rounded-md bg-red-500/90 text-white hover:bg-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
