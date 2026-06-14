import type { PhaseScores } from "./types";

export type PhaseKey = keyof PhaseScores;

export const PHASES: { key: PhaseKey; label: string }[] = [
  { key: "launch", label: "ローンチ期" },
  { key: "expansion", label: "拡大期" },
  { key: "mature", label: "成熟期" },
  { key: "decline", label: "衰退期" },
];

const PHASE_LABEL: Record<PhaseKey, string> = {
  launch: "ローンチ期",
  expansion: "拡大期",
  mature: "成熟期",
  decline: "衰退期",
};

/**
 * 最も支配的なフェーズ名を返す。
 *
 * @param withCohabitation true の場合、上位 2 つの差が 18 未満なら「A／B 併存」と返す。
 *   similarity.ts は併存表示あり、compare.ts は併存なしで挙動が異なっていたため引数で切り替え。
 */
export function dominantPhase(p: PhaseScores, withCohabitation = false): string {
  const entries = PHASES.map((ph) => [ph.label, p[ph.key]] as [string, number]).sort(
    (a, b) => b[1] - a[1],
  );
  if (withCohabitation && entries[0][1] - entries[1][1] < 18) {
    return `${entries[0][0]}／${entries[1][0]}併存`;
  }
  return entries[0][0];
}

export const phaseLabel = (key: PhaseKey): string => PHASE_LABEL[key];
