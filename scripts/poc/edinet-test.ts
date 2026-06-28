/**
 * EDINET API v2 を試し叩きするスクリプト。
 *
 * 目的: 有価証券報告書 / 四半期報告書 が
 *   (1) どのくらいの粒度で引けるか
 *   (2) ZIP の中の XBRL からどの数値が機械的に取り出せるか
 * を確認する。
 *
 * 使い方:
 *   pnpm tsx scripts/poc/edinet-test.ts
 *
 * 環境変数 (.env.local):
 *   EDITNET_API_KEY=xxxx  (現行 typo を尊重) or EDINET_API_KEY=xxxx
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../../tmp/edinet-poc");

// .env.local を最低限読む (dotenv 不要)
async function loadEnv() {
  const envPath = path.join(__dirname, "../../.env.local");
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // 無視
  }
}

const TARGET_CODE = "72030"; // EDINET の secCode は 5 桁 (末尾0)。トヨタ自動車 = 7203 -> "72030"
// 取得対象の書類種別 (有報/四半期報告書/半期報告書)
const TARGET_DOC_TYPES = new Set(["120", "140", "160"]);

type DocResult = {
  seqNumber: number;
  docID: string;
  edinetCode: string;
  secCode: string | null;
  filerName: string;
  docDescription: string;
  docTypeCode: string;
  submitDateTime: string;
  periodStart: string | null;
  periodEnd: string | null;
  xbrlFlag: string; // "1" なら XBRL あり
  pdfFlag: string;
};

type DocListResponse = {
  metadata: { resultset: { count: number }; processDateTime: string; status: string; message: string };
  results: DocResult[];
};

async function fetchDocList(date: string, apiKey: string): Promise<DocListResponse> {
  const url = `https://api.edinet-fsa.go.jp/api/v2/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`書類一覧API失敗 ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<DocListResponse>;
}

async function fetchDocZip(docID: string, apiKey: string): Promise<ArrayBuffer> {
  // type=1 = XBRL+PDF の本体ZIP (XBRL のみは type=5)
  const url = `https://api.edinet-fsa.go.jp/api/v2/documents/${docID}?type=1&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`書類取得API失敗 ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.arrayBuffer();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await loadEnv();
  const apiKey = process.env.EDITNET_API_KEY ?? process.env.EDINET_API_KEY;
  if (!apiKey) {
    console.error("EDINET_API_KEY / EDITNET_API_KEY が .env.local に見つかりません");
    process.exit(1);
  }
  console.log(`API キー: ${apiKey.slice(0, 6)}...${apiKey.slice(-4)} (length=${apiKey.length})`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  // ─────────────────────────────────────────
  // 1. 直近 365 日を後ろから走査して、トヨタの有報/四半期報告書を最初に見つけたら止める
  // ─────────────────────────────────────────
  console.log("\n=== Step 1: 書類一覧APIをスキャンしてトヨタ書類を探す ===");
  let foundDoc: DocResult | null = null;
  let foundDate = "";
  let scannedDays = 0;
  let totalDocsScanned = 0;

  for (let i = 1; i <= 365; i++) {
    const date = daysAgo(i);
    scannedDays++;
    let list: DocListResponse;
    try {
      list = await fetchDocList(date, apiKey);
    } catch (e) {
      console.error(`  [${date}] エラー: ${(e as Error).message}`);
      continue;
    }
    totalDocsScanned += list.results.length;
    const hits = list.results.filter(
      (r) =>
        r.secCode === TARGET_CODE &&
        TARGET_DOC_TYPES.has(r.docTypeCode) &&
        r.xbrlFlag === "1",
    );
    if (i % 30 === 0) {
      console.log(`  [${date}] count=${list.results.length} (累計スキャン書類=${totalDocsScanned})`);
    }
    if (hits.length > 0) {
      foundDoc = hits[0];
      foundDate = date;
      console.log(`  ★ ヒット [${date}]: ${foundDoc.filerName} / ${foundDoc.docDescription}`);
      break;
    }
  }

  if (!foundDoc) {
    console.error(`トヨタ (secCode=${TARGET_CODE}) の対象書類が直近${scannedDays}日で見つからず`);
    process.exit(1);
  }

  console.log("\n見つかった書類:");
  console.log(`  docID: ${foundDoc.docID}`);
  console.log(`  EDINETコード: ${foundDoc.edinetCode}`);
  console.log(`  証券コード: ${foundDoc.secCode}`);
  console.log(`  会社名: ${foundDoc.filerName}`);
  console.log(`  書類種別コード: ${foundDoc.docTypeCode}`);
  console.log(`  書類概要: ${foundDoc.docDescription}`);
  console.log(`  対象期間: ${foundDoc.periodStart} 〜 ${foundDoc.periodEnd}`);
  console.log(`  提出日時: ${foundDoc.submitDateTime}`);

  // ─────────────────────────────────────────
  // 2. 書類取得 API で ZIP をダウンロード
  // ─────────────────────────────────────────
  console.log("\n=== Step 2: 書類取得APIでZIPをダウンロード ===");
  const zipBuf = await fetchDocZip(foundDoc.docID, apiKey);
  const zipPath = path.join(OUT_DIR, `${foundDoc.docID}.zip`);
  await fs.writeFile(zipPath, Buffer.from(zipBuf));
  console.log(`  ZIP保存: ${zipPath}`);
  console.log(`  サイズ: ${(zipBuf.byteLength / 1024 / 1024).toFixed(2)} MB`);

  // ─────────────────────────────────────────
  // 3. ZIP を展開して中身一覧
  // ─────────────────────────────────────────
  console.log("\n=== Step 3: ZIPを展開 ===");
  const { execSync } = await import("node:child_process");
  const extractDir = path.join(OUT_DIR, foundDoc.docID);
  await fs.rm(extractDir, { recursive: true, force: true });
  await fs.mkdir(extractDir, { recursive: true });
  execSync(`unzip -q ${zipPath} -d ${extractDir}`);

  // 中身を walk して .xbrl/.xml/.htm をリストアップ
  async function walk(dir: string, base = ""): Promise<string[]> {
    const out: string[] = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
      else out.push(rel);
    }
    return out;
  }
  const allFiles = await walk(extractDir);
  console.log(`  展開後ファイル数: ${allFiles.length}`);

  const xbrlFiles = allFiles.filter((f) => f.endsWith(".xbrl"));
  const xsdFiles = allFiles.filter((f) => f.endsWith(".xsd"));
  const htmFiles = allFiles.filter((f) => /\.(htm|html)$/i.test(f));
  console.log(`    .xbrl: ${xbrlFiles.length} 件`);
  console.log(`    .xsd:  ${xsdFiles.length} 件`);
  console.log(`    .htm:  ${htmFiles.length} 件`);
  console.log("  XBRL ファイル一覧:");
  for (const f of xbrlFiles) {
    const stat = await fs.stat(path.join(extractDir, f));
    console.log(`    - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  // ─────────────────────────────────────────
  // 4. メインの XBRL を読んで主要数値を取り出す (機械的にどこまで抽出できるか試す)
  // ─────────────────────────────────────────
  console.log("\n=== Step 4: XBRLから主要数値を抽出 (PoC) ===");
  const mainXbrl = xbrlFiles.find((f) => f.includes("PublicDoc")) ?? xbrlFiles[0];
  if (!mainXbrl) {
    console.log("  XBRLが見つからず");
    return;
  }
  const xbrlPath = path.join(extractDir, mainXbrl);
  const xbrlText = await fs.readFile(xbrlPath, "utf-8");
  console.log(`  対象: ${mainXbrl}`);
  console.log(`  サイズ: ${(xbrlText.length / 1024).toFixed(1)} KB`);

  // 簡易抽出 (正規表現でタグを引く): contextRef, decimals は無視して最初の数字だけ取る
  // 本番では XBRL パーサ (例: xmldom + xpath, fast-xml-parser) を使うが、PoC では正規表現で雰囲気を見る
  const targets = [
    { tag: "jpcrp_cor:NetSales", label: "売上高 / 営業収益" },
    { tag: "jppfs_cor:NetSales", label: "売上高 (jppfs)" },
    { tag: "jpcrp_cor:OperatingIncome", label: "営業利益" },
    { tag: "jppfs_cor:OperatingIncome", label: "営業利益 (jppfs)" },
    { tag: "jpcrp_cor:OrdinaryIncome", label: "経常利益" },
    { tag: "jpcrp_cor:ProfitLoss", label: "当期純利益" },
    { tag: "jpcrp_cor:BasicEarningsLossPerShare", label: "EPS" },
    { tag: "jpcrp_cor:DividendPaidPerShareSummaryOfBusinessResults", label: "1株配当" },
    { tag: "jpcrp_cor:NumberOfEmployees", label: "従業員数" },
    { tag: "jpdei_cor:FilerNameInJapaneseDEI", label: "提出者名 (日本語)" },
    { tag: "jpdei_cor:SecurityCodeDEI", label: "証券コード" },
    { tag: "jpdei_cor:EDINETCodeDEI", label: "EDINETコード" },
    { tag: "jpdei_cor:CurrentFiscalYearStartDateDEI", label: "当期開始日" },
    { tag: "jpdei_cor:CurrentFiscalYearEndDateDEI", label: "当期末日" },
  ];

  for (const { tag, label } of targets) {
    const re = new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, "g");
    const matches = [...xbrlText.matchAll(re)];
    if (matches.length === 0) {
      console.log(`  [-] ${label} (${tag}): なし`);
    } else {
      // 同じタグが複数 context (前期/当期/予想等) で出るので 3 件まで表示
      const samples = matches.slice(0, 3).map((m) => m[1].trim()).join(" | ");
      console.log(
        `  [✓] ${label} (${tag}): ${matches.length}件 — ${samples}${matches.length > 3 ? " ..." : ""}`,
      );
    }
  }

  console.log("\n=== 完了 ===");
  console.log(`成果物: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
