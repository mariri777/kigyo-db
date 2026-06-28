/**
 * fetch-market-indices: 日経平均/TOPIX/USD-JPY/SOX/S&P 500 を Yahoo Finance から
 * 取得し market_indices テーブルに UPSERT する。
 *
 * シングルトン target (key="_singleton")。run() の中で全シンボル並列取得。
 * runBatch も不要 — 1 ターゲット内で 1 回叩くだけ。
 *
 * 個別の銘柄 fetch (3,800社) とは別の経路にする理由:
 *   - 指数は数本なので 1 まとめにしたい
 *   - 失敗時の再試行単位が違う (1 銘柄失敗より、まとめて失敗のほうが扱いやすい)
 *   - sync-remote に乗せるため、target ごとに lake file を分けたい
 */
import { sql } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";

import { marketIndices } from "../../../src/server/db/schema.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Input = { date: string };
type IndexRow = {
  symbol: string;
  name: string;
  displayOrder: number;
  value: number | null;
  previousClose: number | null;
  change1dPct: number | null;
  change1dAbs: number | null;
  asOf: string | null;
};
type Output = {
  date: string;
  rows: IndexRow[];
};

/**
 * 取得対象指数。display_order が小さいほど v2 トップで先頭に出る。
 * シンボルは Yahoo Finance の表記に従う。
 */
const INDEX_DEFS: Array<{ symbol: string; name: string; displayOrder: number }> = [
  { symbol: "^N225", name: "日経平均", displayOrder: 1 },
  { symbol: "^TOPX", name: "TOPIX", displayOrder: 2 },
  { symbol: "JPY=X", name: "USD/JPY", displayOrder: 3 },
  { symbol: "^SOX", name: "SOX 指数", displayOrder: 4 },
  { symbol: "^GSPC", name: "S&P 500", displayOrder: 5 },
];

const TABLE = "market_indices";
const COLS = [
  "symbol",
  "name",
  "display_order",
  "value",
  "previous_close",
  "change_1d_pct",
  "change_1d_abs",
  "as_of",
  "updated_at",
];

const marketIndicesTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "fetch-market-indices",
  kind: "fetch",
  description: "Yahoo Finance から日経/TOPIX/USDJPY/SOX/S&P500 を取得 → market_indices",
  remoteTable: TABLE,

  async selectTargets(ctx): Promise<Target<unknown>[]> {
    const t: Target<Input> = { key: "_singleton", input: { date: ctx.date } };
    return [t as Target<unknown>];
  },

  async run(target): Promise<Output> {
    const input = target.input as Input;
    const results = await Promise.allSettled(
      INDEX_DEFS.map((def) => fetchIndex(def.symbol)),
    );
    const rows: IndexRow[] = [];
    for (let i = 0; i < INDEX_DEFS.length; i++) {
      const def = INDEX_DEFS[i];
      const r = results[i];
      if (r.status === "fulfilled") {
        rows.push({
          symbol: def.symbol,
          name: def.name,
          displayOrder: def.displayOrder,
          ...r.value,
        });
      } else {
        // 1 本失敗しても他は流す (途中で throw すると全部 NULL になる)
        console.warn(`    ! ${def.symbol}: ${(r.reason as Error).message}`);
      }
    }
    if (rows.length === 0) {
      throw new Error(`market-indices: 全 ${INDEX_DEFS.length} 指数の取得に失敗`);
    }
    return { date: input.date, rows };
  },

  async applyLocal(_target, output, ctx) {
    const o = output as Output;
    const now = new Date().toISOString();
    for (const r of o.rows) {
      await ctx.db
        .insert(marketIndices)
        .values({
          symbol: r.symbol,
          name: r.name,
          displayOrder: r.displayOrder,
          value: r.value,
          previousClose: r.previousClose,
          change1dPct: r.change1dPct,
          change1dAbs: r.change1dAbs,
          asOf: r.asOf,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: marketIndices.symbol,
          set: {
            name: sql`excluded.name`,
            displayOrder: sql`excluded.display_order`,
            value: sql`excluded.value`,
            previousClose: sql`excluded.previous_close`,
            change1dPct: sql`excluded.change_1d_pct`,
            change1dAbs: sql`excluded.change_1d_abs`,
            asOf: sql`excluded.as_of`,
            updatedAt: now,
          },
        })
        .run();
    }
  },

  writeLakePath(_target, ctx) {
    // sync-remote が walk する AI_GENERATED_ROOT 配下に置いて、
    // 本番 D1 への反映パイプラインに乗せる (fetch だが派生扱い)。
    return aiGeneratedPath("fetch-market-indices", ctx.date, "_daily");
  },

  sqlFor(_key, output): string[] {
    const now = new Date().toISOString();
    const colList = COLS.map(sqlIdent).join(",");
    const updateClause = COLS.filter((c) => c !== "symbol")
      .map((c) => `${sqlIdent(c)} = excluded.${sqlIdent(c)}`)
      .join(", ");
    const stmts: string[] = [];
    for (const r of output.rows) {
      const values = [
        sqlLit(r.symbol),
        sqlLit(r.name),
        sqlLit(r.displayOrder),
        sqlLit(r.value),
        sqlLit(r.previousClose),
        sqlLit(r.change1dPct),
        sqlLit(r.change1dAbs),
        sqlLit(r.asOf),
        sqlLit(now),
      ].join(",");
      stmts.push(
        `INSERT INTO ${sqlIdent(TABLE)} (${colList}) VALUES (${values}) ON CONFLICT(symbol) DO UPDATE SET ${updateClause};`,
      );
    }
    return stmts;
  },
};

export { marketIndicesTask };

// ──────────────────────────────────────────────────
// 内部: Yahoo Finance 指数 1 本ぶん取得
// ──────────────────────────────────────────────────

let _yf: InstanceType<typeof YahooFinance> | null = null;
function yf() {
  if (!_yf) _yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  return _yf;
}

async function fetchIndex(symbol: string): Promise<{
  value: number | null;
  previousClose: number | null;
  change1dPct: number | null;
  change1dAbs: number | null;
  asOf: string | null;
}> {
  const q = await yf().quote(symbol);
  // quote は単体シンボルなら QuoteResponse、配列で渡すと配列
  if (Array.isArray(q)) throw new Error(`quote: 単体シンボルに配列が返った (${symbol})`);
  const value = q.regularMarketPrice ?? null;
  const previousClose = q.regularMarketPreviousClose ?? null;
  const change1dAbs = q.regularMarketChange ?? null;
  const change1dPct = q.regularMarketChangePercent ?? null;
  const asOf = q.regularMarketTime
    ? new Date(q.regularMarketTime).toISOString().slice(0, 10)
    : null;
  return { value, previousClose, change1dPct, change1dAbs, asOf };
}
