import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { ROUTES } from "@/shared/links";
import { SITE_NAME } from "@/shared/site";

type NavLink = {
  href: string;
  label: string;
  /** Tailwind breakpoint で表示開始 */
  showFrom: "sm" | "md" | "lg";
  /** 文字を強調し、右上にドットを付ける (新コンテンツ・推し動線用) */
  highlight?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: ROUTES.stocks, label: "銘柄", showFrom: "sm" },
  { href: ROUTES.screens, label: "スクリーン", showFrom: "md" },
  { href: ROUTES.industries, label: "業界", showFrom: "sm" },
  { href: ROUTES.themes, label: "特集", showFrom: "md", highlight: true },
  { href: ROUTES.predictions, label: "予測", showFrom: "sm", highlight: true },
  { href: ROUTES.blog, label: "ブログ", showFrom: "sm" },
  { href: ROUTES.about, label: "超!企業DBとは", showFrom: "lg" },
];

const VISIBILITY: Record<NavLink["showFrom"], string> = {
  sm: "hidden sm:inline",
  md: "hidden md:inline",
  lg: "hidden lg:inline",
};

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <span className="text-foreground text-xl font-bold tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${VISIBILITY[l.showFrom]} transition ${
                l.highlight
                  ? "text-foreground hover:text-muted-foreground font-bold relative"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
              {l.highlight && (
                <span className="absolute -top-1 -right-2.5 inline-block w-1.5 h-1.5 rounded-full bg-foreground" />
              )}
            </Link>
          ))}
          <SearchBox />
        </nav>
      </div>
    </header>
  );
}
