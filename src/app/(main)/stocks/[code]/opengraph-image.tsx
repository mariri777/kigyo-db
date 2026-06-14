import { ImageResponse } from "next/og";
import { getStockDetail } from "@/server/usecase";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "銘柄詳細 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const stock = await getStockDetail(code);
  if (!stock) {
    return new ImageResponse(
      (
        <OgCard
          sectionLabel={`Stock · ${code}`}
          title="銘柄が見つかりません"
          subtitle={`コード ${code} の銘柄は登録されていません。`}
        />
      ),
      { ...size },
    );
  }
  const subtitle =
    stock.oneLiner?.trim() ||
    stock.description.slice(0, 110);
  const chips: string[] = [];
  if (stock.per != null && stock.per > 0) chips.push(`PER ${stock.per.toFixed(1)}`);
  if (stock.pbr != null && stock.pbr > 0) chips.push(`PBR ${stock.pbr.toFixed(2)}`);
  if (stock.dividendYield != null && stock.dividendYield > 0)
    chips.push(`配当 ${stock.dividendYield.toFixed(2)}%`);
  chips.push("類似銘柄", "見落とし論点");
  return new ImageResponse(
    (
      <OgCard
        sectionLabel={`Stock · ${stock.code} · 東証${stock.exchange} · ${stock.industryCluster}`}
        title={`${stock.name}(${stock.code})`}
        subtitle={subtitle}
        chips={chips.slice(0, 5)}
      />
    ),
    { ...size },
  );
}
