import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "銘柄詳細 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return new ImageResponse(
    (
      <OgCard
        sectionLabel={`Stock · ${code}`}
        title={`銘柄 ${code}`}
        subtitle="事業構造タグ・類似銘柄・AI による見落とし論点・ファクター感応度をすべて 1 ページに。"
        chips={["事業構造", "類似銘柄", "見落とし論点", "AI 評価", "予測カード"]}
      />
    ),
    { ...size },
  );
}
