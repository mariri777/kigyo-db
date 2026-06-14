import { ImageResponse } from "next/og";
import { industries } from "@/content/industries";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "業界マップ | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Industry Map"
        title="業界の競争構造を、一枚に。"
        subtitle={`半導体・自動車・化学… ${industries.length} 業界を、バリューチェーン・主要 KPI・見落とし論点まで分解。`}
        chips={["バリューチェーン", "競争構造", "主要 KPI", "サブクラスタ", "見落とし論点"]}
      />
    ),
    { ...size },
  );
}
