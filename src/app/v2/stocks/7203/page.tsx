import type { Metadata } from "next";

import { loadStockPageData } from "./_live";
import { StockDetailRenderer } from "./_renderer";

export const metadata: Metadata = {
  title: `トヨタ自動車 (7203) — v2`,
  description: "D1 駆動のリッチ銘柄詳細",
  robots: { index: false, follow: false },
};

export default async function ToyotaDetailPage() {
  const data = await loadStockPageData("7203");
  return <StockDetailRenderer data={data} />;
}
