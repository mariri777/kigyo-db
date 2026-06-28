import { getLocalDb } from "./lib/local-db.js";
import { edinetDocs, financialsAnnual, dividends, companies } from "../src/server/db/schema.js";
import { isNotNull } from "drizzle-orm";
const db = getLocalDb();
console.log("edinet_docs:");
for (const r of db.select().from(edinetDocs).all()) {
  console.log(`  ${r.docId} sec=${r.secCode} type=${r.docTypeCode} ${r.fetchStatus} ${r.periodStart}〜${r.periodEnd}`);
}
console.log("\nfinancials_annual 上位15件:");
for (const r of db.select().from(financialsAnnual).limit(15).all()) {
  console.log(`  c${r.companyId} ${r.fy} 売上=${r.revenueOku} 営業益=${r.operatingProfitOku} 純利益=${r.netProfitOku} EPS=${r.eps}`);
}
console.log("\ndividends 上位10件:");
for (const r of db.select().from(dividends).limit(10).all()) {
  console.log(`  c${r.companyId} ${r.fy} ¥${r.amount}`);
}
console.log("\ncompanies (employees設定済):");
for (const r of db.select().from(companies).where(isNotNull(companies.employeesConsolidated)).limit(10).all()) {
  console.log(`  ${r.name} (id=${r.id}) 従業員=${r.employeesConsolidated}`);
}
