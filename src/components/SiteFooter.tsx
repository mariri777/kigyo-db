import Link from "next/link";
import {
  FOOTER_PRIMARY_LINKS,
  FOOTER_SECONDARY_LINKS,
  LEGAL_LINKS,
} from "@/shared/links";
import { SITE_NAME } from "@/shared/site";

const COPYRIGHT_YEAR = "2026";

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
          {[...FOOTER_PRIMARY_LINKS, ...LEGAL_LINKS, ...FOOTER_SECONDARY_LINKS].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-auto text-foreground/60">© {COPYRIGHT_YEAR} {SITE_NAME}</span>
        </div>
      </div>
    </footer>
  );
}
