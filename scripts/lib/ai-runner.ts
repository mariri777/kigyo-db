/**
 * AI 推論ランナ。2 モード:
 *
 *   1. --auto (default): claude CLI を spawn → stdin に prompt+JSON、stdout から JSON 取得
 *      サブスクで完結。1 回 1 タスク × 10 銘柄ずつをバッチで処理。
 *   2. --manual: 入力 JSON を local/tmp/ai-brief/ に書き出して exit。
 *      ユーザーが LLM で処理 → 出力を別パスに保存 → apply モードで読み込む。
 *
 * 失敗時の挙動:
 *   - 出力 JSON parse 失敗 → throw
 *   - results 配列の 1 件失敗 → その件だけ skip、他は適用
 *   - claude CLI が PATH に無い → 起動時にエラーで manual 案内
 */
import { spawnSync } from "node:child_process";
import { z } from "zod";

export type AiRunMode = "auto" | "manual";

export type AiAutoOpts<O> = {
  prompt: string;
  inputJson: unknown;
  outputItemSchema: z.ZodTypeAny;
  /** "claude-haiku-4-5-20251001" 等を渡せばモデルを強制 */
  model?: string;
  /** 進捗ログのプレフィクス("ai-stock-trend" 等) */
  label?: string;
};

/** Claude CLI を spawn して results 配列を返す */
export function runClaudeCli<O>(opts: AiAutoOpts<O>): O[] {
  ensureClaudeAvailable();

  const stdin = buildPrompt(opts.prompt, opts.inputJson);
  const args = ["--print"];
  if (opts.model) args.push("--model", opts.model);

  const t0 = Date.now();
  const res = spawnSync("claude", args, {
    input: stdin,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  const elapsed = Date.now() - t0;

  if (res.status !== 0) {
    throw new Error(
      `claude CLI が exit ${res.status} で失敗\n--- stderr ---\n${res.stderr}\n--- stdout (頭 500 char) ---\n${(res.stdout ?? "").slice(0, 500)}`,
    );
  }

  console.log(`    [${opts.label ?? "ai"}] claude --print 完了 (${elapsed}ms)`);

  const json = extractJsonObject(res.stdout ?? "");
  const Envelope = z.object({ results: z.array(opts.outputItemSchema) });
  const parsed = Envelope.parse(JSON.parse(json));
  return parsed.results as O[];
}

function buildPrompt(systemPrompt: string, inputJson: unknown): string {
  return [
    systemPrompt,
    "",
    "## 入力 (targets)",
    "```json",
    JSON.stringify(inputJson, null, 2),
    "```",
    "",
    "## 出力フォーマット (厳守)",
    "results 配列の JSON のみを返してください。説明・前置き・コードブロックも不要、純粋な JSON のみ。",
    "",
    '例: {"results":[{"code":"7203","stockTrendAnalysis":"...",...}, ...]}',
  ].join("\n");
}

/**
 * stdout テキストから最初の `{...}` JSON オブジェクトを抽出。
 * claude --print は素のテキストを返すことが多いが、コードブロックで囲まれることもある。
 */
function extractJsonObject(text: string): string {
  // ```json ... ``` を優先抽出
  const fence = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fence) return fence[1].trim();
  // 素の JSON
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`stdout から JSON を抽出できませんでした:\n${text.slice(0, 500)}`);
  }
  return text.slice(start, end + 1);
}

let _claudeAvailable: boolean | null = null;
function ensureClaudeAvailable(): void {
  if (_claudeAvailable === true) return;
  if (_claudeAvailable === false) {
    throw new Error("claude CLI が PATH に見つかりません。--manual モードを使うか claude をインストールしてください。");
  }
  const r = spawnSync("claude", ["--version"], { encoding: "utf8" });
  _claudeAvailable = r.status === 0;
  if (!_claudeAvailable) {
    throw new Error("claude CLI が PATH に見つかりません。--manual モードを使うか claude をインストールしてください。");
  }
}
