import type { Metadata } from "next";
import { listStockBriefsPaginated } from "@/server/usecase";
import { industries } from "@/content/industries";
import { StockTable } from "@/components/StockTable";
import { Eyebrow } from "@/components/ui/eyebrow";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const metadata: Metadata = pageMetadata({
  title: "銘柄一覧 — 東証 3,800 社を業界・指標で絞り込む",
  description:
    "東証プライム/スタンダード/グロース上場の約 3,800 社を、業界・PER・PBR・配当利回り・時価総額で絞り込み・並び替え。気になる銘柄から事業構造タグ・類似銘柄・AI 評価に 1 クリックでジャンプ。",
  path: ROUTES.stocks,
  keywords: ["銘柄一覧", "東証", "PER", "PBR", "配当利回り", "高配当", "時価総額", "スクリーニング"],
  ogType: "website",
});

const INITIAL_PAGE_SIZE = 100;

export default async function StocksListPage() {
  // 初回 SSR は時価総額順の上位 100 件のみ。残りは StockTable が
  // /api/stocks 経由で「もっと見る」で追加 fetch する(CDN cache 30 分)。
  const initial = await listStockBriefsPaginated({
    sortKey: "marketCapOku",
    sortDir: "desc",
    offset: 0,
    limit: INITIAL_PAGE_SIZE,
  });
  const industryOptions = industries.map((i) => ({
    slug: i.slug,
    name: i.name,
    codes: i.subClusters.flatMap((sc) => sc.companyCodes),
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="pb-8 border-b border-border mb-8">
        <Eyebrow className="mb-3">Stocks</Eyebrow>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-4">
          銘柄一覧
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          東証プライム/スタンダード/グロース上場銘柄を、業界で絞り込み・各指標で並び替えできます。
          時価総額の大きい順に 100 件ずつ表示します。
        </p>
      </header>

      <StockTable initial={initial} industryOptions={industryOptions} />

      <div className="mt-12 text-[11px] text-foreground/60 leading-relaxed">
        ※ 株価・PER・PBR・配当利回り・時価総額は Yahoo Finance より日次更新。
        企業詳細(事業タグ・セグメント・AI 分析)は順次拡充中。
      </div>
    </div>
  );
}
