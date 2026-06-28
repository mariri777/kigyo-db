/**
 * fetch-yahoo-snapshot:
 *   Yahoo Finance から各銘柄の quote + chart 90 日 + chart 1 年を取得し、
 *   stock_snapshot (派生指標含む) と stock_prices_daily を更新する。
 *
 *   Yahoo に空ペイロード(サイレント rate-limit)で帰られたら成功にしない、
 *   並列度・リトライ・進捗ログは lib/concurrency に委譲。
 *   Yahoo HTTP は lib/yahoo に集約 — このファイルにはビジネスロジックだけ残す。
 */
import { sql } from "drizzle-orm";

import { stockPricesDaily, stockSnapshot, stocks } from "../../../src/server/db/schema.js";
import { mapWithLimit } from "../../lib/concurrency.js";
import { changePctOver, rsi, sma } from "../../lib/indicators.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import { fetchChart, fetchQuote, jpStockSymbol, type Bar, type Quote } from "../../lib/yahoo.js";

// ──────────────────────────────────────────────────
// 型
// ──────────────────────────────────────────────────

type Input = { code: string };

type Output = {
  code: string;
  priceJpy: number | null;
  priceDate: string | null;
  change1dPct: number | null;
  change1mPct: number | null;
  change1yPct: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
  high52w: number | null;
  low52w: number | null;
  ma25: number | null;
  ma75: number | null;
  ma200: number | null;
  rsi14: number | null;
  prices: Bar[];
};

// ──────────────────────────────────────────────────
// 取得設定
// ──────────────────────────────────────────────────

/**
 * Yahoo Finance はサイレント rate-limit が強い。
 *   - 並列 8: 73% が空ペイロードで「成功」扱いされた事故(2026-06-28)
 *   - 並列 2 + リトライ 2 回: 全銘柄 99%+ で安定
 * 数字を上げるときは必ず healthCheck の充足率を見ながら上げること。
 */
const FETCH_OPTS = {
  concurrency: 2,
  retryDelaysMs: [800, 2400],
  label: "yahoo-snapshot",
};

const CHART_WINDOW_DAYS = 90;
const CHART_WINDOW_YEAR_DAYS = 365;
const PRICES_KEEP_DAYS = 30;

// ──────────────────────────────────────────────────
// Task
// ──────────────────────────────────────────────────

export const yahooSnapshotTask: Task<Input, Output> = {
  name: "fetch-yahoo-snapshot",
  kind: "fetch",
  description: "Yahoo Finance から quote/chart 取得 → stock_snapshot + stock_prices_daily",

  async selectTargets(ctx, opts): Promise<Target<Input>[]> {
    if (opts.codes && opts.codes.length > 0) {
      return opts.codes.map((code) => ({ key: code, input: { code } }));
    }
    let q = ctx.db.select({ code: stocks.code }).from(stocks).orderBy(stocks.code).$dynamic();
    if (opts.limit) q = q.limit(opts.limit);
    const rows = await q.all();
    return rows.map((r) => ({ key: r.code, input: { code: r.code } }));
  },

  async run(target): Promise<Output> {
    return fetchSnapshot(target.input.code);
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const { ok } = await mapWithLimit<Target<Input>, Output>(
      targets,
      (t) => fetchSnapshot(t.input.code),
      FETCH_OPTS,
    );
    return ok;
  },

  validateOutput(output: Output) {
    if (output.priceJpy == null && output.marketCapOku == null) {
      return { ok: false, reason: "priceJpy / marketCapOku が両方 NULL" };
    }
    return { ok: true };
  },

  async healthCheck(ctx) {
    const [{ n: totalStocks }] = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM stocks`,
    )) as Array<{ n: number }>;
    const [{ n: withPrice }] = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM stock_snapshot WHERE price_jpy IS NOT NULL`,
    )) as Array<{ n: number }>;
    const ratio = totalStocks > 0 ? withPrice / totalStocks : 0;
    const metrics = [
      `stock_snapshot.price_jpy 埋まり ${(ratio * 100).toFixed(1)}% (${withPrice}/${totalStocks})`,
    ];
    if (totalStocks === 0) {
      return { ok: false, metrics, reasons: ["stocks テーブルが空"] };
    }
    if (ratio < 0.8) {
      return {
        ok: false,
        metrics,
        reasons: [
          `snapshot 充足率 ${(ratio * 100).toFixed(1)}% < 80%。` +
            `Yahoo rate-limit を疑い、FETCH_OPTS の concurrency を下げて再実行。`,
        ],
      };
    }
    return {
      ok: true,
      metrics,
      warnings: ratio < 0.95 ? [`充足率 ${(ratio * 100).toFixed(1)}%。未取得分を再実行推奨`] : undefined,
    };
  },

  async applyLocal(target, output, ctx) {
    const now = new Date().toISOString();

    await ctx.db
      .insert(stockSnapshot)
      .values({
        code: target.input.code,
        priceJpy: output.priceJpy,
        priceDate: output.priceDate,
        change1dPct: output.change1dPct,
        change1mPct: output.change1mPct,
        change1yPct: output.change1yPct,
        marketCapOku: output.marketCapOku,
        per: output.per,
        pbr: output.pbr,
        dividendYield: output.dividendYield,
        high52w: output.high52w,
        low52w: output.low52w,
        ma25: output.ma25,
        ma75: output.ma75,
        ma200: output.ma200,
        rsi14: output.rsi14,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: stockSnapshot.code,
        set: {
          priceJpy: sql`excluded.price_jpy`,
          priceDate: sql`excluded.price_date`,
          change1dPct: sql`excluded.change_1d_pct`,
          change1mPct: sql`excluded.change_1m_pct`,
          change1yPct: sql`excluded.change_1y_pct`,
          marketCapOku: sql`excluded.market_cap_oku`,
          per: sql`excluded.per`,
          pbr: sql`excluded.pbr`,
          dividendYield: sql`excluded.dividend_yield`,
          high52w: sql`excluded.high_52w`,
          low52w: sql`excluded.low_52w`,
          ma25: sql`excluded.ma_25`,
          ma75: sql`excluded.ma_75`,
          ma200: sql`excluded.ma_200`,
          rsi14: sql`excluded.rsi_14`,
          updatedAt: now,
        },
      })
      .run();

    if (output.prices.length === 0) return;
    await ctx.db
      .insert(stockPricesDaily)
      .values(
        output.prices.map((p) => ({
          code: target.input.code,
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        })),
      )
      .onConflictDoUpdate({
        target: [stockPricesDaily.code, stockPricesDaily.date],
        set: {
          open: sql`excluded.open`,
          high: sql`excluded.high`,
          low: sql`excluded.low`,
          close: sql`excluded.close`,
          volume: sql`excluded.volume`,
        },
      })
      .run();
  },
};

// ──────────────────────────────────────────────────
// 取得本体: 1 銘柄分 = quote + chart 90d + chart 1y
// ──────────────────────────────────────────────────

async function fetchSnapshot(code: string): Promise<Output> {
  const symbol = jpStockSymbol(code);

  // quote が落ちたら snapshot を作らず throw(空 NULL 成功化を防ぐ)。
  // chart は無くても snapshot は意味がある(指標が一部出ないだけ)ので例外として握る。
  const quote = await fetchQuote(symbol);
  const [daily, weekly] = await Promise.allSettled([
    fetchChart(symbol, { period1: daysAgo(CHART_WINDOW_DAYS), interval: "1d" }),
    fetchChart(symbol, { period1: daysAgo(CHART_WINDOW_YEAR_DAYS), interval: "1wk" }),
  ]);

  const { ma, prices, change1mPct } = summarizeDaily(quote, settle(daily));
  const change1yPct = summarize1y(quote, settle(weekly));

  return {
    code,
    priceJpy: quote.price,
    priceDate: quote.asOf,
    change1dPct: quote.change1dPct,
    change1mPct,
    change1yPct,
    marketCapOku: quote.marketCap != null ? Math.round(quote.marketCap / 1e8) : null,
    per: quote.trailingPE,
    pbr: quote.priceToBook,
    dividendYield: quote.dividendYieldPct,
    high52w: quote.high52w,
    low52w: quote.low52w,
    ma25: ma.ma25,
    ma75: ma.ma75,
    ma200: ma.ma200,
    rsi14: ma.rsi14,
    prices,
  };
}

function settle<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

function summarizeDaily(
  quote: Quote,
  bars: Bar[] | null,
): {
  ma: { ma25: number | null; ma75: number | null; ma200: number | null; rsi14: number | null };
  prices: Bar[];
  change1mPct: number | null;
} {
  if (!bars || bars.length === 0) {
    return {
      ma: { ma25: null, ma75: null, ma200: null, rsi14: null },
      prices: [],
      change1mPct: null,
    };
  }
  const closes = bars.map((b) => b.close);
  return {
    ma: {
      ma25: sma(closes, 25),
      ma75: sma(closes, 75),
      ma200: sma(closes, 200),
      rsi14: rsi(closes, 14),
    },
    prices: bars.slice(-PRICES_KEEP_DAYS),
    // 20 営業日前との比較 = 概ね 1 ヶ月
    change1mPct: changePctOver(closes, quote.price, 20),
  };
}

function summarize1y(quote: Quote, bars: Bar[] | null): number | null {
  if (!bars || bars.length === 0) return null;
  const oldest = bars.find((b) => b.close != null)?.close;
  if (oldest == null || oldest <= 0) return null;
  return ((quote.price - oldest) / oldest) * 100;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
