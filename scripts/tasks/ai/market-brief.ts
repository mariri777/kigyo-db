/**
 * ai-market-brief: 既存 lib/ai-tasks/market-brief.ts を新 Task shape に adapt。
 * 1 日 1 行のシングルトン。target.key = YYYY-MM-DD。
 */
import { marketBriefTask as legacy } from "../../lib/ai-tasks/market-brief.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Output = {
  date: string;
  lede: string;
  bullets: string[];
  watchThemes: Array<{ name: string; changePct: number }>;
  indices: Array<{ name: string; value: number; changePct: number }>;
};

const marketBriefTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-market-brief",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "market_brief",

  async selectTargets(ctx: PipelineCtx, opts) {
    const legacyTargets = await legacy.selectTargets(ctx.db, opts.limit);
    return legacyTargets as Target<unknown>[];
  },

  async run(target): Promise<Output> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: [{ key: target.key, input: target.input }] },
      outputItemSchema: legacy.outputSchema,
      label: "ai-market-brief",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async applyLocal(target, output, ctx) {
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    // market-brief は 1 日 1 ファイル: local/ai-generated/ai-market-brief/YYYY/MM/DD.json
    return aiGeneratedPath("ai-market-brief", ctx.date, "_daily");
  },

  sqlFor(_key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    return [
      `INSERT INTO ${sqlIdent("market_brief")} (date, lede, bullets_json, watch_themes_json, indices_json, generated_at) VALUES (${sqlLit(o.date)}, ${sqlLit(o.lede)}, ${sqlLit(JSON.stringify(o.bullets))}, ${sqlLit(JSON.stringify(o.watchThemes))}, ${sqlLit(JSON.stringify(o.indices))}, ${sqlLit(now)}) ON CONFLICT(date) DO UPDATE SET lede = excluded.lede, bullets_json = excluded.bullets_json, watch_themes_json = excluded.watch_themes_json, indices_json = excluded.indices_json, generated_at = excluded.generated_at;`,
    ];
  },
};

export { marketBriefTask };
