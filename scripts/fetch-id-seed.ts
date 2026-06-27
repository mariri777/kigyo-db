#!/usr/bin/env tsx
// 本番 D1 から companies と sources の id seed を取得して JSON ファイルに書き出す。
//
// 使い方:
//   npm run db:fetch-id-seed -- --out /tmp/id-seed.json
//
// 出力 JSON 形式:
//   {
//     "companies": [{ "id": 1, "name": "..." }, ...],
//     "sources":   [{ "id": 1, "doc": "...", "page": null, "period": null, "url": null }, ...]
//   }

import { writeFileSync } from "node:fs";

import { execRemoteJson } from "./lib/d1Remote.js";

type CompanyRow = { id: number; name: string };
type SourceRow = {
  id: number;
  doc: string;
  page: number | null;
  period: string | null;
  url: string | null;
};

function parseArgs(argv: string[]): { out: string } {
  let out: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && i + 1 < argv.length) {
      out = argv[i + 1];
      i++;
    } else if (argv[i].startsWith("--out=")) {
      out = argv[i].slice("--out=".length);
    }
  }
  if (!out) {
    throw new Error("--out <path> を指定してください");
  }
  return { out };
}

async function main() {
  const { out } = parseArgs(process.argv.slice(2));

  console.log("⬇️  本番 D1 から companies id seed を取得...");
  const companiesRes = execRemoteJson<CompanyRow>(
    "SELECT id, name FROM companies",
  );
  const companies = companiesRes[0]?.results ?? [];
  console.log(`   ${companies.length} 件`);

  console.log("⬇️  本番 D1 から sources id seed を取得...");
  const sourcesRes = execRemoteJson<SourceRow>(
    "SELECT id, doc, page, period, url FROM sources",
  );
  const sources = sourcesRes[0]?.results ?? [];
  console.log(`   ${sources.length} 件`);

  const json = JSON.stringify({ companies, sources }, null, 2);
  writeFileSync(out, json);
  console.log(`✅ ${out} に書き出しました`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
