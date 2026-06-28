import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sparkles,
  Target,
} from "lucide-react";

import { getDb } from "@/server/db/client";
import {
  listAllForecasts,
  type ForecastSummary,
} from "@/server/repo/forecastRepo";
import {
  confidenceMeta,
  formatGeneratedAt,
  formatResolveAtJp,
  readStance,
  timeUntilResolveJp,
} from "./_lib/format";
import { ShiftSparkline, YesNoBlock } from "./_viz";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AIの明日予想 — 主要指数の翌営業日予想アーカイブ",
  description:
    "S&P 500・日経平均など主要指数を AI が 6 時間ごとに分析した翌営業日予想のアーカイブ。読み物として根拠とシナリオまで踏み込んで読めます。",
  alternates: { canonical: "/forecasts" },
  openGraph: {
    title: "AIの明日予想 — 主要指数の翌営業日予想アーカイブ | 超!企業DB",
    description:
      "S&P 500・日経平均など主要指数を AI が 6 時間ごとに分析した翌営業日予想のアーカイブ。",
    url: "/forecasts",
    type: "website",
  },
};

export default async function ForecastsIndex() {
  const db = await getDb();
  const all = await listAllForecasts(db, 80);

  const live = all.filter((f) => f.status === "live");
  const resolved = all.filter((f) => f.status === "resolved");

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5 space-y-8">
        <Breadcrumb />

        <Hero
          liveCount={live.length}
          resolvedCount={resolved.length}
          latestGeneratedAt={all[0]?.generatedAt ?? null}
        />

        {live.length > 0 && (
          <section>
            <SectionTitle
              kicker="まもなく解決"
              title="今、AIが読んでいるマーケット"
              icon={Activity}
            />
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {live.map((f) => (
                <LiveCard key={f.id} forecast={f} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle
            kicker="アーカイブ"
            title="過去の予想と答え合わせ"
            icon={Target}
            note={`${resolved.length}件`}
          />
          {resolved.length === 0 ? (
            <div className="mt-4 bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-neutral-500">
              まだ解決済みの予想はありません。
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200 bg-white rounded-2xl shadow-sm overflow-hidden">
              {resolved.map((f) => (
                <li key={f.id}>
                  <ResolvedRow forecast={f} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────

function Hero({
  liveCount,
  resolvedCount,
  latestGeneratedAt,
}: {
  liveCount: number;
  resolvedCount: number;
  latestGeneratedAt: string | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      {/* 背景グリッド */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id="forecasts-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#forecasts-grid)" />
      </svg>
      {/* 発光 */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-widest backdrop-blur">
            <Sparkles className="w-3 h-3" />
            AIの明日予想
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            明日のマーケットを、
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-300 bg-clip-text text-transparent">
              AIがガチで予測する。
            </span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
            主要指数の翌営業日終値が前日比プラスとなる確率を、
            マクロ・テクニカル・センチメントの 3 視点で 6 時間ごとに再計算。
            読み物として根拠・シナリオまで踏み込んで公開しています。
          </p>
          {latestGeneratedAt && (
            <div className="text-[11px] font-mono tracking-widest text-neutral-400">
              最終更新 {formatGeneratedAt(latestGeneratedAt)}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <StatBlock label="進行中の予想" value={liveCount} unit="本" emphasize />
          <StatBlock label="アーカイブ" value={resolvedCount} unit="本" />
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string;
  value: number;
  unit: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 backdrop-blur ${
        emphasize ? "bg-emerald-500/15 ring-1 ring-emerald-400/30" : "bg-white/5"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono tabular text-3xl sm:text-4xl font-black tracking-tight ${
            emphasize ? "text-emerald-300" : "text-white"
          }`}
        >
          {value}
        </span>
        <span className={`text-sm font-bold ${emphasize ? "text-emerald-300" : "text-neutral-300"}`}>
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Live card (一覧用 — トップより少しリッチ)
// ─────────────────────────────────────────────────────────

function LiveCard({ forecast }: { forecast: ForecastSummary }) {
  const stance = readStance(forecast.probability, forecast.position);
  const confidence = confidenceMeta(forecast.confidence);
  const remaining = timeUntilResolveJp(forecast.resolveAt);
  const yesLabel = forecast.yesLabel ?? "プラス";
  const noLabel = forecast.noLabel ?? "マイナス";

  return (
    <Link
      href={`/forecasts/${forecast.id}`}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-neutral-100 flex flex-col"
    >
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-wide">
          <Globe className="w-3 h-3" />
          {forecast.targetName}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${confidence.color}`}>
            {confidence.label}
          </span>
          <span className="text-[11px] font-mono tabular text-emerald-700 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {remaining}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
          ISSUE
        </div>
        <h3 className="font-black text-base sm:text-lg leading-snug tracking-tight text-neutral-900">
          {forecast.question}
        </h3>
        {forecast.headline && (
          <div className="mt-1 text-[12px] font-bold text-neutral-600 leading-snug">
            AIの結論: {forecast.headline}
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-4">
        <YesNoBlock
          probability={forecast.probability}
          position={forecast.position}
          yesLabel={yesLabel}
          noLabel={noLabel}
        />
      </div>

      <div className="px-5 pb-4">
        <p className="text-[13px] text-neutral-700 leading-relaxed line-clamp-3">
          {forecast.lede}
        </p>
      </div>

      <div className="mt-auto border-t border-neutral-100">
        {forecast.shifts.length >= 2 && (
          <div className="px-5 pt-3 pb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
              24h の確率推移
            </div>
            <ShiftSparkline shifts={forecast.shifts} tone={stance.side} />
          </div>
        )}
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-bold tracking-wide">
          <span className="text-neutral-500 font-mono tabular">
            答え合わせ {formatResolveAtJp(forecast.resolveAt)}
          </span>
          <span className="text-neutral-900 inline-flex items-center gap-1 group-hover:text-emerald-700 transition">
            根拠とシナリオを読む
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// Resolved row (一覧用 — 予想だけを素早く眺める)
// ─────────────────────────────────────────────────────────

function ResolvedRow({ forecast }: { forecast: ForecastSummary }) {
  const stance = readStance(forecast.probability, forecast.position);
  const sideLabel =
    stance.side === "yes"
      ? `YES・${forecast.yesLabel ?? "プラス"}`
      : stance.side === "no"
        ? `NO・${forecast.noLabel ?? "マイナス"}`
        : "拮抗";

  return (
    <Link
      href={`/forecasts/${forecast.id}`}
      className="group block px-5 py-4 hover:bg-neutral-50 transition"
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700 shrink-0 w-28 justify-center">
          <Globe className="w-3 h-3" />
          {forecast.targetName}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold tracking-tight text-neutral-900 truncate">
            {forecast.headline || forecast.question}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular mt-0.5">
            答え合わせ {formatResolveAtJp(forecast.resolveAt)}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className={`font-mono tabular text-sm font-black ${stance.color}`}>
            {stance.sideProbability}%
          </span>
          <span className={`text-[10px] font-bold tracking-widest ${stance.color}`}>
            {sideLabel}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 group-hover:translate-x-0.5 transition shrink-0" />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// 共通
// ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <nav className="text-[11px] font-medium text-neutral-500" aria-label="パンくず">
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3 h-3" />
        トップ
      </Link>
      <span className="mx-2">/</span>
      <span className="text-neutral-700">AIの明日予想</span>
    </nav>
  );
}

function SectionTitle({
  kicker,
  title,
  icon: Icon,
  note,
}: {
  kicker: string;
  title: string;
  icon: typeof Globe;
  note?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
          {kicker}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h2>
        </div>
      </div>
      {note && (
        <span className="text-[11px] font-mono tabular text-neutral-500">{note}</span>
      )}
    </div>
  );
}
