import { ImageResponse } from "next/og";
import { getScreen } from "@/domain/screens";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "スクリーン | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const screen = getScreen(slug);
  if (!screen) {
    return new ImageResponse(
      (
        <OgCard sectionLabel="Screen" title="スクリーンが見つかりません" />
      ),
      { ...size },
    );
  }
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Screen"
        title={screen.shortTitle}
        subtitle={screen.description.slice(0, 110)}
        chips={["定量フィルタ", "メソドロジー公開", "東証全社"]}
      />
    ),
    { ...size },
  );
}
