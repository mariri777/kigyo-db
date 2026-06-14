import "server-only";

import type { Stock, StockBrief } from "@/domain/types";
import { listStockBriefs } from "./stockBriefs";
import { listOverlayStocks } from "./listOverlayStocks";

export type HomeHighlights = {
  briefs: StockBrief[];
  overlayStocks: Stock[];
  undervalued: Stock[];
  expansion: Stock[];
};

const TOP_N = 4;

/**
 * ホームページが必要とする集計をまとめて返す。
 *
 *  - 全銘柄(briefs): カウント表示用
 *  - オーバーレイ済全 Stock: coverage/track-record/cross-industry セクション用
 *  - 割安スコアトップ 4
 *  - 拡大期スコアトップ 4
 *
 * ソートはサーバーで決定的に行う。app/page.tsx 側のロジックはここに集約する。
 */
export async function listHomeHighlights(): Promise<HomeHighlights> {
  const [briefs, overlayStocks] = await Promise.all([
    listStockBriefs(),
    listOverlayStocks(),
  ]);

  const undervalued = overlayStocks
    .filter((s) => s.valuationCall?.verdict === "割安")
    .sort(
      (a, b) =>
        (b.valuationCall?.score ?? -Infinity) -
        (a.valuationCall?.score ?? -Infinity),
    )
    .slice(0, TOP_N);

  const expansion = overlayStocks
    .filter(
      (s): s is Stock & { phaseScores: NonNullable<Stock["phaseScores"]> } =>
        s.phaseScores !== null,
    )
    .sort((a, b) => b.phaseScores.expansion - a.phaseScores.expansion)
    .slice(0, TOP_N);

  return { briefs, overlayStocks, undervalued, expansion };
}
