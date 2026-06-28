/**
 * ai-stock-trend: 既存 scripts/lib/ai-tasks/stock-trend.ts を新 Task shape に adapt。
 *
 * 違いは「対象選定が selector 経由(movers / rotation / all)になる」ことだけ。
 * 既存の prompt / outputSchema / applyOne ロジックはそのまま使う。
 */
import { eq } from "drizzle-orm";

import {
  companies,
  companyAiBrief,
  stockPricesDaily,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import { stockTrendTask as legacy } from "../../lib/ai-tasks/stock-trend.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { selectStockCodes } from "../../lib/selectors.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

// 入力型(legacy と同じ)
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

// 出力型(legacy.outputSchema の構造に合わせる)
type Output = {
  code: string;
  stockTrendAnalysis: string;
  stockTrendFactors: Array<{ label: string; value: string; note: string }>;
  technicalComment: string;
};

const stockTrendTask: Task<Input, Output> & SyncCapable<Output> = {
  name: "ai-stock-trend",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "company_ai_brief",

  async selectTargets(ctx: PipelineCtx, opts): Promise<Target<Input>[]> {
    // selector 系: ctx.args.codes / limit が指定されていればそれを優先、
    // なければ legacy.selectTargets を使う
    const codes = opts.codes ?? [];
    let targetCodes: string[];
    if (codes.length > 0) {
      targetCodes = codes;
    } else if ((ctx.args.selector ?? "") === "movers") {
      targetCodes = await selectStockCodes(ctx, "movers", {
        threshold: Number(ctx.args.threshold ?? 5),
        limit: opts.limit,
      });
    } else if ((ctx.args.selector ?? "") === "rotation") {
      targetCodes = await selectStockCodes(ctx, "rotation", {
        slice: Number(ctx.args.slice ?? 8),
        limit: opts.limit,
      });
    } else {
      // 未生成のもの優先(legacy のロジックを利用)
      const legacyTargets = await legacy.selectTargets(ctx.db, opts.limit);
      return legacyTargets as Target<Input>[];
    }
    // targetCodes だけ legacy の input 構築ロジックを部分的に呼ぶ
    return await buildInputsForCodes(ctx, targetCodes);
  },

  async run(target: Target<Input>): Promise<Output> {
    // 1 件単独実行(runBatch がメイン)
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: [{ key: target.key, input: target.input }] },
      outputItemSchema: legacy.outputSchema,
      label: "ai-stock-trend",
    });
    if (results.length === 0) throw new Error("LLM が結果を返さなかった");
    return results[0];
  },

  async runBatch(targets, _ctx): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-stock-trend",
    });
    const out = new Map<string, Output>();
    for (const r of results) {
      const key = (r as { code?: string }).code;
      if (key) out.set(key, r);
    }
    return out;
  },

  async applyLocal(target, output, ctx) {
    // legacy.applyOne を再利用
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    return aiGeneratedPath("ai-stock-trend", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    // company_ai_brief への UPSERT。company_id は本番側で SELECT する必要があるが、
    // 本番 D1 にも companies.code → companyId の対応があるので INSERT INTO ... SELECT 形にする
    const now = new Date().toISOString();
    return [
      `INSERT INTO ${sqlIdent("company_ai_brief")} (company_id, stock_trend_analysis, stock_trend_factors_json, technical_comment, generated_at) SELECT s.company_id, ${sqlLit(o.stockTrendAnalysis)}, ${sqlLit(JSON.stringify(o.stockTrendFactors))}, ${sqlLit(o.technicalComment)}, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)} ON CONFLICT(company_id) DO UPDATE SET stock_trend_analysis = excluded.stock_trend_analysis, stock_trend_factors_json = excluded.stock_trend_factors_json, technical_comment = excluded.technical_comment, generated_at = excluded.generated_at;`,
    ];
  },
};

// codes が与えられたときに、legacy.selectTargets と同じ shape の input を組み立てる
async function buildInputsForCodes(
  ctx: PipelineCtx,
  codes: string[],
): Promise<Target<Input>[]> {
  const out: Target<Input>[] = [];
  for (const code of codes) {
    const baseRows = await ctx.db
      .select({
        code: stocks.code,
        name: companies.name,
        sectorTse: stocks.sectorTse,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .where(eq(stocks.code, code))
      .limit(1)
      .all();
    if (baseRows.length === 0) continue;
    const r = baseRows[0];
    const snap = await ctx.db
      .select()
      .from(stockSnapshot)
      .where(eq(stockSnapshot.code, code))
      .limit(1)
      .all();
    const prices = await ctx.db
      .select({
        date: stockPricesDaily.date,
        close: stockPricesDaily.close,
        volume: stockPricesDaily.volume,
      })
      .from(stockPricesDaily)
      .where(eq(stockPricesDaily.code, code))
      .all();
    const s = snap[0];
    out.push({
      key: code,
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
        recentPrices: prices.sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  }
  void companyAiBrief;
  return out;
}

export { stockTrendTask };
