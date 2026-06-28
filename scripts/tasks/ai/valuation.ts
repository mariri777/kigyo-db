/**
 * ai-valuation: 既存 lib/ai-tasks/valuation.ts を新 Task shape に adapt。
 * 詳細は ai/stock-trend.ts のコメント参照。
 */
import { valuationTask as legacy } from "../../lib/ai-tasks/valuation.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Output = {
  code: string;
  valuationVerdict: "割安" | "ほぼ妥当" | "やや割高" | "割高";
  valuationScore: number;
  valuationRationale: string;
};

const valuationTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-valuation",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "company_ai_brief",

  async selectTargets(ctx: PipelineCtx, opts) {
    if (opts.codes && opts.codes.length > 0) {
      const wanted = new Set(opts.codes);
      const all = await legacy.selectTargets(ctx.db, 9999);
      return all.filter((t) => wanted.has(t.key)) as Target<unknown>[];
    }
    const legacyTargets = await legacy.selectTargets(ctx.db, opts.limit);
    return legacyTargets as Target<unknown>[];
  },

  async run(target): Promise<Output> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: [{ key: target.key, input: target.input }] },
      outputItemSchema: legacy.outputSchema,
      label: "ai-valuation",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-valuation",
    });
    const m = new Map<string, Output>();
    for (const r of results) {
      const key = (r as { code?: string }).code;
      if (key) m.set(key, r);
    }
    return m;
  },

  async applyLocal(target, output, ctx) {
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    return aiGeneratedPath("ai-valuation", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    return [
      `INSERT INTO ${sqlIdent("company_ai_brief")} (company_id, valuation_rationale, generated_at) SELECT s.company_id, ${sqlLit(o.valuationRationale)}, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)} ON CONFLICT(company_id) DO UPDATE SET valuation_rationale = excluded.valuation_rationale, generated_at = excluded.generated_at;`,
      `UPDATE ${sqlIdent("stock_snapshot")} SET valuation_verdict = ${sqlLit(o.valuationVerdict)}, valuation_score = ${sqlLit(o.valuationScore)}, updated_at = ${sqlLit(now)} WHERE code = ${sqlLit(key)};`,
    ];
  },
};

export { valuationTask };
