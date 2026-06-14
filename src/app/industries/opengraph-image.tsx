import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "業界マップ — 業界ごとの徹底分析 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Industry Map"
        title="業界の競争構造を、一枚に。"
        subtitle="バリューチェーン・主要プレイヤー・KPI・見落とし論点。10 業界をカバー。"
        chips={["業界マップ", "競争構造", "主要 KPI", "サブクラスタ", "見落とし論点"]}
      />
    ),
    { ...size },
  );
}
