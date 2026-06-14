import Link from "next/link";
import Script from "next/script";
import { SearchBox } from "@/components/SearchBox";
import {
  SITE_DESCRIPTION,
  SITE_LANG,
  SITE_NAME,
  SITE_SAME_AS,
  SITE_URL,
} from "@/shared/site";

// 公開サイト全体の chrome (ヘッダー/フッター/JSON-LD/Web Analytics)。
// 管理画面 (/admin/*) はこの layout に入らないので、フッター・検索ボックス・
// JSON-LD 等は admin 側に一切混ざらない。
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Cho! Kigyo DB",
    url: SITE_URL,
    inLanguage: SITE_LANG,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/stocks?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "Cho! Kigyo DB",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: SITE_DESCRIPTION,
    sameAs: SITE_SAME_AS,
  };

  return (
    <>
      <Script
        id="ld-website"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight">超!企業DB</span>
            <span className="text-foreground/60 text-xs hidden sm:inline">Cho! Kigyo DB</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm">
            <Link
              href="/stocks"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              銘柄
            </Link>
            <Link
              href="/screens"
              className="text-muted-foreground hover:text-foreground transition hidden md:inline"
            >
              スクリーン
            </Link>
            <Link
              href="/industries"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              業界
            </Link>
            <Link
              href="/themes"
              className="text-foreground hover:text-muted-foreground transition hidden md:inline font-bold relative"
            >
              特集
              <span className="absolute -top-1 -right-2.5 inline-block w-1.5 h-1.5 rounded-full bg-foreground" />
            </Link>
            <Link
              href="/predictions"
              className="text-foreground hover:text-muted-foreground transition hidden sm:inline font-bold relative"
            >
              予測
              <span className="absolute -top-1 -right-2.5 inline-block w-1.5 h-1.5 rounded-full bg-foreground" />
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              ブログ
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition hidden lg:inline">
              超!企業DBとは
            </Link>
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground transition hidden md:inline-flex items-center gap-1 text-xs"
              aria-label="マイ予測"
              title="マイ予測"
            >
              <span className="inline-block w-6 h-6 rounded-full border border-border-strong flex items-center justify-center text-foreground">
                🎯
              </span>
            </Link>
            <SearchBox />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-surface mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 text-xs text-foreground/60 space-y-3 leading-relaxed">
          <p>
            本サービスの情報は、不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。
            投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。
          </p>
          <p>
            株価は市場実勢の終値を週次で更新しています。財務指標・業績データは EDINET / TDnet / J-Quants からの取得を前提とした構造で、現在はサンプルデータで運用中です。
          </p>
          <div className="pt-4 border-t border-border flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/guide" className="text-muted-foreground hover:text-foreground transition">
              初めての方へ
            </Link>
            <Link href="/themes" className="text-muted-foreground hover:text-foreground transition">
              特集
            </Link>
            <Link href="/predictions" className="text-muted-foreground hover:text-foreground transition">
              予測
            </Link>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground transition">
              マイ予測
            </Link>
            <Link href="/screens" className="text-muted-foreground hover:text-foreground transition">
              スクリーン
            </Link>
            <Link href="/compare" className="text-muted-foreground hover:text-foreground transition">
              比較
            </Link>
            <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition">
              利用規約
            </Link>
            <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition">
              プライバシーポリシー
            </Link>
            <Link href="/legal/disclaimer" className="text-muted-foreground hover:text-foreground transition">
              免責事項
            </Link>
            <Link href="/legal/editorial-policy" className="text-muted-foreground hover:text-foreground transition">
              編集方針
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition">
              超!企業DBとは
            </Link>
            <span className="ml-auto text-foreground/60">© 2026 超!企業DB</span>
          </div>
        </div>
      </footer>
      {/* Cloudflare Web Analytics(cookie 不使用・個人を追跡しない計測)。本番ビルドのみ */}
      {process.env.NODE_ENV === "production" && (
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "6a7cbafe0c2b4fed9c18724aabea76e6"}'
        />
      )}
    </>
  );
}
