import Link from "next/link";
import { Countdown } from "./Countdown";
import { getStock } from "@/lib/data";
import { daysFromToday } from "@/lib/predictions";
import type { Prediction } from "@/lib/predictions";

/**
 * ハブページ用のコンパクトな予測カード。
 * クリックで該当銘柄ページの予測セクションへスクロール、または個別予測ページへ。
 */
export function PredictionListItem({ prediction: p }: { prediction: Prediction }) {
  const stock = p.stockCode ? getStock(p.stockCode) : null;
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
                    ? "bg-accent-soft text-muted border border-border"
                    : "text-muted border border-border"
              }`}
            >
              {p.status === "live" ? "🔴 LIVE" : isResolved ? "✓ Resolved" : "Upcoming"}
            </span>
            <span className="text-[10px] text-dim tracking-wide">
              {eventLabel(p.eventType)}
            </span>
            {stock && (
              <span className="text-[11px] text-muted">
                <span className="tabular text-dim">{stock.code}</span>{" "}
                <span>{stock.name}</span>
              </span>
            )}
            {!stock && (
              <span className="text-[11px] text-muted">マクロ（全銘柄横断）</span>
            )}
          </div>
          {!isResolved && (
            <span className="text-[11px] text-muted">
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
            <span className="text-[10px] text-muted ml-1 font-normal">{topChoice.label}</span>
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted">
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
            <span className="text-[10px] text-dim whitespace-nowrap">
              AI: <span className="text-foreground">{aiPick.label}</span>
            </span>
          )}
          {isResolved && (
            <span
              className={`text-[10px] font-bold whitespace-nowrap ${
                aiHit ? "text-foreground" : "text-muted"
              }`}
            >
              AI {aiHit ? "✓" : "✗"}
            </span>
          )}
        </div>

        {/* イベント日付 / resolved label */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px]">
          <span className="text-dim">
            {isResolved ? "結果：" : days === 0 ? "本日" : days === 1 ? "明日" : `${days} 日後`}{" "}
            <span className="text-muted">{formatDate(p.eventAt)}</span>
          </span>
          {isResolved && p.resolution && (
            <span className="text-muted font-bold">{p.resolution.outcomeLabel.slice(0, 24)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function eventLabel(t: Prediction["eventType"]): string {
  switch (t) {
    case "earnings":
      return "Earnings";
    case "disclosure":
      return "Disclosure";
    case "macro":
      return "Macro";
    case "news":
      return "News";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
