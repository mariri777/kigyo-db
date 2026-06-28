/**
 * 最小限の CSV エンコーダ/デコーダ。RFC 4180 準拠。
 *
 * - ヘッダー 1 行 + データ N 行
 * - 値の型は string | number | null。JSON 値 (objects/arrays) は文字列化して入れる
 *   - null → 空セル
 *   - "," / "\"" / "\n" / "\r" を含む値はダブルクオートで囲み、" → "" でエスケープ
 *
 * 大量行を持つテーブル (stock_prices_daily 89k 行) を JSON で書くと 4MB だが、
 * CSV だと 1.5MB 以下に収まる。
 */

export type CsvRow = Record<string, string | number | null>;

export function rowsToCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const header = cols.map(escapeCell).join(",");
  const body = rows.map((r) => cols.map((c) => formatCell(r[c])).join(","));
  return [header, ...body].join("\n") + "\n";
}

export function csvToRows(csv: string): CsvRow[] {
  const lines = parseCsv(csv);
  if (lines.length === 0) return [];
  const cols = lines[0];
  return lines.slice(1).map((cells) => {
    const row: CsvRow = {};
    for (let i = 0; i < cols.length; i++) {
      row[cols[i]] = parseCell(cells[i] ?? "");
    }
    return row;
  });
}

// ──────────────────────────────────────────────────
// encode
// ──────────────────────────────────────────────────

function formatCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  return escapeCell(v);
}

const NEEDS_QUOTE = /[",\n\r]/;

function escapeCell(v: string): string {
  if (!NEEDS_QUOTE.test(v)) return v;
  return `"${v.replace(/"/g, '""')}"`;
}

// ──────────────────────────────────────────────────
// decode
// ──────────────────────────────────────────────────

/**
 * 空セル → null、それ以外 → 文字列のまま返す。
 *
 * 数値判定をしない理由: CSV からは型を 100% 復元できない。
 *   - "1301" は銘柄コード(text)であって整数ではない (前ゼロ "0001" 失われも怖い)
 *   - "1e3" を 1000 にしてしまう、等
 * SQLite に投入するときは bind value が string でも、カラム型が INTEGER/REAL なら
 * 自動で適切に変換される (SQLite の type affinity)。なので string で十分。
 */
function parseCell(raw: string): string | null {
  if (raw === "") return null;
  return raw;
}

function parseCsv(csv: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuote = false;
  let i = 0;
  const n = csv.length;
  while (i < n) {
    const c = csv[i];
    if (inQuote) {
      if (c === '"') {
        if (csv[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuote = false;
        i++;
        continue;
      }
      cell += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuote = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      // CRLF / LF 両対応
      if (cell !== "" || row.length > 0) {
        row.push(cell);
        out.push(row);
        row = [];
        cell = "";
      }
      // CRLF の \n もスキップ
      if (c === "\r" && csv[i + 1] === "\n") i++;
      i++;
      continue;
    }
    cell += c;
    i++;
  }
  // 最後の cell
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  return out;
}
