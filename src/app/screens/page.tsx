import Link from "next/link";
import { screens, screenStockCount } from "@/lib/screens";

export const metadata = {
  title: "スクリーン — 切り口別の銘柄一覧",
  description:
    "割安銘柄、高配当銘柄、拡大期銘柄など、目的別の切り口で東証上場銘柄をスクリーニング。",
};

export default function ScreensHub() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">Screens</p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          切り口で探す。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          目的別の切り口で銘柄を絞り込んだリスト。割安狙い・インカム狙い・成長狙い・拡大期狙いなど、
          投資スタイルに応じた候補群が一覧で見られます。
          各スクリーンは抽出条件（メソドロジー）を明示しています。
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {screens.map((scr) => {
          const count = screenStockCount(scr);
          return (
            <Link
              key={scr.slug}
              href={`/screens/${scr.slug}`}
              className="group block bg-surface border border-border rounded-md p-5 hover:border-border-strong transition"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-bold tracking-tight group-hover:underline">
                  {scr.shortTitle}
                </h2>
                <span className="text-[10px] text-dim tabular">{count} 社</span>
              </div>
              <p className="text-[13px] text-muted leading-relaxed">{scr.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-16 pt-8 border-t border-border text-[12px] text-dim leading-relaxed">
        ※ 各スクリーンは公開情報に基づく機械的抽出です。投資判断にあたっては、必ず各銘柄の個別ページの「規範的判断」と「見落とし論点」、および一次情報をご確認ください。
        判断基準の詳細は <Link href="/legal/editorial-policy" className="underline">編集方針</Link> をご覧ください。
      </section>
    </div>
  );
}
