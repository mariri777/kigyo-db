import Link from "next/link";
import type { Metadata } from "next";
import { groupedPredictions } from "@/lib/predictions";
import type { Prediction, PredictionBucket } from "@/lib/predictions";
import { PredictionListItem } from "@/components/PredictionListItem";
import { PredictionCard } from "@/components/PredictionCard";
import { Term } from "@/components/Term";

export const metadata: Metadata = {
  title: "予測 — 結果で学ぶ確率思考",
  description:
    "決算・適時開示・マクロイベントに対する予測カード。賭けません・賞金もありません。結果が出ると「教訓」が追加されるミニ学習ユニットです。",
};

const BUCKET_LABEL: Record<
  PredictionBucket,
  { label: string; sub: string; emoji: string }
> = {
  live: { label: "LIVE NOW", sub: "今、結果が出ようとしている予測", emoji: "🔴" },
  today: { label: "今日", sub: "本日中に結果が出る", emoji: "📍" },
  "this-week": { label: "今週中（〜7 日）", sub: "近いうちに答え合わせ", emoji: "📆" },
  "next-week": { label: "来週（8-14 日）", sub: "もう少し先", emoji: "📅" },
  later: { label: "それ以降", sub: "2 週間以上先", emoji: "🗓️" },
  resolved: {
    label: "最近の答え合わせ",
    sub: "結果が出た予測 — 教訓が追加されています",
    emoji: "🎓",
  },
};

const BUCKET_ORDER: PredictionBucket[] = [
  "live",
  "today",
  "this-week",
  "next-week",
  "later",
  "resolved",
];

export default function PredictionsHub() {
  const buckets = groupedPredictions();
  const total = Object.values(buckets).flat().length;
  const upcomingCount =
    buckets.live.length +
    buckets.today.length +
    buckets["this-week"].length +
    buckets["next-week"].length +
    buckets.later.length;
  const resolvedCount = buckets.resolved.length;
  const aiHits = buckets.resolved.filter(
    (p) => p.resolution && p.resolution.outcomeKey === p.aiReasoning.pick,
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* ===== ヘッダー ===== */}
      <header className="pb-10 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Predictions
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          確率で考える、
          <br />
          短期で答え合わせ。
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          決算・適時開示・マクロイベントに対する予測カード。
          <strong className="text-foreground">賭けません・賞金もありません。</strong>
          各カードは「見るべきポイント」「考え方のフレーム」「過去パターン」「AI の推論」を備えた
          ミニ学習ユニットになっています。
          結果が出ると<strong className="text-foreground">「教訓」</strong>が追加され、毎回の予測が蓄積される投資勘の燃料になります。
        </p>

        {/* 統計 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl">
          <Stat label="予測カード総数" value={total.toString()} />
          <Stat label="進行中" value={upcomingCount.toString()} />
          <Stat label="決着済み" value={resolvedCount.toString()} />
          <Stat
            label="AI 的中率"
            value={resolvedCount > 0 ? `${Math.round((aiHits / resolvedCount) * 100)}%` : "—"}
            sub={resolvedCount > 0 ? `${aiHits}/${resolvedCount}` : "サンプル収集中"}
          />
        </div>
        <div className="mt-4 max-w-2xl">
          <Link
            href="/predictions/track-record"
            className="inline-flex items-center gap-1 text-[12px] text-foreground border border-border-strong rounded px-3 py-1.5 hover:bg-foreground hover:text-background transition"
          >
            的中率の詳細ダッシュボード →
          </Link>
        </div>
      </header>

      {/* ===== カテゴリ説明 ===== */}
      <section className="mb-10">
        <div className="bg-surface-elev border-l-2 border-foreground p-4 rounded-r-md">
          <h2 className="text-sm font-bold mb-2">予測カードの 4 種類</h2>
          <ul className="text-[12px] text-muted leading-relaxed space-y-1">
            <li>
              <strong className="text-foreground">Earnings / 決算</strong>{" "}
              — 個別企業の四半期・通期決算。<Term>ガイダンス</Term>の修正方向、<Term>コンセンサス</Term>を上回るか等を予測します。
            </li>
            <li>
              <strong className="text-foreground">Disclosure / <Term>適時開示</Term></strong>{" "}
              — <Term>自社株買い</Term>、M&amp;A、配当変更などの開示前後の反応を予測します。
            </li>
            <li>
              <strong className="text-foreground">Macro / マクロ</strong>{" "}
              — 日銀政策決定会合、<Term>FOMC</Term>、<Term>CPI</Term> など、複数銘柄に同時影響するイベント。
            </li>
            <li>
              <strong className="text-foreground">News / ニュース</strong>{" "}
              — 取引時間中の重要ニュースに対する短期反応（5-30 分で決着）。
            </li>
          </ul>
        </div>
      </section>

      {/* ===== バケット別表示 ===== */}
      {BUCKET_ORDER.map((b) => {
        const items = buckets[b];
        if (items.length === 0) return null;
        const meta = BUCKET_LABEL[b];
        return (
          <section key={b} className="mb-12" id={`bucket-${b}`}>
            <div className="flex items-end justify-between mb-4 pb-2 border-b border-border">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  <span className="mr-2">{meta.emoji}</span>
                  {meta.label}
                </h2>
                <p className="text-[12px] text-muted mt-1">{meta.sub}</p>
              </div>
              <span className="text-[11px] text-dim">{items.length} 件</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((p) => (
                <PredictionListItem key={p.id} prediction={p} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ===== Resolved を 1 件詳細展開（教訓を見せる） ===== */}
      {buckets.resolved.length > 0 && (
        <ResolvedSpotlight prediction={buckets.resolved[0]} />
      )}

      {/* ===== About / 注意書き ===== */}
      <section className="mt-16 pt-8 border-t border-border max-w-2xl">
        <h2 className="text-sm font-bold mb-3">この機能について</h2>
        <div className="space-y-3 text-[13px] text-muted leading-relaxed">
          <p>
            予測カードは<strong className="text-foreground">「賭け」ではありません</strong>。賞金もポイント交換もありません。あくまで「確率で考える」「答え合わせで学ぶ」ためのツールとして設計されています。
          </p>
          <p>
            各予測カードは編集部 + AI による<strong className="text-foreground">公開情報ベース</strong>の予測であり、投資助言・投資推奨ではありません。投資判断はご自身の責任で行ってください。詳しくは
            <Link href="/legal/disclaimer" className="text-foreground underline decoration-dotted underline-offset-2 hover:text-muted">
              免責事項
            </Link>
            ・
            <Link
              href="/legal/editorial-policy"
              className="text-foreground underline decoration-dotted underline-offset-2 hover:text-muted"
            >
              編集方針
            </Link>
            をご覧ください。
          </p>
          <p>
            予測の<strong className="text-foreground">外し</strong>もすべて公開しています。AI と編集部の的中率は累積的に検証可能で、これが本サービスの透明性の根拠です。
          </p>
        </div>
      </section>

      {/* ===== 関連 ===== */}
      <section className="mt-12 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">関連</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/stocks" className="text-muted hover:text-foreground transition">
            銘柄一覧へ →
          </Link>
          <Link href="/blog" className="text-muted hover:text-foreground transition">
            ブログへ →
          </Link>
          <Link href="/guide" className="text-muted hover:text-foreground transition">
            5 分ガイドへ →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-md px-3 py-2.5">
      <div className="text-[10px] text-dim tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold tabular font-mono leading-none">{value}</div>
      {sub && <div className="text-[10px] text-dim mt-1.5">{sub}</div>}
    </div>
  );
}

/**
 * 最新の resolved 予測 1 件を「教訓を見せる」目的でフル展開表示。
 */
function ResolvedSpotlight({ prediction }: { prediction: Prediction }) {
  return (
    <section className="mb-12 mt-12" id="spotlight">
      <div className="flex items-end justify-between mb-4 pb-2 border-b border-border">
        <div>
          <p className="text-muted text-[11px] font-bold tracking-[0.2em] uppercase mb-1">
            Spotlight
          </p>
          <h2 className="text-xl font-bold tracking-tight">直近の答え合わせを深掘り</h2>
          <p className="text-[12px] text-muted mt-1">
            予測が外れた／当たった理由と「見落としやすかったポイント」を毎回まとめます。
          </p>
        </div>
      </div>
      <PredictionCard prediction={prediction} />
    </section>
  );
}
