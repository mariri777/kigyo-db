import type { DisclosureDetail } from "@/content/predictions";
import { Disclose } from "@/components/Disclose";
import { formatTimeHms } from "@/shared/format";

type Bias = DisclosureDetail["aiInterpretation"]["bias"];

const BIAS_LABEL: Record<Bias, string> = {
  bullish: "強気サプライズ",
  bearish: "弱気サプライズ",
  neutral: "中立",
};

const BIAS_CLASS: Record<Bias, string> = {
  bullish: "bg-foreground text-background border-foreground",
  bearish: "bg-background text-foreground border-foreground",
  neutral: "bg-muted text-foreground border-border",
};

/**
 * 適時開示の生データ + AI 即時解読パネル。
 * 開示 → AI までの「Polymarket 的超短期サイクル」の前半部分を可視化する。
 */
export function DisclosurePanel({ detail }: { detail: DisclosureDetail }) {
  const interpDelaySec = Math.round(
    (new Date(detail.aiInterpretation.interpretedAt).getTime() -
      new Date(detail.releasedAt).getTime()) /
      1000,
  );

  return (
    <div className="my-4 space-y-3">
      <div className="bg-surface-elev border border-border rounded-md overflow-hidden">
        <div className="bg-foreground/[0.03] px-3 py-2 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              📰 TDnet 適時開示
            </span>
            <span className="text-[10px] tabular text-foreground/60">
              {formatTimeHms(detail.releasedAt)}
            </span>
          </div>
          <span className="text-[10px] font-bold border border-border bg-surface px-1.5 py-0.5 rounded-sm text-foreground">
            {detail.disclosureType}
          </span>
        </div>
        <div className="px-3 py-3">
          <div className="text-[13px] font-bold leading-snug mb-2">{detail.rawTitle}</div>
          <Disclose label="本文を読む" openLabel="本文を閉じる">
            <pre className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans bg-background border border-border rounded-sm p-3 mt-1">
              {detail.rawSnippet}
            </pre>
          </Disclose>
        </div>
      </div>

      <div className="ai-section pl-3 -ml-3 py-3 pr-3 bg-ai-soft/40 rounded-r-md">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              🤖 AI による即時解読
            </span>
            <span className="text-[10px] tabular text-foreground/60">
              {formatTimeHms(detail.aiInterpretation.interpretedAt)}
              <span className="text-foreground/60 ml-1">(開示後 {interpDelaySec} 秒)</span>
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
              BIAS_CLASS[detail.aiInterpretation.bias]
            }`}
          >
            {BIAS_LABEL[detail.aiInterpretation.bias]}
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
                <span className="text-muted-foreground leading-relaxed">{kp}</span>
              </li>
            ))}
          </ul>
        </Disclose>

        <div className="mt-3 bg-surface border border-border rounded-sm p-3">
          <div className="text-[10px] tracking-wider text-foreground/60 mb-1">株価への影響予想</div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {detail.aiInterpretation.impactPrediction}
          </p>
        </div>
      </div>

      {detail.resultMeasure && (
        <div className="bg-muted border border-foreground rounded-md px-3 py-3">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            📊 実測結果
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className={`text-2xl font-bold tabular font-mono ${
                detail.resultMeasure.priceChange >= 0
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {detail.resultMeasure.priceChange >= 0 ? "+" : ""}
              {detail.resultMeasure.priceChange.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatTimeHms(detail.resultMeasure.measuredAt)} 時点
              {detail.resultMeasure.note && (
                <span className="text-foreground/60 ml-2">／ {detail.resultMeasure.note}</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
