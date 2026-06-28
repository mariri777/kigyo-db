/**
 * 本番 D1 (--remote) への wrangler コマンドラッパ。
 *
 * - execRemoteJson: SQL を 1 つ叩いて JSON 結果を返す
 * - execRemoteFile: SQL ファイルを単一トランザクションで投入する
 * - stderr / stdout は失敗時に Error メッセージへ含めて、CI ログでも原因が見えるようにする
 */
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
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    maxBuffer: 256 * 1024 * 1024,
  };
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], opts);
  const stderr = (result.stderr as string) ?? "";
  const stdout = (result.stdout as string) ?? "";
  if (result.status !== 0) {
    throw new Error(
      `wrangler ${args.slice(0, 4).join(" ")} ... が exit ${result.status} で失敗しました\n--- stderr ---\n${stderr}\n--- stdout ---\n${stdout}`,
    );
  }
  return stdout;
}

function parseWranglerJson<T>(stdout: string): D1QueryResult<T>[] {
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

export function execRemoteJson<T = Record<string, unknown>>(sql: string): D1QueryResult<T>[] {
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

export function execRemoteFile(path: string): void {
  runWrangler(["d1", "execute", D1_NAME, "--remote", "--file", path]);
}
