import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP, JetBrains_Mono } from "next/font/google";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_PUBLISHER,
  SITE_TAGLINE,
  SITE_TWITTER,
  SITE_URL,
} from "@/shared/site";
import "./globals.css";

// Noto Sans JP は日本語コンテンツが本体なので latin だけにしない。
// Google Fonts では `japanese` 等の指定はないので preload を切り、
// hint だけ next が CSS で扱う形に倒す。
const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});
const jbMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
// 記事見出し・エディトリアル用のセリフ体。従来は未定義の --font-serif を参照して
// OS ごとに別の明朝で描画されていたため、正式に読み込んで統一する。
const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["600", "700"],
  display: "swap",
  preload: false,
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
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// ダークモードは現状未提供(globals.css の color-scheme: light と一致させる)。
// dark を宣言すると OS ダーク環境でフォーム部品だけ暗転する不整合が起きる。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

/**
 * root layout は `<html>`/`<body>` だけ。
 * 公開サイトの chrome (ヘッダー/フッター/JSON-LD/Web Analytics) は
 * `(main)/layout.tsx` に、管理画面の chrome は `admin/layout.tsx` に置く。
 *
 * これにより `/admin/*` 配下では公開サイトのヘッダー・フッター・検索ボックスが
 * 一切ロードされず、admin 専用の chrome だけが描画される。
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={SITE_LANG}
      className={`${notoJp.variable} ${notoSerifJp.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
