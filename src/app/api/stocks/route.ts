// /stocks 一覧の「もっと見る」用ペジネーション API。
//
// クエリパラメータ:
//   industry: 業界 slug(複数: industry=semiconductor&industry=pharma)
//   sort:     SortKey (code/priceJpy/marketCapOku/per/pbr/dividendYield)
//   dir:      asc/desc(デフォルトは sort に応じて推奨方向)
//   offset:   開始位置(デフォルト 0)
//   limit:    取得件数(上限 100)
//
// レスポンス: { results: StockBrief[], hasMore: boolean }
//
// キャッシュ: Workers Cache API で 30 分。同じパラメータの組み合わせは共有される。

import { listStockBriefsPaginated } from "@/server/usecase";
import { industries } from "@/content/industries";
import { withEdgeCache } from "@/server/cache";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;
const CACHE_TTL_SEC = 1800;
const VALID_SORT_KEYS = new Set([
  "code",
  "priceJpy",
  "marketCapOku",
  "per",
  "pbr",
  "dividendYield",
]);

export async function GET(request: Request): Promise<Response> {
  return withEdgeCache(
    request,
    async () => {
      const url = new URL(request.url);
      const industryFilter = url.searchParams.getAll("industry");

      const sortRaw = url.searchParams.get("sort") ?? "marketCapOku";
      const sortKey = VALID_SORT_KEYS.has(sortRaw)
        ? (sortRaw as
            | "code"
            | "priceJpy"
            | "marketCapOku"
            | "per"
            | "pbr"
            | "dividendYield")
        : "marketCapOku";

      const dirRaw = url.searchParams.get("dir");
      const sortDir: "asc" | "desc" =
        dirRaw === "asc" || dirRaw === "desc"
          ? dirRaw
          : sortKey === "code"
            ? "asc"
            : "desc";

      const offset = Math.max(
        0,
        Number(url.searchParams.get("offset") ?? "0") | 0,
      );
      const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, Number(url.searchParams.get("limit") ?? "100") | 0),
      );

      let codes: string[] | undefined;
      if (industryFilter.length > 0) {
        const allowed = new Set<string>();
        for (const ind of industries) {
          if (industryFilter.includes(ind.slug)) {
            for (const sc of ind.subClusters) {
              for (const code of sc.companyCodes) allowed.add(code);
            }
          }
        }
        codes = [...allowed];
        if (codes.length === 0) {
          return Response.json({ results: [], hasMore: false });
        }
      }

      const results = await listStockBriefsPaginated({
        codes,
        sortKey,
        sortDir,
        offset,
        limit,
      });

      return Response.json({
        results,
        hasMore: results.length === limit,
      });
    },
    CACHE_TTL_SEC,
  );
}
