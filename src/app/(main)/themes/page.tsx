import type { Metadata } from "next";
import Link from "next/link";
import { listThemes, pickedStocksForTheme } from "@/content/themes";
import { listOverlayStocks } from "@/server/usecase";
import { Eyebrow } from "@/components/ui/eyebrow";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const metadata: Metadata = pageMetadata({
  title: "特集 — マクロ・テーマで掘る業界横断キュレーション",
  description:
    "円安・AI 受益・金利上昇・訪日インバウンド・累進配当・PBR 改善 — マクロやテーマを起点に、業界横断で銘柄をキュレーション。各特集は推奨銘柄 + ファクターランキング + 関連業界の 3 層構成。",
  path: ROUTES.themes,
  keywords: ["特集", "テーマ投資", "円安", "AI 関連", "高配当", "PBR 改善", "インバウンド"],
  ogType: "website",
});

export default async function ThemesHub() {
  const themes = listThemes();
  const overlayStocks = await listOverlayStocks();
  return (
    <article className="max-w-6xl mx-auto px-6 py-12">
      <header className="pb-10 border-b border-border mb-12">
        <Eyebrow className="mb-4">Cross-Industry Themes</Eyebrow>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          テーマで
          <br />
          掘る。
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
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
              href={`${ROUTES.themes}/${theme.slug}`}
              className="group block bg-surface border border-border rounded-md p-6 hover:border-border-strong transition"
            >
              <div className="flex items-baseline justify-between mb-3 gap-2">
                <h2 className="text-2xl font-bold tracking-tighter group-hover:underline leading-tight">
                  {theme.name}
                </h2>
                <span className="text-[10px] text-foreground/60 shrink-0">{picks.length} 社</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{theme.oneLiner}</p>

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
                  <span className="text-[10px] text-foreground/60">+{picks.length - 4}</span>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground tabular border-t border-border pt-3 flex items-center justify-between">
                <span>ランキング軸：{theme.rankLabel}</span>
                <span className="text-foreground/60">更新 {theme.updatedAt}</span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-16 pt-8 border-t border-border text-[12px] text-foreground/60 leading-relaxed max-w-3xl">
        <h2 className="text-sm font-bold text-muted-foreground mb-3">特集とスクリーンの違い</h2>
        <p className="mb-2">
          <Link href={ROUTES.screens} className="underline text-muted-foreground">スクリーン</Link>{" "}
          は『PER 15 倍以下』『ROE 15% 以上』など純粋な定量フィルタ。条件を満たす全銘柄を機械的に抽出します。
        </p>
        <p>
          <strong className="text-muted-foreground">特集</strong>{" "}
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
