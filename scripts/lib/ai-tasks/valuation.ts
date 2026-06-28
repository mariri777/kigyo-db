// valuation: バリュエーション判定の根拠テキスト。
//   出力先カラム: company_ai_brief.valuation_rationale, stock_snapshot.valuation_verdict / valuation_score

import { eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  companyAiBrief,
  financialsAnnual,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株のバリュエーション担当アナリストです。提供される指標から各銘柄について次を出力してください。

1. valuationVerdict: "割安" | "ほぼ妥当" | "やや割高" | "割高" のいずれか
2. valuationScore: 0-100 の整数(100 が極度の割安、0 が極度の割高)
3. valuationRationale: 判定の根拠 200〜260 字
   - PER / PBR / 配当利回り / ROE のうち 2-3 指標を引用
   - 同業界平均との比較を 1 文盛り込む(平均値が不明なら言及を避ける)
   - 「割安だが配当は伸び悩み」のような両面性を含める

【厳守】
- 提供データのみ使用、数値は引用通り。捏造禁止。
- 「魅力的」のような曖昧表現は禁止。数値を必ず添える。
- 業界平均は input.peerAverage が提供されているときだけ言及する。
- 銘柄名・コードは本文に含めない。
`;

const Verdict = z.enum(["割安", "ほぼ妥当", "やや割高", "割高"]);
const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  valuationVerdict: Verdict,
  valuationScore: z.number().int().min(0).max(100),
  valuationRationale: z.string().min(80).max(360),
});
type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  sectorTse: string;
  snapshot: {
    per: number | null;
    perForecast: number | null;
    pbr: number | null;
    psr: number | null;
    roe: number | null;
    dividendYield: number | null;
    dividendPayoutRatio: number | null;
    evEbitda: number | null;
    peg: number | null;
  } | null;
  recentFinancials: Array<{
    fy: string;
    revenueOku: number | null;
    operatingProfitOku: number | null;
    operatingMargin: number | null;
    netProfitOku: number | null;
  }>;
  /** 同セクター平均(取れなければ null)。 */
  peerAverage: { per: number | null; pbr: number | null; dividendYield: number | null } | null;
};

export const valuationTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "valuation",
  description: "バリュエーション判定 + 根拠テキストを生成する(四半期トリガー)",
  outputSchemaName: "valuation-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        valuationVerdict: "ほぼ妥当",
        valuationScore: 50,
        valuationRationale: "",
      },
    ],
  },

  async selectTargets(db, limit) {
    const rows = await db
      .select({
        code: stocks.code,
        name: companies.name,
        sectorTse: stocks.sectorTse,
        companyId: companies.id,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .leftJoin(companyAiBrief, eq(companyAiBrief.companyId, companies.id))
      .where(
        or(
          isNull(companyAiBrief.companyId),
          isNull(companyAiBrief.valuationRationale),
        ),
      )
      .orderBy(sql`COALESCE(${companyAiBrief.generatedAt}, '0000-00-00')`)
      .limit(limit ?? 1000)
      .all();

    // 同セクター平均(per/pbr/dividend_yield)を 1 回まとめて取る
    const sectorAvg = new Map<
      string,
      { per: number | null; pbr: number | null; dividendYield: number | null }
    >();
    const sectors = Array.from(new Set(rows.map((r) => r.sectorTse)));
    for (const sec of sectors) {
      const avg = await db
        .select({
          per: sql<number | null>`AVG(${stockSnapshot.per})`,
          pbr: sql<number | null>`AVG(${stockSnapshot.pbr})`,
          dy: sql<number | null>`AVG(${stockSnapshot.dividendYield})`,
        })
        .from(stockSnapshot)
        .innerJoin(stocks, eq(stocks.code, stockSnapshot.code))
        .where(eq(stocks.sectorTse, sec))
        .all();
      sectorAvg.set(sec, {
        per: avg[0]?.per ?? null,
        pbr: avg[0]?.pbr ?? null,
        dividendYield: avg[0]?.dy ?? null,
      });
    }

    const targets: Array<{ key: string; input: Input }> = [];
    for (const r of rows) {
      const snap = await db
        .select()
        .from(stockSnapshot)
        .where(eq(stockSnapshot.code, r.code))
        .limit(1)
        .all();
      const fins = await db
        .select({
          fy: financialsAnnual.fy,
          revenueOku: financialsAnnual.revenueOku,
          operatingProfitOku: financialsAnnual.operatingProfitOku,
          operatingMargin: financialsAnnual.operatingMargin,
          netProfitOku: financialsAnnual.netProfitOku,
        })
        .from(financialsAnnual)
        .where(eq(financialsAnnual.companyId, r.companyId))
        .orderBy(sql`${financialsAnnual.fy} DESC`)
        .limit(3)
        .all();
      const s = snap[0];
      targets.push({
        key: r.code,
        input: {
          code: r.code,
          name: r.name,
          sectorTse: r.sectorTse,
          snapshot: s
            ? {
                per: s.per,
                perForecast: s.perForecast,
                pbr: s.pbr,
                psr: s.psr,
                roe: s.roe,
                dividendYield: s.dividendYield,
                dividendPayoutRatio: s.dividendPayoutRatio,
                evEbitda: s.evEbitda,
                peg: s.peg,
              }
            : null,
          recentFinancials: fins.reverse(),
          peerAverage: sectorAvg.get(r.sectorTse) ?? null,
        },
      });
    }
    return targets;
  },

  async applyOne(db, key, output) {
    const out = output as Output;
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .innerJoin(stocks, eq(stocks.companyId, companies.id))
      .where(eq(stocks.code, key))
      .limit(1)
      .all();
    if (company.length === 0) throw new Error(`company が見つからない: code=${key}`);
    const companyId = company[0].id;
    const now = new Date().toISOString();

    await db
      .insert(companyAiBrief)
      .values({
        companyId,
        valuationRationale: out.valuationRationale,
        generatedAt: now,
      })
      .onConflictDoUpdate({
        target: companyAiBrief.companyId,
        set: { valuationRationale: out.valuationRationale, generatedAt: now },
      })
      .run();

    // verdict/score は stock_snapshot 側に保持(スキーマ設計通り)
    await db
      .update(stockSnapshot)
      .set({
        valuationVerdict: out.valuationVerdict,
        valuationScore: out.valuationScore,
        updatedAt: now,
      })
      .where(eq(stockSnapshot.code, key))
      .run();
  },
};
