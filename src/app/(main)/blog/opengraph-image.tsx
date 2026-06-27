import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "ブログ — 銘柄・業界の深掘り記事 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Blog"
        title="銘柄と業界を、深く読む。"
        subtitle="決算ハイライト・業界レポート・テーマ解説。AI + 編集部レビューでお届けします。"
        chips={["決算レビュー", "業界深掘り", "テーマ解説", "編集後記"]}
      />
    ),
    { ...size },
  );
}
