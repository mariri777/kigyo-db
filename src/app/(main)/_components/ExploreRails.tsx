import Link from "next/link";
import { ArrowUpRight, Building2, Search } from "lucide-react";

// JPX 33業種のうち代表的な入口。件数はデータと乖離しないよう表示しない
// (正確な件数は /stocks 側でフィルタ適用時に表示される)。
const SECTOR_LINKS = [
  "電気機器",
  "情報・通信",
  "輸送用機器",
  "化学",
  "機械",
  "医薬品",
  "卸売",
  "小売",
  "銀行",
  "保険",
  "建設",
  "不動産",
];

export function ExploreRails() {
  return (
    <section id="explore" className="scroll-mt-20" aria-label="全銘柄データベース">
      <div className="rounded-2xl bg-white shadow-sm p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
            <Building2 className="w-3 h-3" />
            FULL DATABASE
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            東証 <span className="text-emerald-600">3,800</span> 社、すべて
          </h2>
          <Link
            href="/stocks"
            className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
          >
            銘柄一覧へ
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>
        <form
          action="/stocks"
          method="get"
          className="flex items-center bg-neutral-50 rounded-xl pl-3 pr-2 py-1 focus-within:ring-2 focus-within:ring-neutral-900 transition"
        >
          <Search className="w-4 h-4 text-neutral-400" aria-hidden="true" />
          <input
            type="text"
            name="q"
            autoComplete="off"
            placeholder="銘柄コード・社名で検索 (例: 7203, トヨタ)…"
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none"
            aria-label="銘柄検索"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            検索
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_LINKS.map((name) => (
            <Link
              key={name}
              href={`/stocks?sector=${encodeURIComponent(name)}`}
              className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
