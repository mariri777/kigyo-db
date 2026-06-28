/**
 * 全タスクのレジストリ。pipeline.ts と sync-remote.ts から参照される。
 *
 * 新タスク追加は import 1 行 + 配列に 1 行追加するだけ。
 */
import type { Task } from "../lib/task.js";

// fetch
import { jpxSyncTask } from "./fetch/jpx-sync.js";
import { yahooSnapshotTask } from "./fetch/yahoo-snapshot.js";
import { marketIndicesTask } from "./fetch/market-indices.js";
import { edinetPipelineTask } from "./fetch/edinet-pipeline.js";

// derive
import { derivedHighlightsTask } from "./derive/highlights.js";

// ai
import { stockTrendTask } from "./ai/stock-trend.js";
import { valuationTask } from "./ai/valuation.js";
import { positioningTask } from "./ai/positioning.js";
import { marketBriefTask } from "./ai/market-brief.js";
import { catalystsTask } from "./ai/catalysts.js";
import { summaryTask } from "./ai/summary.js";
import { logoColorTask } from "./ai/logo-color.js";
import { forecastTask } from "./ai/forecast.js";

export const ALL_TASKS: Task[] = [
  jpxSyncTask as Task,
  yahooSnapshotTask as Task,
  marketIndicesTask as Task,
  edinetPipelineTask as Task,
  derivedHighlightsTask as Task,
  stockTrendTask as Task,
  valuationTask as Task,
  positioningTask as Task,
  marketBriefTask as Task,
  catalystsTask as Task,
  summaryTask as Task,
  logoColorTask as Task,
  forecastTask as Task,
];

export function getTask(name: string): Task {
  const t = ALL_TASKS.find((x) => x.name === name);
  if (!t) {
    const known = ALL_TASKS.map((x) => x.name).join(", ") || "(まだ無し)";
    throw new Error(`未知のタスク "${name}"。利用可能: ${known}`);
  }
  return t;
}
