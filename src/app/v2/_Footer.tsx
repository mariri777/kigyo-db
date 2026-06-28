import Link from "next/link";
import { BrandMark } from "./_BrandMark";

const HOT_THEMES = [
  "半導体・HBM",
  "AIデータセンタ",
  "電力インフラ",
  "防衛・宇宙",
  "原発再稼働",
  "全固体電池",
  "SDV",
  "為替・金利",
];

export function V2Footer() {
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

        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
            今のホットテーマ
          </div>
          <div className="flex flex-wrap gap-2">
            {HOT_THEMES.map((t) => (
              <Link
                key={t}
                href="#"
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

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
