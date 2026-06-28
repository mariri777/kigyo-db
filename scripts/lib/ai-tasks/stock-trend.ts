// stock-trend: 日次の株価トレンド解説。
//   出力先カラム: company_ai_brief.stock_trend_analysis / stock_trend_factors_json / technical_comment

import { eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  companyAiBrief,
  stockPricesDaily,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株のエクイティアナリストです。提供される 1 銘柄の価格・テクニカル指標から、個人投資家向けに次の 3 つを出力してください。

1. stockTrendAnalysis: 直近の値動きを 120〜180 字で解説(数値を 1〜2 個引用)
2. stockTrendFactors: 株価を動かした主因 4 個。各 { label: <8字以内>, value: <12字以内>, note: <40字以内> }
   - label の例: "需給" / "業績期待" / "為替" / "セクター" / "需給(機関)" / "信用倍率"
3. technicalComment: テクニカル一言 60 字以内(MA・RSI・52週高安に触れる)

【厳守】
- 数値は提供データのみ使用。捏造禁止。
- 「上昇トレンド」など曖昧な表現より、根拠の数値を 1 つ添える("25日線 +3.4% 上抜け" 等)。
- データが NULL の指標には触れない(無いものを語らない)。
- 銘柄名・コードは出力に含めない(コード自体は results[].code で同定する)。
`;

const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  stockTrendAnalysis: z.string().min(40).max(280),
  stockTrendFactors: z
    .array(
      z.object({
        label: z.string().min(1).max(12),
        value: z.string().min(1).max(16),
        note: z.string().min(1).max(60),
      }),
    )
    .length(4),
  technicalComment: z.string().min(10).max(90),
});

type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  sectorTse: string;
  snapshot: {
    priceJpy: number | null;
    priceDate: string | null;
    change1dPct: number | null;
    change1mPct: number | null;
    change1yPct: number | null;
    ma25: number | null;
    ma75: number | null;
    ma200: number | null;
    high52w: number | null;
    low52w: number | null;
    rsi14: number | null;
    creditRatio: number | null;
  } | null;
  recentPrices: Array<{ date: string; close: number; volume: number | null }>;
};

export const stockTrendTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "stock-trend",
  description: "直近の価格動向 + 主因 + テクニカル一言を生成する(日次)",
  outputSchemaName: "stock-trend-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        stockTrendAnalysis: "",
        stockTrendFactors: [
          { label: "", value: "", note: "" },
          { label: "", value: "", note: "" },
          { label: "", value: "", note: "" },
          { label: "", value: "", note: "" },
        ],
        technicalComment: "",
      },
    ],
  },

  async selectTargets(db, limit) {
    // company_ai_brief.stock_trend_analysis が NULL の銘柄を優先。
    // 次に generatedAt が古い順。
    const rows = await db
      .select({
        code: stocks.code,
        companyId: companies.id,
        name: companies.name,
        sectorTse: stocks.sectorTse,
        generatedAt: companyAiBrief.generatedAt,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .leftJoin(companyAiBrief, eq(companyAiBrief.companyId, companies.id))
      .where(
        or(
          isNull(companyAiBrief.companyId),
          isNull(companyAiBrief.stockTrendAnalysis),
        ),
      )
      .orderBy(sql`COALESCE(${companyAiBrief.generatedAt}, '0000-00-00')`)
      .limit(limit ?? 1000)
      .all();

    const targets: Array<{ key: string; input: Input }> = [];
    for (const r of rows) {
      const snap = await db
        .select()
        .from(stockSnapshot)
        .where(eq(stockSnapshot.code, r.code))
        .limit(1)
        .all();
      const prices = await db
        .select({
          date: stockPricesDaily.date,
          close: stockPricesDaily.close,
          volume: stockPricesDaily.volume,
        })
        .from(stockPricesDaily)
        .where(eq(stockPricesDaily.code, r.code))
        .orderBy(sql`${stockPricesDaily.date} DESC`)
        .limit(30)
        .all();
      const s = snap[0];
      targets.push({
        key: r.code,
        input: {
          code: r.code,
          name: r.name,
          sectorTse: r.sectorTse,
          snapshot: s
            ? {
                priceJpy: s.priceJpy,
                priceDate: s.priceDate,
                change1dPct: s.change1dPct,
                change1mPct: s.change1mPct,
                change1yPct: s.change1yPct,
                ma25: s.ma25,
                ma75: s.ma75,
                ma200: s.ma200,
                high52w: s.high52w,
                low52w: s.low52w,
                rsi14: s.rsi14,
                creditRatio: s.creditRatio,
              }
            : null,
          recentPrices: prices.reverse(),
        },
      });
    }
    return targets;
  },

  async applyOne(db, key, output) {
    const out = output as Output;
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .innerJoin(stocks, eq(stocks.companyId, companies.id))
      .where(eq(stocks.code, key))
      .limit(1)
      .all();
    if (company.length === 0) throw new Error(`company が見つからない: code=${key}`);
    const companyId = company[0].id;
    const now = new Date().toISOString();
    await db
      .insert(companyAiBrief)
      .values({
        companyId,
        stockTrendAnalysis: out.stockTrendAnalysis,
        stockTrendFactorsJson: JSON.stringify(out.stockTrendFactors),
        technicalComment: out.technicalComment,
        generatedAt: now,
      })
      .onConflictDoUpdate({
        target: companyAiBrief.companyId,
        set: {
          stockTrendAnalysis: out.stockTrendAnalysis,
          stockTrendFactorsJson: JSON.stringify(out.stockTrendFactors),
          technicalComment: out.technicalComment,
          generatedAt: now,
        },
      })
      .run();
  },
};
