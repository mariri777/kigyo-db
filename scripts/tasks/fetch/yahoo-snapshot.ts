/**
 * fetch-yahoo-snapshot: Yahoo Finance から価格・指標・チャートを取得し、
 * stock_snapshot と stock_prices_daily を更新する。
 *
 * 1 銘柄 1 target。selectTargets で対象を絞る。
 *   - default: 全銘柄(--limit で先頭 N)
 *   - --codes で明示
 *
 * 取得項目:
 *   - quote: 価格 / change_1d_pct / market_cap / per / pbr / dividend_yield / 52w 高安
 *   - chart (3 ヶ月): 終値時系列 → MA25/75/200 計算、RSI14 計算、過去 30 日 OHLCV を保存
 *
 * RSI / MA は yahoo-finance2 が出さないので自前計算(scripts 内に閉じる)。
 */
import { sql } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";

import {
  stockPricesDaily,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";

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
  prices: Array<{
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number;
    volume: number | null;
  }>;
};

const BATCH_CONCURRENCY = 8;

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
    return fetchOne(target.input.code);
  },

  async runBatch(targets, _ctx): Promise<Map<string, Output>> {
    const out = new Map<string, Output>();
    // BATCH_CONCURRENCY 件ずつ並列
    for (let i = 0; i < targets.length; i += BATCH_CONCURRENCY) {
      const slice = targets.slice(i, i + BATCH_CONCURRENCY);
      const results = await Promise.allSettled(slice.map((t) => fetchOne(t.input.code)));
      for (let j = 0; j < slice.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled") out.set(slice[j].key, r.value);
      }
    }
    return out;
  },

  async applyLocal(target, output, ctx) {
    const now = new Date().toISOString();
    // stock_snapshot UPSERT(code PK)
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

    // stock_prices_daily 過去 30 日ぶん UPSERT
    if (output.prices.length > 0) {
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
    }
  },
};

// ──────────────────────────────────────────────────
// 内部: Yahoo Finance ラッパ + 指標計算
// ──────────────────────────────────────────────────

let _yf: InstanceType<typeof YahooFinance> | null = null;
function yf() {
  if (!_yf) _yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  return _yf;
}

async function fetchOne(code: string): Promise<Output> {
  const symbol = `${code}.T`;

  const [quoteRes, chartRes, chart1yRes] = await Promise.allSettled([
    yf().quote(symbol),
    yf().chart(symbol, {
      period1: ninetyDaysAgo(),
      interval: "1d",
    }),
    yf().chart(symbol, {
      period1: oneYearAgo(),
      interval: "1wk",
    }),
  ]);

  let priceJpy: number | null = null;
  let priceDate: string | null = null;
  let change1dPct: number | null = null;
  let marketCapOku: number | null = null;
  let per: number | null = null;
  let pbr: number | null = null;
  let dividendYield: number | null = null;
  let high52w: number | null = null;
  let low52w: number | null = null;

  if (quoteRes.status === "fulfilled" && !Array.isArray(quoteRes.value)) {
    const q = quoteRes.value;
    priceJpy = q.regularMarketPrice ?? null;
    priceDate = q.regularMarketTime ? new Date(q.regularMarketTime).toISOString().slice(0, 10) : null;
    change1dPct = q.regularMarketChangePercent ?? null;
    marketCapOku = q.marketCap != null ? Math.round(q.marketCap / 1e8) : null;
    per = q.trailingPE ?? null;
    pbr = q.priceToBook ?? null;
    dividendYield = q.trailingAnnualDividendYield != null ? q.trailingAnnualDividendYield * 100 : null;
    high52w = q.fiftyTwoWeekHigh ?? null;
    low52w = q.fiftyTwoWeekLow ?? null;
  }

  let prices: Output["prices"] = [];
  let ma25: number | null = null;
  let ma75: number | null = null;
  let ma200: number | null = null;
  let rsi14: number | null = null;
  let change1mPct: number | null = null;
  let change1yPct: number | null = null;

  if (chartRes.status === "fulfilled") {
    const closes: number[] = [];
    for (const r of chartRes.value.quotes) {
      if (r.close == null) continue;
      closes.push(r.close);
      const d = (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10);
      prices.push({
        date: d,
        open: r.open ?? null,
        high: r.high ?? null,
        low: r.low ?? null,
        close: r.close,
        volume: r.volume ?? null,
      });
    }
    // 直近 30 日のみ保存
    prices = prices.slice(-30);
    ma25 = sma(closes, 25);
    ma75 = sma(closes, 75);
    ma200 = sma(closes, 200);
    rsi14 = rsi(closes, 14);
    // 1m 騰落率: 20 営業日前との比較
    if (priceJpy != null && closes.length >= 21) {
      const prev = closes[closes.length - 21];
      if (prev > 0) change1mPct = ((priceJpy - prev) / prev) * 100;
    }
  }

  // 1y 騰落率: 週足 1 年データから取得
  if (chart1yRes.status === "fulfilled" && priceJpy != null) {
    const q = chart1yRes.value.quotes;
    // 最古の close を取って比較
    const oldest = q.find((r) => r.close != null)?.close;
    if (oldest && oldest > 0) change1yPct = ((priceJpy - oldest) / oldest) * 100;
  }

  return {
    code,
    priceJpy,
    priceDate,
    change1dPct,
    change1mPct,
    change1yPct,
    marketCapOku,
    per,
    pbr,
    dividendYield,
    high52w,
    low52w,
    ma25,
    ma75,
    ma200,
    rsi14,
    prices,
  };
}

function ninetyDaysAgo(): string {
  const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function oneYearAgo(): string {
  const d = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function sma(closes: number[], window: number): number | null {
  if (closes.length < window) return null;
  let sum = 0;
  for (let i = closes.length - window; i < closes.length; i++) sum += closes[i];
  return sum / window;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}
