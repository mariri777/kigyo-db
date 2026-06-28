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

// Yahoo Finance はリクエスト多重度を上げるとサイレントに rate limit する
// (返答自体は来るが半数以上が空に近い)。BATCH_CONCURRENCY=8 で 3572 銘柄を
// 192 秒で処理した結果、quote 取得率は 27% (957/3572) だった。
// 並列度を 2 に落とし、失敗時はバックオフリトライを 2 回入れる。
const BATCH_CONCURRENCY = 2;
const RETRY_DELAYS_MS = [800, 2400];

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
    return fetchOneWithRetry(target.input.code);
  },

  async runBatch(targets, _ctx): Promise<Map<string, Output>> {
    const out = new Map<string, Output>();
    let okCount = 0;
    let failCount = 0;
    for (let i = 0; i < targets.length; i += BATCH_CONCURRENCY) {
      const slice = targets.slice(i, i + BATCH_CONCURRENCY);
      const results = await Promise.allSettled(
        slice.map((t) => fetchOneWithRetry(t.input.code)),
      );
      for (let j = 0; j < slice.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled") {
          out.set(slice[j].key, r.value);
          okCount += 1;
        } else {
          failCount += 1;
          if (failCount <= 5 || failCount % 50 === 0) {
            console.warn(
              `    ! yahoo-snapshot ${slice[j].key}: ${(r.reason as Error).message}`,
            );
          }
        }
      }
      // 進捗を 200 件ごとに stderr に
      if ((i + slice.length) % 200 < BATCH_CONCURRENCY) {
        console.log(
          `    … ${i + slice.length}/${targets.length} ok=${okCount} fail=${failCount}`,
        );
      }
    }
    if (failCount > 0) {
      console.warn(
        `    ⚠ yahoo-snapshot fail=${failCount}/${targets.length} (${((failCount / targets.length) * 100).toFixed(1)}%)`,
      );
    }
    return out;
  },

  validateOutput(output: Output) {
    // quote が空(rate limit 等)で全 NULL になっていないかをここで弾く。
    // fetchOne 側でも throw するが、二重に防御。
    if (output.priceJpy == null && output.marketCapOku == null) {
      return { ok: false, reason: "priceJpy / marketCapOku が両方 NULL" };
    }
    return { ok: true };
  },

  async healthCheck(ctx) {
    // 「3572 銘柄中 price_jpy が埋まってる割合」を見て 80% を下回ったら異常
    const totalRow = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM stocks`,
    )) as Array<{ n: number }>;
    const totalStocks = totalRow[0]?.n ?? 0;
    const okRow = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM stock_snapshot WHERE price_jpy IS NOT NULL`,
    )) as Array<{ n: number }>;
    const okSnapshots = okRow[0]?.n ?? 0;
    const ratio = totalStocks > 0 ? okSnapshots / totalStocks : 0;
    const pct = (ratio * 100).toFixed(1);
    const metrics = [
      `stock_snapshot.price_jpy 埋まり ${pct}% (${okSnapshots}/${totalStocks})`,
    ];
    if (totalStocks === 0) {
      return { ok: false, metrics, reasons: ["stocks テーブルが空"] };
    }
    if (ratio < 0.8) {
      return {
        ok: false,
        metrics,
        reasons: [
          `snapshot 充足率 ${pct}% < 80%。Yahoo の rate limit を疑い、` +
            `BATCH_CONCURRENCY と RETRY_DELAYS_MS を見直すこと。`,
        ],
      };
    }
    return {
      ok: true,
      metrics,
      warnings: ratio < 0.95 ? [`充足率 ${pct}%。可能なら未取得分を再実行`] : undefined,
    };
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

async function fetchOneWithRetry(code: string): Promise<Output> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fetchOne(code);
    } catch (e) {
      lastErr = e as Error;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay == null) break;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error(`fetchOne ${code} failed`);
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

  // quote が取れなければ「実質失敗」扱いにして再試行させる(中身が全 NULL の
  // snapshot が「成功」として残るのを防ぐ)。
  if (quoteRes.status === "rejected") {
    throw new Error(`quote rejected: ${(quoteRes.reason as Error)?.message ?? "unknown"}`);
  }
  if (Array.isArray(quoteRes.value) || quoteRes.value == null) {
    throw new Error("quote returned no value");
  }
  const q0 = quoteRes.value;
  if (q0.regularMarketPrice == null && q0.marketCap == null) {
    throw new Error("quote returned empty (likely rate-limited)");
  }

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
