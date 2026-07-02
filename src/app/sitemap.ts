import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { articles, stocks } from "@/server/db/schema";
import { SITE_URL } from "@/shared/site";

// D1 から銘柄・記事を読むため、build 時の静的生成は不可(robots.ts と同じ環境前提)
export const dynamic = "force-dynamic";

/**
 * サイトマップ。robots.ts が `${SITE_URL}/sitemap.xml` を参照している。
 * 銘柄 約3,800 + 公開記事で 50,000 URL 制限に収まるため単一ファイルで返す。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/stocks`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/articles`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/forecasts`, changeFrequency: "daily", priority: 0.7 },
  ];

  try {
    const db = await getDb();
    const [stockRows, articleRows] = await Promise.all([
      db.select({ code: stocks.code }).from(stocks).all(),
      db
        .select({
          slug: articles.slug,
          publishedAt: articles.publishedAt,
          updatedAt: articles.updatedAt,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .all(),
    ]);

    const stockEntries: MetadataRoute.Sitemap = stockRows.map((s) => ({
      url: `${SITE_URL}/stocks/${s.code}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const articleEntries: MetadataRoute.Sitemap = articleRows.map((a) => {
      const lastModified = a.updatedAt ?? a.publishedAt;
      return {
        url: `${SITE_URL}/articles/${a.slug}`,
        ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    });

    return [...staticEntries, ...stockEntries, ...articleEntries];
  } catch {
    // D1 が無い環境 (preview 等) でも sitemap 自体は 200 で返す
    return staticEntries;
  }
}
