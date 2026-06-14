"use client";

import { useState } from "react";
import { GLOSSARY } from "@/shared/glossary";

type Props = {
  /** 用語キー。指定しない場合は children のテキストをキーに使う */
  term?: string;
  children: React.ReactNode;
};

/**
 * 専門用語を hover/tap で解説。用語の壁を取り除く。
 * モバイルではタップでトグル、PCではホバーで開く。
 */
export function Term({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const key = term ?? (typeof children === "string" ? children : "");
  const def = GLOSSARY[key];

  if (!def) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="border-b border-dotted border-foreground/40 hover:border-foreground transition cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((s) => !s);
        }}
        aria-label={`${key} の解説を表示`}
      >
        {children}
        <span className="ml-0.5 text-[9px] text-muted align-super select-none">?</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-[calc(100%+4px)] w-72 max-w-[80vw] bg-foreground text-background p-3 rounded-md shadow-xl text-xs leading-relaxed font-normal not-italic"
        >
          <strong className="block text-[11px] font-bold tracking-wide mb-1">{key}</strong>
          <span className="opacity-90">{def}</span>
        </span>
      )}
    </span>
  );
}
