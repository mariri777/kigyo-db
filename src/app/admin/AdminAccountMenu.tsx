"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/server/blog/actions";

/** name の先頭 1 文字をアバターに使う(英数字は大文字化、日本語はそのまま) */
function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const ch = trimmed[0];
  return /[a-z]/.test(ch) ? ch.toUpperCase() : ch;
}

/** name から hue を導出して、毎回安定した色のアバターにする */
function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function AdminAccountMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (e.target instanceof Node && wrapRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = initialOf(name);
  const hue = hueOf(name + email);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="アカウントメニューを開く"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white border border-border hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-foreground/40"
        style={{ background: `hsl(${hue} 65% 42%)` }}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-border bg-surface shadow-lg z-50"
        >
          <div className="px-3 py-2 border-b border-border">
            <div className="text-xs font-semibold text-foreground truncate" title={name}>
              {name}
            </div>
            <div className="text-[11px] text-muted-foreground truncate" title={email}>
              {email}
            </div>
          </div>
          <ul className="py-1 text-xs">
            <li>
              <Link
                href="/admin/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-foreground/90 hover:bg-foreground/5 transition"
              >
                アカウント設定
              </Link>
            </li>
            <li>
              <Link
                href="/"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-foreground/90 hover:bg-foreground/5 transition"
              >
                公開サイトを開く ↗
              </Link>
            </li>
          </ul>
          <div className="border-t border-border p-1">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/5 rounded transition"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
