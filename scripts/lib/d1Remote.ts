// wrangler d1 execute --remote を child_process 経由で呼ぶ薄いラッパ。
// stdout は --json 形式を期待し、parse 済みの結果を返す。

import { spawnSync, type SpawnSyncOptions } from "node:child_process";

const D1_NAME = "cho-kigyo-db-database";

export type D1QueryResult<T = Record<string, unknown>> = {
  success: boolean;
  meta?: {
    rows_read?: number;
    rows_written?: number;
    duration?: number;
  };
  results?: T[];
};

function runWrangler(args: string[]): string {
  const opts: SpawnSyncOptions = {
    cwd: process.cwd(),
    encoding: "utf8",
    // stdin は使わない / stdout を捕捉 / stderr は CI ログに直接流す
    stdio: ["ignore", "pipe", "inherit"],
    env: process.env,
  };
  const result = spawnSync("npx", ["wrangler", ...args], opts);
  if (result.status !== 0) {
    throw new Error(
      `wrangler ${args.slice(0, 4).join(" ")} ... が exit ${result.status} で失敗しました`,
    );
  }
  return (result.stdout as string) ?? "";
}

/**
 * wrangler の --json 出力は配列(複数ステートメントぶん)で返ってくる。
 * 例: [{ success: true, results: [...], meta: {...} }]
 */
function parseWranglerJson<T>(stdout: string): D1QueryResult<T>[] {
  // wrangler は --json でも進捗ログを混ぜることがあるため、最初の `[` から最後の `]` までを抜く。
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`wrangler --json の出力を parse できませんでした:\n${stdout.slice(0, 500)}`);
  }
  const json = stdout.slice(start, end + 1);
  try {
    return JSON.parse(json) as D1QueryResult<T>[];
  } catch (e) {
    throw new Error(
      `wrangler --json の JSON parse 失敗: ${(e as Error).message}\n${json.slice(0, 500)}`,
    );
  }
}

/** リモート D1 に対して 1 つの SQL を実行し、結果を JSON で返す。 */
export function execRemoteJson<T = Record<string, unknown>>(
  sql: string,
): D1QueryResult<T>[] {
  const stdout = runWrangler([
    "d1",
    "execute",
    D1_NAME,
    "--remote",
    "--json",
    "--command",
    sql,
  ]);
  return parseWranglerJson<T>(stdout);
}

/** リモート D1 に対して SQL ファイルを単一トランザクションで実行する。 */
export function execRemoteFile(path: string): void {
  runWrangler([
    "d1",
    "execute",
    D1_NAME,
    "--remote",
    "--file",
    path,
  ]);
}
