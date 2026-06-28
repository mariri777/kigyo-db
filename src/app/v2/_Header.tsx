"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "./_BrandMark";
import { SearchBox } from "./_SearchBox";

const NAV_LINKS = [
  { href: "/v2", label: "ホーム" },
  { href: "/v2#predictions", label: "AI予測", highlight: true },
  { href: "/v2/articles", label: "記事" },
  { href: "/v2#featured", label: "注目企業" },
  { href: "/v2/stocks", label: "銘柄" },
  { href: "/v2#semiconductor", label: "半導体特集" },
];

export function V2Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/v2" className="flex items-center gap-2 shrink-0">
          <BrandMark className="w-7 h-7 text-neutral-900" accent="#10b981" />
          <span className="font-bold tracking-tight text-base sm:text-lg">
            超!企業<span className="text-emerald-600">DB</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                l.highlight
                  ? "text-neutral-900 hover:bg-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              {l.label}
              {l.highlight && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        <SearchBox />


        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition ml-auto md:ml-0"
          aria-label="メニューを開く"
          aria-expanded={open}
          aria-controls="v2-mobile-menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div
          id="v2-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="メニュー"
          className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col"
        >
          <div className="h-14 px-4 sm:px-6 flex items-center gap-4 border-b border-neutral-200 shrink-0">
            <Link
              href="/v2"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 shrink-0"
            >
              <BrandMark className="w-7 h-7 text-neutral-900" accent="#10b981" />
              <span className="font-bold tracking-tight text-base sm:text-lg">
                超!企業<span className="text-emerald-600">DB</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition"
              aria-label="メニューを閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="md:hidden mb-4">
              <SearchBox variant="mobile" onNavigate={() => setOpen(false)} />
            </div>

            <nav className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="relative px-3 py-3 rounded-lg text-base font-semibold text-neutral-800 hover:bg-neutral-100 transition flex items-center"
                >
                  {l.label}
                  {l.highlight && (
                    <span className="ml-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
