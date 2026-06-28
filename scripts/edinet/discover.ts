/**
 * Step 1. discover
 * 書類一覧 API で指定日付に提出された有報/四半期/半期 (XBRL付き上場銘柄) を見つけ、
 * edinet_docs に INSERT (ON CONFLICT DO NOTHING)。
 */
import { sql } from "drizzle-orm";
import { fetchDocList } from "../lib/edinet-api.js";
import { getLocalDb } from "../lib/local-db.js";
import { edinetDocs } from "../../src/server/db/schema.js";

const TARGET_DOC_TYPES = new Set(["120", "140", "160"]);

export async function discoverDate(date: string): Promise<{
  totalInResponse: number;
  newlyInserted: number;
  candidates: number;
}> {
  const db = getLocalDb();
  const list = await fetchDocList(date);
  const now = new Date().toISOString();

  let candidates = 0;
  let inserted = 0;

  for (const doc of list.results) {
    if (!TARGET_DOC_TYPES.has(doc.docTypeCode)) continue;
    if (doc.xbrlFlag !== "1") continue;
    if (doc.secCode == null) continue;
    candidates++;

    const result = db
      .insert(edinetDocs)
      .values({
        docId: doc.docID,
        edinetCode: doc.edinetCode,
        secCode: doc.secCode,
        docTypeCode: doc.docTypeCode,
        periodStart: doc.periodStart,
        periodEnd: doc.periodEnd,
        submitDate: doc.submitDateTime.slice(0, 10),
        fetchStatus: "discovered",
        discoveredAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: edinetDocs.docId })
      .run();
    // better-sqlite3 returns changes
    inserted += (result as unknown as { changes: number }).changes ?? 0;
  }

  return {
    totalInResponse: list.results.length,
    newlyInserted: inserted,
    candidates,
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  discoverDate(date).then((r) => {
    console.log(`discover ${date}: response=${r.totalInResponse}, candidates=${r.candidates}, inserted=${r.newlyInserted}`);
  });
}
