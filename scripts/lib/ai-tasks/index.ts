// AI 生成タスクのレジストリと共通インターフェース。
//
// 1 タスク = 1 ファイル。各ファイルが Task を export する。
// 新しい AI 出力(例: ESG コメント、決算サプライズ要約)を増やすときは
// scripts/lib/ai-tasks/<name>.ts を 1 つ追加して registry に登録するだけ。

import type { z, ZodTypeAny } from "zod";

import type { LocalDb } from "../local-db.js";

/** prepare が書き出す .input.json の上位構造。 */
export type PreparedFile<TargetInput, OutputItem extends { code?: string }> = {
  task: string;
  generatedAt: string;
  prompt: string;
  /** 出力 JSON はこのスキーマに準拠していなければ apply 時に reject される */
  outputSchemaName: string;
  outputJsonSchema: unknown;
  targets: Array<{ key: string; input: TargetInput }>;
  /** 出力テンプレ(キーだけ並んだひな形)。コピペで作業しやすく。 */
  outputTemplate: { results: Partial<OutputItem>[] };
};

/**
 * 1 タスクの定義。型は input/output で 2 つだけ持ち、apply 側で zod で検証する。
 */
export type Task<TInput = unknown, TOutput = unknown> = {
  /** "stock-trend" 等。pnpm 引数で使う識別子。 */
  name: string;
  /** ユーザー向けの 1 行説明。prepare 出力の冒頭に出す。 */
  description: string;
  /**
   * 未生成 or 古い対象 N 件を返す。各要素は (key, input) の組。
   * key は output JSON で同定するための一意なキー(銘柄なら "7203")。
   *
   * limit が undefined のときは「全対象」を返してよい(market-brief のように単一行のとき)。
   */
  selectTargets: (
    db: LocalDb,
    limit: number | undefined,
  ) => Promise<Array<{ key: string; input: TInput }>>;
  /** prompt の先頭に貼るシステム指示。出力スキーマも文字で説明する。 */
  promptTemplate: string;
  /** zod スキーマ(results 配列の各要素)。 */
  outputSchema: ZodTypeAny;
  /** スキーマの human-readable な名前(stock-trend-output 等)。 */
  outputSchemaName: string;
  /** output template(キーだけ並べたひな形)。 */
  outputTemplate: TOutput;
  /**
   * 検証済みの output を 1 件ずつ受け取って DB に UPSERT する。
   * 失敗(対象行が無い等)は throw すれば apply が当該銘柄だけスキップして次に進む。
   */
  applyOne: (
    db: LocalDb,
    key: string,
    output: z.infer<Task<TInput, TOutput>["outputSchema"]>,
  ) => Promise<void>;
};

// ──────────────────────────────────────────────────
// レジストリ
// ──────────────────────────────────────────────────

import { stockTrendTask } from "./stock-trend.js";
import { valuationTask } from "./valuation.js";
import { positioningTask } from "./positioning.js";
import { marketBriefTask } from "./market-brief.js";
import { catalystsTask } from "./catalysts.js";
import { summaryTask } from "./summary.js";
import { logoColorTask } from "./logo-color.js";

export const TASKS: Record<string, Task> = {
  [stockTrendTask.name]: stockTrendTask as Task,
  [valuationTask.name]: valuationTask as Task,
  [positioningTask.name]: positioningTask as Task,
  [marketBriefTask.name]: marketBriefTask as Task,
  [catalystsTask.name]: catalystsTask as Task,
  [summaryTask.name]: summaryTask as Task,
  [logoColorTask.name]: logoColorTask as Task,
};

export function getTask(name: string): Task {
  const t = TASKS[name];
  if (!t) {
    const known = Object.keys(TASKS).join(", ");
    throw new Error(`未知のタスク "${name}"。利用可能: ${known}`);
  }
  return t;
}
