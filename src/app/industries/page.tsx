import type { Metadata } from "next";
import Link from "next/link";
import { industries, industryAggregates } from "@/content/industries";
import { listStockBriefs } from "@/server/usecase";

const title = `業界マップ — バリューチェーンで読む ${industries.length} 業界`;
const description = `半導体・自動車・化学など ${industries.length} 業界を、バリューチェーン・競争構造・主要 KPI・市場が見落とした論点まで分解。東証の業種分類より一段細かい粒度で、銘柄を俯瞰できます。`;

export const metadata: Metadata = {
  title,
  description,
  keywords: ["業界マップ", "バリューチェーン", "競争構造", "業界分析", "サブクラスタ", "業界 KPI"],
  alternates: { canonical: "/industries" },
  openGraph: { title, description, url: "/industries", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const COMING_SOON: { name: string; note: string }[] = [];

export default async function IndustriesHub() {
  const briefsByCode = new Map((await listStockBriefs()).map((b) => [b.code, b]));
  return (
    <article className="max-w-6xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-12">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Industry Map
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          業界の競争構造を、
          <br />
          一枚に。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          東証の業種分類より細かい粒度で、業界の<strong className="text-foreground">バリューチェーン・競争構造・主要指標（KPI）・見落とし論点</strong>を分析。
          現在 <strong className="text-foreground">{industries.length} 業界</strong>をカバー、銘柄数は順次拡大中です。
        </p>
      </header>

      <section className="mb-16">
        <h2 className="text-xl font-bold mb-6">公開中</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((ind) => {
            const agg = industryAggregates(ind, briefsByCode);
            return (
              <Link
                key={ind.slug}
                href={`/industries/${ind.slug}`}
                className="group block bg-surface border border-border rounded-md p-6 hover:border-border-strong transition"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-2xl font-bold tracking-tighter group-hover:underline">
                    {ind.name}
                  </h3>
                  <span className="text-[10px] text-dim">{agg.count} 社</span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed mb-4">
                  {ind.description.slice(0, 100)}…
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {ind.subClusters.slice(0, 4).map((s) => (
                    <span
                      key={s.key}
                      className="text-[10px] border border-border rounded px-1.5 py-0.5"
                    >
                      {s.name}
                    </span>
                  ))}
                  {ind.subClusters.length > 4 && (
                    <span className="text-[10px] text-dim">+{ind.subClusters.length - 4}</span>
                  )}
                </div>
                <div className="text-[11px] text-muted tabular border-t border-border pt-3">
                  時価総額合計 {agg.totalMcap.toLocaleString()} 億円 / 平均 PER {agg.avgPer.toFixed(1)} 倍
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {COMING_SOON.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold mb-6">展開予定</h2>
          <p className="text-sm text-muted mb-6 max-w-2xl">
            半導体クラスタを磨き込みのテンプレートとし、開発者レビュー込みで順次展開します。
            リクエストはご意見フォームから。
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMING_SOON.map((cs) => (
              <div
                key={cs.name}
                className="bg-surface border border-border rounded-md p-4 opacity-60"
              >
                <div className="text-[10px] text-dim tracking-wider mb-1">準備中</div>
                <h3 className="font-bold">{cs.name}</h3>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{cs.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-xl font-bold mb-6">主要セクター網羅</h2>
          <p className="text-sm text-muted mb-6 max-w-2xl leading-relaxed">
            東証 33 業種の主要セクターを 10 業界で網羅しました。
            今後は『中堅・新興企業の深掘り』『業界横断テーマの追加』『定量データの自動更新』を予定。
            リクエストはご意見フォームから。
          </p>
        </section>
      )}
    </article>
  );
}
