/**
 * ai-catalysts: 既存 lib/ai-tasks/catalysts.ts を新 Task shape に adapt。
 *
 * 出力先テーブル = events
 *   - upside  → kind=catalyst, direction=up
 *   - downside → kind=risk,     direction=down
 *
 * sqlFor は「既存削除 + 8 件 INSERT」を 1 文ずつ並べる(D1 は statement 単位で execute)。
 */
import { catalystsTask as legacy } from "../../lib/ai-tasks/catalysts.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type CatalystItem = {
  title: string;
  when: string;
  impact: "強" | "中" | "弱";
  note: string;
};

type Output = {
  code: string;
  upside: CatalystItem[];
  downside: CatalystItem[];
};

const catalystsTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "ai-catalysts",
  kind: "ai",
  description: legacy.description,
  outputSchema: legacy.outputSchema,
  outputTemplate: legacy.outputTemplate,
  promptTemplate: legacy.promptTemplate,
  remoteTable: "events",

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
      label: "ai-catalysts",
    });
    if (results.length === 0) throw new Error("LLM 結果空");
    return results[0];
  },

  async runBatch(targets): Promise<Map<string, Output>> {
    const results = runClaudeCli<Output>({
      prompt: legacy.promptTemplate ?? "",
      inputJson: { targets: targets.map((t) => ({ key: t.key, input: t.input })) },
      outputItemSchema: legacy.outputSchema,
      label: "ai-catalysts",
    });
    const m = new Map<string, Output>();
    for (const r of results) {
      const key = (r as { code?: string }).code;
      if (key) m.set(key, r);
    }
    return m;
  },

  validateOutput(output: Output) {
    // upside/downside がそれぞれ最低 3 件は欲しい(空回しの 1 件で済まされない)
    if (!Array.isArray(output.upside) || output.upside.length < 3) {
      return { ok: false, reason: `upside ${output.upside?.length ?? 0} 件 < 3` };
    }
    if (!Array.isArray(output.downside) || output.downside.length < 3) {
      return { ok: false, reason: `downside ${output.downside?.length ?? 0} 件 < 3` };
    }
    if (output.upside.some((c: { title?: string }) => !c.title || c.title.length < 5)) {
      return { ok: false, reason: "upside.title が空または短すぎる" };
    }
    return { ok: true };
  },

  async applyLocal(target, output, ctx) {
    await legacy.applyOne(ctx.db, target.key, output);
  },

  writeLakePath(target, ctx) {
    return aiGeneratedPath("ai-catalysts", ctx.date, target.key);
  },

  sqlFor(key, output): string[] {
    const o = output;
    const now = new Date().toISOString();
    const stmts: string[] = [];

    // 1. 既存 catalyst/risk を削除(scopeRef = company_id を stocks.code から SELECT)
    //    サブクエリで company_id を引いて文字列化
    stmts.push(
      `DELETE FROM ${sqlIdent("events")} WHERE scope = 'company' AND kind IN ('catalyst','risk') AND scope_ref = CAST((SELECT company_id FROM stocks WHERE code = ${sqlLit(key)}) AS TEXT);`,
    );

    // 2. upside 4 件 = kind=catalyst, direction=up
    for (const item of o.upside) {
      stmts.push(
        `INSERT INTO ${sqlIdent("events")} (kind, scope, scope_ref, title, body, occurs_at, impact, direction, source_url, created_at) SELECT 'catalyst', 'company', CAST(s.company_id AS TEXT), ${sqlLit(item.title)}, ${sqlLit(item.note)}, ${sqlLit(item.when)}, ${sqlLit(item.impact)}, 'up', NULL, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)};`,
      );
    }
    // 3. downside 4 件 = kind=risk, direction=down
    for (const item of o.downside) {
      stmts.push(
        `INSERT INTO ${sqlIdent("events")} (kind, scope, scope_ref, title, body, occurs_at, impact, direction, source_url, created_at) SELECT 'risk', 'company', CAST(s.company_id AS TEXT), ${sqlLit(item.title)}, ${sqlLit(item.note)}, ${sqlLit(item.when)}, ${sqlLit(item.impact)}, 'down', NULL, ${sqlLit(now)} FROM stocks s WHERE s.code = ${sqlLit(key)};`,
      );
    }
    return stmts;
  },
};

export { catalystsTask };
