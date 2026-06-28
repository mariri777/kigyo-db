import type { Metadata } from "next";

import { loadStockPageData } from "./_live";
import { StockDetailRenderer } from "./_renderer";
import { buildStockMetadata } from "../_meta";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadStockPageData("7203");
  return buildStockMetadata(data);
}

export default async function ToyotaDetailPage() {
  const data = await loadStockPageData("7203");
  return <StockDetailRenderer data={data} />;
}
