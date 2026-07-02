import { Activity, Flame, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import type { BriefView, IndexView } from "../_lib/homeData";
import { formatDateShortJp, formatPctSigned } from "../_lib/homeData";
import { SectionHeader } from "./SectionHeader";

export function MarketSummary({
  indices,
  brief,
  today,
  asOfDate,
}: {
  indices: IndexView[];
  brief: BriefView | null;
  today: string | null;
  asOfDate: string | null;
}) {
  const hero = indices[0] ?? null;
  const subIndices = indices.slice(1);
  return (
    <section aria-labelledby="market-summary-heading">
      <SectionHeader
        kicker={today ?? undefined}
        title="市場サマリ"
        icon={Activity}
        tag={{ label: "AI 要約", color: "bg-emerald-500 text-white" }}
      />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ヒーロー: 主役指標 */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-sm min-h-[300px] flex flex-col">
          <GridBackdrop />
          <div className="relative p-6 sm:p-7 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                <Activity className="w-3 h-3" />
                本日の主役指標
              </span>
              {asOfDate && (
                <span className="text-xs text-neutral-300 font-mono tabular">
                  {formatDateShortJp(asOfDate)} 大引け時点
                </span>
              )}
            </div>

            {hero ? (
              <>
                <div className="mt-auto pt-8">
                  <div className="text-sm font-semibold text-neutral-300 mb-1">{hero.name}</div>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <div className="font-mono tabular text-5xl sm:text-6xl font-bold tracking-tight">
                      {hero.value}
                    </div>
                    <ChangeIndicator view={hero} size="lg" />
                  </div>
                </div>

                {subIndices.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {subIndices.map((idx) => (
                      <div key={idx.key} className="rounded-xl bg-white/5 backdrop-blur px-3 py-2.5">
                        <div className="text-[10px] text-neutral-300 font-semibold mb-0.5 truncate">
                          {idx.name}
                        </div>
                        <div className="font-mono tabular text-sm font-bold truncate">
                          {idx.value}
                        </div>
                        <ChangeIndicator view={idx} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-auto pt-8 pb-4">
                <p className="text-sm text-neutral-300">
                  市場指数データはまだ取り込まれていません。
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  データパイプラインの実行後にここへ主要指数が表示されます。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Brief サマリ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">今日のまとめ</div>
              <div className="text-[10px] text-neutral-500">AIによる自動生成</div>
            </div>
          </div>

          {brief ? (
            <>
              <div className="px-5 pb-4 space-y-4 flex-1">
                <p className="text-base font-bold leading-snug tracking-tight">{brief.lede}</p>
                <ul className="space-y-2.5">
                  {brief.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                      <span className="font-mono text-emerald-600 font-bold tabular shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-neutral-700">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <WatchThemes themes={brief.watchThemes} />
            </>
          ) : (
            <div className="px-5 pb-6 flex-1 flex items-center">
              <p className="text-sm text-neutral-500 leading-relaxed">
                本日のまとめはまだ生成されていません。市場データの取り込み後に自動生成されます。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 前日比の矢印+数値。positive が null(データなし)のときは矢印を出さない。 */
function ChangeIndicator({ view, size }: { view: IndexView; size: "lg" | "sm" }) {
  const hasData = view.positive !== null;
  const color = !hasData
    ? "text-neutral-400"
    : view.positive
      ? "text-emerald-400"
      : "text-rose-400";
  const Icon = view.positive ? TrendingUp : TrendingDown;

  if (size === "lg") {
    return (
      <div className={`flex items-center gap-1.5 font-mono tabular font-bold ${color}`}>
        {hasData && <Icon className="w-5 h-5" />}
        <span className="text-2xl">{view.change}</span>
        {hasData && (
          <span className="text-base text-neutral-300 font-normal">{view.delta}</span>
        )}
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-0.5 font-mono tabular text-xs font-semibold ${color}`}>
      {hasData && <Icon className="w-3 h-3" />}
      {view.change}
    </div>
  );
}

function WatchThemes({ themes }: { themes: BriefView["watchThemes"] }) {
  if (themes.length === 0) return null;
  return (
    <div className="border-t border-neutral-100">
      <div className="px-5 pt-3 pb-1 flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-[11px] font-bold tracking-wider text-neutral-600">注目テーマ</span>
      </div>
      <ul className="px-3 pb-3">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.name} className="px-2 py-2 flex items-center gap-2.5 rounded-lg">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="flex-1 text-xs font-semibold truncate">{t.name}</span>
              {t.changePct !== null && (
                <span
                  className={`text-xs font-mono tabular font-bold ${
                    t.changePct >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatPctSigned(t.changePct)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * ヒーロー背景。以前はダミー値の右肩上がり折れ線を描いており、
 * 下落日にも上昇チャートが見える虚偽の視覚情報になっていたため、
 * 方向を暗示しない静かなグリッドのみとする。
 */
function GridBackdrop() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true">
      <defs>
        <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
        <radialGradient id="hero-glow" cx="80%" cy="10%" r="80%">
          <stop offset="0%" stopColor="rgba(52,211,153,0.12)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
      <rect width="100%" height="100%" fill="url(#hero-glow)" />
    </svg>
  );
}
