import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/profile", "/profile/*", "/api/", "/_next/"],
      },
      // 主要クローラに明示で許可(良質クロールを期待)
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Twitterbot", allow: "/" },
      { userAgent: "Slackbot", allow: "/" },
      { userAgent: "facebookexternalhit", allow: "/" },
      { userAgent: "LinkedInBot", allow: "/" },
      { userAgent: "Discordbot", allow: "/" },
      { userAgent: "Applebot", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
