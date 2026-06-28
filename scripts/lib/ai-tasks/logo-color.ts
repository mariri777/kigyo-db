// logo-color: 企業ロゴカラー(hex)を AI で推定。
//   出力先カラム: companies.logo_color

import { eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { companies, stocks } from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは企業のブランド情報に詳しいデザイナーです。提供される 1 銘柄の企業情報から、ブランドカラー(コーポレートカラー)を推定し、hex で 1 つだけ返してください。

1. logoColor: "#RRGGBB" 形式の hex カラーコード(7 文字、必ず先頭 #)

【厳守】
- 出力は必ず "#" + 16 進 6 桁。例: "#e60012"。短縮形 #fff は禁止。
- 既知のコーポレートカラーがある場合はそれを使う(トヨタ → #eb0a1e、ファーストリテイリング → #e50012 等)。
- 不明な場合でも、業種・社名のイメージから妥当な 1 色を返す(白 #ffffff・黒 #000000 は最後の手段)。
- 必ず 1 色のみ。複数候補や説明文は不要。
- 銘柄名・コードは出力に含めない(コード自体は results[].code で同定する)。
`;

const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  logoColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  nameEn: string | null;
  sectorTse: string;
  description: string | null;
  oneLiner: string | null;
  website: string | null;
};

export const logoColorTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "logo-color",
  description: "企業ロゴカラー(hex)を AI で推定し companies.logo_color を埋める",
  outputSchemaName: "logo-color-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        logoColor: "#000000",
      },
    ],
  },

  async selectTargets(db, limit) {
    // companies.logo_color が NULL の銘柄を優先。
    const rows = await db
      .select({
        code: stocks.code,
        companyId: companies.id,
        name: companies.name,
        nameEn: companies.nameEn,
        sectorTse: stocks.sectorTse,
        description: companies.description,
        oneLiner: companies.oneLiner,
        website: companies.website,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .where(isNull(companies.logoColor))
      .orderBy(sql`${stocks.code}`)
      .limit(limit ?? 1000)
      .all();

    return rows.map((r) => ({
      key: r.code,
      input: {
        code: r.code,
        name: r.name,
        nameEn: r.nameEn,
        sectorTse: r.sectorTse,
        description: r.description,
        oneLiner: r.oneLiner,
        website: r.website,
      },
    }));
  },

  async applyOne(db, key, output) {
    const out = output as Output;
    const now = new Date().toISOString();
    // companies.logo_color を UPDATE。stocks.code → company_id 経由で更新。
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .innerJoin(stocks, eq(stocks.companyId, companies.id))
      .where(eq(stocks.code, key))
      .limit(1)
      .all();
    if (company.length === 0) throw new Error(`company が見つからない: code=${key}`);
    const companyId = company[0].id;

    await db
      .update(companies)
      .set({ logoColor: out.logoColor, updatedAt: now })
      .where(eq(companies.id, companyId))
      .run();
  },
};
