// positioning: 業界内ポジショニング(見出し / 解説 / 強み / 課題)。
//   出力先カラム: company_ai_brief.positioning_{headline,analysis,strengths_json,challenges_json}

import { eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  companyAiBrief,
  companyIndustries,
  financialsAnnual,
  industries,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株のセクターアナリストです。提供される 1 銘柄と同業他社・業界概要から、次を出力してください。

1. positioningHeadline: 業界内ポジションを 1 行 28 字以内("○○ で国内首位、海外比率低めで内需依存" 等)
2. positioningAnalysis: 業界構造内での立ち位置を 250〜320 字。ライバル銘柄に 1〜2 件触れる
3. positioningStrengths: 強み 4 項目。各 { title: <12字>, detail: <50字> }
4. positioningChallenges: 課題 3 項目。各 { title: <12字>, detail: <50字> }

【厳守】
- 提供データのみ使用、ライバル名は input.peers にあるものだけ。
- 数値が無い項目は推測しない(「成長余地大」のような中身のない断定は禁止)。
- 銘柄名・コードは headline / analysis 本文に含めない。
`;

const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  positioningHeadline: z.string().min(8).max(48),
  positioningAnalysis: z.string().min(140).max(420),
  positioningStrengths: z
    .array(z.object({ title: z.string().min(1).max(18), detail: z.string().min(1).max(80) }))
    .length(4),
  positioningChallenges: z
    .array(z.object({ title: z.string().min(1).max(18), detail: z.string().min(1).max(80) }))
    .length(3),
});
type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  sectorTse: string;
  industries: Array<{ slug: string; name: string; description: string | null }>;
  peers: Array<{ code: string; name: string; sectorTse: string }>;
  recentFinancials: Array<{
    fy: string;
    revenueOku: number | null;
    operatingMargin: number | null;
  }>;
};

export const positioningTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "positioning",
  description: "業界内ポジショニング(見出し / 解説 / 強み×4 / 課題×3)を生成する(四半期トリガー)",
  outputSchemaName: "positioning-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        positioningHeadline: "",
        positioningAnalysis: "",
        positioningStrengths: [
          { title: "", detail: "" },
          { title: "", detail: "" },
          { title: "", detail: "" },
          { title: "", detail: "" },
        ],
        positioningChallenges: [
          { title: "", detail: "" },
          { title: "", detail: "" },
          { title: "", detail: "" },
        ],
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
          isNull(companyAiBrief.positioningAnalysis),
        ),
      )
      .orderBy(sql`COALESCE(${companyAiBrief.generatedAt}, '0000-00-00')`)
      .limit(limit ?? 1000)
      .all();

    const targets: Array<{ key: string; input: Input }> = [];
    for (const r of rows) {
      // 関連 industries
      const inds = await db
        .select({
          slug: industries.slug,
          name: industries.name,
          description: industries.description,
        })
        .from(companyIndustries)
        .innerJoin(industries, eq(industries.slug, companyIndustries.industrySlug))
        .where(eq(companyIndustries.companyId, r.companyId))
        .all();

      // ピア銘柄(同 sectorTse の 5 社まで、自分は除く)
      const peers = await db
        .select({
          code: stocks.code,
          name: companies.name,
          sectorTse: stocks.sectorTse,
        })
        .from(stocks)
        .innerJoin(companies, eq(companies.id, stocks.companyId))
        .where(sql`${stocks.sectorTse} = ${r.sectorTse} AND ${stocks.code} != ${r.code}`)
        .limit(5)
        .all();

      const fins = await db
        .select({
          fy: financialsAnnual.fy,
          revenueOku: financialsAnnual.revenueOku,
          operatingMargin: financialsAnnual.operatingMargin,
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
          industries: inds,
          peers,
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
        positioningHeadline: out.positioningHeadline,
        positioningAnalysis: out.positioningAnalysis,
        positioningStrengthsJson: JSON.stringify(out.positioningStrengths),
        positioningChallengesJson: JSON.stringify(out.positioningChallenges),
        generatedAt: now,
      })
      .onConflictDoUpdate({
        target: companyAiBrief.companyId,
        set: {
          positioningHeadline: out.positioningHeadline,
          positioningAnalysis: out.positioningAnalysis,
          positioningStrengthsJson: JSON.stringify(out.positioningStrengths),
          positioningChallengesJson: JSON.stringify(out.positioningChallenges),
          generatedAt: now,
        },
      })
      .run();
  },
};
