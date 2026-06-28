/**
 * derive-highlights: v2 トップの「本日のハイライト」を既存テーブルから抽出する。
 *
 * AI なし、SQL のルールベース。日次パイプラインの fetch-yahoo-snapshot 後、
 * ai-market-brief の前に走らせる (market_brief が一覧を参照したい可能性に備える)。
 *
 * 抽出ルール (kind 別):
 *   - price_anomaly:  |change_1d_pct| >= 5 の銘柄を上位 N
 *   - indicator_shift: priceJpy / ma200 が 1.00〜1.03 かつ change_1d_pct > 0
 *                     (200日線を僅差で上抜けた = テクニカル転換点)
 *   - dividend_shift: dividendYield >= 3.5% かつ change_1d_pct > 0 (高利回り再評価)
 *   - earnings_brief: 過去 7 日に financials_quarterly が UPSERT された companyId を拾う
 *                     (現状 quarterly テーブルに updated_at が無いので、今回は省略)
 *
 * 出力は homepage_highlights を target.input.date (= ctx.date) で「総入れ替え」する。
 * 1 日 1 スナップショット。
 */
import { sql } from "drizzle-orm";

import {
  homepageHighlights,
  stockSnapshot,
} from "../../../src/server/db/schema.js";
import { aiGeneratedPath } from "../../lib/lake.js";
import { sqlIdent, sqlLit, upsertChunks } from "../../lib/sql-escape.js";
import type { Target, Task } from "../../lib/task.js";
import type { SyncCapable } from "../../lib/sync-remote.js";

type Input = { date: string };
type HighlightRow = {
  id: string;
  kind: "earnings_brief" | "price_anomaly" | "indicator_shift" | "dividend_shift";
  subjectKind: "company" | "industry" | "theme" | "metric";
  subjectCode: string | null;
  subjectName: string;
  oneLiner: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  keyMetricPositive: 1 | 0 | null;
  source: string;
  publishedAt: string;
  publishedAtIso: string;
  relatedArticleSlug: string | null;
  score: number;
  asOf: string;
};
type Output = {
  date: string;
  rows: HighlightRow[];
};

const TABLE = "homepage_highlights";
const COLS = [
  "id",
  "kind",
  "subject_kind",
  "subject_code",
  "subject_name",
  "one_liner",
  "key_metric_label",
  "key_metric_value",
  "key_metric_positive",
  "source",
  "published_at",
  "published_at_iso",
  "related_article_slug",
  "score",
  "as_of",
];

/** 上位何件のハイライトを保持するか */
const MAX_HIGHLIGHTS = 8;
/** 株価異常検知のしきい値 (%) */
const PRICE_ANOMALY_THRESHOLD = 5;
/** 200日線「上抜け近傍」の上限比率 (ma200 比 +3%) */
const MA200_OVERSHOOT_MAX = 1.03;
/** 高利回り評価のしきい値 (%) */
const DIVIDEND_YIELD_THRESHOLD = 3.5;

const derivedHighlightsTask: Task<unknown, Output> & SyncCapable<Output> = {
  name: "derive-highlights",
  kind: "derive",
  description:
    "stock_snapshot などから日次ハイライトを抽出 → homepage_highlights を総入れ替え",
  remoteTable: TABLE,

  async selectTargets(ctx): Promise<Target<unknown>[]> {
    const t: Target<Input> = { key: ctx.date, input: { date: ctx.date } };
    return [t as Target<unknown>];
  },

  async run(target, ctx): Promise<Output> {
    const input = target.input as Input;
    const date = input.date;
    const rows: HighlightRow[] = [];

    // 1. price_anomaly: 大幅変動 (絶対値)
    const priceAnomaly = (await ctx.db.all(sql`
      SELECT
        s.code              AS code,
        c.name              AS name,
        s.change_1d_pct     AS change1d,
        s.price_jpy         AS price,
        s.price_date        AS asof
      FROM stock_snapshot s
      JOIN stocks st ON st.code = s.code
      JOIN companies c ON c.id = st.company_id
      WHERE s.change_1d_pct IS NOT NULL
        AND ABS(s.change_1d_pct) >= ${PRICE_ANOMALY_THRESHOLD}
      ORDER BY ABS(s.change_1d_pct) DESC
      LIMIT 6
    `)) as Array<{
      code: string;
      name: string;
      change1d: number;
      price: number | null;
      asof: string | null;
    }>;
    for (const r of priceAnomaly) {
      const positive = r.change1d > 0 ? 1 : 0;
      const direction = positive ? "急騰" : "急落";
      rows.push({
        id: `price-${date}-${r.code}`,
        kind: "price_anomaly",
        subjectKind: "company",
        subjectCode: r.code,
        subjectName: `${r.code} ${r.name}`,
        oneLiner: `前日比 ${formatPct(r.change1d)} で${direction}。${
          r.price ? `終値 ${formatJpy(r.price)}。` : ""
        }要因の整理を本日 AI が後追い。`,
        keyMetricLabel: "前日比",
        keyMetricValue: formatPct(r.change1d),
        keyMetricPositive: positive,
        source: "stock_snapshot.change_1d_pct",
        publishedAt: "15:01",
        publishedAtIso: `${r.asof ?? date}T15:01:00+09:00`,
        relatedArticleSlug: null,
        score: Math.abs(r.change1d) + 10,
        asOf: date,
      });
    }

    // 2. indicator_shift: 200日線近傍を上抜け (まだ過熱なし)
    const ma200Shift = (await ctx.db.all(sql`
      SELECT
        s.code              AS code,
        c.name              AS name,
        s.price_jpy         AS price,
        s.ma_200            AS ma200,
        s.change_1d_pct     AS change1d,
        s.rsi_14            AS rsi,
        s.price_date        AS asof
      FROM stock_snapshot s
      JOIN stocks st ON st.code = s.code
      JOIN companies c ON c.id = st.company_id
      WHERE s.price_jpy IS NOT NULL
        AND s.ma_200 IS NOT NULL
        AND s.ma_200 > 0
        AND (s.price_jpy / s.ma_200) BETWEEN 1.00 AND ${MA200_OVERSHOOT_MAX}
        AND s.change_1d_pct > 0
      ORDER BY s.change_1d_pct DESC
      LIMIT 4
    `)) as Array<{
      code: string;
      name: string;
      price: number;
      ma200: number;
      change1d: number;
      rsi: number | null;
      asof: string | null;
    }>;
    for (const r of ma200Shift) {
      const overshoot = ((r.price - r.ma200) / r.ma200) * 100;
      const rsiText = r.rsi != null ? ` RSI(14)は${r.rsi.toFixed(0)}で過熱感はまだ薄い。` : "";
      rows.push({
        id: `ma200-${date}-${r.code}`,
        kind: "indicator_shift",
        subjectKind: "company",
        subjectCode: r.code,
        subjectName: `${r.code} ${r.name}`,
        oneLiner: `終値が200日MA(${formatJpy(r.ma200)})を上抜け。${rsiText}`,
        keyMetricLabel: "対200日MA",
        keyMetricValue: `+${overshoot.toFixed(1)}%`,
        keyMetricPositive: 1,
        source: "stock_snapshot.ma_200 / price_jpy",
        publishedAt: "15:01",
        publishedAtIso: `${r.asof ?? date}T15:01:00+09:00`,
        relatedArticleSlug: null,
        score: 8 - overshoot, // ma200 にぴったり = スコア高
        asOf: date,
      });
    }

    // 3. dividend_shift: 高利回り銘柄 (本日上昇かつ利回り 3.5% 超)
    const divShift = (await ctx.db.all(sql`
      SELECT
        s.code              AS code,
        c.name              AS name,
        s.dividend_yield    AS yield,
        s.change_1d_pct     AS change1d,
        s.price_date        AS asof
      FROM stock_snapshot s
      JOIN stocks st ON st.code = s.code
      JOIN companies c ON c.id = st.company_id
      WHERE s.dividend_yield >= ${DIVIDEND_YIELD_THRESHOLD}
        AND s.change_1d_pct > 0
      ORDER BY s.dividend_yield DESC
      LIMIT 3
    `)) as Array<{
      code: string;
      name: string;
      yield: number;
      change1d: number;
      asof: string | null;
    }>;
    for (const r of divShift) {
      rows.push({
        id: `div-${date}-${r.code}`,
        kind: "dividend_shift",
        subjectKind: "company",
        subjectCode: r.code,
        subjectName: `${r.code} ${r.name}`,
        oneLiner: `配当利回り ${r.yield.toFixed(1)}% で再評価。本日 ${formatPct(r.change1d)}。`,
        keyMetricLabel: "配当利回り",
        keyMetricValue: `${r.yield.toFixed(1)}%`,
        keyMetricPositive: 1,
        source: "stock_snapshot.dividend_yield",
        publishedAt: "09:15",
        publishedAtIso: `${r.asof ?? date}T09:15:00+09:00`,
        relatedArticleSlug: null,
        score: r.yield,
        asOf: date,
      });
    }

    // スコア降順、ただし同種が連続しないようにラウンドロビン風にしたい場合は後で。
    // いったん score 降順で先頭 MAX_HIGHLIGHTS。
    rows.sort((a, b) => b.score - a.score);
    return { date, rows: rows.slice(0, MAX_HIGHLIGHTS) };
  },

  async applyLocal(_target, output, ctx) {
    const o = output as Output;
    // 同日付の既存ハイライトをいったん全削除して入れ替え (冪等)
    await ctx.db
      .delete(homepageHighlights)
      .where(sql`as_of = ${o.date}`)
      .run();
    if (o.rows.length === 0) return;
    await ctx.db
      .insert(homepageHighlights)
      .values(
        o.rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          subjectKind: r.subjectKind,
          subjectCode: r.subjectCode,
          subjectName: r.subjectName,
          oneLiner: r.oneLiner,
          keyMetricLabel: r.keyMetricLabel,
          keyMetricValue: r.keyMetricValue,
          keyMetricPositive: r.keyMetricPositive,
          source: r.source,
          publishedAt: r.publishedAt,
          publishedAtIso: r.publishedAtIso,
          relatedArticleSlug: r.relatedArticleSlug,
          score: r.score,
          asOf: r.asOf,
        })),
      )
      .run();
  },

  writeLakePath(_target, ctx) {
    return aiGeneratedPath("derive-highlights", ctx.date, "_daily");
  },

  sqlFor(_key, output): string[] {
    if (output.rows.length === 0) return [];
    // 同日付の既存行を消してから INSERT
    const stmts: string[] = [
      `DELETE FROM ${sqlIdent(TABLE)} WHERE ${sqlIdent("as_of")} = ${sqlLit(output.date)};`,
    ];
    const rows = output.rows.map((r) => [
      r.id,
      r.kind,
      r.subjectKind,
      r.subjectCode,
      r.subjectName,
      r.oneLiner,
      r.keyMetricLabel,
      r.keyMetricValue,
      r.keyMetricPositive,
      r.source,
      r.publishedAt,
      r.publishedAtIso,
      r.relatedArticleSlug,
      r.score,
      r.asOf,
    ]);
    stmts.push(
      ...upsertChunks(
        TABLE,
        COLS,
        rows,
        ["id"],
        COLS.filter((c) => c !== "id"),
      ),
    );
    return stmts;
  },
};

export { derivedHighlightsTask };

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────

function formatPct(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function formatJpy(v: number): string {
  if (v >= 10000) return `¥${(v / 1).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `¥${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
}
