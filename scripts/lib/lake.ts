/**
 * local/ ディレクトリへの I/O 抽象。
 *
 * 設計:
 *   - 書き込みは atomic rename(*.tmp に書いて mv)
 *   - 階層は <root>/<group>/<task>/<yyyy>/<mm>/<dd>/<key>.json
 *   - 読み出しは walk + JSON.parse
 *
 * NOTE: コミット対象外。git ignore で local/ 配下全部を除外する。
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const LOCAL_ROOT = join(ROOT, "local");
export const AI_GENERATED_ROOT = join(LOCAL_ROOT, "ai-generated");
export const LAKE_ROOT = join(LOCAL_ROOT, "lake");
export const TMP_ROOT = join(LOCAL_ROOT, "tmp");

/** YYYY-MM-DD を YYYY/MM/DD に */
export function datePartition(date: string): string {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) throw new Error(`不正な date: ${date}`);
  return `${y}/${m}/${d}`;
}

/** 親ディレクトリを再帰作成 + atomic write */
export function writeJsonAtomic(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2));
  renameSync(tmp, filePath);
}

export function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function exists(filePath: string): boolean {
  return existsSync(filePath);
}

/** 再帰 walk。ファイルパスの配列を返す。 */
export function walkJson(rootDir: string): string[] {
  if (!existsSync(rootDir)) return [];
  const out: string[] = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) stack.push(p);
      else if (s.isFile() && p.endsWith(".json")) out.push(p);
    }
  }
  return out.sort();
}

/** AI 生成ファイルのパス組立: local/ai-generated/<task>/<yyyy>/<mm>/<dd>/<key>.json */
export function aiGeneratedPath(task: string, date: string, key: string): string {
  return join(AI_GENERATED_ROOT, task, datePartition(date), `${key}.json`);
}

/** Lake(中間取得物)のパス: local/lake/<source>/<yyyy>/<mm>/<dd>/<key>.json */
export function lakePath(source: string, date: string, key: string): string {
  return join(LAKE_ROOT, source, datePartition(date), `${key}.json`);
}

/** 1 日 1 ファイルの集約版: local/lake/<source>/<yyyy-mm-dd>.json */
export function lakeFlatPath(source: string, date: string): string {
  return join(LAKE_ROOT, source, `${date}.json`);
}

/** 中間 SQL 等の使い捨て領域 */
export function tmpPath(...segs: string[]): string {
  return join(TMP_ROOT, ...segs);
}
