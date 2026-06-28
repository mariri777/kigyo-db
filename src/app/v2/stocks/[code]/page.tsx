import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { stocks } from "@/server/db/schema";

import { StockDetailRenderer } from "../7203/_renderer";
import { loadStockPageData } from "../7203/_live";
import { buildStockMetadata } from "../_meta";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const db = await getDb();
  const found = await db
    .select({ code: stocks.code })
    .from(stocks)
    .where(eq(stocks.code, code))
    .all();
  if (found.length === 0) {
    return {
      title: `銘柄が見つかりません (${code})`,
      robots: { index: false, follow: false },
    };
  }
  const data = await loadStockPageData(code);
  return buildStockMetadata(data);
}

export default async function StockPage({ params }: { params: Params }) {
  const { code } = await params;

  const db = await getDb();
  const found = await db.select({ code: stocks.code }).from(stocks).where(eq(stocks.code, code)).all();
  if (found.length === 0) {
    // 既知の銘柄でなければ 404 もしくは簡易リンク
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-neutral-500 text-sm tracking-widest mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">銘柄が見つかりません: {code}</h1>
        <Link href="/v2" className="text-emerald-600 font-bold">トップへ戻る →</Link>
      </div>
    );
  }

  const data = await loadStockPageData(code);
  return <StockDetailRenderer data={data} />;
}

// avoid unused warning
void notFound;
