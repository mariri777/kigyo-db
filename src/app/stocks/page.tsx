import type { Metadata } from "next";
import { listStockBriefs } from "@/server/usecase";
import { industries } from "@/content/industries";
import { StockTable } from "@/components/StockTable";

const title = "銘柄一覧 — 業界・指標で絞り込む";
const description =
  "東証上場銘柄を業界・PER・PBR・配当利回り・時価総額で絞り込み、並び替え。事業構造タグ・類似銘柄・AI 評価に 1 クリックでジャンプ。";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["銘柄一覧", "東証", "PER", "PBR", "配当利回り", "高配当", "時価総額", "スクリーニング"],
  alternates: { canonical: "/stocks" },
  openGraph: { title, description, url: "/stocks", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export const dynamic = "force-dynamic";

export default async function StocksListPage() {
  const stocks = await listStockBriefs();
  const industryOptions = industries.map((i) => ({
    slug: i.slug,
    name: i.name,
    codes: i.subClusters.flatMap((sc) => sc.companyCodes),
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="pb-8 border-b border-border mb-8">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">
          Stocks
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-4">
          銘柄一覧
        </h1>
        <p className="text-muted leading-relaxed max-w-2xl">
          現在{" "}
          <strong className="text-foreground">
            東証 {stocks.length.toLocaleString()} 社
          </strong>
          を掲載中。業界で絞り込み、各指標で並び替えできます。
          銘柄名をクリックで詳細ページへ。
        </p>
      </header>

      <StockTable stocks={stocks} industryOptions={industryOptions} />

      <div className="mt-12 text-[11px] text-dim leading-relaxed">
        ※ 株価・PER・PBR・配当利回り・時価総額は Yahoo Finance より日次更新。
        企業詳細(事業タグ・セグメント・AI 分析)は順次拡充中。
      </div>
    </div>
  );
}
