import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { SearchBox, type Hit } from "@/components/SearchBox";
import {
  SITE_BACKGROUND_COLOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_PUBLISHER,
  SITE_SAME_AS,
  SITE_TAGLINE,
  SITE_THEME_COLOR,
  SITE_TWITTER,
  SITE_URL,
} from "@/shared/site";
import { listStockBriefs } from "@/server/usecase";
import { industries } from "@/content/industries";
import { listPosts, CATEGORY_LABEL } from "@/content/posts";
import "./globals.css";

async function buildSearchIndex(): Promise<Hit[]> {
  const stocks = await listStockBriefs();
  const items: Hit[] = [];
  for (const s of stocks) {
    items.push({
      type: "stock",
      code: s.code,
      name: s.name,
      nameEn: s.nameEn,
      cluster: s.sectorTSE,
    });
  }
  for (const i of industries) {
    items.push({ type: "industry", slug: i.slug, name: i.name });
  }
  for (const p of listPosts()) {
    items.push({
      type: "post",
      slug: p.slug,
      title: p.title,
      category: CATEGORY_LABEL[p.category],
    });
  }
  return items;
}

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const jbMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_PUBLISHER, url: SITE_URL }],
  creator: SITE_PUBLISHER,
  publisher: SITE_PUBLISHER,
  category: "finance",
  classification: "投資情報 / 銘柄分析",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: SITE_THEME_COLOR },
  ],
  colorScheme: "dark light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchIndex = await buildSearchIndex();
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
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon` },
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
    logo: `${SITE_URL}/icon`,
    description: SITE_DESCRIPTION,
    sameAs: SITE_SAME_AS,
  };

  return (
    <html lang={SITE_LANG} className={`${notoJp.variable} ${jbMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: SITE_BACKGROUND_COLOR }}>
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
              <span className="text-accent text-xl font-bold tracking-tight">超!企業DB</span>
              <span className="text-dim text-xs hidden sm:inline">Cho! Kigyo DB</span>
            </Link>
            <nav className="flex items-center gap-3 sm:gap-5 text-sm">
              <Link
                href="/stocks"
                className="text-muted hover:text-foreground transition hidden sm:inline"
              >
                銘柄
              </Link>
              <Link
                href="/screens"
                className="text-muted hover:text-foreground transition hidden md:inline"
              >
                スクリーン
              </Link>
              <Link
                href="/industries"
                className="text-muted hover:text-foreground transition hidden sm:inline"
              >
                業界
              </Link>
              <Link
                href="/themes"
                className="text-foreground hover:text-muted transition hidden md:inline font-bold relative"
              >
                特集
                <span className="absolute -top-1 -right-2.5 inline-block w-1.5 h-1.5 rounded-full bg-foreground" />
              </Link>
              <Link
                href="/predictions"
                className="text-foreground hover:text-muted transition hidden sm:inline font-bold relative"
              >
                予測
                <span className="absolute -top-1 -right-2.5 inline-block w-1.5 h-1.5 rounded-full bg-foreground" />
              </Link>
              <Link
                href="/blog"
                className="text-muted hover:text-foreground transition hidden sm:inline"
              >
                ブログ
              </Link>
              <Link href="/about" className="text-muted hover:text-foreground transition hidden lg:inline">
                超!企業DBとは
              </Link>
              <Link
                href="/profile"
                className="text-muted hover:text-foreground transition hidden md:inline-flex items-center gap-1 text-xs"
                aria-label="マイ予測"
                title="マイ予測"
              >
                <span className="inline-block w-6 h-6 rounded-full border border-border-strong flex items-center justify-center text-foreground">
                  🎯
                </span>
              </Link>
              <SearchBox index={searchIndex} />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface mt-16">
          <div className="max-w-6xl mx-auto px-6 py-10 text-xs text-dim space-y-3 leading-relaxed">
            <p>
              本サービスの情報は、不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。
              投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。
            </p>
            <p>
              株価は市場実勢の終値を週次で更新しています。財務指標・業績データは EDINET / TDnet / J-Quants からの取得を前提とした構造で、現在はサンプルデータで運用中です。
            </p>
            <div className="pt-4 border-t border-border flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/guide" className="text-muted hover:text-foreground transition">
                初めての方へ
              </Link>
              <Link href="/themes" className="text-muted hover:text-foreground transition">
                特集
              </Link>
              <Link href="/predictions" className="text-muted hover:text-foreground transition">
                予測
              </Link>
              <Link href="/profile" className="text-muted hover:text-foreground transition">
                マイ予測
              </Link>
              <Link href="/screens" className="text-muted hover:text-foreground transition">
                スクリーン
              </Link>
              <Link href="/compare" className="text-muted hover:text-foreground transition">
                比較
              </Link>
              <Link href="/legal/terms" className="text-muted hover:text-foreground transition">
                利用規約
              </Link>
              <Link href="/legal/privacy" className="text-muted hover:text-foreground transition">
                プライバシーポリシー
              </Link>
              <Link href="/legal/disclaimer" className="text-muted hover:text-foreground transition">
                免責事項
              </Link>
              <Link href="/legal/editorial-policy" className="text-muted hover:text-foreground transition">
                編集方針
              </Link>
              <Link href="/about" className="text-muted hover:text-foreground transition">
                超!企業DBとは
              </Link>
              <span className="ml-auto text-dim">© 2026 超!企業DB</span>
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
      </body>
    </html>
  );
}
