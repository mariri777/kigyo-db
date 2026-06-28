"use client";

import { useEffect, useState } from "react";

const INPUT_ID = "v2-global-search";

export function GlobalSearchKbd() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    // ポインタ細かい = マウス/トラックパッド前提、つまり物理キーボードが期待できる端末
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) {
      setLabel(null);
      return;
    }
    const isMac = /Mac|iPhone|iPad|iPod/i.test(ua);
    setLabel(isMac ? "⌘K" : "Ctrl+K");

    const onKey = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "k") return;
      const el = document.getElementById(INPUT_ID) as HTMLInputElement | null;
      if (!el) return;
      e.preventDefault();
      el.focus();
      el.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!label) return null;
  return (
    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono text-neutral-500 shrink-0">
      {label}
    </kbd>
  );
}

export const GLOBAL_SEARCH_INPUT_ID = INPUT_ID;
