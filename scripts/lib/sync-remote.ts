/**
 * local/ai-generated/ を walk して本番 D1 に UPSERT。
 *
 * 流れ:
 *   1. AI_GENERATED_ROOT を walk して全 JSON ファイルを集める
 *   2. タスクごとに「Output → SQL UPSERT」ジェネレータを呼ぶ
 *   3. テーブル単位で local/tmp/sync-remote/<table>.sql に書き出す
 *   4. wrangler d1 execute --remote --file=<path> で順次投入
 *
 * 冪等性: SQL は全て INSERT ... ON CONFLICT DO UPDATE。同じファイルを 2 度流しても同じ状態。
 *
 * 差分判定は最初入れない(全 JSON を毎回 UPSERT)。
 * 問題が顕在化したら local/sync-log.sqlite で hash 管理を後追加する。
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";

import { execRemoteFile } from "./d1-remote.js";
import { AI_GENERATED_ROOT, readJson, tmpPath, walkJson } from "./lake.js";
import { ALL_TASKS } from "../tasks/index.js";
import type { Task } from "./task.js";

/** タスクは「出力 → SQL 配列」を返す sqlFor() を実装する */
export type SyncCapable<O = unknown> = Task & {
  /** 1 件の出力を本番 D1 に書く SQL UPSERT 文の配列を返す */
  sqlFor(key: string, output: O): string[];
  /** 反映先テーブル名(同じテーブルへの SQL は同じファイルにまとめる) */
  remoteTable: string;
};

export function isSyncCapable(task: Task): task is SyncCapable {
  return typeof (task as SyncCapable).sqlFor === "function";
}

type LakeFile = { task: string; key: string; output: unknown };

export async function syncRemote(): Promise<void> {
  console.log(`==> sync-remote: ${AI_GENERATED_ROOT} → 本番 D1`);

  const files = walkJson(AI_GENERATED_ROOT);
  console.log(`    対象ファイル: ${files.length} 個`);
  if (files.length === 0) return;

  const taskByName = new Map<string, Task>(ALL_TASKS.map((t) => [t.name, t]));

  // テーブル単位で SQL をまとめる
  const sqlByTable = new Map<string, string[]>();
  let skipped = 0;

  for (const file of files) {
    const rel = relative(AI_GENERATED_ROOT, file);
    let payload: LakeFile;
    try {
      payload = readJson<LakeFile>(file);
    } catch (e) {
      console.warn(`    ! parse 失敗 ${rel}: ${(e as Error).message}`);
      skipped += 1;
      continue;
    }
    const task = taskByName.get(payload.task);
    if (!task || !isSyncCapable(task)) {
      console.warn(`    ! sqlFor 未実装 task=${payload.task} (${rel})`);
      skipped += 1;
      continue;
    }
    const stmts = task.sqlFor(payload.key, payload.output);
    const arr = sqlByTable.get(task.remoteTable) ?? [];
    arr.push(...stmts);
    sqlByTable.set(task.remoteTable, arr);
  }

  if (sqlByTable.size === 0) {
    console.log("    生成された SQL 無し、終了");
    return;
  }

  // tmp/sync-remote/ に書き出し
  const outDir = tmpPath("sync-remote");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const sqlFiles: string[] = [];
  for (const [table, stmts] of sqlByTable) {
    const p = `${outDir}/${table}.sql`;
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, stmts.join("\n") + "\n");
    sqlFiles.push(p);
    console.log(`    ${table}: ${stmts.length} 文 → ${p}`);
  }

  // wrangler 投入
  for (const p of sqlFiles) {
    console.log(`    🚀 wrangler d1 execute --remote --file=${p}`);
    execRemoteFile(p);
  }

  console.log(`==> sync-remote 完了 (skip=${skipped})`);
}
