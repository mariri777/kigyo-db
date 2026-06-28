/**
 * Yahoo Finance クライアントの薄いラッパ。
 *
 * 設計方針:
 *   1. **空の成功」を absolutely 許さない**: 主要キーが NULL のまま fulfilled で返ると、
 *      呼び出し側が「rate-limited で空」を「成功」と勘違いしてしまう
 *      (2026-06-28 の Yahoo snapshot 大失敗事故、3572 銘柄中 957 件しか取れて
 *       いないのに「成功」と判定された)。そこでクライアント側で常に検証して、
 *      取得できなかったら throw する。
 *   2. **シングルトン**: yahoo-finance2 はインスタンス内部に crumb cookie を持つので、
 *      タスク間で共有してリクエスト効率を上げる。
 *   3. **薄く保つ**: メソッドは `quote` / `chart` の 2 つだけ。
 *      指標計算(SMA/RSI)や DB マッピングはタスク側に置く。
 *
 * 並列度・リトライ・進捗ログは concurrency.ts に分離している。
 */
import YahooFinance from "yahoo-finance2";

let _client: InstanceType<typeof YahooFinance> | null = null;

function client(): InstanceType<typeof YahooFinance> {
  if (!_client) {
    _client = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  }
  return _client;
}

/** 取得した quote の正規化済み形。Null 許容なのは「データが本当に無い」フィールドだけ。 */
export type Quote = {
  symbol: string;
  price: number;
  /** YYYY-MM-DD。タイムゾーンは Yahoo の取引所セッション基準 */
  asOf: string | null;
  previousClose: number | null;
  change1dPct: number | null;
  change1dAbs: number | null;
  /** 通常 USD / JPY のまま。指数は無し */
  marketCap: number | null;
  trailingPE: number | null;
  priceToBook: number | null;
  /** Yahoo の 0..1 を 0..100 に正規化済み */
  dividendYieldPct: number | null;
  high52w: number | null;
  low52w: number | null;
};

export type Bar = {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
};

/**
 * 1 銘柄の quote。空 quote(価格も時価総額も NULL)は throw する。
 * Yahoo が空っぽを返すのは大抵 rate-limit のサイレント失敗で、再試行する価値がある。
 */
export async function fetchQuote(symbol: string): Promise<Quote> {
  const raw = await client().quote(symbol);
  if (Array.isArray(raw) || raw == null) {
    throw new Error(`[yahoo.quote] ${symbol}: no payload (likely rate-limited)`);
  }
  if (raw.regularMarketPrice == null && raw.marketCap == null) {
    throw new Error(`[yahoo.quote] ${symbol}: empty payload (likely rate-limited)`);
  }
  const price = raw.regularMarketPrice;
  if (price == null) {
    throw new Error(`[yahoo.quote] ${symbol}: no regularMarketPrice`);
  }
  return {
    symbol,
    price,
    asOf: raw.regularMarketTime
      ? new Date(raw.regularMarketTime).toISOString().slice(0, 10)
      : null,
    previousClose: raw.regularMarketPreviousClose ?? null,
    change1dPct: raw.regularMarketChangePercent ?? null,
    change1dAbs: raw.regularMarketChange ?? null,
    marketCap: raw.marketCap ?? null,
    trailingPE: raw.trailingPE ?? null,
    priceToBook: raw.priceToBook ?? null,
    dividendYieldPct:
      raw.trailingAnnualDividendYield != null
        ? raw.trailingAnnualDividendYield * 100
        : null,
    high52w: raw.fiftyTwoWeekHigh ?? null,
    low52w: raw.fiftyTwoWeekLow ?? null,
  };
}

/**
 * 1 銘柄のチャート(終値配列)。
 * 空 chart も throw する (rate-limit のサイレント失敗を成功扱いしない)。
 */
export async function fetchChart(
  symbol: string,
  opts: { period1: Date | string; interval: "1d" | "1wk" },
): Promise<Bar[]> {
  const raw = await client().chart(symbol, {
    period1: opts.period1,
    interval: opts.interval,
  });
  if (!raw?.quotes || raw.quotes.length === 0) {
    throw new Error(`[yahoo.chart] ${symbol}: empty quotes`);
  }
  const bars: Bar[] = [];
  for (const r of raw.quotes) {
    if (r.close == null) continue;
    const d = r.date instanceof Date ? r.date : new Date(r.date as string);
    bars.push({
      date: d.toISOString().slice(0, 10),
      open: r.open ?? null,
      high: r.high ?? null,
      low: r.low ?? null,
      close: r.close,
      volume: r.volume ?? null,
    });
  }
  if (bars.length === 0) {
    throw new Error(`[yahoo.chart] ${symbol}: no usable bars`);
  }
  return bars;
}

/** 日本株の symbol へ正規化("7203" → "7203.T")。指数の "^N225" 等はそのまま返す。 */
export function jpStockSymbol(code: string): string {
  return `${code}.T`;
}
