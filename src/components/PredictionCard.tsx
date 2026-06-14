import { Countdown } from "./Countdown";
import { Disclose } from "./Disclose";
import { VoteButtons } from "./VoteButtons";
import { Term } from "./Term";
import type {
  Prediction,
  PredictionChoice,
  DisclosureDetail,
} from "@/content/predictions";
import { eventLabelFull } from "@/shared/predictionLabels";
import { formatShortDateTime, formatTimeHms } from "@/shared/format";

/**
 * 予測カード = 学習カード。
 *
 * データを掘る派：質問と確率を見て即予測。AI の推論を検証。
 * これから学ぶ派：「見るべきポイント」「考え方のフレーム」を開いて学習。
 *
 * Polymarket の本質的な良いところ（確率・対立サイド・時系列・答え合わせ可能性）を
 * 投資ドメインに「賭けずに」持ち込む。
 *
 * 表示モード：
 *   - upcoming/live: 予測可能、確率と動いた瞬間を表示
 *   - resolved: 結果と「教訓」を表示
 */
export function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const isResolved = p.status === "resolved" && p.resolution;
  const aiPickChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);

  return (
    <div className="border-2 border-foreground rounded-md bg-surface overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase">
            {p.status === "live" ? "🔴 LIVE" : isResolved ? "✓ Resolved" : "Upcoming"}
          </span>
          <span className="text-[11px] text-background/70">|</span>
          <span className="text-[11px] text-background/80">{eventLabelFull(p.eventType)}</span>
        </div>
        {!isResolved && (
          <div className="bg-background text-foreground px-2.5 py-1 rounded-sm">
            <Countdown target={p.deadlineAt} />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* イベント名 */}
        <div className="text-[11px] text-muted mb-2 tracking-wide">{p.eventName}</div>

        {/* 質問 */}
        <h3 className="text-base sm:text-lg font-bold leading-snug tracking-tight mb-1">
          Q. {p.question}
        </h3>
        {p.questionNote && (
          <p className="text-[12px] text-muted leading-relaxed mb-4">{p.questionNote}</p>
        )}

        {/* 適時開示の生データ + AI 解読 — disclosure 型のみ */}
        {p.disclosureDetail && <DisclosurePanel detail={p.disclosureDetail} />}

        {/* 確率バー */}
        <div className="mt-4 mb-3">
          <ProbabilityBars choices={p.choices} aiPick={p.aiReasoning.pick} />
        </div>

        {/* AI の選択を強調 */}
        {aiPickChoice && !isResolved && (
          <div className="text-[11px] text-muted mb-4 flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border border-foreground bg-ai-soft" />
            AI の見立て：<span className="font-bold text-foreground">{aiPickChoice.label}</span>
            <span className="text-dim">（確信度 {p.aiReasoning.confidence}%）</span>
          </div>
        )}

        {/* 結果（resolved の場合） */}
        {isResolved && p.resolution && (
          <div className="mt-4 mb-4 border border-foreground bg-accent-soft px-4 py-3 rounded-sm">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">結果 / Result</div>
            <div className="text-lg font-bold mb-1">{p.resolution.outcomeLabel}</div>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span className="text-[11px] text-dim">
                {formatShortDateTime(p.resolution.resolvedAt)}
              </span>
              {aiPickChoice && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                    p.aiReasoning.pick === p.resolution.outcomeKey
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground border border-foreground"
                  }`}
                >
                  AI: {aiPickChoice.label}
                  <span className="ml-1">
                    {p.aiReasoning.pick === p.resolution.outcomeKey ? "✓ 的中" : "✗ 外し"}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* 動いた瞬間 — 時系列 */}
        {p.shifts.length > 0 && !isResolved && (
          <Disclose label={`動いた瞬間（${p.shifts.length} 件）を見る`} openLabel="折りたたむ">
            <ul className="space-y-2 text-[13px]">
              {p.shifts.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[10px] text-dim tabular mt-1 shrink-0 w-24">
                    {formatShortDateTime(s.at)}
                  </span>
                  <span
                    className={`text-[11px] font-bold tabular shrink-0 w-12 ${
                      s.delta >= 0 ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {s.delta >= 0 ? "+" : ""}
                    {s.delta}pp
                  </span>
                  <span className="text-muted">{s.reason}</span>
                </li>
              ))}
            </ul>
          </Disclose>
        )}

        {/* ─── 学習セクション ─── */}
        <div className="mt-5 pt-5 border-t border-border space-y-1">
          <div className="text-[10px] tracking-[0.2em] uppercase text-dim mb-2">
            予測する前に — ここを見る・こう考える
          </div>

          {/* 見るべきポイント */}
          <Disclose
            label={`🔍 見るべきポイント（${p.checkpoints.length} 個）`}
            openLabel="🔍 見るべきポイント（閉じる）"
          >
            <p className="text-[11px] text-dim mb-3">
              この質問に答えを出すために、まずこれらの情報を確認します。
            </p>
            <ul className="space-y-3">
              {p.checkpoints.map((c, i) => (
                <li key={i} className="border-l-2 border-foreground/30 pl-3">
                  <div className="text-[13px] font-bold leading-tight">
                    {c.href ? (
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener"
                        className="underline decoration-dotted underline-offset-2 hover:text-muted"
                      >
                        {c.label} ↗
                      </a>
                    ) : (
                      c.label
                    )}
                  </div>
                  <div className="text-[12px] text-muted mt-0.5 leading-relaxed">
                    なぜ：{c.why}
                  </div>
                </li>
              ))}
            </ul>
          </Disclose>

          {/* 考え方のフレーム */}
          <Disclose
            label={`🎯 考え方のフレーム（${p.frames.length} 個）`}
            openLabel="🎯 考え方のフレーム（閉じる）"
          >
            <p className="text-[11px] text-dim mb-3">
              プロが頭の中で使っている<Term>メンタルモデル</Term>（考え方の型）。一度覚えると他の銘柄でも応用できます。
            </p>
            <ul className="space-y-3">
              {p.frames.map((f, i) => (
                <li key={i} className="bg-surface-elev border border-border rounded-sm px-3 py-2">
                  <div className="text-[13px] font-bold leading-tight mb-1">{f.title}</div>
                  <div className="text-[12px] text-muted leading-relaxed">{f.body}</div>
                </li>
              ))}
            </ul>
          </Disclose>

          {/* 過去パターン */}
          <Disclose
            label={`📊 過去 ${p.history.length} 四半期の修正パターン`}
            openLabel="📊 過去パターン（閉じる）"
          >
            <p className="text-[11px] text-dim mb-3">
              歴史で考える訓練。この会社の過去の傾向と、為替・受注などの環境が今と何が違うか。
            </p>
            <div className="border border-border rounded-sm overflow-hidden">
              {p.history.map((h, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_auto_1fr] gap-3 px-3 py-2 text-[12px] border-b border-border last:border-b-0"
                >
                  <span className="tabular text-dim w-16">{h.period}</span>
                  <span className="font-bold w-16">{h.outcome}</span>
                  {h.note && <span className="text-muted">{h.note}</span>}
                </div>
              ))}
            </div>
          </Disclose>

          {/* AI の推論 */}
          <Disclose
            label={`🤖 AI の推論を見る（${p.aiReasoning.steps.length} ステップ）`}
            openLabel="🤖 AI の推論（閉じる）"
          >
            <p className="text-[11px] text-dim mb-3">
              AI がどの情報をどう重み付けして確率を出したか。検証してから自分の予測を決められます。
            </p>
            <ul className="space-y-2">
              {p.aiReasoning.steps.map((s, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-center text-[13px] border-b border-border pb-2 last:border-b-0"
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                      s.direction === "+"
                        ? "bg-foreground text-background"
                        : s.direction === "-"
                          ? "bg-accent-soft border border-foreground text-foreground"
                          : "bg-surface-elev border border-border text-muted"
                    }`}
                  >
                    {s.direction}
                  </span>
                  <span className="text-muted">{s.signal}</span>
                  {s.weight !== undefined && (
                    <span className="text-[10px] text-dim tabular">重み {s.weight}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[12px] bg-ai-soft border-l-2 border-foreground pl-3 py-2">
              総合：
              <span className="font-bold text-foreground mx-1">
                {aiPickChoice?.label}
              </span>
              （AI 確信度 {p.aiReasoning.confidence}%）
            </div>
          </Disclose>

          {/* 用語集動線 */}
          {p.glossaryTerms && p.glossaryTerms.length > 0 && (
            <div className="text-[11px] text-muted mt-4 pt-3 border-t border-border">
              この予測で出てくる用語：
              <span className="text-foreground ml-1">
                {p.glossaryTerms.join(" / ")}
              </span>
              <span className="text-dim ml-1.5">（hover で解説）</span>
            </div>
          )}
        </div>

        {/* 答え合わせ — Resolution */}
        {isResolved && p.resolution && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="text-[10px] tracking-[0.2em] uppercase text-dim mb-2">
              🎓 答え合わせと学び
            </div>

            <div className="bg-accent-soft border border-border rounded-sm p-4 space-y-4">
              <div>
                <div className="text-[12px] font-bold mb-1.5">▼ なぜそうなったか</div>
                <ul className="text-[12px] text-muted space-y-1 list-disc list-inside">
                  {p.resolution.why.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              {p.resolution.surprises.length > 0 && (
                <div>
                  <div className="text-[12px] font-bold mb-1.5">▼ 想定外の要因</div>
                  <ul className="text-[12px] text-muted space-y-1 list-disc list-inside">
                    {p.resolution.surprises.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {p.resolution.lessons.length > 0 && (
                <div>
                  <div className="text-[12px] font-bold mb-1.5">
                    ▼ 見落とされやすかったポイント
                  </div>
                  <ul className="text-[12px] text-muted space-y-1 list-disc list-inside">
                    {p.resolution.lessons.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 予測コミットボタン（localStorage に永続化） */}
        <VoteButtons prediction={p} />

        {/* 注意書き */}
        <p className="text-[10px] text-dim mt-5 pt-4 border-t border-border leading-relaxed">
          ※ 本予測は編集部 + AI による公開情報ベースの予測であり、投資助言・投資推奨ではありません。投資判断はご自身の責任で行ってください。
        </p>
      </div>
    </div>
  );
}

/**
 * 適時開示の生データ + AI 解読パネル。
 * disclosureDetail を持つ予測（eventType === "disclosure"）でのみ表示される。
 *
 * 「開示が出る → 数十秒後に AI が解読 → 5 分以内に予測 → 30 分で答え合わせ」
 * という Polymarket 的超短期サイクルの「開示 → AI」までの可視化を担う。
 */
function DisclosurePanel({ detail }: { detail: DisclosureDetail }) {
  const interpDelaySec = Math.round(
    (new Date(detail.aiInterpretation.interpretedAt).getTime() -
      new Date(detail.releasedAt).getTime()) /
      1000,
  );
  const biasLabel: Record<DisclosureDetail["aiInterpretation"]["bias"], string> = {
    bullish: "強気サプライズ",
    bearish: "弱気サプライズ",
    neutral: "中立",
  };
  const biasColor: Record<DisclosureDetail["aiInterpretation"]["bias"], string> = {
    bullish: "bg-foreground text-background border-foreground",
    bearish: "bg-background text-foreground border-foreground",
    neutral: "bg-accent-soft text-foreground border-border",
  };

  return (
    <div className="my-4 space-y-3">
      {/* 適時開示の生データ */}
      <div className="bg-surface-elev border border-border rounded-md overflow-hidden">
        <div className="bg-foreground/[0.03] px-3 py-2 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">
              📰 TDnet 適時開示
            </span>
            <span className="text-[10px] tabular text-dim">
              {formatTimeHms(detail.releasedAt)}
            </span>
          </div>
          <span className="text-[10px] font-bold border border-border bg-surface px-1.5 py-0.5 rounded-sm text-foreground">
            {detail.disclosureType}
          </span>
        </div>
        <div className="px-3 py-3">
          <div className="text-[13px] font-bold leading-snug mb-2">
            {detail.rawTitle}
          </div>
          <Disclose label="本文を読む" openLabel="本文を閉じる">
            <pre className="text-[11px] text-muted leading-relaxed whitespace-pre-wrap font-sans bg-background border border-border rounded-sm p-3 mt-1">
              {detail.rawSnippet}
            </pre>
          </Disclose>
        </div>
      </div>

      {/* AI による即時解読 */}
      <div className="ai-section pl-3 -ml-3 py-3 pr-3 bg-ai-soft/40 rounded-r-md">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">
              🤖 AI による即時解読
            </span>
            <span className="text-[10px] tabular text-dim">
              {formatTimeHms(detail.aiInterpretation.interpretedAt)}
              <span className="text-dim ml-1">
                （開示後 {interpDelaySec} 秒）
              </span>
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${biasColor[detail.aiInterpretation.bias]}`}
          >
            {biasLabel[detail.aiInterpretation.bias]}
          </span>
        </div>

        <p className="text-[13px] leading-relaxed font-medium mb-3">
          {detail.aiInterpretation.summary}
        </p>

        <Disclose label="🔍 抽出された主要ポイントを見る" openLabel="主要ポイントを閉じる">
          <ul className="space-y-1.5 text-[12px] mt-2">
            {detail.aiInterpretation.keyPoints.map((kp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 border-l-2 border-foreground/40 pl-2.5"
              >
                <span className="text-muted leading-relaxed">{kp}</span>
              </li>
            ))}
          </ul>
        </Disclose>

        <div className="mt-3 bg-surface border border-border rounded-sm p-3">
          <div className="text-[10px] tracking-wider text-dim mb-1">
            株価への影響予想
          </div>
          <p className="text-[12px] leading-relaxed text-muted">
            {detail.aiInterpretation.impactPrediction}
          </p>
        </div>
      </div>

      {/* 結果計測（resolved 時） */}
      {detail.resultMeasure && (
        <div className="bg-accent-soft border border-foreground rounded-md px-3 py-3">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">
            📊 実測結果
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className={`text-2xl font-bold tabular font-mono ${
                detail.resultMeasure.priceChange >= 0
                  ? "text-foreground"
                  : "text-muted"
              }`}
            >
              {detail.resultMeasure.priceChange >= 0 ? "+" : ""}
              {detail.resultMeasure.priceChange.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted">
              {formatTimeHms(detail.resultMeasure.measuredAt)} 時点
              {detail.resultMeasure.note && (
                <span className="text-dim ml-2">／ {detail.resultMeasure.note}</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 確率を Yes/No (2 値) または 3 択で水平バーで表示。
 * AI が picked した choice にマークを付ける。
 */
function ProbabilityBars({
  choices,
  aiPick,
}: {
  choices: PredictionChoice[];
  aiPick: string;
}) {
  return (
    <div>
      {/* 1 本帯の積み上げ表示 */}
      <div className="flex h-6 w-full border border-foreground rounded-sm overflow-hidden mb-2">
        {choices.map((c, i) => (
          <div
            key={c.key}
            className={`flex items-center justify-center text-[11px] font-bold tabular ${
              i === 0
                ? "bg-foreground text-background"
                : i === 1
                  ? "bg-foreground/35 text-foreground"
                  : "bg-foreground/10 text-foreground"
            }`}
            style={{ width: `${c.probability}%` }}
          >
            {c.probability >= 12 ? `${c.probability}%` : ""}
          </div>
        ))}
      </div>

      {/* 凡例 — flex で 2 択／3 択に自動適応 */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
        {choices.map((c, i) => {
          const delta =
            c.probabilityWeekAgo !== undefined
              ? c.probability - c.probabilityWeekAgo
              : undefined;
          const isAiPick = c.key === aiPick;
          return (
            <div
              key={c.key}
              className={`flex items-start gap-2 ${isAiPick ? "" : ""}`}
            >
              <span
                className={`inline-block w-2.5 h-2.5 mt-1 shrink-0 ${
                  i === 0
                    ? "bg-foreground"
                    : i === 1
                      ? "bg-foreground/35"
                      : "bg-foreground/10 border border-foreground/30"
                }`}
              />
              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold">{c.label}</span>
                  {isAiPick && (
                    <span className="text-[9px] tracking-wider text-muted">AI</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="tabular font-mono text-sm font-bold">
                    {c.probability}%
                  </span>
                  {delta !== undefined && delta !== 0 && (
                    <span
                      className={`text-[10px] tabular ${
                        delta > 0 ? "text-foreground" : "text-muted"
                      }`}
                      title="pp = パーセンテージポイント。確率の差を表す単位。"
                    >
                      ({delta > 0 ? "+" : ""}
                      {delta}<Term term="pp">pp</Term> / 1 週間)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
