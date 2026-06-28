/**
 * タスク実行ループ。
 *
 * task.selectTargets() → 各 target について run → applyLocal (+ ai は writeLake) を
 * 順次実行する。1 target が失敗しても他は継続。最後にレポート。
 *
 * AI タスクの run/applyLocal は ai-runner.ts に委譲(--auto / --manual の切替が入るため)。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ZodError } from "zod";

import { LOCAL_ROOT, writeJsonAtomic } from "./lake.js";
import type { PipelineCtx, Task, TaskRunOptions } from "./task.js";

function formatError(e: unknown): string {
  if (e instanceof ZodError) {
    return e.issues.map((it) => `${it.path.join(".")}: ${it.message}`).join("; ");
  }
  return (e as Error).message ?? String(e);
}

/** manual モードで AI タスクの入力 JSON を吐き出して exit させる(ユーザー手動 LLM ループ用) */
function writeManualPrepare<I>(
  task: Task<I, unknown>,
  targets: Array<{ key: string; input: I }>,
  date: string,
): string {
  const ts = date.replace(/-/g, "") + "-" + new Date().toISOString().slice(11, 16).replace(":", "");
  const outDir = join(LOCAL_ROOT, "tmp/ai-brief");
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, `${task.name}-${ts}.input.json`);
  const payload = {
    task: task.name,
    generatedAt: new Date().toISOString(),
    prompt: task.promptTemplate ?? "",
    outputTemplate: task.outputTemplate ?? null,
    targets,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

export type RunSummary = {
  task: string;
  selected: number;
  succeeded: number;
  skipped: number;
  failed: Array<{ key: string; reason: string }>;
  durationMs: number;
  /** health-check が ok=false で終わった場合 true(後段の sync を止めるため使う) */
  unhealthy?: boolean;
};

export async function runTask<I, O>(
  task: Task<I, O>,
  ctx: PipelineCtx,
  opts: TaskRunOptions = {},
): Promise<RunSummary> {
  const startedAt = Date.now();
  console.log(`\n=== task: ${task.name} (${task.kind}) ===`);
  console.log(`    ${task.description}`);

  const targets = await task.selectTargets(ctx, opts);
  console.log(`    target: ${targets.length} 件${opts.limit ? ` (limit ${opts.limit})` : ""}`);

  if (targets.length === 0) {
    return {
      task: task.name,
      selected: 0,
      succeeded: 0,
      skipped: 0,
      failed: [],
      durationMs: Date.now() - startedAt,
    };
  }

  // AI タスク + --manual のときは入力 JSON を吐いて終了
  if (task.kind === "ai" && ctx.args.manual === true) {
    const path = writeManualPrepare(task, targets, ctx.date);
    console.log(`    📝 manual prepare: ${path}`);
    console.log(`    → LLM 推論結果を ${path.replace(".input.json", ".output.json")} に保存して`);
    console.log(`    → pnpm pipeline ai-apply ${task.name} --file ${path.replace(".input.json", ".output.json")}`);
    return {
      task: task.name,
      selected: targets.length,
      succeeded: 0,
      skipped: targets.length,
      failed: [],
      durationMs: Date.now() - startedAt,
    };
  }

  let succeeded = 0;
  const skipped = 0;
  const failed: Array<{ key: string; reason: string }> = [];

  // batch 実装があれば優先(AI バッチ等)
  const outputs = new Map<string, O>();
  if (task.runBatch) {
    try {
      const m = await task.runBatch(targets, ctx);
      for (const [k, v] of m) outputs.set(k, v);
      // batch で返ってこなかった key は失敗扱い
      for (const t of targets) {
        if (!outputs.has(t.key)) {
          failed.push({ key: t.key, reason: "runBatch から戻り値が返らなかった" });
        }
      }
    } catch (e) {
      // batch 全体が失敗 → 個別 run にフォールバック
      console.warn(`    ! runBatch 失敗、個別 run にフォールバック: ${(e as Error).message}`);
      for (const t of targets) {
        try {
          outputs.set(t.key, await task.run(t, ctx));
        } catch (e2) {
          failed.push({ key: t.key, reason: formatError(e2) });
        }
      }
    }
  } else {
    for (const t of targets) {
      try {
        outputs.set(t.key, await task.run(t, ctx));
      } catch (e) {
        failed.push({ key: t.key, reason: formatError(e) });
      }
    }
  }

  // applyLocal + writeLake は逐次
  for (const t of targets) {
    const output = outputs.get(t.key);
    if (output === undefined) continue;
    // タスクの validateOutput で「中身が本当に成功と呼べるか」確認(再発防止)
    if (task.validateOutput) {
      const v = task.validateOutput(output, t);
      if (!v.ok) {
        failed.push({ key: t.key, reason: `validate: ${v.reason}` });
        process.stdout.write(`    ✗ ${t.key} (validate): ${v.reason}\n`);
        continue;
      }
    }
    try {
      if (task.writeLakePath) {
        const path = task.writeLakePath(t, ctx);
        writeJsonAtomic(path, {
          task: task.name,
          key: t.key,
          generatedAt: new Date().toISOString(),
          output,
        });
      }
      await task.applyLocal(t, output, ctx);
      succeeded += 1;
      process.stdout.write(`    ✓ ${t.key}\n`);
    } catch (e) {
      failed.push({ key: t.key, reason: formatError(e) });
      process.stdout.write(`    ✗ ${t.key} (apply): ${formatError(e)}\n`);
    }
  }

  const durationMs = Date.now() - startedAt;
  console.log(`    ✅ ${succeeded} 成功 / ${skipped} skip / ${failed.length} 失敗 (${durationMs}ms)`);

  // 事後 health-check。タスクが「N% 以上は埋まっているはず」等を判定する。
  let unhealthy = false;
  if (task.healthCheck) {
    try {
      const hc = await task.healthCheck(ctx);
      for (const m of hc.metrics) console.log(`    🩺 ${m}`);
      if (hc.warnings) for (const w of hc.warnings) console.warn(`    ⚠ ${w}`);
      if (!hc.ok) {
        unhealthy = true;
        for (const r of hc.reasons ?? []) console.error(`    🚨 ${r}`);
        console.error(
          `    ❌ ${task.name} health-check FAILED ─ 後段の sync を止めるべき`,
        );
      }
    } catch (e) {
      unhealthy = true;
      console.error(`    🚨 health-check 自体が例外: ${formatError(e)}`);
    }
  }

  return {
    task: task.name,
    selected: targets.length,
    succeeded,
    skipped,
    failed,
    durationMs,
    unhealthy,
  };
}
