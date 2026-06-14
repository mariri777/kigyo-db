import type { MetadataRoute } from "next";
import {
  SITE_BACKGROUND_COLOR,
  SITE_DESCRIPTION,
  SITE_LANG,
  SITE_NAME,
  SITE_THEME_COLOR,
} from "@/shared/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "超!企業DB",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: SITE_LANG,
    dir: "ltr",
    background_color: SITE_BACKGROUND_COLOR,
    theme_color: SITE_THEME_COLOR,
    categories: ["finance", "business", "news"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
