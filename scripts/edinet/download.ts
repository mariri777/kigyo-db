/**
 * Step 2. download
 * edinet_docs WHERE fetch_status='discovered' の docID を ZIP 取得して R2 に put。
 */
import { eq } from "drizzle-orm";
import { fetchDocZip, sleep } from "../lib/edinet-api.js";
import { getLocalDb } from "../lib/local-db.js";
import { createR2Client, type R2Target } from "../lib/r2.js";
import { edinetDocs } from "../../src/server/db/schema.js";

export async function downloadPending(target: R2Target): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const db = getLocalDb();
  const r2 = createR2Client(target);
  const pending = db.select().from(edinetDocs).where(eq(edinetDocs.fetchStatus, "discovered")).all();

  let succeeded = 0;
  let failed = 0;

  for (const doc of pending) {
    const now = new Date().toISOString();
    try {
      const zipBuf = await fetchDocZip(doc.docId);
      const year = doc.submitDate.slice(0, 4);
      const r2Key = `raw/${year}/${doc.edinetCode}/${doc.docId}.zip`;
      await r2.put(r2Key, zipBuf);

      db.update(edinetDocs)
        .set({
          fetchStatus: "downloaded",
          r2ZipKey: r2Key,
          updatedAt: now,
        })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      succeeded++;
    } catch (e) {
      db.update(edinetDocs)
        .set({
          fetchStatus: "failed",
          failedReason: `download: ${(e as Error).message}`,
          updatedAt: now,
        })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      failed++;
    }
    await sleep(200);
  }

  return { attempted: pending.length, succeeded, failed };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadPending("local").then((r) => {
    console.log(`download: attempted=${r.attempted}, succeeded=${r.succeeded}, failed=${r.failed}`);
  });
}
