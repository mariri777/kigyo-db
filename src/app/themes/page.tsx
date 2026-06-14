import type { Metadata } from "next";
import Link from "next/link";
import { listThemes, pickedStocksForTheme } from "@/content/themes";
import { listOverlayStocks } from "@/server/usecase";

const title = "特集 — 業界横断テーマ別の銘柄キュレーション";
const description =
  "円安・AI 受益・金利上昇・訪日インバウンド・累進配当・PBR 改善 — マクロ・テーマ別に業界横断で銘柄をキュレーション。各特集は推奨銘柄 + ファクターランキング + 関連業界の三層構成。";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["特集", "テーマ投資", "円安", "AI 関連", "高配当", "PBR 改善", "インバウンド"],
  alternates: { canonical: "/themes" },
  openGraph: { title, description, url: "/themes", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export const dynamic = "force-dynamic";

export default async function ThemesHub() {
  const themes = listThemes();
  const overlayStocks = await listOverlayStocks();
  return (
    <article className="max-w-6xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-12">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Cross-Industry Themes
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          テーマで
          <br />
          掘る。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          『円安が続いたら何を見ればいいか』『AI ブームの恩恵を直接受けるのはどの企業か』
          『金利上昇局面で銀行株はどう動くか』──マクロ・テーマ別に業界横断で銘柄をキュレーション。
          各特集は『編集部の推奨銘柄』+『ファクターベース ランキング』+『関連業界・記事』の三層構成。
        </p>
      </header>

      <section className="grid sm:grid-cols-2 gap-5">
        {themes.map((theme) => {
          const picks = pickedStocksForTheme(theme, overlayStocks);
          return (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              className="group block bg-surface border border-border rounded-md p-6 hover:border-border-strong transition"
            >
              <div className="flex items-baseline justify-between mb-3 gap-2">
                <h2 className="text-2xl font-bold tracking-tighter group-hover:underline leading-tight">
                  {theme.name}
                </h2>
                <span className="text-[10px] text-dim shrink-0">{picks.length} 社</span>
              </div>
              <p className="text-[13px] text-muted leading-relaxed mb-4">{theme.oneLiner}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {picks.slice(0, 4).map((p) => (
                  <span
                    key={p.stock.code}
                    className="text-[10px] border border-border rounded px-1.5 py-0.5 font-mono tabular"
                  >
                    {p.stock.code} {p.stock.name.slice(0, 6)}
                  </span>
                ))}
                {picks.length > 4 && (
                  <span className="text-[10px] text-dim">+{picks.length - 4}</span>
                )}
              </div>

              <div className="text-[11px] text-muted tabular border-t border-border pt-3 flex items-center justify-between">
                <span>ランキング軸：{theme.rankLabel}</span>
                <span className="text-dim">更新 {theme.updatedAt}</span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-16 pt-8 border-t border-border text-[12px] text-dim leading-relaxed max-w-3xl">
        <h2 className="text-sm font-bold text-muted mb-3">特集とスクリーンの違い</h2>
        <p className="mb-2">
          <Link href="/screens" className="underline text-muted">スクリーン</Link>{" "}
          は『PER 15 倍以下』『ROE 15% 以上』など純粋な定量フィルタ。条件を満たす全銘柄を機械的に抽出します。
        </p>
        <p>
          <strong className="text-muted">特集</strong>{" "}
          は『円安が続いたら』『AI ブームが続いたら』など、マクロ・ナラティブを起点に業界横断で
          編集部キュレーションの銘柄を提示。投資判断の起点として、なぜそのファクターが効くかの解説と関連業界・記事も併記します。
        </p>
        <p className="mt-4 pt-3 border-t border-border">
          ※ 本特集は不特定多数向けの一般情報提供であり、投資助言・推奨ではありません。投資判断はユーザー自身の責任で行ってください。
        </p>
      </section>
    </article>
  );
}
