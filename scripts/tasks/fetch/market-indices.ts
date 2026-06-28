/**
 * fetch-market-indices:
 *   日経 / TOPIX / USDJPY / SOX / S&P500 の 5 指数を Yahoo から取得し
 *   market_indices テーブルに UPSERT する。
 *
 * シングルトン target。1 回の run で 5 指数を並列取得。
 * Yahoo HTTP は lib/yahoo に委譲、サイレント rate-limit は throw される。
 */
import { sql } from "drizzle-orm";

import { marketIndices } from "../../../src/server/db/schema.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { mapWithLimit } from "../../lib/concurrency.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";
import { fetchQuote } from "../../lib/yahoo.js";

// ──────────────────────────────────────────────────
// 定義
// ──────────────────────────────────────────────────

const INDEX_DEFS = [
  { symbol: "^N225", name: "日経平均", displayOrder: 1 },
  { symbol: "^TOPX", name: "TOPIX", displayOrder: 2 },
  { symbol: "JPY=X", name: "USD/JPY", displayOrder: 3 },
  { symbol: "^SOX", name: "SOX 指数", displayOrder: 4 },
  { symbol: "^GSPC", name: "S&P 500", displayOrder: 5 },
] as const;

/** 5 指数中 3 本以上は値が必要(v2 トップが崩れないため) */
const MIN_VALID_INDICES = 3;

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

// ──────────────────────────────────────────────────
// Task
// ──────────────────────────────────────────────────

const marketIndicesTask: Task<Input, Output> & SyncCapable<Output> = {
  name: "fetch-market-indices",
  kind: "fetch",
  description: "Yahoo Finance から日経/TOPIX/USDJPY/SOX/S&P500 を取得 → market_indices",
  remoteTable: TABLE,

  async selectTargets(ctx): Promise<Target<Input>[]> {
    return [{ key: "_singleton", input: { date: ctx.date } }];
  },

  async run(target): Promise<Output> {
    const items = INDEX_DEFS.map((def) => ({ key: def.symbol, def }));
    const { ok } = await mapWithLimit(
      items,
      async ({ def }) => {
        const q = await fetchQuote(def.symbol);
        return {
          symbol: def.symbol,
          name: def.name,
          displayOrder: def.displayOrder,
          value: q.price,
          previousClose: q.previousClose,
          change1dPct: q.change1dPct,
          change1dAbs: q.change1dAbs,
          asOf: q.asOf,
        };
      },
      { concurrency: 5, retryDelaysMs: [500, 1500], label: "market-indices", progressEvery: 0 },
    );
    const rows = Array.from(ok.values()).sort((a, b) => a.displayOrder - b.displayOrder);
    if (rows.length === 0) {
      throw new Error(`market-indices: 全 ${INDEX_DEFS.length} 指数の取得に失敗`);
    }
    return { date: target.input.date, rows };
  },

  validateOutput(output: Output) {
    const withValue = output.rows.filter((r) => r.value != null).length;
    if (withValue < MIN_VALID_INDICES) {
      return { ok: false, reason: `value 入り ${withValue}/${INDEX_DEFS.length} (< ${MIN_VALID_INDICES})` };
    }
    return { ok: true };
  },

  async healthCheck(ctx) {
    const [{ n }] = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM market_indices WHERE value IS NOT NULL`,
    )) as Array<{ n: number }>;
    const metrics = [`market_indices.value 入り ${n}/${INDEX_DEFS.length}`];
    if (n < MIN_VALID_INDICES) {
      return { ok: false, metrics, reasons: [`指数の値が ${n} 本しか入っていない`] };
    }
    return { ok: true, metrics };
  },

  async applyLocal(_target, output, ctx) {
    const now = new Date().toISOString();
    for (const r of output.rows) {
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
    return aiGeneratedPath("fetch-market-indices", ctx.date, "_daily");
  },

  sqlFor(_key, output): string[] {
    const now = new Date().toISOString();
    const colList = COLS.map(sqlIdent).join(",");
    const updateClause = COLS.filter((c) => c !== "symbol")
      .map((c) => `${sqlIdent(c)} = excluded.${sqlIdent(c)}`)
      .join(", ");
    return output.rows.map((r) => {
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
      return `INSERT INTO ${sqlIdent(TABLE)} (${colList}) VALUES (${values}) ON CONFLICT(symbol) DO UPDATE SET ${updateClause};`;
    });
  },
};

export { marketIndicesTask };
