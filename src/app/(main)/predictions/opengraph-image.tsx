import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "予測 — 結果で学ぶ確率思考 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Predictions"
        title="確率で考える、短期で答え合わせ。"
        subtitle="決算・適時開示・マクロイベントに対する AI と編集部の予測カード。賭けない、学ぶ。"
        chips={["決算予測", "適時開示", "マクロ", "ニュース", "教訓"]}
        badge="LIVE"
      />
    ),
    { ...size },
  );
}
