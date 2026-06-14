// /stocks 一覧の「もっと見る」用ペジネーション API。
//
// クエリパラメータ:
//   industry: 業界 slug(複数: industry=semiconductor&industry=pharma)
//   sort:     SortKey (code/priceJpy/marketCapOku/per/pbr/dividendYield)
//   dir:      asc/desc(デフォルトは sort に応じて推奨方向)
//   offset:   開始位置(デフォルト 0)
//   limit:    取得件数(上限 100)
//
// レスポンス: { results: StockBrief[], total: number, hasMore: boolean }
//
// キャッシュ: CDN で 30 分。同じパラメータの組み合わせは共有される。

import { listStockBriefsPaginated } from "@/server/usecase";
import { industries } from "@/content/industries";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;
const VALID_SORT_KEYS = new Set([
  "code",
  "priceJpy",
  "marketCapOku",
  "per",
  "pbr",
  "dividendYield",
]);

export async function GET(request: Request): Promise<Response> {
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

  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") | 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit") ?? "100") | 0),
  );

  // 業界フィルタを銘柄コード集合に展開
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
    // 業界フィルタに該当銘柄が無いケースは空で即返す(D1 アクセス不要)
    if (codes.length === 0) {
      return Response.json(
        { results: [], total: 0, hasMore: false },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        },
      );
    }
  }

  const results = await listStockBriefsPaginated({
    codes,
    sortKey,
    sortDir,
    offset,
    limit,
  });

  return Response.json(
    {
      results,
      hasMore: results.length === limit,
    },
    {
      headers: {
        // 同じ (industry, sort, dir, offset, limit) の組み合わせは CDN で共有
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    },
  );
}
