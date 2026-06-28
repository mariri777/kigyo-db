/**
 * 本番 D1 への書き込み用、JS 値 → SQLite SQL リテラル変換。
 * SQLite 標準: 文字列内のシングルクオートは '' でエスケープ。
 */
export function sqlLit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`sqlLit: 非有限数値: ${v}`);
    return String(v);
  }
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

export function sqlIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`sqlIdent: 不正な識別子: ${name}`);
  }
  return `"${name}"`;
}

/**
 * multi-row INSERT を chunkSize 行ごとに分割。
 * D1 の単一 statement 上限を回避するため、デフォルト 100 行/INSERT。
 */
export function insertChunks(
  table: string,
  cols: string[],
  rows: unknown[][],
  chunkSize = 100,
): string[] {
  if (rows.length === 0) return [];
  const colList = cols.map(sqlIdent).join(",");
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const values = slice
      .map((r) => {
        if (r.length !== cols.length) {
          throw new Error(`insertChunks: 列数不一致 (expected ${cols.length}, got ${r.length})`);
        }
        return `(${r.map(sqlLit).join(",")})`;
      })
      .join(",");
    out.push(`INSERT INTO ${sqlIdent(table)} (${colList}) VALUES ${values};`);
  }
  return out;
}

/** UPSERT 用 ON CONFLICT 句生成ヘルパ */
export function upsertChunks(
  table: string,
  cols: string[],
  rows: unknown[][],
  conflictCols: string[],
  updateCols: string[],
  chunkSize = 100,
): string[] {
  if (rows.length === 0) return [];
  const colList = cols.map(sqlIdent).join(",");
  const conflictList = conflictCols.map(sqlIdent).join(",");
  const updateClause = updateCols
    .map((c) => `${sqlIdent(c)} = excluded.${sqlIdent(c)}`)
    .join(", ");
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const values = slice
      .map((r) => {
        if (r.length !== cols.length) {
          throw new Error(`upsertChunks: 列数不一致 (expected ${cols.length}, got ${r.length})`);
        }
        return `(${r.map(sqlLit).join(",")})`;
      })
      .join(",");
    out.push(
      `INSERT INTO ${sqlIdent(table)} (${colList}) VALUES ${values} ON CONFLICT(${conflictList}) DO UPDATE SET ${updateClause};`,
    );
  }
  return out;
}
