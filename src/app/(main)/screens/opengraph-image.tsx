import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "スクリーン — 切り口別の銘柄一覧 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Screens"
        title="切り口で探す。"
        subtitle="高配当・低 PER・低 PBR・大型株 — 投資スタイルに応じた候補群。条件は完全公開。"
        chips={["高配当", "低 PER", "低 PBR", "大型株", "メソドロジー公開"]}
      />
    ),
    { ...size },
  );
}
