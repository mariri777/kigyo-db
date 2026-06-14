import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { listOverlayStocks } from "@/server/usecase";

const compareTitle = "銘柄比較 — 最大 3 銘柄を横並びチェック";
const compareDescription =
  "最大 3 銘柄を選び、基本情報・AI 評価・PER / PBR / 配当利回り・成長フェーズ・リスクプロファイルを横並びで比較。違いと共通点を自動でハイライト。";

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
