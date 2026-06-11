// robots.txt を自動生成する特別ファイル（Next.js の規約）
// https://kigyo.cho-super.com/robots.txt として配信され、
// 検索エンジンのクローラーへの「立ち入りルール」と sitemap の場所を伝える

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 個人用ページは検索結果に出す意味がないので除外
      disallow: ["/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
