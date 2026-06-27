import type { Stock } from "@/domain/types";
import type { PhaseScores } from "@/domain/types";

/** ベータ差が小さい(=ほぼ 0)場合は中立扱いにするためのしきい値。 */
const SIGN_TONE_EPS = 0.1;

export function signTone(v: number): "positive" | "negative" | undefined {
  if (v > SIGN_TONE_EPS) return "positive";
  if (v < -SIGN_TONE_EPS) return "negative";
  return undefined;
}

type Nullable<T> = T | null;

function highlightExtremum<K extends keyof Stock>(
  key: K,
  compare: (a: number, b: number) => number,
): (stocks: Stock[]) => string | undefined {
  return (stocks) => {
    if (stocks.length < 2) return undefined;
    const valued = stocks
      .map((s) => ({ s, v: s[key] as unknown as Nullable<number> }))
      .filter((x): x is { s: Stock; v: number } => typeof x.v === "number");
    if (valued.length < 2) return undefined;
    valued.sort((a, b) => compare(a.v, b.v));
    return valued[0].s.code;
  };
}

/** `null` 許容フィールドで最大値の銘柄をハイライト。 */
export function highlightMaxNullable<K extends keyof Stock>(key: K) {
  return highlightExtremum(key, (a, b) => b - a);
}

/** `null` 許容フィールドで最小値の銘柄をハイライト。 */
export function highlightMinNullable<K extends keyof Stock>(key: K) {
  return highlightExtremum(key, (a, b) => a - b);
}

/** PhaseScores の特定キー (launch/expansion/...) で最大値の銘柄をハイライト。 */
export function highlightMaxPhase(phase: keyof PhaseScores) {
  return (stocks: Stock[]) => {
    if (stocks.length < 2) return undefined;
    const valued = stocks
      .map((s) => ({ s, v: s.phaseScores?.[phase] }))
      .filter((x): x is { s: Stock; v: number } => typeof x.v === "number");
    if (valued.length < 2) return undefined;
    valued.sort((a, b) => b.v - a.v);
    return valued[0].s.code;
  };
}
