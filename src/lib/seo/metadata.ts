import type { Metadata } from "next";

import { SITE_NAME } from "@/shared/site";

/** og:type のうちこのプロジェクトで使う値だけ。 */
export type OgType = "website" | "article";

export type PageMetadataInput = {
  title: string;
  description: string;
  /** canonical / og:url に使う相対パス (例: `/stocks/7203`) */
  path: string;
  keywords?: string[];
  ogType?: OgType;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  /** OG/Twitter title が長すぎる場合の上書き */
  socialTitle?: string;
  /** 任意の og: メタタグ追加 */
  other?: Metadata["other"];
};

/**
 * ページ用 Metadata の共通ファクトリ。
 * canonical / openGraph / twitter / keywords を一括で組み立て、各ページの generateMetadata から呼ぶ。
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  ogType = "article",
  publishedTime,
  modifiedTime,
  authors,
  socialTitle,
  other,
}: PageMetadataInput): Metadata {
  const ogTitle = socialTitle ?? title;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      title: ogTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
    ...(other ? { other } : {}),
  };
}

/** notFound 時の no-index メタデータ。 */
export const NOT_FOUND_METADATA: Metadata = {
  title: "見つかりません",
  robots: { index: false, follow: false },
};
