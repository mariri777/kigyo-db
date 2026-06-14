import Link from "next/link";
import type { Metadata } from "next";
import {
  trackRecordOverall,
  trackRecordByEventType,
  trackRecordByConfidence,
  allResolvedPredictions,
} from "@/content/predictions";
import type { TrackRecordRow } from "@/content/predictions";
import { eventLabelJa } from "@/shared/predictionLabels";
import { formatIsoSlashDate } from "@/shared/format";

const trackTitle = "AI 予測の的中率ダッシュボード — 全件公開";
const trackDescription =
  "超!企業DB の AI 予測がどれくらい当たっているのか。決算・適時開示・マクロといったイベント種別、確信度ブラケット別の的中率を全件公開。外した予測も隠さず、累積で検証可能に。";

export const metadata: Metadata = {
  title: trackTitle,
  description: trackDescription,
  keywords: ["AI 予測", "的中率", "予測精度", "確信度別", "イベント別"],
  alternates: { canonical: "/predictions/track-record" },
  openGraph: { title: trackTitle, description: trackDescription, url: "/predictions/track-record", type: "website" },
  twitter: { card: "summary_large_image", title: trackTitle, description: trackDescription },
};

export default function TrackRecordPage() {
  const overall = trackRecordOverall();
  const byEvent = trackRecordByEventType();
  const byConfidence = trackRecordByConfidence();
  const resolved = allResolvedPredictions();

  return (
    <article className="max-w-5xl mx-auto px-6 py-12">
      {/* ===== ヘッダー ===== */}
      <header className="pb-10 border-b border-border mb-12">
        <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4">
          AI Track Record
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          AI 予測は、
          <br />
          <span className="relative inline-block">
            本当に当たるのか。
            <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-foreground opacity-10" />
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          このページは「超！企業DB」の<strong className="text-foreground">透明性宣言</strong>です。
          AI 予測の的中・外しをすべて公開し、累積で検証可能にすることで、サービスの信頼性を担保します。
          投資判断の前に、ここで「この AI を信じてよいか」を確かめてください。
        </p>
      </header>

      {/* ===== 全体スタッツ ===== */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-2">全体的中率</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
          答え合わせ済みの全予測における、AI が正しく予測できた割合。
          サンプル数が増えるほど信頼性が上がります。
        </p>
        <div className="grid sm:grid-cols-4 gap-3">
          <BigStat
            label="累積予測数"
            value={overall.total.toString()}
            sub="答え合わせ済み"
          />
          <BigStat
            label="的中"
            value={overall.hits.toString()}
            sub="AI が正解"
            tone="positive"
          />
          <BigStat
            label="外し"
            value={overall.misses.toString()}
            sub="AI が外し"
            tone="negative"
          />
          <BigStat
            label="累積的中率"
            value={
              overall.total > 0
                ? `${overall.accuracy.toFixed(0)}%`
                : "—"
            }
            sub={
              overall.total > 0
                ? `${overall.hits} / ${overall.total}`
                : "サンプル収集中"
            }
            highlight
          />
        </div>
      </section>

      {/* ===== イベント種別ごとの的中率 ===== */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-2">イベント種別ごとの的中率</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
          AI が得意なイベントと苦手なイベントを可視化します。
          決算と適時開示は<strong className="text-foreground">数字ベース</strong>で予測しやすく、
          マクロやニュースは<strong className="text-foreground">外部要因</strong>が多く難易度が高い傾向。
        </p>
        <BarTable rows={byEvent} emptyHint="まだサンプルがないイベント種別もあります" />
      </section>

      {/* ===== 確信度別の的中率 ===== */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-2">確信度別の的中率（キャリブレーション）</h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed max-w-2xl">
          AI が「<strong className="text-foreground">90% 自信あり</strong>」と言ったとき、本当に 90% 当たっているか。
          ここで的中率と確信度が乖離していれば、AI の自己評価が過大・過小ということ。
          理想は「確信度 90% → 的中率 90%」のような一致。
        </p>
        <p className="text-[11px] text-foreground/60 mb-6 leading-relaxed max-w-2xl">
          ※ キャリブレーションは統計的に意味のある検証で、機械学習モデルの信頼性評価で標準的に使われる手法です。
        </p>
        <BarTable rows={byConfidence} emptyHint="この確信度レンジにはまだサンプルがありません" />
      </section>

      {/* ===== 答え合わせ済みの全予測 ===== */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-2">答え合わせ済みの全予測</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
          的中・外しすべての記録を、新しい順に表示。各予測の「教訓」も学びとして残しています。
        </p>
        {resolved.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-8 text-center text-muted-foreground">
            まだ答え合わせ済みの予測がありません。
          </div>
        ) : (
          <div className="space-y-3">
            {resolved.map((p) => {
              const isHit = p.aiReasoning.pick === p.resolution!.outcomeKey;
              const aiChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);
              return (
                <Link
                  key={p.id}
                  href={`/predictions/${p.id}`}
                  className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-foreground/60 tracking-wider mb-1">
                        {eventLabelJa(p.eventType)} ・ {formatIsoSlashDate(p.resolution!.resolvedAt)}
                      </div>
                      <div className="text-sm font-bold group-hover:underline">{p.eventName}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{p.question}</div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 rounded border ${
                        isHit
                          ? "text-positive border-positive/40 bg-positive/10"
                          : "text-negative border-negative/40 bg-negative/10"
                      }`}
                    >
                      {isHit ? "✓ 的中" : "✗ 外し"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular mt-2 pt-2 border-t border-border">
                    <div>
                      <span className="text-foreground/60">AI 予測：</span>
                      <span className="font-bold">{aiChoice?.label ?? p.aiReasoning.pick}</span>
                      <span className="text-foreground/60 ml-1">（確信度 {p.aiReasoning.confidence}%）</span>
                    </div>
                    <div>
                      <span className="text-foreground/60">実際：</span>
                      <span className="font-bold">{p.resolution!.outcomeLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== About / 注意書き ===== */}
      <section className="mt-16 pt-8 border-t border-border max-w-2xl">
        <h2 className="text-sm font-bold mb-3">この透明性ダッシュボードについて</h2>
        <div className="space-y-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            予測の外しもすべて公開しています。これは「AI が完璧」と装うためではなく、
            <strong className="text-foreground">サービスの信頼性を累積的に検証できる状態</strong>を作るためです。
          </p>
          <p>
            サンプル数が増えるほど、ダッシュボードの統計的意味は強くなります。
            現状はサンプル収集中の段階で、参考程度にとどめてください。
          </p>
          <p>
            AI 予測は<strong className="text-foreground">投資助言・投資推奨ではありません</strong>。
            あくまで参考情報として、投資判断はご自身の責任で行ってください。詳しくは
            <Link href="/legal/disclaimer" className="text-foreground underline decoration-dotted underline-offset-2 hover:text-muted-foreground mx-1">
              免責事項
            </Link>
            ・
            <Link href="/legal/editorial-policy" className="text-foreground underline decoration-dotted underline-offset-2 hover:text-muted-foreground">
              編集方針
            </Link>
            をご覧ください。
          </p>
        </div>
      </section>

      {/* ===== 関連 ===== */}
      <section className="mt-12 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">関連</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/predictions" className="text-muted-foreground hover:text-foreground transition">
            予測一覧へ →
          </Link>
          <Link href="/guide" className="text-muted-foreground hover:text-foreground transition">
            5 分ガイドへ →
          </Link>
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition">
            マイ予測へ →
          </Link>
        </div>
      </section>
    </article>
  );
}

function BigStat({
  label,
  value,
  sub,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "positive" | "negative";
  highlight?: boolean;
}) {
  const valueClass = tone === "positive"
    ? "text-positive"
    : tone === "negative"
      ? "text-negative"
      : highlight
        ? "text-foreground"
        : "text-foreground";
  return (
    <div className={`bg-surface border rounded-md px-4 py-3 ${highlight ? "border-foreground" : "border-border"}`}>
      <div className="text-[10px] text-foreground/60 font-bold tracking-[0.15em] uppercase mb-1">{label}</div>
      <div className={`text-3xl font-bold tabular font-mono leading-tight ${valueClass}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function BarTable({ rows, emptyHint }: { rows: TrackRecordRow[]; emptyHint: string }) {
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_120px] gap-4 px-4 py-2 text-[10px] text-foreground/60 tracking-wider border-b border-border bg-surface-elev">
        <div>区分</div>
        <div className="text-right w-16">的中</div>
        <div className="text-right w-16">総数</div>
        <div className="text-right">的中率</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.group}
          className="grid grid-cols-[1fr_auto_auto_120px] gap-4 px-4 py-3 border-b border-border last:border-b-0 items-center text-sm"
        >
          <div className="font-medium">{row.group}</div>
          <div className="text-right tabular font-mono w-16 text-positive">
            {row.total > 0 ? row.hits : "—"}
          </div>
          <div className="text-right tabular font-mono w-16 text-muted-foreground">
            {row.total > 0 ? row.total : "—"}
          </div>
          <div className="text-right">
            {row.total > 0 ? (
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-16 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${row.accuracy}%` }}
                  />
                </div>
                <span className="tabular font-mono text-sm font-bold w-10 text-right">
                  {row.accuracy.toFixed(0)}%
                </span>
              </div>
            ) : (
              <span className="text-foreground/60 text-[11px]">{emptyHint.length > 30 ? "サンプル不足" : "—"}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

