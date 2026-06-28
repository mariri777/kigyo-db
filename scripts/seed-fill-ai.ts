#!/usr/bin/env tsx
/**
 * 主要銘柄 (JPX プライム上場) を対象に AI 推論タスクを一括実行し、
 * 結果を scripts/seed/snapshots/ に書き出すワンショットコマンド。
 *
 *   pnpm seed:fill-ai                                    # プライム全件 × 全 AI タスク
 *   pnpm seed:fill-ai --limit 10                         # プライム先頭 10 件
 *   pnpm seed:fill-ai --codes 7203,9984                  # コード直接指定
 *   pnpm seed:fill-ai --tasks ai-summary,ai-valuation    # 一部タスクのみ
 *   pnpm seed:fill-ai --skip-snapshot                    # snapshot 書き出しを省略
 *   pnpm seed:fill-ai --yes                              # コスト確認を skip
 *
 * 設計:
 *   - 各 AI タスクは scripts/lib/runner.ts の runTask に任せる(1 件失敗で次へ継続)
 *   - market-brief は date ベースなので --codes を渡さず単独実行
 *   - 全タスクの succeeded 合計が 0 のときのみ snapshot 書き出しを skip
 *     (全 NULL を snapshot に焼き付ける事故防止)
 *   - 失敗銘柄リストを local/tmp/seed-fill-ai-failed.json に書く
 *   - 本番反映は別ターン: pnpm db:restore → pnpm tsx scripts/dump-tables-to-remote.ts ...
 */
import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { runSnapshot } from "./db-snapshot.js";
import { getLocalDb } from "./lib/d1-local.js";
import { getLocalSqlite } from "./lib/local-db.js";
import { tmpPath } from "./lib/lake.js";
import { runTask, type RunSummary } from "./lib/runner.js";
import { getTask } from "./tasks/index.js";
import type { PipelineCtx } from "./lib/task.js";

// AI タスク実行順 (依存無しだが「失敗時に最も惜しいものを先に」優先順)。
// market-brief は date ベースで --codes を取らないので最後に単独実行。
const TASK_ORDER = [
  "ai-summary",
  "ai-logo-color",
  "ai-stock-trend",
  "ai-valuation",
  "ai-catalysts",
  "ai-positioning",
  "ai-forecast",
  "ai-market-brief",
] as const;

// snapshot 書き出し対象 (AI 推論で更新される/関連するテーブル)。
const SNAPSHOT_TABLES = [
  "company_ai_brief",
  "stock_snapshot",
  "predictions",
  "market_brief",
  "story_decks",
  "story_slides",
];

type Args = {
  limit?: number;
  codes?: string[];
  tasks: string[];
  skipSnapshot: boolean;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const a = argv.slice(2);
  const out: Args = {
    tasks: [...TASK_ORDER],
    skipSnapshot: false,
    yes: false,
  };
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x === "--limit") out.limit = Number(a[++i]);
    else if (x.startsWith("--limit=")) out.limit = Number(x.slice("--limit=".length));
    else if (x === "--codes") out.codes = a[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (x.startsWith("--codes=")) {
      out.codes = x.slice("--codes=".length).split(",").map((s) => s.trim()).filter(Boolean);
    } else if (x === "--tasks") out.tasks = a[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (x.startsWith("--tasks=")) {
      out.tasks = x.slice("--tasks=".length).split(",").map((s) => s.trim()).filter(Boolean);
    } else if (x === "--skip-snapshot") out.skipSnapshot = true;
    else if (x === "--yes" || x === "-y") out.yes = true;
    else if (x === "--help" || x === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`未知の引数: ${x}`);
      printHelp();
      process.exit(1);
    }
  }
  // 未知のタスク名チェック
  const unknown = out.tasks.filter((t) => !TASK_ORDER.includes(t as (typeof TASK_ORDER)[number]));
  if (unknown.length > 0) {
    console.error(`未知のタスク: ${unknown.join(",")}. 利用可能: ${TASK_ORDER.join(",")}`);
    process.exit(1);
  }
  return out;
}

function printHelp(): void {
  console.log(`pnpm seed:fill-ai [options]

JPX プライム上場銘柄に AI 推論タスクを一括実行し、scripts/seed/snapshots/ に書き出す。

options:
  --limit N              プライム先頭 N 件 (default: 全件 ≈1,600)
  --codes 7203,9984      コード直接指定 (--limit より優先)
  --tasks ai-summary,…   一部タスクのみ (default: 全 8 タスク)
  --skip-snapshot        snapshot 書き出しを省略
  --yes / -y             コスト確認プロンプトを skip

タスク順序: ${TASK_ORDER.join(" → ")}

検証手順 (memory: ai-task-codes-pitfall):
  1. pnpm seed:fill-ai --codes 7203 --tasks ai-summary --skip-snapshot --yes
  2. pnpm seed:fill-ai --codes 7203 --skip-snapshot --yes
  3. pnpm seed:fill-ai --limit 10 --skip-snapshot --yes
  4. pnpm seed:fill-ai --limit 10 --yes
  5. pnpm seed:fill-ai
`);
}

/**
 * プライム上場銘柄のコードを取得 (ORDER BY code、--limit で先頭から)。
 */
function getPrimeCodes(limit?: number): string[] {
  const db = getLocalSqlite();
  const sql = limit && limit > 0
    ? `SELECT code FROM stocks WHERE exchange = 'Prime' ORDER BY code LIMIT ?`
    : `SELECT code FROM stocks WHERE exchange = 'Prime' ORDER BY code`;
  const rows = (limit && limit > 0
    ? db.prepare(sql).all(limit)
    : db.prepare(sql).all()) as { code: string }[];
  return rows.map((r) => r.code);
}

/**
 * Claude CLI 呼び出し回数とおおよその所要時間を見積もる。
 * バッチサイズ 10、1 呼び出し平均 60 秒の素朴な計算。
 * market-brief は銘柄非依存なので 1 回固定。
 */
function estimateCost(codes: string[], tasks: string[]): { calls: number; etaMin: number } {
  const BATCH = 10;
  const SEC_PER_CALL = 60;
  let calls = 0;
  for (const t of tasks) {
    if (t === "ai-market-brief") calls += 1;
    else calls += Math.ceil(codes.length / BATCH);
  }
  const etaMin = Math.ceil((calls * SEC_PER_CALL) / 60);
  return { calls, etaMin };
}

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (ans) => {
      rl.close();
      resolve(/^y(es)?$/i.test(ans.trim()));
    });
  });
}

function todayJst(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function makeCtx(): PipelineCtx {
  return {
    db: getLocalDb(),
    date: todayJst(),
    args: { limit: 0, codes: "", auto: true, manual: false },
  };
}

function writeFailedJson(failures: Array<{ task: string; key: string; reason: string }>): string {
  const path = tmpPath("seed-fill-ai-failed.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: failures.length,
        failures,
      },
      null,
      2,
    ),
  );
  return path;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  // 対象コード決定: --codes 明示 > プライム上場 (+--limit)
  const codes = args.codes && args.codes.length > 0
    ? args.codes
    : getPrimeCodes(args.limit);

  if (codes.length === 0 && args.tasks.some((t) => t !== "ai-market-brief")) {
    console.error("対象銘柄が 0 件。stocks テーブルが空、または --codes が空。");
    process.exit(1);
  }

  console.log(`\n==> seed:fill-ai`);
  console.log(`    対象銘柄: ${codes.length} 件${args.limit ? ` (--limit ${args.limit})` : ""}`);
  console.log(`    タスク: ${args.tasks.join(", ")}`);

  const { calls, etaMin } = estimateCost(codes, args.tasks);
  console.log(`    推定 Claude CLI 呼び出し: ${calls} 回、所要時間目安: ${etaMin} 分\n`);

  if (!args.yes) {
    const ok = await confirm("続行しますか? (y/N): ");
    if (!ok) {
      console.log("中止しました。");
      return;
    }
  }

  const ctx = makeCtx();
  const summaries: RunSummary[] = [];
  const allFailures: Array<{ task: string; key: string; reason: string }> = [];

  for (const taskName of args.tasks) {
    const task = getTask(taskName);
    const opts = taskName === "ai-market-brief"
      ? {} // date ベース。codes 不要
      : { codes };
    const summary = await runTask(task, ctx, opts);
    summaries.push(summary);
    for (const f of summary.failed) {
      allFailures.push({ task: taskName, key: f.key, reason: f.reason });
    }
  }

  // サマリ
  console.log(`\n==> summary`);
  let totalSucceeded = 0;
  for (const s of summaries) {
    const flag = s.unhealthy ? " 🚨UNHEALTHY" : "";
    console.log(
      `  ${s.task.padEnd(28)} selected=${s.selected} ok=${s.succeeded} fail=${s.failed.length} (${s.durationMs}ms)${flag}`,
    );
    totalSucceeded += s.succeeded;
  }

  // 失敗ログ
  if (allFailures.length > 0) {
    const path = writeFailedJson(allFailures);
    console.log(`\n  📝 失敗 ${allFailures.length} 件を ${path} に保存`);
  }

  // snapshot 書き出し
  if (args.skipSnapshot) {
    console.log(`\n  ⏭ --skip-snapshot 指定のため snapshot 書き出しを skip`);
  } else if (totalSucceeded === 0) {
    console.error(`\n  ❌ 全タスクの succeeded=0。snapshot 書き出しを skip (空 snapshot 焼き付け防止)`);
    process.exit(1);
  } else {
    console.log(`\n==> snapshot 書き出し`);
    await runSnapshot(SNAPSHOT_TABLES);
    console.log(`\n  次のステップ:`);
    console.log(`    git diff scripts/seed/snapshots/`);
    console.log(`    pnpm db:restore                                              # 確認後の復元`);
    console.log(`    pnpm tsx scripts/dump-tables-to-remote.ts ${SNAPSHOT_TABLES.join(" ")}  # 本番反映`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
