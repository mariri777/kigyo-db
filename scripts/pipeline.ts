#!/usr/bin/env tsx
/**
 * 統合データパイプラインの唯一のエントリ。
 *
 * 使い方:
 *   pnpm pipeline daily              # JST 04:00 cron 相当(JPX/Yahoo/EDINET/AI 動意+market-brief + sync)
 *   pnpm pipeline weekly             # 土曜 cron 相当(EDINET 補修 + AI ローテ + sync)
 *   pnpm pipeline monthly            # 月初 cron 相当(valuation + positioning ローテ + sync)
 *   pnpm pipeline sync               # local/ai-generated/ → 本番 D1 反映のみ
 *   pnpm pipeline run <task> [opts]  # 単発タスク実行(デバッグ用)
 *     例: pnpm pipeline run ai-stock-trend --limit 10 --auto
 *         pnpm pipeline run fetch-jpx
 *
 * 共通オプション:
 *   --limit N         対象を先頭 N 件に限定
 *   --codes 7203,9984 銘柄コード明示
 *   --date YYYY-MM-DD 論理日付の上書き(default: 今日 JST)
 *   --auto / --manual AI タスクの実行モード(default: auto)
 */
import { readFileSync } from "node:fs";
import { z } from "zod";

import { getLocalDb } from "./lib/d1-local.js";
import { writeJsonAtomic } from "./lib/lake.js";
import { entriesFor, type Frequency } from "./lib/schedule.js";
import { runTask, type RunSummary } from "./lib/runner.js";
import { syncRemote } from "./lib/sync-remote.js";
import type { PipelineCtx, Target } from "./lib/task.js";
import { ALL_TASKS, getTask } from "./tasks/index.js";

type ParsedArgs = {
  subcommand: "daily" | "weekly" | "monthly" | "sync" | "run" | "ai-apply" | "help";
  taskName?: string;
  limit?: number;
  codes?: string[];
  date?: string;
  auto: boolean;
  manual: boolean;
  file?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const sub = args[0];
  const out: ParsedArgs = {
    subcommand: "help",
    auto: true,
    manual: false,
  };
  if (sub === "daily" || sub === "weekly" || sub === "monthly" || sub === "sync") {
    out.subcommand = sub;
  } else if (sub === "run") {
    out.subcommand = "run";
    out.taskName = args[1];
  } else if (sub === "ai-apply") {
    out.subcommand = "ai-apply";
    out.taskName = args[1];
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") out.limit = Number(args[++i]);
    else if (a.startsWith("--limit=")) out.limit = Number(a.slice("--limit=".length));
    else if (a === "--codes") out.codes = args[++i].split(",");
    else if (a.startsWith("--codes=")) out.codes = a.slice("--codes=".length).split(",");
    else if (a === "--date") out.date = args[++i];
    else if (a.startsWith("--date=")) out.date = a.slice("--date=".length);
    else if (a === "--file") out.file = args[++i];
    else if (a.startsWith("--file=")) out.file = a.slice("--file=".length);
    else if (a === "--auto") {
      out.auto = true;
      out.manual = false;
    } else if (a === "--manual") {
      out.manual = true;
      out.auto = false;
    }
  }
  return out;
}

function todayJst(): string {
  const now = new Date();
  // JST = UTC + 9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function makeCtx(args: ParsedArgs): PipelineCtx {
  return {
    db: getLocalDb(),
    date: args.date ?? todayJst(),
    args: {
      limit: args.limit ?? 0,
      codes: (args.codes ?? []).join(","),
      auto: args.auto,
      manual: args.manual,
    },
  };
}

function printHelp() {
  console.log(`pnpm pipeline <subcommand> [options]

subcommands:
  daily              SCHEDULE の daily エントリを順次実行
  weekly             SCHEDULE の weekly エントリを順次実行
  monthly            SCHEDULE の monthly エントリを順次実行
  sync               local/ai-generated/ → 本番 D1 反映のみ
  run <task>         単発タスク実行(--manual で AI は prepare のみ)
  ai-apply <task>    LLM 出力 JSON を読み込んでローカル D1 + lake に適用
                     pnpm pipeline ai-apply <task> --file <output.json>

options:
  --limit N          対象を先頭 N 件に限定
  --codes 7203,9984  銘柄コード明示
  --date YYYY-MM-DD  論理日付の上書き(default: 今日 JST)
  --auto / --manual  AI タスクの実行モード(default: auto)
  --file <path>      ai-apply で読み込む output.json

利用可能タスク:
${ALL_TASKS.map((t) => `  ${t.name.padEnd(28)} ${t.description}`).join("\n") || "  (まだ登録なし)"}
`);
}

async function runSchedule(frequency: Frequency, args: ParsedArgs): Promise<void> {
  const entries = entriesFor(frequency);
  console.log(`==> ${frequency} schedule (${entries.length} エントリ)`);
  const ctx = makeCtx(args);
  const summaries: RunSummary[] = [];

  for (const e of entries) {
    if (e.task === "sync-remote") {
      await syncRemote();
      continue;
    }
    const task = getTask(e.task);
    const summary = await runTask(task, ctx, {
      limit: args.limit,
      codes: args.codes,
    });
    summaries.push(summary);
  }

  console.log("\n==> summary");
  for (const s of summaries) {
    console.log(
      `  ${s.task.padEnd(28)} selected=${s.selected} ok=${s.succeeded} fail=${s.failed.length} (${s.durationMs}ms)`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.subcommand === "help") {
    printHelp();
    return;
  }

  if (args.subcommand === "sync") {
    await syncRemote();
    return;
  }

  if (args.subcommand === "run") {
    if (!args.taskName) throw new Error("pnpm pipeline run <task> でタスク名を指定してください");
    const task = getTask(args.taskName);
    const ctx = makeCtx(args);
    await runTask(task, ctx, { limit: args.limit, codes: args.codes });
    return;
  }

  if (args.subcommand === "ai-apply") {
    if (!args.taskName) throw new Error("pnpm pipeline ai-apply <task> --file <output.json>");
    if (!args.file) throw new Error("--file <output.json> を指定してください");
    await aiApply(args.taskName, args.file, args);
    return;
  }

  await runSchedule(args.subcommand, args);
}

async function aiApply(taskName: string, file: string, args: ParsedArgs): Promise<void> {
  const task = getTask(taskName);
  if (!task.outputSchema) throw new Error(`${taskName} は ai タスクではありません`);
  const ctx = makeCtx(args);

  const raw = JSON.parse(readFileSync(file, "utf8")) as { results: unknown[] };
  const Envelope = z.object({ results: z.array(z.unknown()).min(1) });
  Envelope.parse(raw);

  console.log(`📥 ${file}: ${raw.results.length} 件`);

  let ok = 0;
  const failed: Array<{ key: string; reason: string }> = [];
  for (let i = 0; i < raw.results.length; i++) {
    const item = raw.results[i] as { code?: string; date?: string };
    const key = String(item.code ?? item.date ?? i);
    try {
      const parsed = task.outputSchema.parse(item);
      const target: Target = { key, input: item };
      if (task.writeLakePath) {
        writeJsonAtomic(task.writeLakePath(target, ctx), {
          task: task.name,
          key,
          generatedAt: new Date().toISOString(),
          output: parsed,
        });
      }
      await task.applyLocal(target, parsed, ctx);
      ok += 1;
      console.log(`  ✅ ${key}`);
    } catch (e) {
      const reason =
        e instanceof z.ZodError
          ? e.issues.map((it) => `${it.path.join(".")}: ${it.message}`).join("; ")
          : (e as Error).message;
      failed.push({ key, reason });
      console.log(`  ❌ ${key}: ${reason}`);
    }
  }

  console.log(`\n📊 ${ok} 成功 / ${failed.length} 失敗 / ${raw.results.length} 件中`);
  if (failed.length > 0 && ok === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
