/**
 * Step 4. parse
 * R2 の XBRL を読み、SUMMARY_METRICS + PL_METRICS から
 *   - financials_annual (連結, Summary 5期分)
 *   - dividends (10年分)
 *   - companies.employees_consolidated
 *   - stock_snapshot.latest_*, ev_ebitda 等は今回スキップ (LLM 派生は別)
 * を upsert する。
 *
 * 注意: companies は EDINET コードを uq に持つ (schema.ts)。既存社にマッチしない場合は
 *   - secCode が一致する stock がいれば、その companyId を取る
 *   - どちらも無ければスキップ (seed が先に走っている前提)
 */
import { and, eq } from "drizzle-orm";
import { getLocalDb } from "../lib/local-db.js";
import { createR2Client, type R2Target } from "../lib/r2.js";
import {
  companies,
  dividends,
  edinetDocs,
  financialsAnnual,
  stocks,
} from "../../src/server/db/schema.js";
import {
  extractCoverMeta,
  extractDividendSchedules,
  extractFromXbrl,
  type CoverMeta,
  type DividendSchedule,
  type ExtractedFinancials,
} from "../lib/edinet-parser.js";

export async function parseDownloaded(target: R2Target): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoCompany: number;
}> {
  const db = getLocalDb();
  const r2 = createR2Client(target);
  const candidates = db
    .select()
    .from(edinetDocs)
    .where(eq(edinetDocs.fetchStatus, "downloaded"))
    .all()
    .filter((d) => d.r2XbrlKey != null);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of candidates) {
    const now = new Date().toISOString();
    try {
      const xml = new TextDecoder("utf-8").decode(await r2.get(doc.r2XbrlKey!));
      const extracted = extractFromXbrl(xml);
      const coverMeta = extractCoverMeta(xml);
      const dividendSchedules = extractDividendSchedules(xml);

      // companies を edinet_code で探す。なければ secCode (4桁) で探す
      const companyId = resolveCompanyId(extracted, doc.edinetCode, doc.secCode);
      if (companyId == null) {
        db.update(edinetDocs)
          .set({
            fetchStatus: "failed",
            failedReason: "no matching company (seed が必要かも)",
            updatedAt: now,
          })
          .where(eq(edinetDocs.docId, doc.docId))
          .run();
        skipped++;
        continue;
      }

      writeFinancials(companyId, extracted);
      writeDividends(companyId, extracted, dividendSchedules);
      writeCompanyMeta(companyId, extracted, coverMeta);

      db.update(edinetDocs)
        .set({ fetchStatus: "parsed", updatedAt: now })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      succeeded++;
    } catch (e) {
      db.update(edinetDocs)
        .set({
          fetchStatus: "failed",
          failedReason: `parse: ${(e as Error).message}`,
          updatedAt: now,
        })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      failed++;
    }
  }

  return { attempted: candidates.length, succeeded, failed, skippedNoCompany: skipped };
}

function resolveCompanyId(
  extracted: ExtractedFinancials,
  edinetCode: string,
  secCode: string | null,
): number | null {
  const db = getLocalDb();
  // 1. edinet_code 一致
  const byEdinet = db.select().from(companies).where(eq(companies.edinetCode, edinetCode)).all();
  if (byEdinet.length > 0) return byEdinet[0].id;

  // 2. stocks.code (4 桁) 一致
  if (secCode) {
    const code4 = secCode.slice(0, 4);
    const byStock = db.select().from(stocks).where(eq(stocks.code, code4)).all();
    if (byStock.length > 0) return byStock[0].companyId;
  }

  return null;
}

function writeFinancials(companyId: number, e: ExtractedFinancials) {
  const db = getLocalDb();
  for (const row of e.summaryByFy) {
    const fy = row.fyLabel;
    if (!fy) continue;
    const revenueOku = row.revenue != null ? Math.round(row.revenue / 100_000_000) : null;
    // 注: ordinaryOku は schema にカラム無し (経常利益はテーブルに持たない)。
    // netOku は当期純利益。
    const netOku = row.netProfit != null ? Math.round(row.netProfit / 100_000_000) : null;
    // 営業利益は本表 (P/L) からの単一値しかないので、当期 (prior=0) のみ反映、他期は null
    let opOku: number | null = null;
    if (row.prior === 0 && e.currentPl.operatingProfit != null) {
      opOku = Math.round(e.currentPl.operatingProfit / 100_000_000);
    }
    const opMargin =
      revenueOku && opOku && revenueOku > 0 ? Number(((opOku / revenueOku) * 100).toFixed(2)) : null;

    db.insert(financialsAnnual)
      .values({
        companyId,
        fy,
        revenueOku,
        operatingProfitOku: opOku,
        operatingMargin: opMargin,
        netProfitOku: netOku,
        eps: row.eps ?? null,
      })
      .onConflictDoUpdate({
        target: [financialsAnnual.companyId, financialsAnnual.fy],
        set: {
          revenueOku,
          operatingProfitOku: opOku,
          operatingMargin: opMargin,
          netProfitOku: netOku,
          eps: row.eps ?? null,
        },
      })
      .run();
  }
}

function writeDividends(
  companyId: number,
  e: ExtractedFinancials,
  schedules: DividendSchedule[] = [],
) {
  const db = getLocalDb();
  // スケジュール (権利付き最終日 / 確定日 / 支払開始日) を fy → 値 でマップ化
  const byFy = new Map<string, DividendSchedule>();
  for (const s of schedules) {
    if (s.fy) byFy.set(s.fy, s);
  }

  // amount があるすべての期と、スケジュールしか無い期の両方を埋める
  const fySet = new Set<string>();
  for (const row of e.summaryByFy) {
    if (row.dividendPerShare != null) fySet.add(row.fyLabel);
  }
  for (const fy of byFy.keys()) fySet.add(fy);

  for (const fy of fySet) {
    const summaryRow = e.summaryByFy.find((r) => r.fyLabel === fy);
    const sched = byFy.get(fy);
    const amount = summaryRow?.dividendPerShare ?? null;
    const exDate = sched?.exDate ?? null;
    const recordDate = sched?.recordDate ?? null;
    const payDate = sched?.payDate ?? null;
    // 何も無ければスキップ
    if (amount == null && !exDate && !recordDate && !payDate) continue;

    // amount は既存値を壊さないように、null の場合 set から外す
    const setOnConflict: Record<string, unknown> = {};
    if (amount != null) setOnConflict.amount = amount;
    if (exDate) setOnConflict.exDate = exDate;
    if (recordDate) setOnConflict.recordDate = recordDate;
    if (payDate) setOnConflict.payDate = payDate;

    db.insert(dividends)
      .values({
        companyId,
        fy,
        amount,
        exDate,
        recordDate,
        payDate,
      })
      .onConflictDoUpdate({
        target: [dividends.companyId, dividends.fy],
        set: setOnConflict,
      })
      .run();
  }
}

function writeCompanyMeta(
  companyId: number,
  e: ExtractedFinancials,
  cover: CoverMeta = {},
) {
  const db = getLocalDb();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  // 当期 (prior=0) の従業員数を反映
  const current = e.summaryByFy.find((r) => r.prior === 0);
  if (current?.employees != null) {
    updates.employeesConsolidated = current.employees;
  }
  // EDINETコードを書き戻す
  if (e.edinetCode) updates.edinetCode = e.edinetCode;

  // 表紙メタ (取れた項目のみ上書き — 既存値を空文字で潰さない)
  if (cover.founded) updates.founded = cover.founded;
  if (cover.listed) updates.listed = cover.listed;
  if (cover.headquarters) updates.headquarters = cover.headquarters;
  if (cover.ceoName) updates.ceoName = cover.ceoName;
  if (cover.website) updates.website = cover.website;

  db.update(companies)
    .set(updates)
    .where(eq(companies.id, companyId))
    .run();
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  parseDownloaded("local").then((r) => {
    console.log(
      `parse: attempted=${r.attempted}, succeeded=${r.succeeded}, failed=${r.failed}, skipped=${r.skippedNoCompany}`,
    );
  });
}
