/**
 * ai-forecast: トップページ「AIの明日予想」のソース。
 *
 * 設計方針:
 *   - フローではなく stock。1 (target_symbol, resolve_at) = 1 行を forecasts に持つ
 *   - 6h ごとに再生成 → 同じ行を UPDATE しつつ、forecast_shifts に時系列を積む
 *   - 1 件あたり、記事ほどではないが「読み物」として読めるボリュームを担保:
 *       headline / lede / takes 3-6 段落 / scenarios 3 本
 *
 * Schema:
 *   forecasts          1 予測 1 行 (見出し・確率・解決状態)
 *   forecast_takes     視点 (macro / technical / sentiment / bull / bear / key-data) の段落
 *   forecast_scenarios base / bull / bear の 3 シナリオ
 *   forecast_shifts    6h ごとの確率推移
 *
 * 詳細仕様は docs/forecast-feature.md。
 */
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  forecastScenarios,
  forecastShifts,
  forecastTakes,
  forecasts,
  marketBrief,
  marketIndices,
} from "../../../src/server/db/schema.js";
import { runClaudeCli } from "../../lib/ai-runner.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit } from "../../lib/sql-escape.js";
import type { PipelineCtx, Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

// ──────────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────────

type ForecastTargetDef = {
  symbol: "^GSPC" | "^N225";
  name: string;
  targetKind: "global-index";
  question: string;
  resolveAt: string;
};

type InputIndex = {
  symbol: string;
  name: string;
  value: number | null;
  previousClose: number | null;
  change1dPct: number | null;
  asOf: string | null;
};

type Input = {
  date: string;
  asOf: string;
  indices: InputIndex[];
  marketBrief: { lede: string; bullets: string[] } | null;
  forecastTargets: ForecastTargetDef[];
  previousForecasts: Array<{ symbol: string; probability: number }>;
};

const TakeSchema = z.object({
  kind: z.enum(["macro", "technical", "sentiment", "bull", "bear", "key-data"]),
  heading: z.string().min(6).max(40),
  body: z.string().min(80).max(420),
  bias: z.enum(["up", "down", "neutral"]).default("neutral"),
});

const ScenarioSchema = z.object({
  kind: z.enum(["base", "bull", "bear"]),
  label: z.string().min(2).max(20),
  probability: z.number().int().min(0).max(100),
  priceLow: z.number().nullable().optional(),
  priceHigh: z.number().nullable().optional(),
  note: z.string().min(40).max(220),
});

const OutputItemSchema = z.object({
  symbol: z.string().min(1),
  headline: z.string().min(8).max(40),
  lede: z.string().min(80).max(280),
  probability: z.number().int().min(0).max(100),
  confidence: z.enum(["low", "med", "high"]),
  referencePrice: z.number().nullable().optional(),
  takes: z.array(TakeSchema).min(3).max(8),
  scenarios: z.array(ScenarioSchema).length(3),
  closingNote: z.string().max(140).optional(),
});
type OutputItem = z.infer<typeof OutputItemSchema>;

type BatchOutput = {
  date: string;
  generatedAt: string;
  items: Array<
    OutputItem & {
      name: string;
      targetKind: "global-index";
      question: string;
      resolveAt: string;
    }
  >;
};

// ──────────────────────────────────────────────────
// プロンプト
// ──────────────────────────────────────────────────

const PROMPT = `\
あなたは Bloomberg / Reuters 水準の中立的なマクロアナリストです。

入力データを踏まえ、forecastTargets に並んだ各指数について、翌営業日終値が
前日比プラスとなる確率 (YES 側、0-100 の整数) と、それを支える分析を
構造化して書いてください。トップページ用に「読み物として読める」密度を持たせます。

【出力】
results 配列に forecastTargets と同じ順序で、各エントリは:
  {
    "symbol": "^GSPC",
    "headline": "テクニカル復調で上方バイアス",   // 12-26字
    "lede": "FOMC ハト派観測で...",                // 100-220字
    "probability": 58,                              // 0-100 (YES = 翌営業日プラス)
    "confidence": "med",                            // low / med / high
    "referencePrice": 5891.42,                      // 直近の終値 (入力 indices から拾う)
    "takes": [
      {
        "kind": "macro",
        "heading": "FOMC ハト派的シグナル",
        "body": "180-280字、根拠と数値を含める",
        "bias": "up"
      },
      { "kind": "technical", ... },
      { "kind": "sentiment", ... },
      { "kind": "bull", ... },                       // 強気シナリオを補強する 1 段落
      { "kind": "bear", ... },                       // 弱気シナリオを補強する 1 段落
      { "kind": "key-data", ... }                    // 任意。具体的な数字ハイライト
    ],
    "scenarios": [
      { "kind": "base", "label": "もみ合い", "probability": 45, "priceLow": 5860, "priceHigh": 5910, "note": "..." },
      { "kind": "bull", "label": "リスク選好", "probability": 35, "priceLow": 5910, "priceHigh": 5980, "note": "..." },
      { "kind": "bear", "label": "利益確定", "probability": 20, "priceLow": 5790, "priceHigh": 5860, "note": "..." }
    ],
    "closingNote": "(任意) 一言オチ。100字以内"
  }

【厳守】
- 各 take.body は 180〜280字、日本語、断定的な投資助言は避ける
- 「絶対」「確実」「暴落」「爆上げ」等の煽り語は禁止
- probability の極端値 (25 未満 / 75 超) は重大な根拠がある場合のみ
- 数値の捏造禁止。入力 indices / marketBrief にない数値は引用しない
- previousForecasts に前回値があり、大きく変える場合は変化理由が takes に反映されること
- scenarios の probability の合計は 100 (誤差 ±5 まで許容)
- takes には macro / technical / sentiment の 3 つを必ず含める。bull / bear / key-data は任意
- referencePrice は入力 indices の該当 symbol の value を整数または小数で埋める
`;

// ──────────────────────────────────────────────────
// resolveAt 計算 (旧コードの流用)
// ──────────────────────────────────────────────────

function nextBusinessDayAtJst(baseDate: Date, hourJst: number, minuteJst = 0): string {
  const jstMs = baseDate.getTime() + 9 * 60 * 60 * 1000;
  let cur = new Date(jstMs + 24 * 60 * 60 * 1000);
  while (cur.getUTCDay() === 0 || cur.getUTCDay() === 6) {
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  const y = cur.getUTCFullYear();
  const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cur.getUTCDate()).padStart(2, "0");
  const hh = String(hourJst).padStart(2, "0");
  const mm = String(minuteJst).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:00+09:00`;
}

function jstSameOrNextDayAt(baseDate: Date, hourJst: number): string {
  const jstMs = baseDate.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  const todayCloseMs = Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate(),
    hourJst,
    0,
    0,
  );
  if (jst.getTime() < todayCloseMs && jst.getUTCDay() !== 0 && jst.getUTCDay() !== 6) {
    const y = jst.getUTCFullYear();
    const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jst.getUTCDate()).padStart(2, "0");
    const hh = String(hourJst).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:00:00+09:00`;
  }
  return nextBusinessDayAtJst(baseDate, hourJst);
}

function buildForecastTargets(now: Date): ForecastTargetDef[] {
  return [
    {
      symbol: "^GSPC",
      name: "S&P 500",
      targetKind: "global-index",
      question: "翌営業日の S&P 500 終値は前日比プラスか?",
      resolveAt: nextBusinessDayAtJst(now, 5, 0),
    },
    {
      symbol: "^N225",
      name: "日経平均",
      targetKind: "global-index",
      question: "翌営業日の日経平均終値は前日比プラスか?",
      resolveAt: jstSameOrNextDayAt(now, 15),
    },
  ];
}

// ──────────────────────────────────────────────────
// Task 定義
// ──────────────────────────────────────────────────

const forecastTask: Task<Input, BatchOutput> & SyncCapable<BatchOutput> = {
  name: "ai-forecast",
  kind: "ai",
  description:
    "S&P 500 / 日経平均の翌営業日方向性を AI が分析し forecasts / forecast_takes / forecast_scenarios / forecast_shifts へ書き込む",
  outputSchema: OutputItemSchema,
  outputTemplate: {
    results: [
      {
        symbol: "^GSPC",
        headline: "",
        lede: "",
        probability: 50,
        confidence: "med",
        referencePrice: null,
        takes: [],
        scenarios: [],
      },
    ],
  },
  promptTemplate: PROMPT,
  remoteTable: "forecasts",

  async selectTargets(ctx): Promise<Target<Input>[]> {
    const now = new Date();
    const forecastTargets = buildForecastTargets(now);

    const idxRows = await ctx.db
      .select({
        symbol: marketIndices.symbol,
        name: marketIndices.name,
        value: marketIndices.value,
        previousClose: marketIndices.previousClose,
        change1dPct: marketIndices.change1dPct,
        asOf: marketIndices.asOf,
      })
      .from(marketIndices)
      .orderBy(marketIndices.displayOrder)
      .all();

    const briefRows = await ctx.db
      .select({ lede: marketBrief.lede, bulletsJson: marketBrief.bulletsJson })
      .from(marketBrief)
      .orderBy(desc(marketBrief.date))
      .limit(1)
      .all();
    const brief =
      briefRows.length > 0
        ? {
            lede: briefRows[0].lede ?? "",
            bullets: safeJsonArray(briefRows[0].bulletsJson),
          }
        : null;

    const prevRows: Array<{ symbol: string; probability: number }> = [];
    for (const t of forecastTargets) {
      const r = await ctx.db
        .select({ probability: forecasts.probability })
        .from(forecasts)
        .where(
          and(
            eq(forecasts.targetSymbol, t.symbol),
            eq(forecasts.resolveAt, t.resolveAt),
          ),
        )
        .limit(1)
        .all();
      if (r.length > 0) {
        prevRows.push({ symbol: t.symbol, probability: r[0].probability });
      }
    }

    const input: Input = {
      date: ctx.date,
      asOf: now.toISOString(),
      indices: idxRows,
      marketBrief: brief,
      forecastTargets,
      previousForecasts: prevRows,
    };

    return [{ key: "_singleton", input }];
  },

  async run(target: Target<Input>, ctx: PipelineCtx): Promise<BatchOutput> {
    const input = target.input;
    const results = runClaudeCli<OutputItem>({
      prompt: PROMPT,
      inputJson: input,
      outputItemSchema: OutputItemSchema,
      label: "ai-forecast",
    });
    if (results.length === 0) throw new Error("LLM が結果を返さなかった");

    const bySymbol = new Map(results.map((r) => [r.symbol, r]));
    const items: BatchOutput["items"] = [];
    for (const t of input.forecastTargets) {
      const r = bySymbol.get(t.symbol);
      if (!r) {
        console.warn(`    ! ${t.symbol} の予測が返ってこなかった`);
        continue;
      }
      items.push({
        ...r,
        name: t.name,
        targetKind: t.targetKind,
        question: t.question,
        resolveAt: t.resolveAt,
      });
    }
    if (items.length === 0) throw new Error("有効な予測が 1 件も返らなかった");

    return {
      date: ctx.date,
      generatedAt: new Date().toISOString(),
      items,
    };
  },

  async applyLocal(_target: Target<Input>, output: BatchOutput, _ctx: PipelineCtx) {
    const now = new Date().toISOString();
    const shiftAt = now.slice(0, 16);

    for (const item of output.items) {
      // forecasts UPSERT
      await _ctx.db
        .insert(forecasts)
        .values({
          targetSymbol: item.symbol,
          targetName: item.name,
          targetKind: item.targetKind,
          stockCode: null,
          horizon: "next-session",
          question: item.question,
          headline: item.headline,
          lede: item.lede,
          probability: item.probability,
          confidence: item.confidence,
          resolveAt: item.resolveAt,
          referencePrice: item.referencePrice ?? null,
          status: "live",
          outcome: null,
          outcomePrice: null,
          outcomeAt: null,
          closingNote: item.closingNote ?? null,
          generatedAt: output.generatedAt,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [forecasts.targetSymbol, forecasts.resolveAt],
          set: {
            targetName: item.name,
            targetKind: item.targetKind,
            question: item.question,
            headline: item.headline,
            lede: item.lede,
            probability: item.probability,
            confidence: item.confidence,
            referencePrice: item.referencePrice ?? null,
            closingNote: item.closingNote ?? null,
            generatedAt: output.generatedAt,
            updatedAt: now,
          },
        })
        .run();

      const row = await _ctx.db
        .select({ id: forecasts.id })
        .from(forecasts)
        .where(
          and(
            eq(forecasts.targetSymbol, item.symbol),
            eq(forecasts.resolveAt, item.resolveAt),
          ),
        )
        .limit(1)
        .all();
      if (row.length === 0) continue;
      const forecastId = row[0].id;

      // takes を一旦削除して入れ直す (kind+position の都合)
      await _ctx.db
        .delete(forecastTakes)
        .where(eq(forecastTakes.forecastId, forecastId))
        .run();
      const positionByKind = new Map<string, number>();
      for (const take of item.takes) {
        const pos = positionByKind.get(take.kind) ?? 0;
        positionByKind.set(take.kind, pos + 1);
        await _ctx.db
          .insert(forecastTakes)
          .values({
            forecastId,
            kind: take.kind,
            position: pos,
            heading: take.heading,
            body: take.body,
            bias: take.bias,
          })
          .run();
      }

      // scenarios も置き換え
      await _ctx.db
        .delete(forecastScenarios)
        .where(eq(forecastScenarios.forecastId, forecastId))
        .run();
      for (const sc of item.scenarios) {
        await _ctx.db
          .insert(forecastScenarios)
          .values({
            forecastId,
            kind: sc.kind,
            label: sc.label,
            probability: sc.probability,
            priceLow: sc.priceLow ?? null,
            priceHigh: sc.priceHigh ?? null,
            note: sc.note,
          })
          .run();
      }

      // shifts は積む
      await _ctx.db
        .insert(forecastShifts)
        .values({
          forecastId,
          at: shiftAt,
          probability: item.probability,
          reason: item.closingNote ?? null,
        })
        .onConflictDoUpdate({
          target: [forecastShifts.forecastId, forecastShifts.at],
          set: { probability: item.probability },
        })
        .run();
    }
  },

  writeLakePath(_target, ctx) {
    const hh = new Date().toISOString().slice(11, 13);
    return aiGeneratedPath("ai-forecast", ctx.date, hh);
  },

  sqlFor(_key, output): string[] {
    const now = new Date().toISOString();
    const shiftAt = now.slice(0, 16);
    const stmts: string[] = [];

    for (const item of output.items) {
      // forecasts UPSERT
      const fCols = [
        "target_symbol",
        "target_name",
        "target_kind",
        "stock_code",
        "horizon",
        "question",
        "headline",
        "lede",
        "probability",
        "confidence",
        "resolve_at",
        "reference_price",
        "status",
        "closing_note",
        "generated_at",
        "created_at",
        "updated_at",
      ];
      const fVals = [
        sqlLit(item.symbol),
        sqlLit(item.name),
        sqlLit(item.targetKind),
        "NULL",
        sqlLit("next-session"),
        sqlLit(item.question),
        sqlLit(item.headline),
        sqlLit(item.lede),
        sqlLit(item.probability),
        sqlLit(item.confidence),
        sqlLit(item.resolveAt),
        item.referencePrice != null ? sqlLit(item.referencePrice) : "NULL",
        sqlLit("live"),
        item.closingNote ? sqlLit(item.closingNote) : "NULL",
        sqlLit(output.generatedAt),
        sqlLit(now),
        sqlLit(now),
      ].join(",");
      const fColList = fCols.map(sqlIdent).join(",");
      stmts.push(
        `INSERT INTO ${sqlIdent("forecasts")} (${fColList}) VALUES (${fVals}) ON CONFLICT(target_symbol, resolve_at) DO UPDATE SET target_name = excluded.target_name, target_kind = excluded.target_kind, question = excluded.question, headline = excluded.headline, lede = excluded.lede, probability = excluded.probability, confidence = excluded.confidence, reference_price = excluded.reference_price, closing_note = excluded.closing_note, generated_at = excluded.generated_at, updated_at = excluded.updated_at;`,
      );

      // takes / scenarios は forecast_id を SELECT して入れ直す。
      // CTE で id を確定させて、DELETE → INSERT を順に並べる。
      stmts.push(
        `DELETE FROM ${sqlIdent("forecast_takes")} WHERE forecast_id = (SELECT id FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAt)});`,
      );
      const posByKind = new Map<string, number>();
      for (const take of item.takes) {
        const pos = posByKind.get(take.kind) ?? 0;
        posByKind.set(take.kind, pos + 1);
        stmts.push(
          `INSERT INTO ${sqlIdent(
            "forecast_takes",
          )} (forecast_id, kind, position, heading, body, bias) SELECT id, ${sqlLit(
            take.kind,
          )}, ${sqlLit(pos)}, ${sqlLit(take.heading)}, ${sqlLit(take.body)}, ${sqlLit(
            take.bias,
          )} FROM ${sqlIdent("forecasts")} WHERE target_symbol = ${sqlLit(
            item.symbol,
          )} AND resolve_at = ${sqlLit(item.resolveAt)};`,
        );
      }

      stmts.push(
        `DELETE FROM ${sqlIdent("forecast_scenarios")} WHERE forecast_id = (SELECT id FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAt)});`,
      );
      for (const sc of item.scenarios) {
        stmts.push(
          `INSERT INTO ${sqlIdent(
            "forecast_scenarios",
          )} (forecast_id, kind, label, probability, price_low, price_high, note) SELECT id, ${sqlLit(
            sc.kind,
          )}, ${sqlLit(sc.label)}, ${sqlLit(sc.probability)}, ${
            sc.priceLow != null ? sqlLit(sc.priceLow) : "NULL"
          }, ${sc.priceHigh != null ? sqlLit(sc.priceHigh) : "NULL"}, ${sqlLit(sc.note)} FROM ${sqlIdent(
            "forecasts",
          )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAt)};`,
        );
      }

      // shifts INSERT (id を SELECT)
      stmts.push(
        `INSERT INTO ${sqlIdent(
          "forecast_shifts",
        )} (forecast_id, at, probability, reason) SELECT id, ${sqlLit(shiftAt)}, ${sqlLit(
          item.probability,
        )}, ${item.closingNote ? sqlLit(item.closingNote) : "NULL"} FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(
          item.resolveAt,
        )} ON CONFLICT(forecast_id, at) DO UPDATE SET probability = excluded.probability;`,
      );
    }
    return stmts;
  },
};

function safeJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    // noop
  }
  return [];
}

export { forecastTask };
