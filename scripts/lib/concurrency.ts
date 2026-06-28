/**
 * 「N 個のアイテムを並列度 C で処理 + 失敗時バックオフリトライ + 進捗ログ」
 * の共通実装。
 *
 * なぜ必要か:
 *   - 外部 API(特に Yahoo Finance)はサイレント rate-limit がある。並列度を上げると
 *     エラーは返さないが空ペイロードを返してくる。タスク側で個別実装すると
 *     必ず一箇所抜け落ちて事故になる(2026-06-28 の snapshot 大失敗)。
 *   - リトライ/バックオフ/進捗ログをタスクごとに書くのは退屈で、テストも書きにくい。
 *
 * 使い方:
 *   const result = await mapWithLimit(codes, (code) => fetchOne(code), {
 *     concurrency: 2,
 *     retryDelaysMs: [800, 2400],
 *     label: "yahoo-snapshot",
 *   });
 *   // result.ok: Map<string, T>, result.fail: Map<string, Error>
 */

export type MapOptions = {
  /** 同時実行数(デフォルト 4) */
  concurrency?: number;
  /** リトライ間ディレイ(ms)の配列。長さ = 最大リトライ回数。空配列ならリトライなし */
  retryDelaysMs?: number[];
  /** 進捗ログのラベル */
  label?: string;
  /** 何件ごとに進捗を出すか(デフォルト 200、0 なら出力しない) */
  progressEvery?: number;
  /** 失敗詳細を出す最大件数(デフォルト 5)。それ以降は件数のみ */
  verboseFailures?: number;
};

export type MapResult<K, V> = {
  ok: Map<K, V>;
  fail: Map<K, Error>;
};

export async function mapWithLimit<I extends { key: string }, V>(
  items: I[],
  fn: (item: I) => Promise<V>,
  opts: MapOptions = {},
): Promise<MapResult<string, V>> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const retryDelays = opts.retryDelaysMs ?? [];
  const label = opts.label ?? "task";
  const progressEvery = opts.progressEvery ?? 200;
  const verboseFailures = opts.verboseFailures ?? 5;

  const ok = new Map<string, V>();
  const fail = new Map<string, Error>();
  let verbose = 0;
  let processed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      slice.map((it) => runWithRetry(it, fn, retryDelays)),
    );
    for (let j = 0; j < slice.length; j++) {
      const r = results[j];
      const key = slice[j].key;
      if (r.status === "fulfilled") {
        ok.set(key, r.value);
      } else {
        const err = r.reason instanceof Error ? r.reason : new Error(String(r.reason));
        fail.set(key, err);
        verbose += 1;
        if (verbose <= verboseFailures) {
          console.warn(`    ! ${label} ${key}: ${err.message}`);
        }
      }
      processed += 1;
    }
    if (progressEvery > 0 && processed % progressEvery < concurrency) {
      console.log(
        `    … ${label} ${processed}/${items.length} ok=${ok.size} fail=${fail.size}`,
      );
    }
  }

  if (fail.size > 0) {
    const pct = ((fail.size / items.length) * 100).toFixed(1);
    console.warn(`    ⚠ ${label} fail=${fail.size}/${items.length} (${pct}%)`);
  }
  return { ok, fail };
}

async function runWithRetry<I, V>(
  item: I,
  fn: (item: I) => Promise<V>,
  retryDelays: number[],
): Promise<V> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      return await fn(item);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const delay = retryDelays[attempt];
      if (delay == null) break;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("runWithRetry: unknown failure");
}
