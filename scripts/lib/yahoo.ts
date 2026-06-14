// Yahoo Finance バッチ取得ヘルパー。

import YahooFinance from "yahoo-finance2";
import type { Quote } from "yahoo-finance2/modules/quote";
import type { ChartResultArray } from "yahoo-finance2/modules/chart";

const QUOTE_BATCH = 100;
const YAHOO_CONCURRENCY = 4;

export type QuoteSnapshot = {
  code: string;
  priceJpy: number | null;
  priceDate: string | null;
  changePct: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  /** %(例: 1.55) — Yahoo の生値は小数なので 100 倍する */
  dividendYield: number | null;
};

export function newYahoo(): InstanceType<typeof YahooFinance> {
  return new YahooFinance({ suppressNotices: ["yahooSurvey"] });
}

/** 銘柄コード(例: ["7203", "8035", ...])に対して quote をバッチ並列で取得する。 */
export async function fetchQuotesAll(
  yf: InstanceType<typeof YahooFinance>,
  codes: string[],
  opts?: { onProgress?: (done: number, total: number, ok: number) => void },
): Promise<Map<string, QuoteSnapshot>> {
  const result = new Map<string, QuoteSnapshot>();
  const batches: string[][] = [];
  for (let i = 0; i < codes.length; i += QUOTE_BATCH) {
    batches.push(codes.slice(i, i + QUOTE_BATCH));
  }

  let done = 0;
  let ok = 0;
  for (let i = 0; i < batches.length; i += YAHOO_CONCURRENCY) {
    const slice = batches.slice(i, i + YAHOO_CONCURRENCY);
    const settled = await Promise.allSettled(
      slice.map(async (batch) => {
        const symbols = batch.map((c) => `${c}.T`);
        const quotes = (await yf.quote(symbols, { return: "array" })) as Quote[];
        return quotes;
      }),
    );
    for (const s of settled) {
      done += 1;
      if (s.status === "fulfilled") {
        for (const q of s.value) {
          const code = q.symbol.replace(".T", "");
          result.set(code, quoteToSnapshot(code, q));
          ok += 1;
        }
      }
    }
    opts?.onProgress?.(done, batches.length, ok);
  }
  return result;
}

function quoteToSnapshot(code: string, q: Quote): QuoteSnapshot {
  return {
    code,
    priceJpy: q.regularMarketPrice ?? null,
    priceDate: q.regularMarketTime
      ? new Date(q.regularMarketTime).toISOString().slice(0, 10)
      : null,
    changePct: q.regularMarketChangePercent ?? null,
    marketCapOku: q.marketCap != null ? Math.round(q.marketCap / 1e8) : null,
    per: q.trailingPE ?? null,
    pbr: q.priceToBook ?? null,
    dividendYield:
      q.trailingAnnualDividendYield != null
        ? q.trailingAnnualDividendYield * 100
        : null,
  };
}

/** 過去 days 日分の日次 OHLC を銘柄ごとに取得する。 */
export async function fetchChartsAll(
  yf: InstanceType<typeof YahooFinance>,
  codes: string[],
  days: number,
  opts?: { onProgress?: (done: number, total: number, ok: number) => void },
): Promise<Map<string, ChartResultArray>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const result = new Map<string, ChartResultArray>();
  const BATCH = 8;
  let done = 0;
  let ok = 0;
  for (let i = 0; i < codes.length; i += BATCH) {
    const slice = codes.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      slice.map(async (code) => {
        const c = (await yf.chart(`${code}.T`, {
          period1: since,
          interval: "1d",
        })) as ChartResultArray;
        return [code, c] as const;
      }),
    );
    for (const s of settled) {
      done += 1;
      if (s.status === "fulfilled") {
        result.set(s.value[0], s.value[1]);
        ok += 1;
      }
    }
    opts?.onProgress?.(done, codes.length, ok);
  }
  return result;
}
