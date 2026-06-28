/**
 * パイプラインのスケジュール宣言。
 *
 * pnpm pipeline <freq> はここを参照して順次実行する。
 * 新タスク追加は SCHEDULE に 1 行足すだけ。
 *
 * 設計:
 *   - frequency  : "every-6h" | "daily" | "weekly" | "monthly"
 *   - runner     : "local" | "gh" | "both"
 *                  - local : サブスク Claude が必要な AI タスク
 *                  - gh    : GitHub Actions で安全に動かせる(AI も外部依存も無いか、API キーで動く)
 *                  - both  : 両方
 *                  CLI --runner=gh / --runner=local でフィルタ可
 *   - selector + params で対象選定方法を指定(scripts/lib/selectors.ts に対応)
 *   - 並び順に実行(依存順を表現)
 *
 * 運用ルール:
 *   - ローカルから「pnpm pipeline daily」と叩くと、daily の local + both 全部走る (AI 含む)
 *   - GH Actions の workflow は「pnpm pipeline daily --runner=gh」で gh + both のみ
 */
import type { SelectorKind, SelectorParams } from "./selectors.js";

export type Frequency = "every-6h" | "daily" | "weekly" | "monthly";
export type Runner = "local" | "gh" | "both";

export type ScheduleEntry = {
  task: string;
  frequency: Frequency;
  runner: Runner;
  selector?: SelectorKind;
  params?: SelectorParams & Record<string, unknown>;
  /** このエントリだけスキップしたいとき(本番停止用) */
  enabled?: boolean;
};

export const SCHEDULE: ScheduleEntry[] = [
  // ─── 6 時間ごと(JST 09/15/21/03) ─────────────────────────
  // ローカルから手で実行する用。市場指数を再取得して forecast を生成する。
  // GH Actions では fetch-market-indices だけが 30 分置きに別 workflow で走る。
  { task: "fetch-market-indices", frequency: "every-6h", runner: "local" },
  { task: "ai-forecast", frequency: "every-6h", runner: "local" },
  { task: "sync-remote", frequency: "every-6h", runner: "local" },

  // ─── 日次(JST 04:00) ─────────────────────────────────────
  // GH Actions が JPX/Yahoo/highlights を毎日取得、ローカル AI が後追いで生成。
  { task: "fetch-jpx", frequency: "daily", runner: "gh" },
  { task: "fetch-yahoo-snapshot", frequency: "daily", selector: "all", runner: "gh" },
  { task: "fetch-market-indices", frequency: "daily", runner: "gh" },
  { task: "edinet-pipeline", frequency: "daily", runner: "gh" },
  // 派生ハイライト(AI 不要、SQL ルールベース)
  { task: "derive-highlights", frequency: "daily", runner: "gh" },

  // AI 系: ローカル実行。Yahoo 取得後の値を元に AI が書く。
  {
    task: "ai-stock-trend",
    frequency: "daily",
    runner: "local",
    selector: "movers",
    params: { threshold: 5 },
  },
  { task: "ai-market-brief", frequency: "daily", runner: "local" },

  // sync は両方が必要。GH Actions も AI 後のローカル run も最後に本番に流す。
  { task: "sync-remote", frequency: "daily", runner: "both" },

  // ─── 週次(土曜 JST 06:00) ─────────────────────────────────
  {
    task: "edinet-pipeline",
    frequency: "weekly",
    runner: "gh",
    params: { backfill: 8 },
  },
  {
    task: "ai-stock-trend",
    frequency: "weekly",
    runner: "local",
    selector: "rotation",
    params: { slice: 4 },
  },
  { task: "sync-remote", frequency: "weekly", runner: "both" },

  // ─── 月次(月初 JST 05:00) ─────────────────────────────────
  // 全銘柄を 1 ヶ月かけて valuation / positioning / summary / catalysts ローテ
  // logo-color は未着色銘柄を全て月初に一気に
  // 全部 AI なのでローカルのみ。
  {
    task: "ai-valuation",
    frequency: "monthly",
    runner: "local",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-positioning",
    frequency: "monthly",
    runner: "local",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-summary",
    frequency: "monthly",
    runner: "local",
    selector: "rotation",
    params: { slice: 8 },
  },
  {
    task: "ai-catalysts",
    frequency: "monthly",
    runner: "local",
    selector: "rotation",
    params: { slice: 8 },
  },
  { task: "ai-logo-color", frequency: "monthly", runner: "local" },
  { task: "sync-remote", frequency: "monthly", runner: "local" },
];

/**
 * frequency と runner でフィルタ。
 *   runner 引数 = "local" → local + both
 *   runner 引数 = "gh"    → gh + both
 *   runner 引数 = "all"   → 全部
 */
export function entriesFor(
  frequency: Frequency,
  runner: Runner | "all" = "all",
): ScheduleEntry[] {
  return SCHEDULE.filter((e) => {
    if (e.frequency !== frequency) return false;
    if (e.enabled === false) return false;
    if (runner === "all") return true;
    if (runner === "local") return e.runner === "local" || e.runner === "both";
    if (runner === "gh") return e.runner === "gh" || e.runner === "both";
    return true;
  });
}
