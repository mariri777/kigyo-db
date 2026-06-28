/**
 * ai-logo-color: 既存 lib/ai-tasks/logo-color.ts を新 Task shape に adapt。
 * companies.logo_color を AI で推定して埋める。
 */
import { logoColorTask as legacy } from "../../lib/ai-tasks/logo-color.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Output = {
  code: string;
  logoColor: string;
};

const logoColorTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-logo-color",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "companies",

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
      label: "ai-logo-color",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-logo-color",
    });
    const m = new Map<string, Output>();
    for (const r of results) {
      const key = (r as { code?: string }).code;
      if (key) m.set(key, r);
    }
    return m;
  },

  validateOutput(output) {
    // #RRGGBB の形式を最低限チェック
    if (!output.logoColor || !/^#[0-9A-Fa-f]{6}$/.test(output.logoColor)) {
      return { ok: false, reason: `logoColor 形式不正: ${output.logoColor}` };
    }
    return { ok: true };
  },

  async applyLocal(target, output, ctx) {
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    return aiGeneratedPath("ai-logo-color", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    return [
      `UPDATE ${sqlIdent("companies")} SET ${sqlIdent("logo_color")} = ${sqlLit(o.logoColor)}, ${sqlIdent("updated_at")} = ${sqlLit(now)} WHERE id = (SELECT company_id FROM stocks WHERE code = ${sqlLit(key)});`,
    ];
  },
};

export { logoColorTask };
