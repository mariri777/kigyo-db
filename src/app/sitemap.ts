// /sitemap.xml を生成する Next.js 規約ファイル。
// ハブ・固定ページ・データ由来の詳細ページを列挙し、検索エンジンに通知する。

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/site";
import { listStockBriefs } from "@/server/usecase";
import { industries } from "@/content/industries";
import { screens } from "@/domain/screens";
import { listThemes } from "@/content/themes";
import { listPredictions } from "@/content/predictions";
import { listPosts } from "@/content/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const hubs: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/stocks`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/industries`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/themes`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/screens`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/predictions`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/predictions/track-record`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
  ];

  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/editorial-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const stockPages: MetadataRoute.Sitemap = (await listStockBriefs()).map((s) => ({
    url: `${SITE_URL}/stocks/${s.code}`,
    lastModified: s.priceDate ? new Date(s.priceDate) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const industryPages: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));
  const screenPages: MetadataRoute.Sitemap = screens.map((s) => ({
    url: `${SITE_URL}/screens/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const themePages: MetadataRoute.Sitemap = listThemes().map((t) => ({
    url: `${SITE_URL}/themes/${t.slug}`,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const predictionPages: MetadataRoute.Sitemap = listPredictions().map((p) => ({
    url: `${SITE_URL}/predictions/${p.id}`,
    lastModified: p.resolution?.resolvedAt ? new Date(p.resolution.resolvedAt) : now,
    changeFrequency: "weekly",
    priority: 0.55,
  }));
  const postPages: MetadataRoute.Sitemap = listPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  // /profile はインデックス対象外 (robots.ts で disallow)
  return [
    ...hubs,
    ...statics,
    ...stockPages,
    ...industryPages,
    ...screenPages,
    ...themePages,
    ...predictionPages,
    ...postPages,
  ];
}
