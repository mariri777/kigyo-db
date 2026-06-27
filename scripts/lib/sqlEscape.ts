// 本番 D1 への書き込み用に、JS 値を SQLite SQL リテラルへ変換するユーティリティ。
// SQLite の標準仕様に従い、文字列リテラル内のシングルクオートは '' でエスケープする。

export function sqlLit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) {
      throw new Error(`sqlLit: 非有限数値は SQL に出力できません: ${v}`);
    }
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
 * 多行 INSERT を chunkSize 行ごとに分割して 1 ステートメントずつ返す。
 *   INSERT INTO "table" ("col1","col2") VALUES (...),(...),...;
 *
 * D1 は 1 ステートメント 100KB 制限があるので、chunkSize は控えめに(デフォルト 500)。
 */
export function insertChunks(
  table: string,
  cols: string[],
  rows: unknown[][],
  chunkSize = 500,
): string[] {
  if (rows.length === 0) return [];
  const colList = cols.map(sqlIdent).join(",");
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const values = slice
      .map((r) => {
        if (r.length !== cols.length) {
          throw new Error(
            `insertChunks: 列数不一致 (expected ${cols.length}, got ${r.length})`,
          );
        }
        return `(${r.map(sqlLit).join(",")})`;
      })
      .join(",");
    out.push(`INSERT INTO ${sqlIdent(table)} (${colList}) VALUES ${values};`);
  }
  return out;
}
