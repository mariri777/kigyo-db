import Link from "next/link";

export function SiteFooter() {
  return (
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
  );
}
