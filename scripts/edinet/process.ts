/**
 * Step 2-4 (in-memory).
 *
 * discovered な edinet_docs を 1 件ずつ:
 *   1. EDINET から ZIP をメモリに DL
 *   2. ZIP を fflate で in-memory unzip し、PublicDoc 配下のメイン XBRL を抽出
 *   3. XBRL を parse して financials_annual / dividends / companies を UPSERT
 *
 * R2 や一時ディレクトリには一切書かない。同一プロセス内で完結。
 *
 * 旧 download/extract/parse の 3 step を廃止し本ファイルに統合した。理由:
 *   - EDINET XBRL の生 ZIP を永続保管するモチベが無くなった
 *   - GH Actions 1 ジョブ内で完結するなら中間 R2 は不要
 *   - 同一ジョブ内でやり直したいケースは、status='failed' を一度クリアして再 discover で十分
 */
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { unzipSync } from "fflate";

import { fetchDocZip, sleep } from "../lib/edinet-api.js";
import { getLocalDb } from "../lib/local-db.js";
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

const REQUEST_DELAY_MS = 200;

export type ProcessFilter = {
  /** プライム上場銘柄に限定する */
  primeOnly?: boolean;
  /** doc_type_code (例: ["120"] = 有報のみ) */
  docTypeCodes?: string[];
  /** sec_code 1 つにつき最新 1 件 (submit_date DESC) に絞る */
  latestPerSecCode?: boolean;
};

export async function processDiscovered(filter: ProcessFilter = {}): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoCompany: number;
}> {
  const db = getLocalDb();

  // 基本クエリ: discovered + secCode あり
  const conds: ReturnType<typeof eq>[] = [
    eq(edinetDocs.fetchStatus, "discovered"),
    isNotNull(edinetDocs.secCode) as unknown as ReturnType<typeof eq>,
  ];

  // プライム銘柄に限定: stocks から sec_code (5 桁) のセットを取る
  // stocks.code は 4 桁。EDINET の sec_code は 5 桁 (末尾 0)。
  if (filter.primeOnly) {
    const primeCodes = db
      .select({ code: stocks.code })
      .from(stocks)
      .where(eq(stocks.exchange, "Prime"))
      .all();
    const primeSecCodes = primeCodes.map((r) => `${r.code}0`);
    if (primeSecCodes.length === 0) {
      return { attempted: 0, succeeded: 0, failed: 0, skippedNoCompany: 0 };
    }
    conds.push(inArray(edinetDocs.secCode, primeSecCodes) as unknown as ReturnType<typeof eq>);
  }

  if (filter.docTypeCodes && filter.docTypeCodes.length > 0) {
    conds.push(inArray(edinetDocs.docTypeCode, filter.docTypeCodes) as unknown as ReturnType<typeof eq>);
  }

  let pending = db.select().from(edinetDocs).where(and(...conds)).all();

  // sec_code ごとに最新 1 件に絞る (submit_date DESC)
  if (filter.latestPerSecCode) {
    const bySec = new Map<string, typeof pending[number]>();
    for (const d of pending) {
      if (!d.secCode) continue;
      const ex = bySec.get(d.secCode);
      if (!ex || (d.submitDate ?? "") > (ex.submitDate ?? "")) bySec.set(d.secCode, d);
    }
    pending = Array.from(bySec.values());
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of pending) {
    const now = new Date().toISOString();
    try {
      // 1. DL
      const zipBuf = await fetchDocZip(doc.docId);

      // 2. unzip in-memory, pick the main PublicDoc xbrl
      const files = unzipSync(new Uint8Array(zipBuf));
      const xbrlPaths = Object.keys(files).filter(
        (p) => p.includes("PublicDoc") && p.endsWith(".xbrl"),
      );
      if (xbrlPaths.length === 0) {
        markFailed(doc.docId, "no PublicDoc xbrl in zip", now);
        failed++;
        continue;
      }
      // Audit は捨てる、本体は通常一番大きい
      const mainPath = xbrlPaths.sort((a, b) => files[b].length - files[a].length)[0];
      const xml = new TextDecoder("utf-8").decode(files[mainPath]);

      // 3. parse
      const extracted = extractFromXbrl(xml);
      const coverMeta = extractCoverMeta(xml);
      const dividendSchedules = extractDividendSchedules(xml);

      const companyId = resolveCompanyId(extracted, doc.edinetCode, doc.secCode);
      if (companyId == null) {
        markFailed(doc.docId, "no matching company (seed が必要かも)", now);
        skipped++;
        continue;
      }

      writeFinancials(companyId, extracted);
      writeDividends(companyId, extracted, dividendSchedules);
      writeCompanyMeta(companyId, extracted, coverMeta);
      writeStockListedShares(doc.secCode, extracted);

      db.update(edinetDocs)
        .set({ fetchStatus: "parsed", failedReason: null, updatedAt: now })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      succeeded++;
    } catch (e) {
      markFailed(doc.docId, `process: ${(e as Error).message}`, now);
      failed++;
    }
    // EDINET の利用ガイドライン上、過度な連続アクセスは避ける
    await sleep(REQUEST_DELAY_MS);
  }

  return { attempted: pending.length, succeeded, failed, skippedNoCompany: skipped };
}

function markFailed(docId: string, reason: string, now: string) {
  getLocalDb()
    .update(edinetDocs)
    .set({ fetchStatus: "failed", failedReason: reason, updatedAt: now })
    .where(eq(edinetDocs.docId, docId))
    .run();
}

function resolveCompanyId(
  extracted: ExtractedFinancials,
  edinetCode: string,
  secCode: string | null,
): number | null {
  const db = getLocalDb();
  const byEdinet = db.select().from(companies).where(eq(companies.edinetCode, edinetCode)).all();
  if (byEdinet.length > 0) return byEdinet[0].id;
  if (secCode) {
    const code4 = secCode.slice(0, 4);
    const byStock = db.select().from(stocks).where(eq(stocks.code, code4)).all();
    if (byStock.length > 0) return byStock[0].companyId;
  }
  void extracted;
  return null;
}

function writeFinancials(companyId: number, e: ExtractedFinancials) {
  const db = getLocalDb();
  for (const row of e.summaryByFy) {
    const fy = row.fyLabel;
    if (!fy) continue;
    const revenueOku = row.revenue != null ? Math.round(row.revenue / 100_000_000) : null;
    const netOku = row.netProfit != null ? Math.round(row.netProfit / 100_000_000) : null;
    let opOku: number | null = null;
    if (row.prior === 0 && e.currentPl.operatingProfit != null) {
      opOku = Math.round(e.currentPl.operatingProfit / 100_000_000);
    }
    const opMargin =
      revenueOku && opOku && revenueOku > 0
        ? Number(((opOku / revenueOku) * 100).toFixed(2))
        : null;

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
  const byFy = new Map<string, DividendSchedule>();
  for (const s of schedules) {
    if (s.fy) byFy.set(s.fy, s);
  }

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
    if (amount == null && !exDate && !recordDate && !payDate) continue;

    const setOnConflict: Record<string, unknown> = {};
    if (amount != null) setOnConflict.amount = amount;
    if (exDate) setOnConflict.exDate = exDate;
    if (recordDate) setOnConflict.recordDate = recordDate;
    if (payDate) setOnConflict.payDate = payDate;

    db.insert(dividends)
      .values({ companyId, fy, amount, exDate, recordDate, payDate })
      .onConflictDoUpdate({
        target: [dividends.companyId, dividends.fy],
        set: setOnConflict,
      })
      .run();
  }
}

/**
 * stocks.listed_shares (発行済株式総数) を UPSERT。
 * Yahoo の marketCap が一部銘柄で壊れているので、自前計算用にここで持つ。
 * secCode は EDINET 形式 (5桁)。stocks.code は 4 桁なので slice(0,4)。
 */
function writeStockListedShares(secCode: string | null, e: ExtractedFinancials) {
  if (secCode == null || e.issuedShares == null) return;
  const code4 = secCode.slice(0, 4);
  const db = getLocalDb();
  db.update(stocks)
    .set({ listedShares: e.issuedShares })
    .where(eq(stocks.code, code4))
    .run();
}

function writeCompanyMeta(
  companyId: number,
  e: ExtractedFinancials,
  cover: CoverMeta = {},
) {
  const db = getLocalDb();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const current = e.summaryByFy.find((r) => r.prior === 0);
  if (current?.employees != null) updates.employeesConsolidated = current.employees;
  if (e.edinetCode) updates.edinetCode = e.edinetCode;
  if (cover.founded) updates.founded = cover.founded;
  if (cover.listed) updates.listed = cover.listed;
  if (cover.headquarters) updates.headquarters = cover.headquarters;
  if (cover.ceoName) updates.ceoName = cover.ceoName;
  if (cover.website) updates.website = cover.website;
  db.update(companies).set(updates).where(eq(companies.id, companyId)).run();
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  processDiscovered().then((r) => {
    console.log(
      `process: attempted=${r.attempted}, succeeded=${r.succeeded}, failed=${r.failed}, skipped=${r.skippedNoCompany}`,
    );
  });
}
