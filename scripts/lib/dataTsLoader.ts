// data.ts と industries.ts を直接 import して、CSV 生成側で使う形に整える。
// tsx が TypeScript ファイルをそのまま実行できるので、正規表現パースより遥かに信頼性が高い。

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// 動的 import で型を効かせる
export async function loadDataTs() {
  const mod = (await import(join(ROOT, "src/lib/data.ts"))) as typeof import(
    "../../src/lib/data"
  );
  return mod;
}

export async function loadIndustriesTs() {
  const mod = (await import(join(ROOT, "src/lib/industries.ts"))) as typeof import(
    "../../src/lib/industries"
  );
  return mod;
}
