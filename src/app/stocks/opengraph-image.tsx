import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "銘柄一覧 — 業界・指標で絞り込む | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Stocks"
        title="銘柄一覧"
        subtitle="東証 3,800 社を業界・PER・PBR・配当・時価総額で絞り込み、並び替え。"
        chips={["全 3,800 社", "東証 P/S/G", "PER", "PBR", "配当利回り"]}
      />
    ),
    { ...size },
  );
}
