/**
 * 銘柄詳細ページ (/stocks/[code]) 用の SEO メタデータ生成ヘルパー。
 *
 * loadStockPageData の戻り値から、会社名・銘柄コード・業界・最新株価・PER などを織り込んだ
 * 検索エンジン向けの title / description を組み立てる。
 */
import type { Metadata } from "next";

import type { loadStockPageData } from "./_lib/loadStockPageData";

type LiveData = Awaited<ReturnType<typeof loadStockPageData>>;

function buildDescription(data: LiveData): string {
  const { basics, stockTrend, latestEarnings, industryName, summary } = data;
  const parts: string[] = [];
  parts.push(`${basics.name}(証券コード ${basics.code} / ${basics.exchange})`);
  if (industryName) parts.push(`業界 ${industryName}`);
  if (stockTrend?.currentPrice != null) {
    parts.push(`株価 ¥${stockTrend.currentPrice.toLocaleString()} (${stockTrend.change1d})`);
  }
  if (stockTrend?.per != null) parts.push(`PER ${stockTrend.per}倍`);
  if (latestEarnings?.revenueOku != null) {
    parts.push(`売上 ${formatOku(latestEarnings.revenueOku)}`);
  }
  if (latestEarnings?.roe != null) parts.push(`ROE ${latestEarnings.roe}%`);
  const head = parts.join(" ・ ");
  const tail = summary ? summary.slice(0, 110).replace(/\s+/g, " ") : "";
  const desc = `${head}。${tail}`;
  return desc.length > 158 ? `${desc.slice(0, 157)}…` : desc;
}

function formatOku(oku: number | null | undefined): string {
  if (oku == null) return "—";
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆円`;
  return `${oku.toLocaleString()}億円`;
}

export function buildStockMetadata(data: LiveData): Metadata {
  const { basics, industryName } = data;
  const code = basics.code;
  const name = basics.name;
  const industry = industryName ? `${industryName}・` : "";
  const title = `${name} (${code}) | ${industry}株価・業績・配当・類似銘柄 — AI 銘柄分析`;
  const description = buildDescription(data);
  const canonical = `/stocks/${code}`;

  return {
    title,
    description,
    keywords: [
      name,
      code,
      `${name} 株価`,
      `${name} 業績`,
      `${name} 配当`,
      `${name} 類似銘柄`,
      ...(industryName ? [industryName] : []),
      "日本株",
      "AI 銘柄分析",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
