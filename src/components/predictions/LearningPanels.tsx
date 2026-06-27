import type { Prediction } from "@/content/predictions";
import { Disclose } from "@/components/Disclose";
import { Term } from "@/components/Term";

const STEP_TONE: Record<"+" | "-" | "0", string> = {
  "+": "bg-foreground text-background",
  "-": "bg-muted border border-foreground text-foreground",
  "0": "bg-surface-elev border border-border text-muted-foreground",
};

/**
 * 予測カードの学習セクション一式(チェックポイント・フレーム・過去パターン・AI 推論)。
 * すべて open 可能な disclose で、開けばその場でミニレッスンになる。
 */
export function LearningPanels({ prediction: p }: { prediction: Prediction }) {
  const aiPickChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);
  return (
    <div className="mt-5 pt-5 border-t border-border space-y-1">
      <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-2">
        予測する前に — ここを見る・こう考える
      </div>

      <Disclose
        label={`🔍 見るべきポイント(${p.checkpoints.length} 個)`}
        openLabel="🔍 見るべきポイント(閉じる)"
      >
        <p className="text-[11px] text-foreground/60 mb-3">
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
                    className="underline decoration-dotted underline-offset-2 hover:text-muted-foreground"
                  >
                    {c.label} ↗
                  </a>
                ) : (
                  c.label
                )}
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                なぜ:{c.why}
              </div>
            </li>
          ))}
        </ul>
      </Disclose>

      <Disclose
        label={`🎯 考え方のフレーム(${p.frames.length} 個)`}
        openLabel="🎯 考え方のフレーム(閉じる)"
      >
        <p className="text-[11px] text-foreground/60 mb-3">
          プロが頭の中で使っている<Term>メンタルモデル</Term>(考え方の型)。一度覚えると他の銘柄でも応用できます。
        </p>
        <ul className="space-y-3">
          {p.frames.map((f, i) => (
            <li
              key={i}
              className="bg-surface-elev border border-border rounded-sm px-3 py-2"
            >
              <div className="text-[13px] font-bold leading-tight mb-1">{f.title}</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">{f.body}</div>
            </li>
          ))}
        </ul>
      </Disclose>

      <Disclose
        label={`📊 過去 ${p.history.length} 四半期の修正パターン`}
        openLabel="📊 過去パターン(閉じる)"
      >
        <p className="text-[11px] text-foreground/60 mb-3">
          歴史で考える訓練。この会社の過去の傾向と、為替・受注などの環境が今と何が違うか。
        </p>
        <div className="border border-border rounded-sm overflow-hidden">
          {p.history.map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_auto_1fr] gap-3 px-3 py-2 text-[12px] border-b border-border last:border-b-0"
            >
              <span className="tabular text-foreground/60 w-16">{h.period}</span>
              <span className="font-bold w-16">{h.outcome}</span>
              {h.note && <span className="text-muted-foreground">{h.note}</span>}
            </div>
          ))}
        </div>
      </Disclose>

      <Disclose
        label={`🤖 AI の推論を見る(${p.aiReasoning.steps.length} ステップ)`}
        openLabel="🤖 AI の推論(閉じる)"
      >
        <p className="text-[11px] text-foreground/60 mb-3">
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
                  STEP_TONE[s.direction]
                }`}
              >
                {s.direction}
              </span>
              <span className="text-muted-foreground">{s.signal}</span>
              {s.weight !== undefined && (
                <span className="text-[10px] text-foreground/60 tabular">重み {s.weight}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[12px] bg-ai-soft border-l-2 border-foreground pl-3 py-2">
          総合:
          <span className="font-bold text-foreground mx-1">{aiPickChoice?.label}</span>
          (AI 確信度 {p.aiReasoning.confidence}%)
        </div>
      </Disclose>

      {p.glossaryTerms && p.glossaryTerms.length > 0 && (
        <div className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border">
          この予測で出てくる用語:
          <span className="text-foreground ml-1">{p.glossaryTerms.join(" / ")}</span>
          <span className="text-foreground/60 ml-1.5">(hover で解説)</span>
        </div>
      )}
    </div>
  );
}
