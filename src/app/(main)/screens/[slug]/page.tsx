import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { applyScreen, getScreen, screens } from "@/domain/screens";
import type { StockBrief } from "@/domain/types";
import { listStockBriefs } from "@/server/usecase";
import { formatPbrOpt, formatPct1Opt, formatPerOpt, formatPriceOpt } from "@/shared/format";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screen = getScreen(slug);
  if (!screen) return { title: "見つかりません", robots: { index: false, follow: false } };
  const url = `/screens/${screen.slug}`;
  return {
    title: screen.title,
    description: screen.metaDescription,
    keywords: ["スクリーニング", screen.shortTitle, "東証", screen.emphasis],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: screen.title,
      description: screen.metaDescription,
      url,
      siteName: "超!企業DB",
    },
    twitter: {
      card: "summary_large_image",
      title: screen.title,
      description: screen.metaDescription,
    },
  };
}

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = getScreen(slug);
  if (!screen) notFound();

  const all = await listStockBriefs();
  const matching = applyScreen(screen, all).slice(0, 100);
  const otherScreens = screens.filter((s) => s.slug !== screen.slug);
  const screenJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://kigyo.cho-super.com/" },
        { "@type": "ListItem", position: 2, name: "スクリーン", item: "https://kigyo.cho-super.com/screens" },
        {
          "@type": "ListItem",
          position: 3,
          name: screen.shortTitle,
          item: `https://kigyo.cho-super.com/screens/${screen.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: screen.title,
      url: `https://kigyo.cho-super.com/screens/${screen.slug}`,
      description: screen.metaDescription,
      isPartOf: { "@type": "WebSite", name: "超!企業DB", url: "https://kigyo.cho-super.com" },
    },
  ];

  return (
    <article className="max-w-5xl mx-auto px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(screenJsonLd) }}
      />
      <Link
        href="/screens"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← すべてのスクリーン
      </Link>

      <header className="pb-8 border-b border-border mb-8">
        <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-3">
          Screen
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-5">
          {screen.title}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
          {screen.description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-foreground/60">
          <span className="text-foreground font-bold tabular">
            {applyScreen(screen, all).length}
          </span>
          <span>社が条件に合致(全 {all.length} 社中)</span>
        </div>
      </header>

      {/* メソドロジー */}
      <section className="mb-10 bg-surface-elev border-l-2 border-foreground rounded-r-md p-4">
        <div className="text-[10px] text-muted-foreground tracking-widest mb-2">
          METHODOLOGY
        </div>
        <p className="text-sm leading-relaxed">{screen.methodology}</p>
      </section>

      {/* マッチング銘柄テーブル */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">
          該当銘柄
          {matching.length < applyScreen(screen, all).length && (
            <span className="text-[12px] text-foreground/60 font-normal ml-2">
              (上位 {matching.length} 件を表示)
            </span>
          )}
        </h2>
        {matching.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-8 text-center text-muted-foreground">
            条件に合致する銘柄がありません。
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="hidden md:grid grid-cols-[40px_70px_1fr_140px_90px_70px_70px_90px] text-[11px] text-foreground/60 border-b border-border bg-surface-elev px-4 py-2 gap-2">
              <div>#</div>
              <div>コード</div>
              <div>銘柄</div>
              <div>業種</div>
              <div className="text-right">株価</div>
              <div className="text-right">PER</div>
              <div className="text-right">PBR</div>
              <div className="text-right">
                {emphasisLabel(screen.emphasis)}
              </div>
            </div>
            {matching.map((s, i) => (
              <Link
                key={s.code}
                href={`/stocks/${s.code}`}
                className="grid grid-cols-1 md:grid-cols-[40px_70px_1fr_140px_90px_70px_70px_90px] items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm gap-2"
              >
                <div className="text-foreground/60 font-mono text-xs tabular">
                  {(i + 1).toString().padStart(2, "0")}
                </div>
                <div className="text-foreground/60 tabular text-xs">{s.code}</div>
                <div>
                  <div className="font-medium group-hover:underline">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground md:hidden truncate">
                    {s.sectorTSE}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground hidden md:block truncate">
                  {s.sectorTSE}
                </div>
                <div className="text-right tabular font-mono">
                  {formatPriceOpt(s.priceJpy)}
                </div>
                <div className="text-right tabular font-mono">
                  {formatPerOpt(s.per)}
                </div>
                <div className="text-right tabular font-mono">
                  {formatPbrOpt(s.pbr)}
                </div>
                <div className="text-right tabular font-mono">
                  <EmphasisCell stock={s} emphasis={screen.emphasis} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 関連スクリーン */}
      <section className="mb-10">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">
          他のスクリーン
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherScreens.map((s) => (
            <Link
              key={s.slug}
              href={`/screens/${s.slug}`}
              className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong transition text-sm font-medium"
            >
              {s.shortTitle} →
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 text-[11px] text-foreground/60 leading-relaxed">
        ※ このスクリーンは公開情報に基づく機械的抽出です。投資判断は必ず個別銘柄ページと一次情報をご確認のうえご自身の責任で行ってください。
      </div>
    </article>
  );
}

function emphasisLabel(e: string): string {
  switch (e) {
    case "per":
      return "PER ↑";
    case "pbr":
      return "PBR ↑";
    case "dividendYield":
      return "配当 ↓";
    case "marketCap":
      return "時価総額 ↓";
    default:
      return "";
  }
}

function EmphasisCell({
  stock,
  emphasis,
}: {
  stock: StockBrief;
  emphasis: string;
}) {
  switch (emphasis) {
    case "per":
      return <span className="font-bold">{formatPerOpt(stock.per)}</span>;
    case "pbr":
      return <span className="font-bold">{formatPbrOpt(stock.pbr)}</span>;
    case "dividendYield":
      return (
        <span className="font-bold">{formatPct1Opt(stock.dividendYield)}</span>
      );
    case "marketCap":
      return (
        <span className="font-bold">
          {stock.marketCapOku === null
            ? "—"
            : `${stock.marketCapOku.toLocaleString()}億`}
        </span>
      );
    default:
      return <span>—</span>;
  }
}
