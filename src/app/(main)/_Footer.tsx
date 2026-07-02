import Link from "next/link";
import { BrandMark } from "./_BrandMark";

const FOOTER_NAV = [
  { href: "/", label: "ホーム" },
  { href: "/forecasts", label: "AIの明日予想" },
  { href: "/articles", label: "記事" },
  { href: "/stocks", label: "銘柄一覧" },
];

export function SiteFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-start gap-3">
          <BrandMark className="w-8 h-8 text-white shrink-0" accent="#34d399" />
          <div className="min-w-0">
            <div className="font-bold text-lg text-white">
              超!企業<span className="text-emerald-400">DB</span>
            </div>
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
              東証上場の約 3,800 社を AI が解析し、銘柄・業界・市場の見落とし論点を掘り出す銘柄分析データベース。
            </p>
          </div>
        </div>

        <nav aria-label="フッター">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_NAV.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-neutral-400 hover:text-white transition"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pt-6 border-t border-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
          本サービスの情報は、不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。
        </div>

        <div className="text-[11px] text-neutral-500 font-mono tabular">
          © 2026 超!企業DB
        </div>
      </div>
    </footer>
  );
}
