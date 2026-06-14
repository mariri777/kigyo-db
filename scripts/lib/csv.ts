// 最小限の CSV ユーティリティ。RFC 4180 風で、ダブルクオート/カンマ/改行に対応。

export function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV 1 行をパースして文字列配列を返す。改行を含まない単一行のみ対応。 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuote = true;
      } else if (c === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

/**
 * 改行・引用符を含むセルを正しく扱う複数行パーサー。
 * 戻り値は行 × セルの 2 次元配列(ヘッダ含む)。
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuote = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // 何もしない (\r\n の \r を読み飛ばす)
      } else {
        cur += c;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  // 末尾の空行を落とす
  while (rows.length && rows[rows.length - 1].every((c) => c === "")) {
    rows.pop();
  }
  return rows;
}

/** ヘッダ + 行データから { col: value } のオブジェクト配列に変換する。 */
export function csvRowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0];
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = r[j] ?? "";
    }
    out.push(obj);
  }
  return out;
}

export function buildCsv(
  header: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) lines.push(r.map(csvEscape).join(","));
  return lines.join("\n") + "\n";
}

/** 空文字列を null に。数値文字列なら number に。それ以外は文字列そのまま。 */
export function emptyToNull(v: string): string | null {
  return v === "" ? null : v;
}

export function parseIntOrNull(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseFloatOrNull(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
