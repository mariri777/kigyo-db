/**
 * ai-positioning: 既存 lib/ai-tasks/positioning.ts を新 Task shape に adapt。
 */
import { positioningTask as legacy } from "../../lib/ai-tasks/positioning.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Output = {
  code: string;
  positioningHeadline: string;
  positioningAnalysis: string;
  positioningStrengths: Array<{ title: string; detail: string }>;
  positioningChallenges: Array<{ title: string; detail: string }>;
};

const positioningTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-positioning",
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
      label: "ai-positioning",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-positioning",
    });
    const m = new Map<string, Output>();
    for (const r of results) {
      const key = (r as { code?: string }).code;
      if (key) m.set(key, r);
    }
    return m;
  },

  validateOutput(output) {
    const o = output as Output;
    if (!o.positioningHeadline || o.positioningHeadline.length < 10) {
      return { ok: false, reason: "positioningHeadline 短すぎ" };
    }
    if (!o.positioningAnalysis || o.positioningAnalysis.length < 80) {
      return { ok: false, reason: "positioningAnalysis 短すぎ" };
    }
    if (
      !Array.isArray(o.positioningStrengths) ||
      o.positioningStrengths.length < 2
    ) {
      return { ok: false, reason: "positioningStrengths < 2" };
    }
    return { ok: true };
  },

  async applyLocal(target, output, ctx) {
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    return aiGeneratedPath("ai-positioning", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    return [
      `INSERT INTO ${sqlIdent("company_ai_brief")} (company_id, positioning_headline, positioning_analysis, positioning_strengths_json, positioning_challenges_json, generated_at) SELECT s.company_id, ${sqlLit(o.positioningHeadline)}, ${sqlLit(o.positioningAnalysis)}, ${sqlLit(JSON.stringify(o.positioningStrengths))}, ${sqlLit(JSON.stringify(o.positioningChallenges))}, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)} ON CONFLICT(company_id) DO UPDATE SET positioning_headline = excluded.positioning_headline, positioning_analysis = excluded.positioning_analysis, positioning_strengths_json = excluded.positioning_strengths_json, positioning_challenges_json = excluded.positioning_challenges_json, generated_at = excluded.generated_at;`,
    ];
  },
};

export { positioningTask };
