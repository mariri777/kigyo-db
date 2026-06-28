import { getLocalDb } from "./lib/local-db.js";
import { edinetDocs, stocks, companies } from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";
const db = getLocalDb();
const docs = db.select().from(edinetDocs).where(eq(edinetDocs.fetchStatus, "parsed")).all();
for (const d of docs) {
  const code4 = d.secCode?.slice(0, 4);
  if (!code4) continue;
  const sRows = db.select().from(stocks).where(eq(stocks.code, code4)).all();
  if (sRows.length === 0) continue;
  const c = db.select().from(companies).where(eq(companies.id, sRows[0].companyId)).all()[0];
  console.log(`http://localhost:3000/v2/stocks/${code4}  ${c.name}`);
}
