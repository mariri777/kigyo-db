/**
 * 対象選定ヘルパ。タスクの selectTargets から呼ばれ、銘柄コード配列を返す。
 *
 *   - all:      全銘柄(または limit で先頭 N)
 *   - movers:   当日 ±threshold% 動意があった銘柄(stockSnapshot から)
 *   - rotation: 全銘柄を slice 等分し、当日のスライスを返す(月次で全件回す)
 *   - codes:    明示指定(--codes 7203,9984)
 */
import { sql } from "drizzle-orm";

import { stocks, stockSnapshot } from "../../src/server/db/schema.js";
import type { PipelineCtx } from "./task.js";

export type SelectorKind = "all" | "movers" | "rotation" | "codes";

export type SelectorParams = {
  /** movers: 騰落率しきい値(%) */
  threshold?: number;
  /** rotation: 何等分するか(slice=8 なら全銘柄の 1/8) */
  slice?: number;
  /** codes: 明示銘柄リスト */
  codes?: string[];
  /** 共通: 返す最大件数 */
  limit?: number;
};

export async function selectStockCodes(
  ctx: PipelineCtx,
  kind: SelectorKind,
  params: SelectorParams = {},
): Promise<string[]> {
  if (kind === "codes") {
    return (params.codes ?? []).slice(0, params.limit);
  }

  if (kind === "movers") {
    const threshold = params.threshold ?? 5;
    let q = ctx.db
      .select({ code: stockSnapshot.code })
      .from(stockSnapshot)
      .where(sql`ABS(${stockSnapshot.change1dPct}) >= ${threshold}`)
      .orderBy(sql`ABS(${stockSnapshot.change1dPct}) DESC`)
      .$dynamic();
    if (params.limit) q = q.limit(params.limit);
    const rows = await q.all();
    return rows.map((r) => r.code);
  }

  if (kind === "rotation") {
    const slice = params.slice ?? 8;
    const all = await ctx.db.select({ code: stocks.code }).from(stocks).orderBy(stocks.code).all();
    const dayIndex = dayIndexFromDate(ctx.date) % slice;
    const chunk: string[] = [];
    for (let i = 0; i < all.length; i++) {
      if (i % slice === dayIndex) chunk.push(all[i].code);
    }
    return params.limit ? chunk.slice(0, params.limit) : chunk;
  }

  // all
  const all = await ctx.db.select({ code: stocks.code }).from(stocks).orderBy(stocks.code).all();
  const codes = all.map((r) => r.code);
  return params.limit ? codes.slice(0, params.limit) : codes;
}

function dayIndexFromDate(date: string): number {
  // 1970-01-01 からの経過日数
  const t = Date.parse(`${date}T00:00:00Z`);
  return Math.floor(t / (1000 * 60 * 60 * 24));
}
