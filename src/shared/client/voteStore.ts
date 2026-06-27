/**
 * 予測コミット（投票）の localStorage 永続化レイヤー。
 *
 * VoteButtons コンポーネントから使う共通 store。
 *
 * 賭けないので「投票」だが、内部表現は単純：
 *   ck_db_votes_v1: { [predictionId]: { choiceKey, votedAt } }
 *   ck_db_stats_v1: { hits, total }
 *   ck_db_resolved_counted_<predictionId>: "1"   ← 二重カウント防止
 */

export const VOTES_KEY = "ck_db_votes_v1";
export const STATS_KEY = "ck_db_stats_v1";

export type VoteRecord = { choiceKey: string; votedAt: string };
export type Votes = Record<string, VoteRecord>;
export type Stats = { hits: number; total: number };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, val: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // QuotaExceeded など。サイレントに無視
  }
}

export function getVotes(): Votes {
  return readJSON<Votes>(VOTES_KEY, {});
}

export function getVote(predictionId: string): VoteRecord | null {
  return getVotes()[predictionId] ?? null;
}

export function setVote(predictionId: string, choiceKey: string): VoteRecord {
  const record: VoteRecord = { choiceKey, votedAt: new Date().toISOString() };
  const votes = getVotes();
  votes[predictionId] = record;
  writeJSON(VOTES_KEY, votes);
  return record;
}

export function clearVote(predictionId: string): void {
  const votes = getVotes();
  delete votes[predictionId];
  writeJSON(VOTES_KEY, votes);
}

export function getStats(): Stats {
  return readJSON<Stats>(STATS_KEY, { hits: 0, total: 0 });
}

export function recordResolution(
  predictionId: string,
  isHit: boolean,
): Stats {
  if (!isBrowser()) return getStats();
  const flagKey = `ck_db_resolved_counted_${predictionId}`;
  if (window.localStorage.getItem(flagKey)) return getStats();
  const stats = getStats();
  const next: Stats = {
    hits: stats.hits + (isHit ? 1 : 0),
    total: stats.total + 1,
  };
  writeJSON(STATS_KEY, next);
  window.localStorage.setItem(flagKey, "1");
  return next;
}

/** 全データ消去（プロファイルのリセット用） */
export function clearAll(): void {
  if (!isBrowser()) return;
  const votes = getVotes();
  for (const id of Object.keys(votes)) {
    window.localStorage.removeItem(`ck_db_resolved_counted_${id}`);
  }
  window.localStorage.removeItem(VOTES_KEY);
  window.localStorage.removeItem(STATS_KEY);
}
