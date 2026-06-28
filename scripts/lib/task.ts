/**
 * 統合パイプラインのタスク抽象。
 *
 * 1 タスク = 1 ファイル(scripts/tasks/<group>/<name>.ts)。
 * fetch(JPX/Yahoo/EDINET) と ai と derive と sync を同じ shape で扱う。
 *
 * 設計判断:
 *   - selectTargets: 「未生成 or 古い対象」を返す。冪等性はここで担保
 *   - run: ローカルで処理する純粋関数。outputs を返す(I → O)
 *   - applyLocal: ローカル D1 に書く(O → DB)
 *   - writeLake: ファイル正本に書く(O → local/)。ai 系のみ
 *   - 副作用は run/applyLocal/writeLake のみ。selectTargets は read-only
 */
import type { ZodTypeAny } from "zod";

import type { LocalDb } from "./d1-local.js";

export type TaskKind = "fetch" | "ai" | "derive" | "sync";

export type PipelineCtx = {
  /** ローカル D1。全タスク共通。 */
  db: LocalDb;
  /** 実行時の論理日付(JST 基準 YYYY-MM-DD)。daily/weekly/monthly の判定基準 */
  date: string;
  /** ユーザー指定の追加引数(CLI 経由) */
  args: Record<string, string | boolean | number>;
};

export type TaskRunOptions = {
  limit?: number;
  codes?: string[];
};

/**
 * Target: 1 銘柄、1 日付など、タスクが 1 単位で処理する最小粒度。
 * key は冪等性とファイルパス計算に使うので一意。
 */
export type Target<I = unknown> = {
  key: string;
  input: I;
};

export type Task<I = unknown, O = unknown> = {
  /** "ai-stock-trend" / "fetch-jpx" / "edinet-pipeline" 等 */
  name: string;
  kind: TaskKind;
  /** 1 行説明 */
  description: string;

  /**
   * 未生成 or 古い対象を返す。limit / codes は CLI から渡る。
   * 何も処理する必要がなければ [] を返してよい。
   */
  selectTargets(ctx: PipelineCtx, opts: TaskRunOptions): Promise<Target<I>[]>;

  /**
   * 1 ターゲットを処理して結果を返す。副作用なしで純粋に I→O が原則。
   * ただし fetch 系は外部 API を叩く副作用は許容。
   *
   * AI タスクは runBatch を実装するならこちらは throw でも可。
   */
  run(target: Target<I>, ctx: PipelineCtx): Promise<O>;

  /**
   * 複数ターゲットをまとめて処理(AI バッチ呼び出し用、省略可)。
   * 戻り値の Map は target.key → output。
   * 失敗した key は Map に含めないこと(runner が失敗扱いする)。
   *
   * runner はこれが実装されていれば優先する。なければ run を 1 件ずつ呼ぶ。
   */
  runBatch?(targets: Target<I>[], ctx: PipelineCtx): Promise<Map<string, O>>;

  /**
   * ローカル D1 に UPSERT。失敗時は throw すれば runner が当該 target だけ skip して継続。
   */
  applyLocal(target: Target<I>, output: O, ctx: PipelineCtx): Promise<void>;

  /** ai 系: ファイル正本に書くべきパス(local/ai-generated/<task>/...) */
  writeLakePath?(target: Target<I>, ctx: PipelineCtx): string;

  /** ai のとき必須。LLM 出力検証用 */
  outputSchema?: ZodTypeAny;
  /** ai のとき必須。LLM への system prompt */
  promptTemplate?: string;
  /** ai のとき出力 JSON のひな形(エンジニアと LLM の双方が読む) */
  outputTemplate?: unknown;

  /**
   * 1 件の output が「本当に成功」と呼べるか判定する。
   *
   * 設計理由: Yahoo の rate limit で空 quote が「成功扱い」になっていた事故への
   * 再発防止。run が値を返したことと「データが取れたこと」を分離する。
   * - 返り値 ok=false → runner が該当 target を失敗扱いし、applyLocal を呼ばない
   * - エラーメッセージは fail の reason として記録
   *
   * 省略時は ok=true (全 output を成功扱い)。後方互換のため optional。
   */
  validateOutput?(output: O, target: Target<I>): { ok: true } | { ok: false; reason: string };

  /**
   * タスク全体の事後 health-check。run+apply が全部終わった後に runner が呼ぶ。
   * 「想定件数の何%は埋まっているべき」「主要キーは入っているはず」等を確認する。
   *
   * - 返り値 ok=false → runner が ⚠ 警告ログを出し、exit code 1 にする
   * - 返り値 ok=true でも warnings に注意を入れられる
   *
   * 省略時は health-check スキップ。
   */
  healthCheck?(ctx: PipelineCtx): Promise<HealthCheckResult>;
};

export type HealthCheckResult = {
  ok: boolean;
  /** "snapshot: price_jpy 埋まり 99% (3540/3572)" 等 */
  metrics: string[];
  /** ok=false のときの致命的な理由 */
  reasons?: string[];
  /** ok=true でも気になる点があれば */
  warnings?: string[];
};
