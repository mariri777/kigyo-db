/**
 * pnpm pipeline doctor:
 *   ローカル D1 が「v2 を本番に出して恥ずかしくない健康状態か」を一目で判定する。
 *
 * 出力例:
 *   🩺 ローカル D1 ヘルスチェック
 *     ✅ companies/stocks         3572 / 3572
 *     ✅ stock_snapshot           price 埋まり 99.4% (3551/3572)
 *     ✅ market_indices           5/5
 *     ✅ market_brief             1 件 (date=2026-06-28)
 *     ✅ homepage_highlights      8 件 (最新 as_of=2026-06-28)
 *     ⚠ company_ai_brief         summary 入り 1.4% (50/3572)
 *     ❌ company_ai_brief         valuation 入り 0% — トヨタ等メジャーがゼロ
 *
 * 1 つでも ❌ があれば exit 1。
 *
 * 「Yahoo こけたまま AI 流して全 NULL が成功扱い」事故の再発防止として、
 * - リリース前
 * - sync-remote の前(=本番反映の前)
 * の 2 箇所で叩く想定。
 */
import { sql } from "drizzle-orm";

import { getLocalDb } from "./d1-local.js";

type Severity = "ok" | "warn" | "fail";
type Line = { sev: Severity; section: string; msg: string };

const TOTAL_STOCKS_MIN = 3000;
const SNAPSHOT_PRICE_RATIO_FAIL = 0.5; // 50% 未満は致命
const SNAPSHOT_PRICE_RATIO_WARN = 0.95;
const MARKET_INDICES_MIN_VALUES = 3;
const HIGHLIGHTS_MIN = 1;

// メジャー銘柄: 全部 snapshot に price が入っていないと「Yahoo こけた」と同じ事故
const MAJOR_CODES = ["7203", "6758", "9984", "8306", "9432", "8035", "6861", "9433", "7974", "6594"];

async function check(): Promise<{ lines: Line[]; failures: number }> {
  const db = getLocalDb();
  const lines: Line[] = [];

  const totalStocksRow = await db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM stocks`,
  );
  const totalStocks = (totalStocksRow as Array<{ n: number }>)[0]?.n ?? 0;

  const totalCompaniesRow = await db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM companies`,
  );
  const totalCompanies = (totalCompaniesRow as Array<{ n: number }>)[0]?.n ?? 0;

  if (totalStocks < TOTAL_STOCKS_MIN) {
    lines.push({
      sev: "fail",
      section: "companies/stocks",
      msg: `stocks=${totalStocks} (< ${TOTAL_STOCKS_MIN}). pnpm pipeline run fetch-jpx`,
    });
  } else {
    lines.push({
      sev: "ok",
      section: "companies/stocks",
      msg: `companies=${totalCompanies} stocks=${totalStocks}`,
    });
  }

  // stock_snapshot: price 埋まり率
  const snapRow = (await db.all<{ filled: number }>(
    sql`SELECT COUNT(*) AS filled FROM stock_snapshot WHERE price_jpy IS NOT NULL`,
  )) as Array<{ filled: number }>;
  const filled = snapRow[0]?.filled ?? 0;
  const ratio = totalStocks > 0 ? filled / totalStocks : 0;
  if (ratio < SNAPSHOT_PRICE_RATIO_FAIL) {
    lines.push({
      sev: "fail",
      section: "stock_snapshot",
      msg: `price 埋まり ${(ratio * 100).toFixed(1)}% (${filled}/${totalStocks}) — Yahoo の rate limit を疑え`,
    });
  } else if (ratio < SNAPSHOT_PRICE_RATIO_WARN) {
    lines.push({
      sev: "warn",
      section: "stock_snapshot",
      msg: `price 埋まり ${(ratio * 100).toFixed(1)}% (${filled}/${totalStocks})`,
    });
  } else {
    lines.push({
      sev: "ok",
      section: "stock_snapshot",
      msg: `price 埋まり ${(ratio * 100).toFixed(1)}% (${filled}/${totalStocks})`,
    });
  }

  // メジャー銘柄が抜けていないか
  const majorList = MAJOR_CODES.map((c) => `'${c}'`).join(",");
  const majorMissingRow = (await db.all<{ code: string }>(
    sql.raw(
      `SELECT s.code FROM stocks s LEFT JOIN stock_snapshot ss ON ss.code=s.code WHERE s.code IN (${majorList}) AND ss.price_jpy IS NULL`,
    ),
  )) as Array<{ code: string }>;
  if (majorMissingRow.length > 0) {
    lines.push({
      sev: "fail",
      section: "stock_snapshot",
      msg: `メジャー銘柄が未取得: ${majorMissingRow.map((r) => r.code).join(",")}`,
    });
  } else {
    lines.push({
      sev: "ok",
      section: "stock_snapshot",
      msg: `メジャー銘柄(${MAJOR_CODES.length}社)全部 price あり`,
    });
  }

  // market_indices
  const idxRow = (await db.all<{ n: number; total: number }>(
    sql`SELECT
          (SELECT COUNT(*) FROM market_indices WHERE value IS NOT NULL) AS n,
          (SELECT COUNT(*) FROM market_indices) AS total`,
  )) as Array<{ n: number; total: number }>;
  const idxOk = idxRow[0]?.n ?? 0;
  const idxTotal = idxRow[0]?.total ?? 0;
  if (idxOk < MARKET_INDICES_MIN_VALUES) {
    lines.push({
      sev: "fail",
      section: "market_indices",
      msg: `value 入り ${idxOk}/${idxTotal} (< ${MARKET_INDICES_MIN_VALUES})`,
    });
  } else {
    lines.push({
      sev: "ok",
      section: "market_indices",
      msg: `value 入り ${idxOk}/${idxTotal}`,
    });
  }

  // market_brief
  const briefRow = (await db.all<{ n: number; latest: string | null }>(
    sql`SELECT COUNT(*) AS n, MAX(date) AS latest FROM market_brief`,
  )) as Array<{ n: number; latest: string | null }>;
  const briefN = briefRow[0]?.n ?? 0;
  const latest = briefRow[0]?.latest ?? null;
  lines.push({
    sev: briefN === 0 ? "warn" : "ok",
    section: "market_brief",
    msg: `${briefN} 件 (latest=${latest ?? "なし"})`,
  });

  // homepage_highlights
  const hlRow = (await db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM homepage_highlights WHERE as_of=(SELECT MAX(as_of) FROM homepage_highlights)`,
  )) as Array<{ n: number }>;
  const hlN = hlRow[0]?.n ?? 0;
  if (hlN < HIGHLIGHTS_MIN) {
    lines.push({
      sev: "warn",
      section: "homepage_highlights",
      msg: `最新 as_of の件数 ${hlN}`,
    });
  } else {
    lines.push({ sev: "ok", section: "homepage_highlights", msg: `最新 ${hlN} 件` });
  }

  // company_ai_brief 充足
  const briefCols = [
    "summary",
    "valuation_rationale",
    "stock_trend_analysis",
    "positioning_headline",
  ];
  for (const col of briefCols) {
    const r = (await db.all<{ n: number }>(
      sql.raw(`SELECT COUNT(*) AS n FROM company_ai_brief WHERE ${col} IS NOT NULL`),
    )) as Array<{ n: number }>;
    const n = r[0]?.n ?? 0;
    const pct = totalStocks > 0 ? ((n / totalStocks) * 100).toFixed(1) : "0";
    lines.push({
      sev: n === 0 ? "warn" : "ok",
      section: `company_ai_brief.${col}`,
      msg: `${pct}% (${n}/${totalStocks})`,
    });
  }

  // predictions + forecasts(後者は新スキーマで forecasts に分離されている可能性)
  try {
    const forecastRow = (await db.all<{ n: number }>(
      sql.raw(`SELECT COUNT(*) AS n FROM forecasts WHERE resolve_at > datetime('now')`),
    )) as Array<{ n: number }>;
    const fc = forecastRow[0]?.n ?? 0;
    lines.push({
      sev: fc === 0 ? "warn" : "ok",
      section: "forecasts",
      msg: `未解決 ${fc} 件`,
    });
  } catch {
    // forecasts テーブルが存在しなければスキップ (旧スキーマでは predictions のみ)
    const predRow = (await db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM predictions WHERE resolve_at > datetime('now')`,
    )) as Array<{ n: number }>;
    const pc = predRow[0]?.n ?? 0;
    lines.push({
      sev: pc === 0 ? "warn" : "ok",
      section: "predictions",
      msg: `未解決 ${pc} 件`,
    });
  }

  const failures = lines.filter((l) => l.sev === "fail").length;
  return { lines, failures };
}

export async function runDoctor(): Promise<void> {
  console.log("🩺 ローカル D1 ヘルスチェック\n");
  const { lines, failures } = await check();
  for (const l of lines) {
    const icon = l.sev === "ok" ? "✅" : l.sev === "warn" ? "⚠ " : "❌";
    console.log(`  ${icon} ${l.section.padEnd(32)} ${l.msg}`);
  }
  if (failures > 0) {
    console.error(
      `\n❌ ${failures} 件の致命的問題。リリース前にこれを潰すこと(exit 1)。`,
    );
    process.exit(1);
  }
  console.log("\n✅ 致命的問題なし。リリース・sync-remote OK。");
}
