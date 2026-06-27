import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { listOverlayStocks } from "@/server/usecase";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

// 検索クエリ依存ページなので noindex(URL を共有された時のみ表示で十分)。
export const metadata: Metadata = {
  ...pageMetadata({
    title: "銘柄比較 — 最大 3 銘柄を横並びチェック",
    description:
      "最大 3 銘柄を選び、基本情報・AI 評価・PER / PBR / 配当利回り・成長フェーズ・リスクプロファイルを横並びで比較。違いと共通点を自動でハイライト。",
    path: ROUTES.compare,
    keywords: ["銘柄比較", "横並び", "PER 比較", "ROE 比較", "リスクプロファイル"],
    ogType: "website",
  }),
  robots: { index: false, follow: true },
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
