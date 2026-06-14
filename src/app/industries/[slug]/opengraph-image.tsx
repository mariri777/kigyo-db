import { ImageResponse } from "next/og";
import { getIndustry } from "@/content/industries";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "業界マップ | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) {
    return new ImageResponse(
      (
        <OgCard sectionLabel="Industry" title="業界が見つかりません" />
      ),
      { ...size },
    );
  }
  return new ImageResponse(
    (
      <OgCard
        sectionLabel={`Industry · ${ind.name}`}
        title={`${ind.name}業界マップ`}
        subtitle={ind.description.slice(0, 84)}
        chips={ind.theme2025.slice(0, 5)}
      />
    ),
    { ...size },
  );
}
