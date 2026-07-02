"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "./_BrandMark";
import { SearchBox } from "./_SearchBox";

const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/forecasts", label: "AI予測", accent: true },
  { href: "/articles", label: "記事" },
  { href: "/stocks", label: "銘柄" },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // ダイアログとして開いたら閉じるボタンへフォーカスを移す
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // 簡易フォーカストラップ: パネル内の focusable 要素で Tab をループさせる
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      // メニューを閉じたら開いたボタンへフォーカスを戻す
      openBtnRef.current?.focus();
    };
  }, [open]);

  // ページ遷移でメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 rounded-lg">
          <BrandMark className="w-7 h-7 text-neutral-900" accent="#10b981" />
          <span className="font-bold tracking-tight text-base sm:text-lg">
            超!企業<span className="text-emerald-600">DB</span>
          </span>
        </Link>

        <nav aria-label="メイン" className="hidden lg:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((l) => {
            const current = isCurrent(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? "page" : undefined}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  current
                    ? "text-neutral-900 bg-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {l.label}
                {l.accent && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <SearchBox />

        <button
          type="button"
          ref={openBtnRef}
          onClick={() => setOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition ml-auto md:ml-0"
          aria-label="メニューを開く"
          aria-expanded={open}
          aria-controls="site-mobile-menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>

      {open && (
        <div
          id="site-mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="メニュー"
          className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col"
        >
          <div className="h-14 px-4 sm:px-6 flex items-center gap-4 border-b border-neutral-200 shrink-0">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 shrink-0 rounded-lg"
            >
              <BrandMark className="w-7 h-7 text-neutral-900" accent="#10b981" />
              <span className="font-bold tracking-tight text-base sm:text-lg">
                超!企業<span className="text-emerald-600">DB</span>
              </span>
            </Link>
            <button
              type="button"
              ref={closeBtnRef}
              onClick={() => setOpen(false)}
              className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition"
              aria-label="メニューを閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="md:hidden mb-4">
              <SearchBox variant="mobile" onNavigate={() => setOpen(false)} />
            </div>

            <nav aria-label="メイン" className="flex flex-col">
              {NAV_LINKS.map((l) => {
                const current = isCurrent(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={`relative px-3 py-3 rounded-lg text-base font-semibold transition flex items-center ${
                      current ? "text-neutral-900 bg-neutral-100" : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    {l.label}
                    {l.accent && (
                      <span
                        aria-hidden="true"
                        className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
