import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTheme,
  listThemes,
  pickedStocksForTheme,
  rankedStocksForTheme,
} from "@/lib/themes";
import { industries } from "@/lib/industries";
import { posts } from "@/lib/posts";
import type { Stock } from "@/lib/types";

export function generateStaticParams() {
  return listThemes().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) return { title: "見つかりません" };
  return {
    title: `${theme.name} — 業界横断テーマ特集`,
    description: theme.lede.slice(0, 120),
  };
}

function rankValue(s: Stock, rankBy: string): number {
  switch (rankBy) {
    case "usdjpy":
      return s.factorBetas.usdjpy;
    case "us10y":
      return s.factorBetas.us10y;
    case "sox":
      return s.factorBetas.sox;
    case "china":
      return s.factorBetas.china;
    case "dividendYield":
      return s.dividendYield;
    case "pbr":
      return s.pbr;
    case "roe":
      return s.roe;
    case "valuationScore":
      return s.valuationCall.score;
    default:
      return 0;
  }
}

function formatRankValue(s: Stock, rankBy: string): string {
  const v = rankValue(s, rankBy);
  switch (rankBy) {
    case "usdjpy":
    case "us10y":
    case "sox":
    case "china":
      return v.toFixed(2);
    case "dividendYield":
    case "roe":
      return `${v.toFixed(1)}%`;
    case "pbr":
      return `${v.toFixed(2)} 倍`;
    case "valuationScore":
      return `${v}/100`;
    default:
      return v.toFixed(2);
  }
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) notFound();

  const picks = pickedStocksForTheme(theme);
  const ranked = rankedStocksForTheme(theme).slice(0, 15);
  const relatedIndustries = theme.relatedIndustries
    .map((s) => industries.find((i) => i.slug === s))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
  const relatedPosts = theme.relatedPosts
    .map((s) => posts.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <article className="max-w-6xl mx-auto px-6 py-8">
      {/* ===== Hero ===== */}
      <header className="border-b border-border pb-10 mb-12">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Cross-Industry Theme
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          {theme.name}
        </h1>
        <p className="text-muted leading-relaxed max-w-3xl text-base mb-8">{theme.lede}</p>

        {/* マクロ・コンテキスト */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
          {theme.macroContext.map((m) => (
            <div key={m.label} className="bg-background p-4">
              <div className="text-[10px] text-dim tracking-wider mb-1">{m.label}</div>
              <div className="font-bold tabular">{m.value}</div>
              {m.note && <div className="text-[11px] text-muted mt-1">{m.note}</div>}
            </div>
          ))}
        </div>
      </header>

      {/* ===== 編集部の推奨銘柄 ===== */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">編集部の推奨銘柄</h2>
          <p className="text-sm text-muted">
            このテーマで特に注目すべき {picks.length} 社。各銘柄の推奨理由を併記。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {picks.map((p, idx) => (
            <Link
              key={p.stock.code}
              href={`/stocks/${p.stock.code}`}
              className="group block bg-surface border border-border rounded-md p-5 hover:border-border-strong transition"
            >
              <div className="flex items-baseline justify-between mb-2 gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] text-dim font-mono tabular">#{idx + 1}</span>
                  <span className="text-[10px] text-dim font-mono tabular">{p.stock.code}</span>
                  <h3 className="text-lg font-bold tracking-tight group-hover:underline">
                    {p.stock.name}
                  </h3>
                </div>
                <span className="text-[10px] text-dim shrink-0">{p.stock.sectorTSE}</span>
              </div>
              <div className="text-[11px] text-muted tabular mb-3">
                時価総額 {p.stock.marketCapOku.toLocaleString()} 億円 / PER {p.stock.per.toFixed(1)} 倍 /
                配当 {p.stock.dividendYield.toFixed(1)}%
              </div>
              <p className="text-[13px] leading-relaxed">{p.reason}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== ナラティブ ===== */}
      <section className="mb-16 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">なぜこのテーマか</h2>
          <p className="text-sm text-muted">マクロ・構造的な背景と投資論点</p>
        </div>

        <div className="space-y-8">
          {theme.sections.map((sec) => (
            <div key={sec.heading}>
              <h3 className="text-xl font-bold mb-3">{sec.heading}</h3>
              <p className="text-[14px] leading-relaxed text-muted">{sec.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ファクターベース ランキング ===== */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">
            {theme.rankLabel} ランキング
          </h2>
          <p className="text-sm text-muted">
            {theme.rankBy === "usdjpy" && "USD/JPY ベータが高いほど円安局面で利益が拡大する構造"}
            {theme.rankBy === "us10y" && "US10Y ベータが負（マイナス）ほど金利上昇で株価が下落しにくい"}
            {theme.rankBy === "sox" && "SOX ベータが高いほど半導体・AI 関連で連動性が高い"}
            {theme.rankBy === "china" && "China ベータが高いほど中国景気との連動性が強い"}
            {theme.rankBy === "dividendYield" && "予想配当利回り上位、累進配当の安全性も加味"}
            {theme.rankBy === "pbr" && "PBR が低いほど東証 PBR 改善要請対応で上値余地大"}
            {theme.rankBy === "roe" && "ROE が高いほど資本効率の良い優良企業"}
            {theme.rankBy === "valuationScore" && "編集部の規範的判断スコア"}
          </p>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] text-dim font-bold tracking-wider w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-dim font-bold tracking-wider">
                  銘柄
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-dim font-bold tracking-wider">
                  {theme.rankLabel}
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-dim font-bold tracking-wider hidden sm:table-cell">
                  PER
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-dim font-bold tracking-wider hidden md:table-cell">
                  配当
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-dim font-bold tracking-wider hidden md:table-cell">
                  時価総額
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, idx) => {
                const isPicked = theme.picks.some((p) => p.code === s.code);
                return (
                  <tr
                    key={s.code}
                    className={`border-b border-border last:border-0 hover:bg-surface transition ${
                      isPicked ? "bg-surface/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-[10px] text-dim font-mono tabular">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/stocks/${s.code}`} className="hover:underline">
                        <span className="font-mono tabular text-[10px] text-dim mr-2">
                          {s.code}
                        </span>
                        <span className="font-bold">{s.name}</span>
                        {isPicked && (
                          <span className="ml-2 text-[9px] bg-foreground text-background px-1.5 py-0.5 rounded">
                            推奨
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular font-bold">
                      {formatRankValue(s, theme.rankBy)}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted hidden sm:table-cell">
                      {s.per > 0 ? `${s.per.toFixed(1)} 倍` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted hidden md:table-cell">
                      {s.dividendYield > 0 ? `${s.dividendYield.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted hidden md:table-cell">
                      {s.marketCapOku.toLocaleString()} 億円
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-dim mt-3">
          ※ 上位 15 社まで表示。推奨マークは編集部キュレーション銘柄。
        </p>
      </section>

      {/* ===== リスク ===== */}
      <section className="mb-16 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tighter mb-4">注意点・逆風要因</h2>
        <ul className="space-y-2">
          {theme.risks.map((r) => (
            <li key={r} className="text-[13px] leading-relaxed text-muted flex gap-2">
              <span className="text-dim shrink-0">▶</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== 関連 ===== */}
      <section className="mb-16 grid md:grid-cols-2 gap-8">
        {relatedIndustries.length > 0 && (
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-3 uppercase">
              関連業界
            </h3>
            <div className="space-y-2">
              {relatedIndustries.map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/industries/${ind.slug}`}
                  className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong transition"
                >
                  <span className="font-bold">{ind.name}</span>
                  <span className="text-[11px] text-muted ml-2">→ 業界マップ</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-3 uppercase">
              関連記事
            </h3>
            <div className="space-y-2">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong transition"
                >
                  <span className="text-[10px] text-dim tracking-wider mr-2 uppercase">
                    {p.category}
                  </span>
                  <span className="font-bold text-sm">{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== Disclaimer ===== */}
      <section className="border-t border-border pt-6 text-[11px] text-dim leading-relaxed">
        <p>
          ※ 本特集は不特定多数向けの一般情報提供であり、投資助言・推奨ではありません。
          ファクターベータは過去データの回帰分析によるもので、将来の値動きを保証しません。
          投資判断はユーザー自身の責任で行ってください。
        </p>
        <p className="mt-2">
          最終更新：{theme.updatedAt} ／ <Link href="/themes" className="underline">他のテーマを見る</Link>
        </p>
      </section>
    </article>
  );
}
