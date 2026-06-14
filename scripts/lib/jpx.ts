// JPX(日本取引所グループ)の「東証上場銘柄一覧」Excel を取得・パースする。

import * as XLSX from "xlsx";

export const JPX_URL =
  "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls";

export type JpxStock = {
  code: string;
  name: string;
  exchange: "Prime" | "Standard" | "Growth";
  sectorTSE: string;
  /** JPX 基準日 (例: "2026-05-31") */
  baseDate: string | null;
};

// JPX Excel の市場区分は全角括弧
const EXCHANGE_MAP: Record<string, "Prime" | "Standard" | "Growth"> = {
  "プライム(内国株式)": "Prime",
  "スタンダード(内国株式)": "Standard",
  "グロース(内国株式)": "Growth",
};
// 実データは全角(/)を使うため正しいマッピングを書き直す
const EXCHANGE_MAP_FW: Record<string, "Prime" | "Standard" | "Growth"> = {
  ["プライム（内国株式）"]: "Prime",
  ["スタンダード（内国株式）"]: "Standard",
  ["グロース（内国株式）"]: "Growth",
};

type JpxRow = {
  日付: number | string;
  コード: number | string;
  銘柄名: string;
  "市場・商品区分": string;
  "33業種コード": string | number;
  "33業種区分": string;
};

export async function fetchJpxExcel(): Promise<Buffer> {
  const res = await fetch(JPX_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`JPX Excel 取得失敗: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export function parseJpxExcel(buf: Buffer): { stocks: JpxStock[]; baseDate: string | null } {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<JpxRow>(ws, { defval: "" });

  const dateRaw = String(rows[0]?.["日付"] ?? "");
  const baseDate =
    dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : null;

  const stocks: JpxStock[] = [];
  for (const r of rows) {
    const code = String(r["コード"]).trim();
    if (!/^\d{4}[A-Z0-9]?$/.test(code)) continue;
    const ex =
      EXCHANGE_MAP_FW[r["市場・商品区分"]] ?? EXCHANGE_MAP[r["市場・商品区分"]];
    if (!ex) continue; // ETF/REIT/外国株/PRO Market を除外
    const sectorRaw = String(r["33業種区分"]).trim();
    stocks.push({
      code,
      name: String(r["銘柄名"]).trim(),
      exchange: ex,
      sectorTSE: sectorRaw === "-" || sectorRaw === "" ? "その他" : sectorRaw,
      baseDate,
    });
  }
  return { stocks, baseDate };
}
