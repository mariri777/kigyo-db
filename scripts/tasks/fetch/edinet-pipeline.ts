/**
 * edinet-pipeline: EDINET 日次取得を 1 タスクで完結させる。
 *
 *   1. discover: 書類一覧 API → edinet_docs に discovered として INSERT
 *   2. process : discovered を 1 件ずつ DL → unzip(in-memory) → parse → financials_* / dividends UPSERT
 *
 * R2 や中間ファイルは使わない(同一ジョブ内で完結)。
 *
 * target はシングルトン。params.backfill が指定されたら過去 N 日ぶんを順番に discover する。
 */
import { discoverDate } from "../../edinet/discover.js";
import { processDiscovered } from "../../edinet/process.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";

type Input = { date: string; backfillDays: number };
type Output = {
  discoveredTotal: number;
  newlyInserted: number;
  processed: number;
  failed: number;
  skipped: number;
};

export const edinetPipelineTask: Task<Input, Output> = {
  name: "edinet-pipeline",
  kind: "fetch",
  description: "EDINET API → 書類一覧から in-memory で財務取り込み",

  async selectTargets(ctx: PipelineCtx): Promise<Target<Input>[]> {
    const backfillDays = Number(ctx.args.backfillDays ?? 0);
    return [{ key: ctx.date, input: { date: ctx.date, backfillDays } }];
  },

  async run(target: Target<Input>): Promise<Output> {
    const { date, backfillDays } = target.input;

    let discoveredTotal = 0;
    let newlyInserted = 0;
    const dates = expandDates(date, backfillDays);
    for (const d of dates) {
      console.log(`    [discover ${d}]`);
      const dRes = await discoverDate(d);
      discoveredTotal += dRes.totalInResponse;
      newlyInserted += dRes.newlyInserted;
    }

    console.log(`    [process]`);
    const p = await processDiscovered();

    return {
      discoveredTotal,
      newlyInserted,
      processed: p.succeeded,
      failed: p.failed,
      skipped: p.skippedNoCompany,
    };
  },

  async applyLocal(_target, output) {
    console.log(
      `    discovered=${output.discoveredTotal}, inserted=${output.newlyInserted}, processed=${output.processed}, failed=${output.failed}, skipped=${output.skipped}`,
    );
  },
};

function expandDates(date: string, backfillDays: number): string[] {
  if (backfillDays <= 0) return [date];
  const out: string[] = [];
  const base = new Date(`${date}T00:00:00Z`);
  for (let i = backfillDays; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
