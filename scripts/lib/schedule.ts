/**
 * パイプラインのスケジュール宣言。
 *
 * pnpm pipeline daily/weekly/monthly はここを参照して順次実行する。
 * 新タスク追加は SCHEDULE に 1 行足すだけ。
 *
 * 設計:
 *   - frequency = "daily" | "weekly" | "monthly"
 *   - selector + params で対象選定方法を指定(scripts/lib/selectors.ts に対応)
 *   - 並び順に実行(依存順を表現)
 */
import type { SelectorKind, SelectorParams } from "./selectors.js";

export type Frequency = "daily" | "weekly" | "monthly";

export type ScheduleEntry = {
  task: string;
  frequency: Frequency;
  selector?: SelectorKind;
  params?: SelectorParams & Record<string, unknown>;
  /** このエントリだけスキップしたいとき(本番停止用) */
  enabled?: boolean;
};

export const SCHEDULE: ScheduleEntry[] = [
  // ─── 日次(JST 04:00) ─────────────────────────────────────
  // データ取得 → AI 生成 → 本番反映
  { task: "fetch-jpx", frequency: "daily" },
  { task: "fetch-yahoo-snapshot", frequency: "daily", selector: "all" },
  { task: "edinet-pipeline", frequency: "daily" },
  {
    task: "ai-stock-trend",
    frequency: "daily",
    selector: "movers",
    params: { threshold: 5 },
  },
  { task: "ai-market-brief", frequency: "daily" },
  { task: "sync-remote", frequency: "daily" },

  // ─── 週次(土曜 JST 06:00) ─────────────────────────────────
  // EDINET 補修 + stock-trend のローテーション 1/4
  {
    task: "edinet-pipeline",
    frequency: "weekly",
    params: { backfill: 8 },
  },
  {
    task: "ai-stock-trend",
    frequency: "weekly",
    selector: "rotation",
    params: { slice: 4 },
  },
  { task: "sync-remote", frequency: "weekly" },

  // ─── 月次(月初 JST 05:00) ─────────────────────────────────
  // 全銘柄を 1 ヶ月かけて valuation / positioning / summary / catalysts ローテ
  // logo-color は未着色銘柄を全て月初に一気に
  {
    task: "ai-valuation",
    frequency: "monthly",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-positioning",
    frequency: "monthly",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-summary",
    frequency: "monthly",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-catalysts",
    frequency: "monthly",
    selector: "rotation",
    params: { slice: 8 },
  },
  { task: "ai-logo-color", frequency: "monthly" },
  { task: "sync-remote", frequency: "monthly" },
];

export function entriesFor(frequency: Frequency): ScheduleEntry[] {
  return SCHEDULE.filter((e) => e.frequency === frequency && e.enabled !== false);
}
