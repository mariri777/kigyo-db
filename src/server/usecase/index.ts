import "server-only";

/**
 * usecase 層の公開 API。app/ からはこの barrel を import する。
 *
 *   import { listStockBriefs, getStockDetail, ... } from "@/server/usecase";
 *
 * これは旧 `@/lib/stocksRepo` の置き換え先。sed の置換ターゲットを 1 か所に集約する。
 */
export {
  listStockBriefs,
  getStockBrief,
  getStockBriefsByCodes,
  listStockBriefsPaginated,
} from "./stockBriefs";
export { getStockDetail } from "./getStockDetail";
export { listOverlayStocks } from "./listOverlayStocks";
export { listHomeHighlights } from "./listHomeHighlights";
export type { HomeHighlights } from "./listHomeHighlights";
