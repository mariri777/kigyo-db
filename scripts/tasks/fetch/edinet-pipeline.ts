/**
 * edinet-pipeline: EDINET 日次 5 ステップを 1 タスクに束ねる。
 *
 * 既存 scripts/edinet/{discover,download,extract,parse}.ts は関数として残し、
 * ここからは順次呼ぶだけ。
 *
 * target は { date, target: "local" | "remote" } のシングルトン。
 * params.backfill が指定されたら過去 N 日ぶんを順番に discover する。
 */
import { discoverDate } from "../../edinet/discover.js";
import { downloadPending } from "../../edinet/download.js";
import { extractDownloaded } from "../../edinet/extract.js";
import { parseDownloaded } from "../../edinet/parse.js";
import type { R2Target } from "../../lib/r2.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";

type Input = { date: string; r2: R2Target; backfillDays: number };
type Output = {
  discoveredTotal: number;
  newlyInserted: number;
  downloadOk: number;
  extractOk: number;
  parseOk: number;
};

export const edinetPipelineTask: Task<Input, Output> = {
  name: "edinet-pipeline",
  kind: "fetch",
  description: "EDINET API → R2 → D1 (5 step: discover/download/extract/parse)",

  async selectTargets(ctx: PipelineCtx): Promise<Target<Input>[]> {
    const r2 = (process.env.EDINET_R2 as R2Target) ?? "local";
    const backfillDays = Number(ctx.args.backfillDays ?? 0);
    return [{ key: ctx.date, input: { date: ctx.date, r2, backfillDays } }];
  },

  async run(target: Target<Input>): Promise<Output> {
    const { date, r2, backfillDays } = target.input;

    let discoveredTotal = 0;
    let newlyInserted = 0;
    const dates = expandDates(date, backfillDays);
    for (const d of dates) {
      console.log(`    [discover ${d}]`);
      const dRes = await discoverDate(d);
      discoveredTotal += dRes.totalInResponse;
      newlyInserted += dRes.newlyInserted;
    }

    console.log(`    [download]`);
    const dl = await downloadPending(r2);
    console.log(`    [extract]`);
    const ex = await extractDownloaded(r2);
    console.log(`    [parse]`);
    const p = await parseDownloaded(r2);

    return {
      discoveredTotal,
      newlyInserted,
      downloadOk: dl.succeeded,
      extractOk: ex.succeeded,
      parseOk: p.succeeded,
    };
  },

  async applyLocal(_target, output) {
    console.log(
      `    discovered=${output.discoveredTotal}, inserted=${output.newlyInserted}, dl_ok=${output.downloadOk}, ex_ok=${output.extractOk}, parse_ok=${output.parseOk}`,
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
