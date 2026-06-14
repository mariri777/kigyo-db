import Link from "next/link";
import { Countdown } from "./Countdown";
import { daysFromToday } from "@/content/predictions";
import type { Prediction } from "@/content/predictions";
import { eventLabelShort } from "@/shared/predictionLabels";
import { formatPredictionEventDate } from "@/shared/format";

/**
 * ハブページ用のコンパクトな予測カード。
 * クリックで該当銘柄ページの予測セクションへスクロール、または個別予測ページへ。
 *
 * stockName は呼び出し側でマップして渡す(client/server どちらからも使えるように、
 * このコンポーネント自体は DB を叩かない)。
 */
export function PredictionListItem({
  prediction: p,
  stockName,
}: {
  prediction: Prediction;
  stockName?: string | null;
}) {
  const stock =
    p.stockCode && stockName ? { code: p.stockCode, name: stockName } : null;
  const aiPick = p.choices.find((c) => c.key === p.aiReasoning.pick);
  const topChoice = [...p.choices].sort((a, b) => b.probability - a.probability)[0];
  const isResolved = p.status === "resolved" && p.resolution;
  const aiHit = isResolved && p.resolution!.outcomeKey === p.aiReasoning.pick;
  const days = daysFromToday(p.eventAt);

  // 個別の deep link がメイン（シェア可能）。銘柄ページへの動線は中で別に置く。
  const href = `/predictions/${p.id}`;

  return (
    <Link
      href={href}
      className="block border border-border hover:border-foreground rounded-md bg-surface transition-colors group"
    >
      <div className="p-4">
        {/* メタ */}
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm ${
                p.status === "live"
                  ? "bg-foreground text-background"
                  : isResolved
                    ? "bg-muted text-muted-foreground border border-border"
                    : "text-muted-foreground border border-border"
              }`}
            >
              {p.status === "live" ? "🔴 LIVE" : isResolved ? "✓ Resolved" : "Upcoming"}
            </span>
            <span className="text-[10px] text-foreground/60 tracking-wide">
              {eventLabelShort(p.eventType)}
            </span>
            {stock && (
              <span className="text-[11px] text-muted-foreground">
                <span className="tabular text-foreground/60">{stock.code}</span>{" "}
                <span>{stock.name}</span>
              </span>
            )}
            {!stock && (
              <span className="text-[11px] text-muted-foreground">マクロ（全銘柄横断）</span>
            )}
          </div>
          {!isResolved && (
            <span className="text-[11px] text-muted-foreground">
              <Countdown target={p.deadlineAt} />
            </span>
          )}
        </div>

        {/* 質問 */}
        <h3 className="text-[14px] font-bold leading-snug mb-3 group-hover:underline decoration-foreground/40 underline-offset-2">
          {p.question}
        </h3>

        {/* 確率（コンパクト：トップ choice + 他 + AI） */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[11px]">
          <span className="font-bold text-base tabular tracking-tight">
            {topChoice.probability}%
            <span className="text-[10px] text-muted-foreground ml-1 font-normal">{topChoice.label}</span>
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
            {p.choices
              .filter((c) => c.key !== topChoice.key)
              .map((c) => (
                <span key={c.key} className="tabular">
                  {c.label}{" "}
                  <span className="text-foreground/80 font-bold">{c.probability}%</span>
                </span>
              ))}
          </div>
          {/* AI 見立て */}
          {!isResolved && aiPick && (
            <span className="text-[10px] text-foreground/60 whitespace-nowrap">
              AI: <span className="text-foreground">{aiPick.label}</span>
            </span>
          )}
          {isResolved && (
            <span
              className={`text-[10px] font-bold whitespace-nowrap ${
                aiHit ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              AI {aiHit ? "✓" : "✗"}
            </span>
          )}
        </div>

        {/* イベント日付 / resolved label */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px]">
          <span className="text-foreground/60">
            {isResolved ? "結果：" : days === 0 ? "本日" : days === 1 ? "明日" : `${days} 日後`}{" "}
            <span className="text-muted-foreground">{formatPredictionEventDate(p.eventAt)}</span>
          </span>
          {isResolved && p.resolution && (
            <span className="text-muted-foreground font-bold">{p.resolution.outcomeLabel.slice(0, 24)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

