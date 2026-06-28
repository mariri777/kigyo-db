// summary: 200 字会社サマリ。
//   出力先カラム: company_ai_brief.summary

import { eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  companyAiBrief,
  financialsAnnual,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株のアナリストです。提供される 1 銘柄の基本情報から、個人投資家向けに会社サマリを 1 件出力してください。

1. summary: 「ひとことで言うと何の会社か。事業の本質と独自性を 200 字で。」180〜220 字

【厳守】
- 提供データのみ使用、捏造禁止。
- 「魅力的な企業」のような曖昧表現は禁止。事業の中身を具体的に書く。
- 銘柄名・コードは本文に含めない(コード自体は results[].code で同定する)。
- 1 段落で書く。改行は入れない。
`;

const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  summary: z.string().min(160).max(260),
});

type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  sectorTse: string;
  description: string | null;
  oneLiner: string | null;
  website: string | null;
  founded: string | null;
  headquarters: string | null;
  employeesConsolidated: number | null;
  recentFinancials: Array<{
    fy: string;
    revenueOku: number | null;
    operatingProfitOku: number | null;
    operatingMargin: number | null;
    netProfitOku: number | null;
  }>;
};

export const summaryTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "summary",
  description: "200 字会社サマリ(summary)を生成する",
  outputSchemaName: "summary-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        summary: "",
      },
    ],
  },

  async selectTargets(db, limit) {
    // company_ai_brief.summary が NULL の銘柄を優先。
    // 次に generatedAt が古い順。
    const rows = await db
      .select({
        code: stocks.code,
        companyId: companies.id,
        name: companies.name,
        sectorTse: stocks.sectorTse,
        description: companies.description,
        oneLiner: companies.oneLiner,
        website: companies.website,
        founded: companies.founded,
        headquarters: companies.headquarters,
        employeesConsolidated: companies.employeesConsolidated,
        generatedAt: companyAiBrief.generatedAt,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .leftJoin(companyAiBrief, eq(companyAiBrief.companyId, companies.id))
      .where(
        or(
          isNull(companyAiBrief.companyId),
          isNull(companyAiBrief.summary),
        ),
      )
      .orderBy(sql`COALESCE(${companyAiBrief.generatedAt}, '0000-00-00')`)
      .limit(limit ?? 1000)
      .all();

    const targets: Array<{ key: string; input: Input }> = [];
    for (const r of rows) {
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
      targets.push({
        key: r.code,
        input: {
          code: r.code,
          name: r.name,
          sectorTse: r.sectorTse,
          description: r.description,
          oneLiner: r.oneLiner,
          website: r.website,
          founded: r.founded,
          headquarters: r.headquarters,
          employeesConsolidated: r.employeesConsolidated,
          recentFinancials: fins.reverse(),
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
        summary: out.summary,
        generatedAt: now,
      })
      .onConflictDoUpdate({
        target: companyAiBrief.companyId,
        set: { summary: out.summary, generatedAt: now },
      })
      .run();
  },
};
