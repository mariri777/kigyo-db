/**
 * Step 3. extract
 * R2 から ZIP を取り、PublicDoc 配下のメイン XBRL を取り出して R2 に put。
 * Audit XBRL は捨てる。
 */
import { eq, isNull, and } from "drizzle-orm";
import { unzipSync, strFromU8 } from "fflate";
import { getLocalDb } from "../lib/local-db.js";
import { createR2Client, type R2Target } from "../lib/r2.js";
import { edinetDocs } from "../../src/server/db/schema.js";

export async function extractDownloaded(target: R2Target): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const db = getLocalDb();
  const r2 = createR2Client(target);
  // downloaded だがまだ xbrl 抽出していないもの
  const candidates = db
    .select()
    .from(edinetDocs)
    .where(and(eq(edinetDocs.fetchStatus, "downloaded"), isNull(edinetDocs.r2XbrlKey)))
    .all();

  let succeeded = 0;
  let failed = 0;

  for (const doc of candidates) {
    const now = new Date().toISOString();
    if (!doc.r2ZipKey) {
      failed++;
      continue;
    }
    try {
      const zipBytes = await r2.get(doc.r2ZipKey);
      const files = unzipSync(zipBytes);
      // メイン XBRL = PublicDoc 配下、jpcrp...-*.xbrl
      // Audit (jpaud-*) は捨てる
      const candidatesPaths = Object.keys(files).filter((p) =>
        p.includes("PublicDoc") && p.endsWith(".xbrl"),
      );
      if (candidatesPaths.length === 0) {
        db.update(edinetDocs)
          .set({
            fetchStatus: "failed",
            failedReason: "no PublicDoc xbrl in zip",
            updatedAt: now,
          })
          .where(eq(edinetDocs.docId, doc.docId))
          .run();
        failed++;
        continue;
      }
      // 複数あれば最大サイズを採用 (メイン本体)
      const mainPath = candidatesPaths.sort((a, b) => files[b].length - files[a].length)[0];
      const xbrlData = files[mainPath];

      const year = doc.submitDate.slice(0, 4);
      const xbrlKey = `xbrl/${year}/${doc.edinetCode}/${doc.docId}.xbrl`;
      await r2.put(xbrlKey, xbrlData);

      db.update(edinetDocs)
        .set({ r2XbrlKey: xbrlKey, updatedAt: now })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      succeeded++;
    } catch (e) {
      db.update(edinetDocs)
        .set({
          fetchStatus: "failed",
          failedReason: `extract: ${(e as Error).message}`,
          updatedAt: now,
        })
        .where(eq(edinetDocs.docId, doc.docId))
        .run();
      failed++;
    }
  }

  return { attempted: candidates.length, succeeded, failed };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  extractDownloaded("local").then((r) => {
    console.log(`extract: attempted=${r.attempted}, succeeded=${r.succeeded}, failed=${r.failed}`);
  });
}
