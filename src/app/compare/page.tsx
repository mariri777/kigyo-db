import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { listOverlayStocks } from "@/server/usecase";

const compareTitle = "銘柄を並べて比較";
const compareDescription =
  "最大 3 銘柄を選んで、基本情報・AI 評価・PER / PBR / 配当・成長フェーズ・リスクプロファイルを横並びで確認。違いを自動抽出。";

export const metadata: Metadata = {
  title: compareTitle,
  description: compareDescription,
  keywords: ["銘柄比較", "横並び", "PER 比較", "ROE 比較", "リスクプロファイル"],
  alternates: { canonical: "/compare" },
  // 検索クエリ依存ページなので noindex(URL を共有された時のみ表示で十分)
  robots: { index: false, follow: true },
  openGraph: { title: compareTitle, description: compareDescription, url: "/compare", type: "website" },
  twitter: { card: "summary_large_image", title: compareTitle, description: compareDescription },
};
export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ codes?: string }>;
}) {
  const { codes } = await searchParams;
  const initialCodes = codes
    ? codes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const allStocks = await listOverlayStocks();
  return <CompareView initialCodes={initialCodes} allStocks={allStocks} />;
}
