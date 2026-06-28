/**
 * ai-summary: 既存 lib/ai-tasks/summary.ts を新 Task shape に adapt。
 * 詳細は ai/valuation.ts のコメント参照。
 */
import { summaryTask as legacy } from "../../lib/ai-tasks/summary.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Output = {
  code: string;
  summary: string;
};

const summaryTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-summary",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "company_ai_brief",

  async selectTargets(ctx: PipelineCtx, opts) {
    const legacyTargets = await legacy.selectTargets(ctx.db, opts.limit);
    return legacyTargets as Target<unknown>[];
  },

  async run(target): Promise<Output> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: [{ key: target.key, input: target.input }] },
      outputItemSchema: legacy.outputSchema,
      label: "ai-summary",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-summary",
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
    return aiGeneratedPath("ai-summary", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    return [
      `INSERT INTO ${sqlIdent("company_ai_brief")} (company_id, summary, generated_at) SELECT s.company_id, ${sqlLit(o.summary)}, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)} ON CONFLICT(company_id) DO UPDATE SET summary = excluded.summary, generated_at = excluded.generated_at;`,
    ];
  },
};

export { summaryTask };
