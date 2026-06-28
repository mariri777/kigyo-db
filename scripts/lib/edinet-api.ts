/**
 * EDINET API v2 クライアント (薄ラッパー)。
 *
 * 仕様: https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://api.edinet-fsa.go.jp/api/v2";

export type DocResult = {
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
  xbrlFlag: string;
  pdfFlag: string;
};

export type DocListResponse = {
  metadata: {
    resultset: { count: number };
    processDateTime: string;
    status: string;
    message: string;
  };
  results: DocResult[];
};

let _apiKeyLoaded = false;
let _apiKey: string | undefined;

/** .env.local から API キーを読む。typo (EDITNET_API_KEY) と正しい綴り (EDINET_API_KEY) の両方に対応 */
export async function loadEdinetApiKey(): Promise<string> {
  if (_apiKeyLoaded && _apiKey) return _apiKey;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(__dirname, "../../.env.local");
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // 無視 (CI では環境変数経由)
  }
  _apiKey = process.env.EDINET_API_KEY ?? process.env.EDITNET_API_KEY;
  if (!_apiKey) {
    throw new Error("EDINET_API_KEY が見つかりません (.env.local または env)");
  }
  _apiKeyLoaded = true;
  return _apiKey;
}

/**
 * 書類一覧 API (type=2: 提出書類一覧 + メタデータ)
 * @param date YYYY-MM-DD
 */
export async function fetchDocList(date: string): Promise<DocListResponse> {
  const apiKey = await loadEdinetApiKey();
  const url = `${BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  const res = await fetchWithRetry(url, { retries: 3 });
  if (!res.ok) {
    throw new Error(`書類一覧API失敗 ${res.status} (${date}): ${await res.text()}`);
  }
  return res.json() as Promise<DocListResponse>;
}

/**
 * 書類取得 API (type=1: XBRL+PDF ZIP)
 */
export async function fetchDocZip(docID: string): Promise<ArrayBuffer> {
  const apiKey = await loadEdinetApiKey();
  const url = `${BASE}/documents/${docID}?type=1&Subscription-Key=${apiKey}`;
  const res = await fetchWithRetry(url, { retries: 3 });
  if (!res.ok) {
    throw new Error(
      `書類取得API失敗 ${res.status} (${docID}): ${await res.text().catch(() => "")}`,
    );
  }
  return res.arrayBuffer();
}

async function fetchWithRetry(
  url: string,
  opts: { retries: number },
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i <= opts.retries; i++) {
    try {
      const res = await fetch(url);
      // 5xx だけリトライ。4xx は即返す
      if (res.status >= 500 && i < opts.retries) {
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(500 * Math.pow(2, i));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < opts.retries) {
        await sleep(500 * Math.pow(2, i));
        continue;
      }
    }
  }
  throw lastErr;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
