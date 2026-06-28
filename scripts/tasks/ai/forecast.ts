/**
 * ai-forecast: トップ「AIの明日予想」を Polymarket 風で生成する。
 *
 * 1 回の Claude 呼び出しで以下を返させる:
 *   - 固定 2 本 (S&P 500 / 日経平均 翌営業日方向性)
 *   - AI スクラッチ 1〜3 本 (その日に立つ旬の Yes/No 二択 Issue)
 *
 * 設計方針:
 *   - AI は曖昧な解 (47〜53%) を出さない。明確に Yes か No に賭ける
 *   - Polymarket 風: yesLabel / noLabel / position を保持し、UI で大型 Yes/No 表示
 *   - スキーマは forecasts に持つ 5 カラム (issueKind / position / yesLabel / noLabel / topicSlug) を全部埋める
 *
 * テーブル:
 *   forecasts (1 予測 1 行) / forecast_takes / forecast_scenarios / forecast_shifts
 *
 * 詳細仕様は docs/forecast-feature.md。
 */
import { and, desc, eq, gte } from "drizzle-orm";
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

type FixedTargetDef = {
  symbol: "^GSPC" | "^N225";
  name: string;
  targetKind: "global-index";
  question: string;
  yesLabel: string;
  noLabel: string;
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
  fixedTargets: FixedTargetDef[];
  previousForecasts: Array<{
    symbol: string;
    probability: number;
    position: "yes" | "no" | null;
  }>;
  /** 直近 7 日の topic_slug。スクラッチでこれと重複させない */
  recentTopicSlugs: string[];
};

const TakeSchema = z.object({
  kind: z.enum(["macro", "technical", "sentiment", "bull", "bear", "key-data"]),
  heading: z.string().min(6).max(40),
  body: z.string().min(80).max(420),
  bias: z.enum(["up", "down", "neutral"]).default("neutral"),
});

const ScenarioSchema = z.object({
  kind: z.enum(["base", "bull", "bear", "yes-case", "no-case"]),
  label: z.string().min(2).max(20),
  probability: z.number().int().min(0).max(100),
  priceLow: z.number().nullable().optional(),
  priceHigh: z.number().nullable().optional(),
  note: z.string().min(40).max(220),
});

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const OutputItemSchema = z
  .object({
    /** "fixed-index" は ^GSPC / ^N225 のどちらか。"ai-scratch" は AI 提案 */
    issueKind: z.enum(["fixed-index", "ai-scratch"]),
    /** 固定なら ^GSPC / ^N225、スクラッチなら kebab-case の topic_slug */
    symbol: z.string().min(1).max(80),
    /** Yes/No 二択に閉じる質問。14-40字 */
    question: z.string().min(10).max(80),
    /** 短い結論 8-26字 */
    headline: z.string().min(6).max(40),
    /** Yes/No それぞれの自然語ラベル ("プラス" / "152円超え" 等) */
    yesLabel: z.string().min(1).max(20),
    noLabel: z.string().min(1).max(20),
    /** AI が取ったポジション。曖昧解を避けるため必ず明示 */
    position: z.enum(["yes", "no"]),
    /** YES 側の確率 0-100。 position="no" を取った時も YES 側の数値を書く (= "no を 70% で取った" → probability=30) */
    probability: z.number().int().min(0).max(100),
    confidence: z.enum(["low", "med", "high"]),
    /** 解決時刻 ISO 8601 (例 "2026-06-29T05:00:00+09:00") */
    resolveAtIso: z.string().regex(ISO_REGEX),
    referencePrice: z.number().nullable().optional(),
    lede: z.string().min(80).max(280),
    takes: z.array(TakeSchema).min(3).max(8),
    scenarios: z.array(ScenarioSchema).length(3),
    closingNote: z.string().max(140).optional(),
  })
  .refine(
    (v) => {
      // 47-53 のような曖昧解を禁止
      if (v.probability >= 47 && v.probability <= 53) return false;
      return true;
    },
    { message: "probability は 47-53 の曖昧解禁止。60-80 を中心に分布させる" },
  )
  .refine(
    (v) => {
      // position と probability の整合性。"yes" を取ったなら probability >= 54 が必須
      if (v.position === "yes" && v.probability < 54) return false;
      if (v.position === "no" && v.probability > 46) return false;
      return true;
    },
    { message: "position と probability の向きが矛盾している" },
  );
type OutputItem = z.infer<typeof OutputItemSchema>;

type BatchOutput = {
  date: string;
  generatedAt: string;
  items: Array<
    OutputItem & {
      targetName: string;
      targetKind: "global-index" | "jp-stock" | "fx" | "commodity";
      topicSlug: string | null;
    }
  >;
};

// ──────────────────────────────────────────────────
// プロンプト
// ──────────────────────────────────────────────────

const PROMPT = `\
あなたは Bloomberg / Reuters 水準の中立的なマクロアナリストです。
出力は Polymarket スタイル: ユーザーは「AI がどちらに賭けたか」を素早く知りたい。

【絶対ルール】
- 各 Issue について、必ず position ("yes" or "no") を取れ。曖昧な中立を出してはならない
- probability は「YES (= 上がる/起こる) 側の確率」を 0-100 で書く
  - position="yes" を取った時: probability は 60-85 を中心 (= 自信度)
  - position="no" を取った時: probability は 15-40 を中心 (YES 側として小さい = "no 60-85%")
- 47-53 のような曖昧解は禁止
- 25 未満 / 90 超は重大な根拠がある場合のみ
- 「絶対」「確実」「暴落」「爆上げ」のような煽り語は禁止
- 入力 indices / marketBrief に無い数値は引用しない (捏造禁止)
- 投資助言と読める言い回し ("買い時です" 等) は禁止

【入力】
- indices: 主要指数のスナップショット
- marketBrief: 当日の AI 市況サマリ
- fixedTargets: 必ず予測すべき固定 2 本 (S&P 500 / 日経平均)
- previousForecasts: 前回 (6h 前) の確率と position。大きく変える時は変更理由を takes に書け
- recentTopicSlugs: 直近 7 日の AI スクラッチ Issue 一覧。これと重複しないこと

【出力】
results 配列に以下を返す:

1. fixedTargets の 2 本 (順序維持、issueKind="fixed-index")
2. AI スクラッチ Issue を 1〜3 本 (issueKind="ai-scratch")
   - その日に市場参加者が今夜気にしている粒度の話題を AI が立てる
   - カテゴリ例: 政策金利・FOMC / 為替節目 / 特定銘柄の決算結果 / 商品市況 / マクロ指標
   - 必ず Yes/No 二項に閉じる質問にする (例「ドル円は明日終値で 152 円を超えるか?」)
   - resolveAtIso は ISO 8601 で AI 自身が決定 (24h 以内〜1 週間以内が望ましい)
   - symbol は kebab-case の topic_slug (例 "usdjpy-152-2026-06-29", "boj-hike-2026-07")
   - scenarios.kind は ["base","yes-case","no-case"] を使う (指数の "bull/bear" ではない)

各エントリの形:
{
  "issueKind": "fixed-index",
  "symbol": "^GSPC",
  "question": "翌営業日の S&P 500 終値は前日比プラスか?",
  "headline": "テクニカル復調で上方バイアス",
  "yesLabel": "プラス",
  "noLabel": "マイナス",
  "position": "yes",
  "probability": 68,
  "confidence": "med",
  "resolveAtIso": "2026-06-29T05:00:00+09:00",
  "referencePrice": 5891.42,
  "lede": "100-220字",
  "takes": [
    { "kind": "macro", "heading": "FOMC ハト派", "body": "180-280字", "bias": "up" },
    { "kind": "technical", "heading": "50日線サポート", "body": "180-280字", "bias": "up" },
    { "kind": "sentiment", "heading": "VIX 低位", "body": "180-280字", "bias": "up" },
    { "kind": "bull", "heading": "...", "body": "...", "bias": "up" },
    { "kind": "bear", "heading": "...", "body": "...", "bias": "down" }
  ],
  "scenarios": [
    { "kind": "base", "label": "もみ合い", "probability": 45, "priceLow": 5860, "priceHigh": 5910, "note": "..." },
    { "kind": "bull", "label": "リスク選好", "probability": 35, "priceLow": 5910, "priceHigh": 5970, "note": "..." },
    { "kind": "bear", "label": "利確優勢", "probability": 20, "priceLow": 5790, "priceHigh": 5860, "note": "..." }
  ],
  "closingNote": "100字以内 (任意)"
}

【厳守: takes と scenarios】
- takes は macro / technical / sentiment の 3 つを必ず含める。bull / bear / key-data は任意
- 各 take.body は 180〜280字
- scenarios は 3 本必須
- 固定指数では ["base","bull","bear"]、スクラッチでは ["base","yes-case","no-case"] の組み合わせ
`;

// ──────────────────────────────────────────────────
// resolveAt 計算 (固定指数用)
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

function buildFixedTargets(now: Date): FixedTargetDef[] {
  return [
    {
      symbol: "^GSPC",
      name: "S&P 500",
      targetKind: "global-index",
      question: "翌営業日の S&P 500 終値は前日比プラスか?",
      yesLabel: "プラス",
      noLabel: "マイナス",
      resolveAt: nextBusinessDayAtJst(now, 5, 0),
    },
    {
      symbol: "^N225",
      name: "日経平均",
      targetKind: "global-index",
      question: "翌営業日の日経平均終値は前日比プラスか?",
      yesLabel: "プラス",
      noLabel: "マイナス",
      resolveAt: jstSameOrNextDayAt(now, 15),
    },
  ];
}

// ──────────────────────────────────────────────────
// 補助: スクラッチ Issue の見出し
// ──────────────────────────────────────────────────

function targetNameForScratch(symbol: string): string {
  // topic_slug をそのまま見出しに使うと味気ないので軽く整える。
  // 例 "usdjpy-152-2026-06-29" → "Usdjpy 152 2026 06 29"
  return symbol
    .replace(/[_]/g, "-")
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// ──────────────────────────────────────────────────
// Task 定義
// ──────────────────────────────────────────────────

const forecastTask: Task<Input, BatchOutput> & SyncCapable<BatchOutput> = {
  name: "ai-forecast",
  kind: "ai",
  description:
    "Polymarket 風 AI 予想を生成 (固定 2 + スクラッチ 1-3) → forecasts / forecast_takes / forecast_scenarios / forecast_shifts",
  outputSchema: OutputItemSchema,
  outputTemplate: {
    results: [
      {
        issueKind: "fixed-index",
        symbol: "^GSPC",
        question: "",
        headline: "",
        yesLabel: "プラス",
        noLabel: "マイナス",
        position: "yes",
        probability: 65,
        confidence: "med",
        resolveAtIso: "2026-06-29T05:00:00+09:00",
        referencePrice: null,
        lede: "",
        takes: [],
        scenarios: [],
      },
    ],
  },
  promptTemplate: PROMPT,
  remoteTable: "forecasts",

  async selectTargets(ctx): Promise<Target<Input>[]> {
    const now = new Date();
    const fixedTargets = buildFixedTargets(now);

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

    // 前回 (= 同じ resolveAt) の予測
    const prevRows: Input["previousForecasts"] = [];
    for (const t of fixedTargets) {
      const r = await ctx.db
        .select({ probability: forecasts.probability, position: forecasts.position })
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
        prevRows.push({
          symbol: t.symbol,
          probability: r[0].probability,
          position: (r[0].position as "yes" | "no" | null) ?? null,
        });
      }
    }

    // 直近 7 日の topic_slug
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString();
    const recentSlugRows = await ctx.db
      .select({ topicSlug: forecasts.topicSlug })
      .from(forecasts)
      .where(
        and(
          eq(forecasts.issueKind, "ai-scratch"),
          gte(forecasts.generatedAt, sevenDaysAgoIso),
        ),
      )
      .all();
    const recentTopicSlugs = recentSlugRows
      .map((r) => r.topicSlug)
      .filter((s): s is string => !!s);

    const input: Input = {
      date: ctx.date,
      asOf: now.toISOString(),
      indices: idxRows,
      marketBrief: brief,
      fixedTargets,
      previousForecasts: prevRows,
      recentTopicSlugs,
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

    const fixedSymbols = new Set<string>(input.fixedTargets.map((t) => t.symbol));
    const items: BatchOutput["items"] = [];
    for (const r of results) {
      if (r.issueKind === "fixed-index") {
        const def = input.fixedTargets.find((t) => t.symbol === r.symbol);
        if (!def) {
          console.warn(`    ! fixed-index で未知 symbol: ${r.symbol}`);
          continue;
        }
        items.push({
          ...r,
          resolveAtIso: def.resolveAt,
          yesLabel: def.yesLabel,
          noLabel: def.noLabel,
          targetName: def.name,
          targetKind: def.targetKind,
          topicSlug: null,
        });
      } else {
        if (fixedSymbols.has(r.symbol)) {
          console.warn(`    ! ai-scratch で固定 symbol を提案: ${r.symbol}`);
          continue;
        }
        items.push({
          ...r,
          targetName: targetNameForScratch(r.symbol),
          targetKind: "global-index",
          topicSlug: r.symbol,
        });
      }
    }
    if (items.length === 0) throw new Error("有効な予測が 1 件も返らなかった");

    return {
      date: ctx.date,
      generatedAt: new Date().toISOString(),
      items,
    };
  },

  validateOutput(output: BatchOutput) {
    // 2 件未満は v2 トップの予測コーナーが寂しくなる(fixed-index + ai-scratch >=1)
    if (!Array.isArray(output.items) || output.items.length < 2) {
      return { ok: false, reason: `items ${output.items?.length ?? 0} 件 < 2` };
    }
    for (const it of output.items) {
      if (typeof it.probability !== "number") {
        return { ok: false, reason: "probability 数値でない" };
      }
      if (!it.lede || it.lede.length < 80) {
        return { ok: false, reason: `${it.symbol} lede 短すぎ (${it.lede?.length ?? 0}字)` };
      }
      if (!Array.isArray(it.takes) || it.takes.length < 3) {
        return { ok: false, reason: `${it.symbol} takes ${it.takes?.length ?? 0} 件 < 3` };
      }
    }
    return { ok: true };
  },

  async applyLocal(_target: Target<Input>, output: BatchOutput, _ctx: PipelineCtx) {
    const now = new Date().toISOString();
    const shiftAt = now.slice(0, 16);

    for (const item of output.items) {
      await _ctx.db
        .insert(forecasts)
        .values({
          targetSymbol: item.symbol,
          targetName: item.targetName,
          targetKind: item.targetKind,
          stockCode: null,
          horizon: "next-session",
          question: item.question,
          headline: item.headline,
          lede: item.lede,
          probability: item.probability,
          confidence: item.confidence,
          resolveAt: item.resolveAtIso,
          referencePrice: item.referencePrice ?? null,
          issueKind: item.issueKind,
          position: item.position,
          yesLabel: item.yesLabel,
          noLabel: item.noLabel,
          topicSlug: item.topicSlug,
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
            targetName: item.targetName,
            targetKind: item.targetKind,
            question: item.question,
            headline: item.headline,
            lede: item.lede,
            probability: item.probability,
            confidence: item.confidence,
            referencePrice: item.referencePrice ?? null,
            issueKind: item.issueKind,
            position: item.position,
            yesLabel: item.yesLabel,
            noLabel: item.noLabel,
            topicSlug: item.topicSlug,
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
            eq(forecasts.resolveAt, item.resolveAtIso),
          ),
        )
        .limit(1)
        .all();
      if (row.length === 0) continue;
      const forecastId = row[0].id;

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

  sqlFor(_key, output: BatchOutput): string[] {
    const now = new Date().toISOString();
    const shiftAt = now.slice(0, 16);
    const stmts: string[] = [];

    for (const item of output.items) {
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
        "issue_kind",
        "position",
        "yes_label",
        "no_label",
        "topic_slug",
        "status",
        "closing_note",
        "generated_at",
        "created_at",
        "updated_at",
      ];
      const fVals = [
        sqlLit(item.symbol),
        sqlLit(item.targetName),
        sqlLit(item.targetKind),
        "NULL",
        sqlLit("next-session"),
        sqlLit(item.question),
        sqlLit(item.headline),
        sqlLit(item.lede),
        sqlLit(item.probability),
        sqlLit(item.confidence),
        sqlLit(item.resolveAtIso),
        item.referencePrice != null ? sqlLit(item.referencePrice) : "NULL",
        sqlLit(item.issueKind),
        sqlLit(item.position),
        sqlLit(item.yesLabel),
        sqlLit(item.noLabel),
        item.topicSlug ? sqlLit(item.topicSlug) : "NULL",
        sqlLit("live"),
        item.closingNote ? sqlLit(item.closingNote) : "NULL",
        sqlLit(output.generatedAt),
        sqlLit(now),
        sqlLit(now),
      ].join(",");
      const fColList = fCols.map(sqlIdent).join(",");
      stmts.push(
        `INSERT INTO ${sqlIdent("forecasts")} (${fColList}) VALUES (${fVals}) ON CONFLICT(target_symbol, resolve_at) DO UPDATE SET target_name = excluded.target_name, target_kind = excluded.target_kind, question = excluded.question, headline = excluded.headline, lede = excluded.lede, probability = excluded.probability, confidence = excluded.confidence, reference_price = excluded.reference_price, issue_kind = excluded.issue_kind, position = excluded.position, yes_label = excluded.yes_label, no_label = excluded.no_label, topic_slug = excluded.topic_slug, closing_note = excluded.closing_note, generated_at = excluded.generated_at, updated_at = excluded.updated_at;`,
      );

      stmts.push(
        `DELETE FROM ${sqlIdent("forecast_takes")} WHERE forecast_id = (SELECT id FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAtIso)});`,
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
          )} AND resolve_at = ${sqlLit(item.resolveAtIso)};`,
        );
      }

      stmts.push(
        `DELETE FROM ${sqlIdent("forecast_scenarios")} WHERE forecast_id = (SELECT id FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAtIso)});`,
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
          )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(item.resolveAtIso)};`,
        );
      }

      stmts.push(
        `INSERT INTO ${sqlIdent(
          "forecast_shifts",
        )} (forecast_id, at, probability, reason) SELECT id, ${sqlLit(shiftAt)}, ${sqlLit(
          item.probability,
        )}, ${item.closingNote ? sqlLit(item.closingNote) : "NULL"} FROM ${sqlIdent(
          "forecasts",
        )} WHERE target_symbol = ${sqlLit(item.symbol)} AND resolve_at = ${sqlLit(
          item.resolveAtIso,
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
