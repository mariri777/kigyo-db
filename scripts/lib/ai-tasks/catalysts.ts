// catalysts: 銘柄ごとの「株価を動かす材料」(上振れ要因×4 + 下振れリスク×4)。
//   出力先: events テーブル
//     - upside  → kind="catalyst", direction="up",   scope="company", scopeRef=<company_id>
//     - downside → kind="risk",     direction="down", scope="company", scopeRef=<company_id>

import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import {
  companies,
  events,
  financialsAnnual,
  stockSnapshot,
  stocks,
} from "../../../src/server/db/schema.js";
import type { LocalDb } from "../local-db.js";
import type { Task } from "./index.js";

const PROMPT = `\
あなたは日本株のエクイティアナリストです。提供される 1 銘柄について、株価を動かす材料を
「上がりそうな材料 (upside) 4 件」「下がりそうなリスク (downside) 4 件」に整理してください。

各材料 = { title, when, impact, note } の 4 フィールド。

1. title: 35 字以内の見出し。具体的・固有の事象を書く
   - 良い例: "4.3兆円自社株買い完了によるEPSブースト" / "米国市場での関税継続・実質増税"
   - 悪い例: "業績拡大に期待" / "市場環境の悪化" (固有性が無く中身が空)
2. when: 時期表記。次のいずれかの形式を使う
   - 四半期: "2026年Q2" / "2026年下期" / "2027年〜2028年"
   - 期間: "通年" / "継続" / "不定"
   - 条件付き: "金融政策次第" / "決算発表後" / "次回株主総会"
3. impact: "強" | "中" | "弱"
   - 「強」は営業利益が数千億円〜兆円規模で動くもの、または株価への過去事例が大きいもの
   - 「中」は営業利益数百億円〜数千億円規模、構造的だが時間がかかるもの
   - 「弱」は短期需給・センチメント
   - 数値根拠を note に必ず添える("対ドル10円の円高で営業利益約4,500億円押し下げ" 等)
4. note: 70 字以内の説明。impact の根拠となる数値 (営業利益への寄与額、シェア、PER 改善幅 等) を 1 つ含める

【厳守】
- 提供データのみ使用。捏造禁止。
- input.snapshot / input.recentFinancials にある数値を引用する(無い数値は語らない)
- 全 8 件はすべて互いに異なるテーマ(同じ材料を upside/downside 双方に書かない、重複禁止)
- 業界全体に通じる一般論ではなく、その銘柄固有の固有名詞・数値を含める
- 銘柄名・コードは title / note 本文に含めない(クライアントが文脈で表示する)
`;

const CatalystItem = z.object({
  title: z.string().min(8).max(60),
  when: z.string().min(2).max(24),
  impact: z.enum(["強", "中", "弱"]),
  note: z.string().min(10).max(120),
});

const OutputItem = z.object({
  code: z.string().regex(/^\d{4}$/),
  upside: z.array(CatalystItem).length(4),
  downside: z.array(CatalystItem).length(4),
});
type Output = z.infer<typeof OutputItem>;

type Input = {
  code: string;
  name: string;
  sectorTse: string;
  snapshot: {
    priceJpy: number | null;
    marketCapOku: number | null;
    per: number | null;
    perForecast: number | null;
    pbr: number | null;
    roe: number | null;
    dividendYield: number | null;
    change1yPct: number | null;
    foreignOwnership: number | null;
    latestRevenueOku: number | null;
    latestOpProfitOku: number | null;
    latestOpMargin: number | null;
  } | null;
  recentFinancials: Array<{
    fy: string;
    revenueOku: number | null;
    operatingProfitOku: number | null;
    operatingMargin: number | null;
    netProfitOku: number | null;
  }>;
};

export const catalystsTask: Task<Input, { results: Partial<Output>[] }> = {
  name: "catalysts",
  description: "銘柄ごとの株価を動かす材料(上振れ×4 + 下振れ×4)を生成する(四半期トリガー)",
  outputSchemaName: "catalysts-output",
  outputSchema: OutputItem,
  promptTemplate: PROMPT,
  outputTemplate: {
    results: [
      {
        code: "0000",
        upside: [
          { title: "", when: "", impact: "強", note: "" },
          { title: "", when: "", impact: "中", note: "" },
          { title: "", when: "", impact: "中", note: "" },
          { title: "", when: "", impact: "弱", note: "" },
        ],
        downside: [
          { title: "", when: "", impact: "強", note: "" },
          { title: "", when: "", impact: "中", note: "" },
          { title: "", when: "", impact: "中", note: "" },
          { title: "", when: "", impact: "弱", note: "" },
        ],
      },
    ],
  },

  async selectTargets(db, limit) {
    // events に scope=company, kind in (catalyst,risk) が一切無い companies を優先
    // (companyId → scopeRef は文字列化済み)
    const existing = await db
      .selectDistinct({ scopeRef: events.scopeRef })
      .from(events)
      .where(
        and(
          eq(events.scope, "company"),
          inArray(events.kind, ["catalyst", "risk"]),
        ),
      )
      .all();
    const existingIds = new Set(existing.map((e) => e.scopeRef));

    const rows = await db
      .select({
        code: stocks.code,
        name: companies.name,
        sectorTse: stocks.sectorTse,
        companyId: companies.id,
      })
      .from(stocks)
      .innerJoin(companies, eq(stocks.companyId, companies.id))
      .orderBy(stocks.code)
      .limit(limit ?? 1000)
      .all();

    const filtered = rows.filter((r) => !existingIds.has(String(r.companyId)));
    const slice = filtered.slice(0, limit ?? filtered.length);

    const targets: Array<{ key: string; input: Input }> = [];
    for (const r of slice) {
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
                priceJpy: s.priceJpy,
                marketCapOku: s.marketCapOku,
                per: s.per,
                perForecast: s.perForecast,
                pbr: s.pbr,
                roe: s.roe,
                dividendYield: s.dividendYield,
                change1yPct: s.change1yPct,
                foreignOwnership: s.foreignOwnership,
                latestRevenueOku: s.latestRevenueOku,
                latestOpProfitOku: s.latestOpProfitOku,
                latestOpMargin: s.latestOpMargin,
              }
            : null,
          recentFinancials: fins.reverse(),
        },
      });
    }
    // 既に events に出力済みのものを除外して取り尽くしたら、続いて「古い順」のロジックを
    // 実装してもいいが、まずは未生成優先で十分なので silently skip。
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
    const scopeRef = String(companyId);
    const now = new Date().toISOString();

    // 既存の catalyst / risk を削除(冪等性のため全消し→全入れ)
    await db
      .delete(events)
      .where(
        and(
          eq(events.scope, "company"),
          eq(events.scopeRef, scopeRef),
          inArray(events.kind, ["catalyst", "risk"]),
        ),
      )
      .run();

    // upside 4 件 = kind=catalyst, direction=up
    for (const item of out.upside) {
      await db
        .insert(events)
        .values({
          kind: "catalyst",
          scope: "company",
          scopeRef,
          title: item.title,
          body: item.note,
          occursAt: item.when,
          impact: item.impact,
          direction: "up",
          sourceUrl: null,
          createdAt: now,
        })
        .run();
    }
    // downside 4 件 = kind=risk, direction=down
    for (const item of out.downside) {
      await db
        .insert(events)
        .values({
          kind: "risk",
          scope: "company",
          scopeRef,
          title: item.title,
          body: item.note,
          occursAt: item.when,
          impact: item.impact,
          direction: "down",
          sourceUrl: null,
          createdAt: now,
        })
        .run();
    }
  },
};
