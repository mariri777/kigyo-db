import { ImageResponse } from "next/og";
import { getPrediction } from "@/content/predictions";
import { getStockBrief } from "@/server/usecase";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og/OgCard";

export const alt = "予測カード | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prediction = getPrediction(id);
  if (!prediction) {
    return new ImageResponse(
      (
        <OgCard sectionLabel="Prediction" title="予測が見つかりません" />
      ),
      { ...size },
    );
  }
  const stock = prediction.stockCode ? await getStockBrief(prediction.stockCode) : null;
  const badge =
    prediction.status === "resolved"
      ? "RESOLVED"
      : prediction.status === "live"
        ? "LIVE"
        : "UPCOMING";
  const sectionLabel = stock
    ? `Prediction · ${stock.name}(${stock.code})`
    : `Prediction · ${prediction.eventName}`;
  return new ImageResponse(
    (
      <OgCard
        sectionLabel={sectionLabel}
        title={prediction.question}
        subtitle={prediction.questionNote ?? prediction.eventName}
        chips={["AI 推論公開", "確信度付き", "結果公開", "教訓付き"]}
        badge={badge}
      />
    ),
    { ...size },
  );
}
