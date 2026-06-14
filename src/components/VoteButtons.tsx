"use client";

import { useEffect, useState } from "react";
import type { Prediction } from "@/content/predictions";
import {
  getVote,
  setVote as persistVote,
  clearVote,
  getStats,
  recordResolution,
  type VoteRecord,
  type Stats,
} from "@/shared/client/voteStore";

/**
 * 予測コミット用ボタン（localStorage 永続化）
 *
 * 賭けません・賞金もありません。各 prediction について 1 票（変更可能）。
 * resolved 後は的中／外しを自動判定して的中率カウンタを更新。
 */
export function VoteButtons({ prediction }: { prediction: Prediction }) {
  const [mounted, setMounted] = useState(false);
  const [vote, setVote] = useState<VoteRecord | null>(null);
  const [stats, setStats] = useState<Stats>({ hits: 0, total: 0 });

  // 初期ロード
  useEffect(() => {
    setVote(getVote(prediction.id));
    setStats(getStats());
    setMounted(true);
  }, [prediction.id]);

  // resolved 予測なら自動で stats に反映（初回のみ）
  useEffect(() => {
    if (!mounted) return;
    if (prediction.status !== "resolved" || !prediction.resolution) return;
    if (!vote) return;
    const isHit = vote.choiceKey === prediction.resolution.outcomeKey;
    const next = recordResolution(prediction.id, isHit);
    setStats(next);
  }, [mounted, prediction, vote]);

  const onVote = (choiceKey: string) => {
    const record = persistVote(prediction.id, choiceKey);
    setVote(record);
  };

  const onClear = () => {
    clearVote(prediction.id);
    setVote(null);
  };

  const isResolved = prediction.status === "resolved" && prediction.resolution;

  // resolved 状態：結果と自分の予測を見比べる
  if (isResolved) {
    const voted = vote
      ? prediction.choices.find((c) => c.key === vote.choiceKey)
      : null;
    const isHit =
      voted && prediction.resolution!.outcomeKey === vote!.choiceKey;
    return (
      <div className="mt-5 pt-5 border-t border-border">
        <div className="text-[10px] tracking-[0.2em] uppercase text-dim mb-2">
          あなたの予測との照合
        </div>
        {!mounted ? (
          <div className="h-8" />
        ) : voted ? (
          <div className="flex items-center gap-3 flex-wrap text-[12px]">
            <span className="text-muted">あなたの予測：</span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-sm ${
                isHit
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground border border-foreground"
              }`}
            >
              {voted.label}
              <span className="ml-1">{isHit ? "✓ 的中" : "✗ 外し"}</span>
            </span>
            <span className="text-dim">|</span>
            <span className="text-muted">
              累積：
              <span className="text-foreground font-bold tabular">
                {stats.hits}
              </span>
              <span className="text-dim"> / {stats.total} 件的中</span>
              {stats.total > 0 && (
                <span className="text-dim ml-1.5">
                  （{Math.round((stats.hits / stats.total) * 100)}%）
                </span>
              )}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-dim">
            この予測には票を入れていません。次の予測カードで予測してみましょう。
          </p>
        )}
      </div>
    );
  }

  // upcoming / live：投票ボタン
  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="text-[10px] tracking-[0.2em] uppercase text-dim mb-2">
        あなたの予測を記録
      </div>
      <p className="text-[11px] text-muted mb-3">
        賭けません・賞金もありません。後で答え合わせされ、あなたの的中率がこのブラウザに溜まります。
      </p>
      <div className="flex flex-wrap gap-2">
        {prediction.choices.map((c) => {
          const isPicked = vote?.choiceKey === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onVote(c.key)}
              className={`text-[13px] font-bold border px-4 py-2 rounded-sm transition ${
                isPicked
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground bg-surface text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              {isPicked ? "✓ " : ""}
              {c.label}
              {isPicked ? "" : " に賭ける気持ち"}
            </button>
          );
        })}
      </div>

      {/* 投票後のフィードバック */}
      {mounted && vote && (
        <p className="text-[11px] text-muted mt-3">
          記録しました：
          <span className="font-bold text-foreground ml-1">
            {prediction.choices.find((c) => c.key === vote.choiceKey)?.label}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="ml-3 text-[10px] text-dim hover:text-foreground underline decoration-dotted underline-offset-2"
          >
            取り消す
          </button>
        </p>
      )}

      {/* 累積スコア */}
      {mounted && stats.total > 0 && (
        <p className="text-[11px] text-dim mt-3 pt-2 border-t border-border">
          あなたの累積的中率：
          <span className="text-foreground font-bold tabular ml-1">
            {stats.hits} / {stats.total}
          </span>
          <span className="ml-1.5">
            （{Math.round((stats.hits / stats.total) * 100)}%）
          </span>
        </p>
      )}
    </div>
  );
}
