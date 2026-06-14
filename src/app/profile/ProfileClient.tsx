"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Prediction } from "@/content/predictions";
import { getVotes, getStats, clearAll, type Votes, type Stats } from "@/shared/client/voteStore";
import { PredictionListItem } from "@/components/PredictionListItem";

/**
 * マイ予測ページ — 完全クライアント側で動作。
 * localStorage を直接読み、自分の投票履歴・的中率・AI との対戦成績を表示。
 */
export function ProfileClient({ predictions }: { predictions: Prediction[] }) {
  const [mounted, setMounted] = useState(false);
  const [votes, setVotes] = useState<Votes>({});
  const [stats, setStats] = useState<Stats>({ hits: 0, total: 0 });

  useEffect(() => {
    setVotes(getVotes());
    setStats(getStats());
    setMounted(true);
  }, []);

  const onReset = () => {
    if (!window.confirm("すべての予測履歴・的中率を消去します。元に戻せません。よろしいですか？")) return;
    clearAll();
    setVotes({});
    setStats({ hits: 0, total: 0 });
  };

  // 投票した予測を、resolved / 未決着で分類
  const votedPredictions = predictions
    .filter((p) => votes[p.id])
    .map((p) => ({
      prediction: p,
      voteChoice: votes[p.id].choiceKey,
      votedAt: votes[p.id].votedAt,
    }));

  const myResolved = votedPredictions.filter(
    (v) => v.prediction.status === "resolved" && v.prediction.resolution,
  );
  const myUpcoming = votedPredictions.filter(
    (v) => v.prediction.status !== "resolved",
  );

  // 自分の的中数 / AI の対戦成績（resolved 集合内で比較）
  const myHits = myResolved.filter(
    (v) => v.prediction.resolution!.outcomeKey === v.voteChoice,
  ).length;

  const aiHitsInMyResolved = myResolved.filter(
    (v) =>
      v.prediction.resolution!.outcomeKey === v.prediction.aiReasoning.pick,
  ).length;

  const myHitRate =
    myResolved.length > 0 ? Math.round((myHits / myResolved.length) * 100) : null;
  const aiHitRate =
    myResolved.length > 0
      ? Math.round((aiHitsInMyResolved / myResolved.length) * 100)
      : null;

  // 全 resolved 集合での AI 的中率（参考値）
  const allResolved = predictions.filter(
    (p) => p.status === "resolved" && p.resolution,
  );
  const aiAllHits = allResolved.filter(
    (p) => p.resolution!.outcomeKey === p.aiReasoning.pick,
  ).length;
  const aiAllRate =
    allResolved.length > 0
      ? Math.round((aiAllHits / allResolved.length) * 100)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* ===== ヘッダー ===== */}
      <header className="pb-10 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          My Predictions
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          あなたの的中率と、
          <br />
          AI との対戦成績。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          あなたがこのブラウザで投票した予測の履歴と、答え合わせの結果を表示します。
          データは<strong className="text-foreground">このブラウザにのみ保存</strong>され、サーバーには送信されません。
          別のブラウザ・端末で投票したデータは表示されません。
        </p>
      </header>

      {!mounted ? (
        <div className="text-muted text-sm">読み込み中...</div>
      ) : votedPredictions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ===== 統計サマリー ===== */}
          <section className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted mb-4">
              Score
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="あなたの投票数"
                value={votedPredictions.length.toString()}
                sub={`未決着 ${myUpcoming.length} / 決着 ${myResolved.length}`}
              />
              <StatCard
                label="あなたの的中率"
                value={myHitRate !== null ? `${myHitRate}%` : "—"}
                sub={
                  myResolved.length > 0
                    ? `${myHits} / ${myResolved.length} 件的中`
                    : "決着待ち"
                }
                accent
              />
              <StatCard
                label="同じ予測での AI 的中率"
                value={aiHitRate !== null ? `${aiHitRate}%` : "—"}
                sub={
                  myResolved.length > 0
                    ? `${aiHitsInMyResolved} / ${myResolved.length} 件的中`
                    : "決着待ち"
                }
              />
              <StatCard
                label="AI の全体的中率（参考）"
                value={aiAllRate !== null ? `${aiAllRate}%` : "—"}
                sub={
                  allResolved.length > 0
                    ? `${aiAllHits} / ${allResolved.length} 件的中`
                    : "—"
                }
              />
            </div>

            {/* 対戦結果サマリー */}
            {myResolved.length > 0 && myHitRate !== null && aiHitRate !== null && (
              <div className="mt-4 bg-surface-elev border-l-2 border-foreground p-4 rounded-r-md text-sm leading-relaxed">
                <strong className="text-foreground">対戦結果：</strong>
                {myHitRate > aiHitRate ? (
                  <>
                    あなた {myHitRate}% vs AI {aiHitRate}% で
                    <span className="font-bold text-foreground mx-1">あなた {myHitRate - aiHitRate}pp 勝ち</span>
                    🎉
                  </>
                ) : myHitRate < aiHitRate ? (
                  <>
                    あなた {myHitRate}% vs AI {aiHitRate}% で
                    <span className="font-bold text-foreground mx-1">AI {aiHitRate - myHitRate}pp 勝ち</span>
                    — 次のラウンドで挽回！
                  </>
                ) : (
                  <>あなた {myHitRate}% vs AI {aiHitRate}% で<span className="font-bold text-foreground mx-1">引き分け</span></>
                )}
              </div>
            )}
          </section>

          {/* ===== 進行中の予測 ===== */}
          {myUpcoming.length > 0 && (
            <section className="mb-12">
              <div className="flex items-end justify-between mb-4 pb-2 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    📍 あなたが投票した、進行中の予測
                  </h2>
                  <p className="text-[12px] text-muted mt-1">
                    答え合わせを待っている予測です
                  </p>
                </div>
                <span className="text-[11px] text-dim">{myUpcoming.length} 件</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {myUpcoming.map((v) => (
                  <PredictionListItemWithVote
                    key={v.prediction.id}
                    prediction={v.prediction}
                    voteChoice={v.voteChoice}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== 答え合わせ済み ===== */}
          {myResolved.length > 0 && (
            <section className="mb-12">
              <div className="flex items-end justify-between mb-4 pb-2 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    🎓 答え合わせ済みの予測
                  </h2>
                  <p className="text-[12px] text-muted mt-1">
                    結果と教訓を振り返れます
                  </p>
                </div>
                <span className="text-[11px] text-dim">{myResolved.length} 件</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {myResolved.map((v) => (
                  <PredictionListItemWithVote
                    key={v.prediction.id}
                    prediction={v.prediction}
                    voteChoice={v.voteChoice}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== Reset ===== */}
          <section className="mt-16 pt-8 border-t border-border">
            <details className="text-[12px] text-muted">
              <summary className="cursor-pointer hover:text-foreground">
                履歴をリセット
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-[11px] text-dim leading-relaxed max-w-lg">
                  すべての投票履歴と的中率カウンタを消去します。元に戻せません。
                </p>
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[12px] font-bold border border-foreground bg-surface text-foreground px-4 py-1.5 rounded-sm hover:bg-foreground hover:text-background transition"
                >
                  すべての履歴を消去する
                </button>
              </div>
            </details>
          </section>
        </>
      )}

      {/* ===== 関連 ===== */}
      <section className="mt-16 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">関連</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/predictions" className="text-muted hover:text-foreground transition">
            予測ハブへ →
          </Link>
          <Link href="/stocks" className="text-muted hover:text-foreground transition">
            銘柄一覧へ →
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border rounded-md px-3 py-3 ${
        accent
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface"
      }`}
    >
      <div
        className={`text-[10px] tracking-wider mb-1 ${
          accent ? "text-background/70" : "text-dim"
        }`}
      >
        {label}
      </div>
      <div className="text-2xl font-bold tabular font-mono leading-none">
        {value}
      </div>
      {sub && (
        <div
          className={`text-[10px] mt-1.5 ${accent ? "text-background/60" : "text-dim"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-border rounded-md bg-surface-elev px-6 py-10 text-center">
      <div className="text-5xl mb-4">🎯</div>
      <h2 className="text-lg font-bold mb-2">まだ予測を投票していません</h2>
      <p className="text-[13px] text-muted leading-relaxed max-w-md mx-auto mb-6">
        予測カードの「賭ける気持ち」ボタンを押すと、ここに履歴が溜まり、
        AI との対戦成績が計算されるようになります。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/predictions"
          className="font-bold border border-foreground bg-foreground text-background px-4 py-2 rounded-sm hover:bg-background hover:text-foreground transition"
        >
          予測ハブを見る →
        </Link>
        <Link
          href="/guide"
          className="text-muted hover:text-foreground transition"
        >
          ガイドを読む →
        </Link>
      </div>
    </div>
  );
}

/**
 * PredictionListItem のラッパー — 自分の投票内容を小さく重ねて表示。
 */
function PredictionListItemWithVote({
  prediction,
  voteChoice,
}: {
  prediction: Prediction;
  voteChoice: string;
}) {
  const voted = prediction.choices.find((c) => c.key === voteChoice);
  const isResolved = prediction.status === "resolved" && prediction.resolution;
  const isHit =
    isResolved && prediction.resolution!.outcomeKey === voteChoice;

  return (
    <div className="relative">
      <PredictionListItem prediction={prediction} />
      <div className="absolute top-3 right-3 pointer-events-none">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
            isResolved
              ? isHit
                ? "bg-foreground text-background"
                : "bg-background text-foreground border border-foreground"
              : "bg-accent-soft text-foreground border border-border"
          }`}
        >
          <span className="text-dim">あなた:</span>
          <span>{voted?.label}</span>
          {isResolved && <span className="ml-0.5">{isHit ? "✓" : "✗"}</span>}
        </span>
      </div>
    </div>
  );
}
