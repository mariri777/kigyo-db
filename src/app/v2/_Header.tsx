import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { BrandMark } from "./_BrandMark";
import { GlobalSearchKbd, GLOBAL_SEARCH_INPUT_ID } from "./_SearchHotkey";

const NAV_LINKS = [
  { href: "/v2", label: "ホーム" },
  { href: "/v2#predictions", label: "AI予測", highlight: true },
  { href: "/v2/articles", label: "記事" },
  { href: "/v2#featured", label: "注目企業" },
  { href: "/v2/stocks", label: "銘柄" },
  { href: "/v2#semiconductor", label: "半導体特集" },
];

export function V2Header() {
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

        <div className="flex-1 max-w-md ml-auto hidden md:flex items-center bg-neutral-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:bg-white focus-within:border-neutral-300 border border-transparent transition">
          <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <input
            id={GLOBAL_SEARCH_INPUT_ID}
            type="text"
            placeholder="銘柄・業界・キーワードを検索"
            className="flex-1 bg-transparent px-2.5 text-sm placeholder:text-neutral-500 focus:outline-none"
            aria-label="検索"
          />
          <GlobalSearchKbd />
        </div>

        <button
          type="button"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition ml-auto md:ml-0"
          aria-label="メニュー"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
