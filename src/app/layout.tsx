import type { Metadata } from "next";
import { Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "超！企業DB — AI が掘る、日本株の発見",
    template: "%s | 超！企業DB",
  },
  description:
    "日本の上場企業 3,800 社を対象に、AI が事業類似銘柄・見落とし論点・業界構造を掘り出す。先回りキュレーション型の銘柄分析サービス。",
  metadataBase: new URL("https://orekabu.example.com"),
  openGraph: {
    title: "超！企業DB — AI が掘る、日本株の発見",
    description: "事業類似銘柄、見落とし論点、業界構造を AI が先回りで掘り出す。",
    siteName: "超！企業DB",
    locale: "ja_JP",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoJp.variable} ${jbMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-accent text-xl font-bold tracking-tight">超！企業DB</span>
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
                超！企業DBとは
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
              <SearchBox />
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
              数値データは EDINET / TDnet / J-Quants からの取得を前提とした構造です（現在はサンプルデータで運用中）。
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
                超！企業DBとは
              </Link>
              <span className="ml-auto text-dim">© 2026 超！企業DB</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
