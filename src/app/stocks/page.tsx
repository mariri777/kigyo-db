import { listStocks } from "@/lib/data";
import { industries } from "@/lib/industries";
import { StockTable } from "@/components/StockTable";

export const metadata = {
  title: "銘柄一覧 — 業界・AI 評価で絞り込む",
  description: "東証上場銘柄を業界・AI 評価で絞り込み、各指標で並び替え。現在 10 業界 61 社をカバー、順次拡大中。",
};

export default function StocksListPage() {
  const stocks = listStocks();
  const industryOptions = industries.map((i) => ({
    slug: i.slug,
    name: i.name,
    codes: i.subClusters.flatMap((sc) => sc.companyCodes),
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="pb-8 border-b border-border mb-8">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">Stocks</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-4">
          銘柄一覧
        </h1>
        <p className="text-muted leading-relaxed max-w-2xl">
          現在 <strong className="text-foreground">10 業界 {stocks.length} 社</strong>を掲載中（順次拡大中）。
          業界と AI 評価（割安／ほぼ妥当／やや割高／割高）で絞り込み、各指標で並び替えできます。
          銘柄名をクリックで詳細ページへ。
        </p>
      </header>

      <StockTable stocks={stocks} industryOptions={industryOptions} />

      <div className="mt-12 text-[11px] text-dim leading-relaxed">
        ※ AI 評価（割安・割高）は同業他社・過去水準との比較に基づく一般的な評価です。
        判断基準の詳細は <a href="/legal/editorial-policy" className="underline">編集方針</a> をご確認ください。
      </div>
    </div>
  );
}
