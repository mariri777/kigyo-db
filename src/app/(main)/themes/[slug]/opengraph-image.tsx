import { ImageResponse } from "next/og";
import { getTheme } from "@/content/themes";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "特集 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) {
    return new ImageResponse(
      (
        <OgCard sectionLabel="Theme" title="テーマが見つかりません" />
      ),
      { ...size },
    );
  }
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Cross-Industry Theme"
        title={theme.name}
        subtitle={theme.lede.slice(0, 110)}
        chips={[`ランキング軸: ${theme.rankLabel}`, "推奨銘柄", "業界横断", "編集部"]}
      />
    ),
    { ...size },
  );
}
