import type { BusinessTag, Stock, TagDimension } from "@/domain/types";
import { SourceChip } from "@/components/SourceChip";

const DIM_LABEL: Record<TagDimension, string> = {
  product: "製品・サービス",
  customer: "顧客セグメント",
  channel: "販売チャネル",
  revenue_model: "収益モデル",
  value_chain: "バリューチェーン",
  geography: "地理的売上構成",
};

const DIM_ORDER: TagDimension[] = [
  "product",
  "customer",
  "revenue_model",
  "value_chain",
  "channel",
  "geography",
];

function groupTags(tags: BusinessTag[]): Partial<Record<TagDimension, BusinessTag[]>> {
  const groups: Partial<Record<TagDimension, BusinessTag[]>> = {};
  for (const t of tags) (groups[t.dimension] ??= []).push(t);
  return groups;
}

/**
 * A 軸 — 事業構造タグ + セグメント別売上を描画。
 */
export function BusinessStructure({ stock }: { stock: Stock }) {
  const tagGroups = groupTags(stock.tags);
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {DIM_ORDER.filter((d) => tagGroups[d]?.length).map((dim) => {
          const tags = tagGroups[dim]!;
          return (
            <div key={dim} className="bg-surface border border-border rounded-md p-4">
              <div className="text-[11px] text-foreground/60 tracking-widest mb-2">{DIM_LABEL[dim]}</div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span
                    key={`${t.value}-${i}`}
                    className="inline-flex items-center text-[12px] border border-border-strong bg-surface-elev rounded px-2 py-0.5"
                  >
                    {t.value}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <SourceChip source={tags[0].source} />
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-bold mt-8 mb-3">
        セグメント別売上({stock.segmentsPeriod ?? "—"})
      </h3>
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_70px_90px] text-[11px] text-foreground/60 border-b border-border bg-surface-elev px-4 py-2">
          <div>セグメント</div>
          <div className="text-right">売上(億円)</div>
          <div className="text-right">構成比</div>
          <div className="text-right">営業利益率</div>
        </div>
        {stock.segments.map((seg) => (
          <div
            key={seg.name}
            className="grid grid-cols-[1fr_100px_70px_90px] items-center px-4 py-2.5 border-b border-border last:border-b-0 text-sm"
          >
            <div>{seg.name}</div>
            <div className="text-right tabular font-mono">{seg.revenueOku.toLocaleString()}</div>
            <div className="text-right tabular font-mono">{seg.share.toFixed(1)}%</div>
            <div className="text-right tabular font-mono text-muted-foreground">
              {seg.operatingMargin !== undefined ? `${seg.operatingMargin.toFixed(1)}%` : "—"}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
