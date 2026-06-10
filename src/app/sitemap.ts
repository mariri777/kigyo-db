// sitemap.xml を自動生成する特別ファイル（Next.js の規約）
// https://kigyo.cho-super.com/sitemap.xml として配信され、
// Google などの検索エンジンに「うちにはこんなページがあります」と伝える地図になる
// 銘柄や特集を追加すると、次のビルドで自動的に地図にも載る

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listStocks } from "@/lib/data";
import { industries } from "@/lib/industries";
import { screens } from "@/lib/screens";
import { listThemes } from "@/lib/themes";
import { listPredictions } from "@/lib/predictions";
import { listPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ハブページ（一覧の入り口）。更新頻度が高く重要度も高い
  const hubs: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/stocks`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/screens`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/industries`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/themes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/predictions`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/predictions/track-record`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // 固定ページ
  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/editorial-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // 詳細ページ（データから自動列挙）
  const stockPages: MetadataRoute.Sitemap = listStocks().map((s) => ({
    url: `${SITE_URL}/stocks/${s.code}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const industryPages: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const screenPages: MetadataRoute.Sitemap = screens.map((s) => ({
    url: `${SITE_URL}/screens/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const themePages: MetadataRoute.Sitemap = listThemes().map((t) => ({
    url: `${SITE_URL}/themes/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const predictionPages: MetadataRoute.Sitemap = listPredictions().map((p) => ({
    url: `${SITE_URL}/predictions/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
  const postPages: MetadataRoute.Sitemap = listPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // /profile（個人用ページ）と /db-test（動作確認用）は意図的に載せない
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
