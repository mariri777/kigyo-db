import type { Insight } from "./types";

/**
 * 論点を {lede, rest} に分割する。
 * - 明示的に lede があればそれを使用、残りを rest に
 * - なければ body の最初の 1〜2 文を lede として自動抽出、残りを rest に
 * - 1 文しかない短い論点なら rest = null
 */
export function splitInsight(ins: Insight): { lede: string; rest: string | null } {
  if (ins.lede) {
    return { lede: ins.lede, rest: ins.body };
  }
  const sentences = ins.body.match(/[^。]+。/g);
  if (!sentences || sentences.length === 0) {
    return { lede: ins.body, rest: null };
  }
  if (sentences.length === 1) {
    return { lede: ins.body.trim(), rest: null };
  }
  const first = sentences[0].trim();
  const lede = first.length < 80 ? (sentences[0] + sentences[1]).trim() : first;
  const usedLength = lede.length;
  const rest = ins.body.slice(usedLength).trim();
  return { lede, rest: rest || null };
}
