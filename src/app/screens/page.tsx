import type { Metadata } from "next";
import Link from "next/link";
import { screens, screenStockCount } from "@/domain/screens";
import { listStockBriefs } from "@/server/usecase";

const title = "スクリーン — 高配当・低 PER・割安銘柄を切り口別に";
const description =
  "高配当・低 PER・低 PBR・大型株・PBR 改善期待など、投資スタイル別の定量フィルタで東証銘柄をスクリーニング。抽出条件(メソドロジー)はすべて公開。";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["スクリーニング", "高配当株", "低 PER", "低 PBR", "大型株", "メソドロジー"],
  alternates: { canonical: "/screens" },
  openGraph: { title, description, url: "/screens", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default async function ScreensHub() {
  const all = await listStockBriefs();
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Screens
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          切り口で探す。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          目的別の切り口で銘柄を絞り込んだリスト。インカム狙い・割安狙いなど、投資スタイルに応じた候補群が一覧で見られます。
          各スクリーンは抽出条件(メソドロジー)を明示しています。
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {screens.map((scr) => {
          const count = screenStockCount(scr, all);
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
              <p className="text-[13px] text-muted leading-relaxed">
                {scr.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="mt-16 pt-8 border-t border-border text-[12px] text-dim leading-relaxed">
        ※ 各スクリーンは公開情報に基づく機械的抽出です。投資判断にあたっては、必ず各銘柄の個別ページと一次情報をご確認ください。
        判断基準の詳細は{" "}
        <Link href="/legal/editorial-policy" className="underline">
          編集方針
        </Link>{" "}
        をご覧ください。
      </section>
    </div>
  );
}
