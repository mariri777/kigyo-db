/**
 * fetch-jpx: JPX 銘柄一覧を取得し、companies + stocks を UPSERT する。
 *
 * - target はシングルトン(1 日 1 回でいい)。target.key = "today"
 * - 出力は { addedCompanies, addedStocks, baseDate }
 * - companies は name で同定し、無ければ INSERT
 * - stocks は code を PK に INSERT OR REPLACE
 * - 完了時に local/lake/jpx/<YYYY-MM-DD>.json を残す(原本スナップショット)
 */
import { sql } from "drizzle-orm";

import { companies, stocks } from "../../../src/server/db/schema.js";
import { fetchJpxExcel, parseJpxExcel } from "../../lib/jpx.js";
import { lakeFlatPath, writeJsonAtomic } from "../../lib/lake.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";

type Input = { logicalDate: string };
type Output = {
  baseDate: string | null;
  added: number;
  updated: number;
  totalAfter: number;
};

export const jpxSyncTask: Task<Input, Output> = {
  name: "fetch-jpx",
  kind: "fetch",
  description: "JPX 上場一覧 Excel → companies/stocks UPSERT",

  async selectTargets(ctx: PipelineCtx): Promise<Target<Input>[]> {
    return [{ key: "today", input: { logicalDate: ctx.date } }];
  },

  async run(target: Target<Input>, _ctx: PipelineCtx): Promise<Output> {
    const buf = await fetchJpxExcel();
    const { stocks: jpxStocks, baseDate } = parseJpxExcel(buf);
    return { baseDate, added: 0, updated: 0, totalAfter: jpxStocks.length };
  },

  async applyLocal(target: Target<Input>, output: Output, ctx: PipelineCtx) {
    // run の戻り値は集計用。実データは再度パースして DB に流す(run と applyLocal の責務分離)。
    // これだと API を 2 回叩いてしまうので、ここでは run で取った JSON を一時保存して使うべき。
    // → applyLocal は呼ばれず、jpxSyncTask は runBatch で完結させる方針
    void target;
    void output;
    void ctx;
  },

  async runBatch(targets, ctx) {
    // 1 件だけだが runBatch で一貫処理。fetch → parse → DB UPSERT → lake 保存 を 1 まとめ。
    const target = targets[0];
    const buf = await fetchJpxExcel();
    const { stocks: jpxStocks, baseDate } = parseJpxExcel(buf);
    console.log(`    JPX 取得: ${jpxStocks.length} 銘柄, baseDate=${baseDate ?? "(不明)"}`);

    // lake にスナップショット保存
    const lakeFile = lakeFlatPath("jpx", ctx.date);
    writeJsonAtomic(lakeFile, { baseDate, stocks: jpxStocks });

    // DB UPSERT(トランザクションで全件)
    const now = new Date().toISOString();
    const db = ctx.db;

    let added = 0;
    let updated = 0;

    // companies: name UNIQUE indexed の前提だが現状そうでないので、name → 既存 id を引いて分岐
    // パフォーマンス重視で SELECT 1 回 + 差分 INSERT
    const existingByName = new Map<string, number>(
      (await db.select({ id: companies.id, name: companies.name }).from(companies).all()).map(
        (r) => [r.name, r.id],
      ),
    );

    const newCompanies: Array<{ name: string }> = [];
    for (const s of jpxStocks) {
      if (!existingByName.has(s.name)) newCompanies.push({ name: s.name });
    }
    if (newCompanies.length > 0) {
      const CHUNK = 200;
      for (let i = 0; i < newCompanies.length; i += CHUNK) {
        const slice = newCompanies.slice(i, i + CHUNK);
        await db
          .insert(companies)
          .values(
            slice.map((c) => ({
              name: c.name,
              nameEn: null,
              edinetCode: null,
              description: null,
              oneLiner: null,
              founded: null,
              listed: null,
              headquarters: null,
              ceoName: null,
              website: null,
              employeesConsolidated: null,
              logoColor: null,
              createdAt: now,
              updatedAt: now,
            })),
          )
          .run();
        added += slice.length;
      }
      // id を再取得
      const refreshed = await db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .all();
      existingByName.clear();
      for (const r of refreshed) existingByName.set(r.name, r.id);
    }

    // stocks: INSERT OR REPLACE 相当を on conflict do update で(code PK)
    const stockRows = jpxStocks
      .map((s) => {
        const companyId = existingByName.get(s.name);
        if (companyId == null) return null;
        return {
          code: s.code,
          companyId,
          exchange: s.exchange,
          sectorTse: s.sectorTSE,
          indexMembership: null as string | null,
          listedShares: null as number | null,
          createdAt: now,
          updatedAt: now,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);

    const STK_CHUNK = 200;
    for (let i = 0; i < stockRows.length; i += STK_CHUNK) {
      const slice = stockRows.slice(i, i + STK_CHUNK);
      await db
        .insert(stocks)
        .values(slice)
        .onConflictDoUpdate({
          target: stocks.code,
          set: {
            companyId: sql`excluded.company_id`,
            exchange: sql`excluded.exchange`,
            sectorTse: sql`excluded.sector_tse`,
            updatedAt: now,
          },
        })
        .run();
    }
    updated = stockRows.length - added;

    const totalAfter = (
      await db.select({ c: sql<number>`COUNT(*)` }).from(stocks).get()
    )?.c ?? 0;

    const result: Output = { baseDate, added, updated, totalAfter };
    return new Map([[target.key, result]]);
  },

  async healthCheck(ctx) {
    // 東証上場は概ね 3500 社以上。3000 未満なら JPX 解析が壊れた疑い。
    const totalRow = (await ctx.db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM stocks`,
    )) as Array<{ n: number }>;
    const total = totalRow[0]?.n ?? 0;
    const metrics = [`stocks 件数 ${total}`];
    if (total < 3000) {
      return {
        ok: false,
        metrics,
        reasons: [`stocks=${total} は東証上場の想定 3500+ を大きく下回る。JPX Excel 形式変更を疑え`],
      };
    }
    return { ok: true, metrics };
  },
};

