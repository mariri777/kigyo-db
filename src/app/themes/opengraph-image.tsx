import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "特集 — 業界横断テーマ別の銘柄キュレーション | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        sectionLabel="Cross-Industry Themes"
        title="テーマで掘る。"
        subtitle="円安・AI 受益・金利上昇・累進配当・PBR 改善 — マクロを起点に銘柄を横断キュレーション。"
        chips={["円安受益", "AI 受益", "高配当", "PBR 改善", "テーマ別ランキング"]}
      />
    ),
    { ...size },
  );
}
