// market-brief: トップ画面の日次 AI サマリ(1 日 1 行)。
//   出力先テーブル: market_brief

import { sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  marketBrief,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株市況のキュレーターです。当日のマーケット要約 1 行ぶんを出力してください。

1. date: YYYY-MM-DD(input.date をそのまま使う)
2. lede: 30〜60 字の見出し("半導体に火が戻った1日" 等)
3. bullets: 3〜5 本の箇条書き。各 60〜100 字。当日の主要動意を 1 件ずつ言及
4. watchThemes: 3 件 [{ name: <12字>, changePct: <平均騰落率%> }]。input.themes の change_pct を引用
5. indices: 5 件 [{ name, value, changePct }]。input.indices を 1:1 で写す(改変禁止)

【厳守】
- 提供データのみ使用。bullets で銘柄に触れる場合は input.topMovers の中から選ぶ。
- 数値捏造禁止。
- "急騰" "急落" などの主観語は使わず数値を引用("+8.2%" 等)。
`;

const OutputItem = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lede: z.string().min(10).max(80),
  bullets: z.array(z.string().min(20).max(140)).min(3).max(5),
  watchThemes: z
    .array(z.object({ name: z.string().min(1).max(16), changePct: z.number() }))
    .length(3),
  indices: z
    .array(z.object({ name: z.string().min(1).max(20), value: z.number(), changePct: z.number() }))
    .length(5),
});
type Output = z.infer<typeof OutputItem>;

type Input = {
  date: string;
  indices: Array<{ name: string; value: number; changePct: number }>;
  themes: Array<{ name: string; changePct: number }>;
  topMovers: Array<{ code: string; name: string; changePct: number }>;
};

// market-brief は対象が 1 件(当日)なので、prepare 側で日付を組み立てる。
// 指数とテーマは現状の D1 には無いので、最低限 stockSnapshot から
// "当日の topMovers" だけ採り、indices/themes は placeholder を出して
// Claude 側で input.indices を尊重する設計に倒す。本番運用では別パイプラインで
// indices/themes を埋める想定。

export const marketBriefTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "market-brief",
  description: "トップ用の日次マーケット要約(1 行)を生成する",
  outputSchemaName: "market-brief-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        date: "2026-01-01",
        lede: "",
        bullets: ["", "", ""],
        watchThemes: [
          { name: "", changePct: 0 },
          { name: "", changePct: 0 },
          { name: "", changePct: 0 },
        ],
        indices: [
          { name: "", value: 0, changePct: 0 },
          { name: "", value: 0, changePct: 0 },
          { name: "", value: 0, changePct: 0 },
          { name: "", value: 0, changePct: 0 },
          { name: "", value: 0, changePct: 0 },
        ],
      },
    ],
  },

  async selectTargets(db, _limit) {
    // 当日 1 件のみ。既に market_brief 当日行があれば対象外。
    const date = new Date().toISOString().slice(0, 10);
    const existing = await db
      .select({ date: marketBrief.date })
      .from(marketBrief)
      .where(sql`${marketBrief.date} = ${date}`)
      .limit(1)
      .all();
    if (existing.length > 0) return [];

    // 上位騰落 10 銘柄
    const movers = await db
      .select({
        code: stockSnapshot.code,
        name: companies.name,
        changePct: stockSnapshot.change1dPct,
      })
      .from(stockSnapshot)
      .innerJoin(stocks, sql`${stocks.code} = ${stockSnapshot.code}`)
      .innerJoin(companies, sql`${companies.id} = ${stocks.companyId}`)
      .where(sql`${stockSnapshot.change1dPct} IS NOT NULL`)
      .orderBy(sql`ABS(${stockSnapshot.change1dPct}) DESC`)
      .limit(10)
      .all();

    return [
      {
        key: date,
        input: {
          date,
          // 指数とテーマは別パイプライン(まだ未実装)が埋める前提。
          // ここではプレースホルダ。Claude には input をそのまま indices に転記させる。
          indices: [
            { name: "TOPIX", value: 0, changePct: 0 },
            { name: "日経225", value: 0, changePct: 0 },
            { name: "JPX400", value: 0, changePct: 0 },
            { name: "マザーズ", value: 0, changePct: 0 },
            { name: "REIT", value: 0, changePct: 0 },
          ],
          themes: [
            { name: "半導体", changePct: 0 },
            { name: "AI関連", changePct: 0 },
            { name: "ディフェンシブ", changePct: 0 },
          ],
          topMovers: movers
            .filter((m): m is { code: string; name: string; changePct: number } => m.changePct != null)
            .map((m) => ({ code: m.code, name: m.name, changePct: m.changePct })),
        },
      },
    ];
  },

  async applyOne(db, _key, output) {
    const out = output as Output;
    const now = new Date().toISOString();
    await db
      .insert(marketBrief)
      .values({
        date: out.date,
        lede: out.lede,
        bulletsJson: JSON.stringify(out.bullets),
        watchThemesJson: JSON.stringify(out.watchThemes),
        indicesJson: JSON.stringify(out.indices),
        generatedAt: now,
      })
      .onConflictDoUpdate({
        target: marketBrief.date,
        set: {
          lede: out.lede,
          bulletsJson: JSON.stringify(out.bullets),
          watchThemesJson: JSON.stringify(out.watchThemes),
          indicesJson: JSON.stringify(out.indices),
          generatedAt: now,
        },
      })
      .run();
  },
};
