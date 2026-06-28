#!/usr/bin/env tsx
/**
 * 単一 docID を ad-hoc に process するヘルパ (デバッグ用)。
 *
 *   pnpm tsx scripts/_process_single.ts S100Y8NY
 *
 * 既存 edinet_docs に該当 docID が無くても良いように、API から直接 DL → parse → UPSERT する。
 */
import { eq } from "drizzle-orm";
import { unzipSync } from "fflate";

import { fetchDocZip } from "./lib/edinet-api.js";
import { getLocalDb } from "./lib/local-db.js";
import { companies, edinetDocs, stocks } from "../src/server/db/schema.js";
import { extractFromXbrl } from "./lib/edinet-parser.js";

const docId = process.argv[2];
if (!docId) {
  console.error("usage: pnpm tsx scripts/_process_single.ts <docID>");
  process.exit(1);
}

async function main() {
  console.log(`==> fetch ${docId}`);
  const zipBuf = await fetchDocZip(docId);
  const files = unzipSync(new Uint8Array(zipBuf));
  const xbrlPaths = Object.keys(files).filter(
    (p) => p.includes("PublicDoc") && p.endsWith(".xbrl"),
  );
  if (xbrlPaths.length === 0) throw new Error("no PublicDoc xbrl");
  const mainPath = xbrlPaths.sort((a, b) => files[b].length - files[a].length)[0];
  const xml = new TextDecoder("utf-8").decode(files[mainPath]);

  console.log(`==> parse ${mainPath}`);
  const e = extractFromXbrl(xml);
  console.log(
    `    edinetCode=${e.edinetCode}, secCode=${e.secCode}, issuedShares=${e.issuedShares}`,
  );

  if (e.issuedShares == null) {
    console.warn("    ⚠ issuedShares 抽出失敗");
    return;
  }

  // edinet_docs から secCode を引いて 4 桁化 (parse 結果の secCode は 5 桁か 4 桁か不定)
  const db = getLocalDb();
  const rows = db.select().from(edinetDocs).where(eq(edinetDocs.docId, docId)).all();
  const secCode = rows[0]?.secCode ?? e.secCode;
  if (!secCode) {
    console.error("    ✗ secCode 不明");
    process.exit(1);
  }
  const code4 = secCode.slice(0, 4);

  const before = db.select().from(stocks).where(eq(stocks.code, code4)).all();
  console.log(
    `==> UPDATE stocks SET listed_shares = ${e.issuedShares} WHERE code = '${code4}'`,
  );
  console.log(`    before: listed_shares=${before[0]?.listedShares ?? "NULL"}`);
  db.update(stocks).set({ listedShares: e.issuedShares }).where(eq(stocks.code, code4)).run();
  const after = db.select().from(stocks).where(eq(stocks.code, code4)).all();
  console.log(`    after:  listed_shares=${after[0]?.listedShares}`);

  // 会社名
  const cmp = db
    .select()
    .from(companies)
    .where(eq(companies.id, before[0]?.companyId ?? 0))
    .all();
  console.log(`\n  ✓ ${code4} ${cmp[0]?.name} listed_shares=${e.issuedShares}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
