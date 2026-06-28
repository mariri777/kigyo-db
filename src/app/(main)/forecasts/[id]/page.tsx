import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Sparkles,
  Target,
} from "lucide-react";

import { getDb } from "@/server/db/client";
import {
  findForecastDetail,
  listForecastsByTarget,
  type ForecastDetail,
  type ForecastScenario,
  type ForecastSummary,
  type ForecastTake,
} from "@/server/repo/forecastRepo";
import {
  confidenceMeta,
  dominantProbability,
  formatGeneratedAtJst,
  formatResolveAtJp,
  formatResolveAtLong,
  readVerdict,
  takeKindMeta,
  timeUntilResolveJp,
} from "../_lib/format";
import {
  ProbabilityGauge,
  ScenarioStack,
  ShiftSparkline,
  VerdictGlyph,
} from "../_viz";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return { title: "AI 予想" };
  const db = await getDb();
  const detail = await findForecastDetail(db, numericId);
  if (!detail) return { title: "AI 予想" };
  const title = `${detail.targetName} — ${detail.headline} | AIの明日予想`;
  return {
    title,
    description: detail.lede,
    alternates: { canonical: `/forecasts/${numericId}` },
    openGraph: {
      title,
      description: detail.lede,
      url: `/forecasts/${numericId}`,
      type: "article",
    },
  };
}

export default async function ForecastDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const db = await getDb();
  const detail = await findForecastDetail(db, numericId);
  if (!detail) notFound();

  const related = (await listForecastsByTarget(db, detail.targetSymbol, 12)).filter(
    (f) => f.id !== detail.id,
  );

  const verdict = readVerdict(detail.probability);
  const dominant = dominantProbability(detail.probability);
  const confidence = confidenceMeta(detail.confidence);

  // takes は kind ごとにグルーピング (macro/technical/sentiment 上、その他下)
  const primary = detail.takes.filter((t) =>
    ["macro", "technical", "sentiment"].includes(t.kind),
  );
  const supporting = detail.takes.filter(
    (t) => !["macro", "technical", "sentiment"].includes(t.kind),
  );

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5 space-y-8">
        <Breadcrumb targetName={detail.targetName} headline={detail.headline} />

        <Hero detail={detail} verdict={verdict} dominant={dominant} confidence={confidence} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <main className="lg:col-span-8 space-y-8">
            {primary.length > 0 && (
              <Section title="AI の根拠" kicker="分析" icon={Activity}>
                <div className="space-y-4">
                  {primary.map((take, i) => (
                    <TakeBlock key={`p-${i}`} take={take} />
                  ))}
                </div>
              </Section>
            )}

            {detail.scenarios.length > 0 && (
              <Section title="3 つのシナリオ" kicker="シナリオ" icon={Target}>
                <ScenarioPanel scenarios={detail.scenarios} />
              </Section>
            )}

            {supporting.length > 0 && (
              <Section title="補強する視点" kicker="深掘り" icon={Sparkles}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supporting.map((take, i) => (
                    <TakeBlock key={`s-${i}`} take={take} compact />
                  ))}
                </div>
              </Section>
            )}

            {detail.closingNote && (
              <aside className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 sm:p-8">
                <div className="text-[11px] font-bold tracking-widest text-neutral-400 mb-2">
                  ひとこと
                </div>
                <p className="text-base sm:text-lg font-bold leading-relaxed">
                  {detail.closingNote}
                </p>
              </aside>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-6">
            <ShiftPanel detail={detail} verdict={verdict} />
            <ResolvePanel detail={detail} />
            {related.length > 0 && <RelatedPanel related={related} targetName={detail.targetName} />}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Hero (ヒーロー帯 + 大確率)
// ─────────────────────────────────────────────────────────

function Hero({
  detail,
  verdict,
  dominant,
  confidence,
}: {
  detail: ForecastDetail;
  verdict: ReturnType<typeof readVerdict>;
  dominant: ReturnType<typeof dominantProbability>;
  confidence: ReturnType<typeof confidenceMeta>;
}) {
  const remaining = timeUntilResolveJp(detail.resolveAt);
  const isLive = detail.status === "live";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      {/* 背景パターン */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id="forecast-detail-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#forecast-detail-grid)" />
      </svg>
      {/* 発光 */}
      <div
        className={`absolute -top-32 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          verdict.tone === "up"
            ? "bg-emerald-500/20"
            : verdict.tone === "down"
              ? "bg-rose-500/20"
              : "bg-sky-500/15"
        }`}
      />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-neutral-100/5 blur-3xl pointer-events-none" />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[11px] font-bold uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              {detail.targetName}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                isLive
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-white/10 text-neutral-200"
              }`}
            >
              {isLive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : null}
              {isLive ? `観測中 ・ ${remaining}` : "解決済"}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${confidence.color}`}>
              {confidence.label}
            </span>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            {detail.question}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {detail.headline}
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
            {detail.lede}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> 答え合わせ {formatResolveAtLong(detail.resolveAt)}
            </span>
            <span className="text-neutral-600">·</span>
            <span>最終更新 {formatGeneratedAtJst(detail.generatedAt)}</span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <VerdictGlyph tone={verdict.tone} size="lg" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    AI の方向性
                  </div>
                  <div
                    className={`text-2xl font-black tracking-tight ${
                      verdict.tone === "up"
                        ? "text-emerald-300"
                        : verdict.tone === "down"
                          ? "text-rose-300"
                          : "text-neutral-200"
                    }`}
                  >
                    {verdict.label}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span
                    className={`font-mono tabular text-6xl font-black tracking-tight ${
                      verdict.tone === "up"
                        ? "text-emerald-300"
                        : verdict.tone === "down"
                          ? "text-rose-300"
                          : "text-neutral-200"
                    }`}
                  >
                    {dominant.value}
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      verdict.tone === "up"
                        ? "text-emerald-300"
                        : verdict.tone === "down"
                          ? "text-rose-300"
                          : "text-neutral-300"
                    }`}
                  >
                    %
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {dominant.direction === "up" ? "上がる" : "下がる"} の確率
                </div>
              </div>
            </div>
            <div className="mt-5">
              <ProbabilityGauge probability={detail.probability} />
            </div>

            {detail.referencePrice != null && (
              <div className="mt-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                <span>参照終値</span>
                <span className="font-bold text-white">
                  {detail.referencePrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Section シェル
// ─────────────────────────────────────────────────────────

function Section({
  title,
  kicker,
  icon: Icon,
  children,
}: {
  title: string;
  kicker: string;
  icon: typeof Globe;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end gap-3 pb-2 border-b-2 border-neutral-900 mb-5">
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
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Take ブロック (1 段落)
// ─────────────────────────────────────────────────────────

function TakeBlock({ take, compact = false }: { take: ForecastTake; compact?: boolean }) {
  const meta = takeKindMeta(take.kind);
  const biasColor =
    take.bias === "up"
      ? "text-emerald-700 bg-emerald-50"
      : take.bias === "down"
        ? "text-rose-700 bg-rose-50"
        : "text-neutral-600 bg-neutral-100";
  return (
    <article
      className={`bg-white rounded-2xl shadow-sm border-l-4 ${meta.accent} px-5 py-4 ${
        compact ? "" : "sm:px-6 sm:py-5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.iconColor}`}>
          {meta.label}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${biasColor}`}
        >
          {take.bias === "up" ? "強気" : take.bias === "down" ? "弱気" : "中立"}
        </span>
      </div>
      <h3 className={`font-bold tracking-tight text-neutral-900 ${compact ? "text-[15px]" : "text-base sm:text-lg"} leading-snug`}>
        {take.heading}
      </h3>
      <p
        className={`mt-2 text-neutral-700 leading-relaxed ${
          compact ? "text-[13px]" : "text-[13.5px] sm:text-[14px]"
        }`}
      >
        {take.body}
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────
// シナリオパネル
// ─────────────────────────────────────────────────────────

function ScenarioPanel({ scenarios }: { scenarios: ForecastScenario[] }) {
  const base = scenarios.find((s) => s.kind === "base");
  const bull = scenarios.find((s) => s.kind === "bull");
  const bear = scenarios.find((s) => s.kind === "bear");
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
          シナリオ別の発生確率
        </div>
        <ScenarioStack
          base={base?.probability ?? 0}
          bull={bull?.probability ?? 0}
          bear={bear?.probability ?? 0}
        />
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-widest">
          <span className="text-emerald-700">強気 {bull?.probability ?? 0}%</span>
          <span className="text-neutral-700 text-center">ベース {base?.probability ?? 0}%</span>
          <span className="text-rose-700 text-right">弱気 {bear?.probability ?? 0}%</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {bull && <ScenarioCard scenario={bull} accent="emerald" />}
        {base && <ScenarioCard scenario={base} accent="neutral" />}
        {bear && <ScenarioCard scenario={bear} accent="rose" />}
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  accent,
}: {
  scenario: ForecastScenario;
  accent: "emerald" | "neutral" | "rose";
}) {
  const styles =
    accent === "emerald"
      ? {
          ring: "ring-emerald-200",
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
        }
      : accent === "rose"
        ? {
            ring: "ring-rose-200",
            bg: "bg-rose-50",
            text: "text-rose-700",
            dot: "bg-rose-500",
          }
        : {
            ring: "ring-neutral-200",
            bg: "bg-neutral-50",
            text: "text-neutral-800",
            dot: "bg-neutral-500",
          };
  const range =
    scenario.priceLow != null && scenario.priceHigh != null
      ? `${formatPrice(scenario.priceLow)} – ${formatPrice(scenario.priceHigh)}`
      : null;
  return (
    <div className={`rounded-xl ring-1 ${styles.ring} ${styles.bg} p-4 flex flex-col`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.text} inline-flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          {scenario.kind === "bull" ? "強気" : scenario.kind === "bear" ? "弱気" : "ベース"}
        </span>
        <span className={`font-mono tabular text-lg font-black ${styles.text}`}>
          {scenario.probability}%
        </span>
      </div>
      <div className="font-bold text-[14px] text-neutral-900 leading-snug">
        {scenario.label}
      </div>
      {range && (
        <div className="mt-1 text-[11px] font-mono tabular text-neutral-500">
          想定レンジ {range}
        </div>
      )}
      <p className="mt-2 text-[12px] text-neutral-700 leading-relaxed">{scenario.note}</p>
    </div>
  );
}

function formatPrice(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// ─────────────────────────────────────────────────────────
// サイドパネル
// ─────────────────────────────────────────────────────────

function ShiftPanel({
  detail,
  verdict,
}: {
  detail: ForecastDetail;
  verdict: ReturnType<typeof readVerdict>;
}) {
  if (detail.shifts.length < 2) {
    return (
      <aside className="bg-white rounded-2xl shadow-sm p-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
          確率の推移
        </div>
        <p className="text-xs text-neutral-500">
          まだ十分なデータがありません。6時間ごとに更新されます。
        </p>
      </aside>
    );
  }
  const first = detail.shifts[0];
  const last = detail.shifts[detail.shifts.length - 1];
  const delta = last.probability - first.probability;
  return (
    <aside className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          確率の推移
        </div>
        <span
          className={`text-[11px] font-bold tabular ${
            delta > 0 ? "text-emerald-700" : delta < 0 ? "text-rose-700" : "text-neutral-600"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta}pt
        </span>
      </div>
      <ShiftSparkline shifts={detail.shifts} tone={verdict.tone} variant="wide" />
      <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex justify-between">
        <span>{first.at.slice(5).replace("T", " ")}</span>
        <span>{last.at.slice(5).replace("T", " ")}</span>
      </div>
    </aside>
  );
}

function ResolvePanel({ detail }: { detail: ForecastDetail }) {
  if (detail.status === "resolved") {
    return (
      <aside className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          解決
        </div>
        <div className="flex items-baseline gap-3">
          <span
            className={`font-mono tabular text-3xl font-black ${
              detail.outcome === "up"
                ? "text-emerald-600"
                : detail.outcome === "down"
                  ? "text-rose-600"
                  : "text-neutral-700"
            }`}
          >
            {detail.outcome === "up" ? "↑" : detail.outcome === "down" ? "↓" : "→"}
          </span>
          <div>
            <div className="font-bold text-sm">
              {detail.outcome === "up"
                ? "上がった"
                : detail.outcome === "down"
                  ? "下がった"
                  : "ほぼ横ばい"}
            </div>
            {detail.outcomePrice != null && (
              <div className="text-[11px] font-mono tabular text-neutral-500">
                終値 {detail.outcomePrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        {detail.outcomeAt && (
          <div className="text-[11px] font-mono tabular text-neutral-500">
            {detail.outcomeAt.slice(0, 16).replace("T", " ")}
          </div>
        )}
      </aside>
    );
  }
  return (
    <aside className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl shadow-sm p-5 space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
        答え合わせ
      </div>
      <div className="text-lg font-bold leading-snug">
        {formatResolveAtLong(detail.resolveAt)}
      </div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-300">
        ・{timeUntilResolveJp(detail.resolveAt)}
      </div>
    </aside>
  );
}

function RelatedPanel({
  related,
  targetName,
}: {
  related: ForecastSummary[];
  targetName: string;
}) {
  return (
    <aside className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          {targetName} の予想履歴
        </div>
        <Link
          href="/forecasts"
          className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1"
        >
          一覧
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <ul className="space-y-2.5">
        {related.slice(0, 6).map((r) => {
          const v = readVerdict(r.probability);
          const d = dominantProbability(r.probability);
          return (
            <li key={r.id}>
              <Link
                href={`/forecasts/${r.id}`}
                className="flex items-center gap-3 hover:bg-neutral-50 rounded-lg -mx-2 px-2 py-1.5 transition"
              >
                <span className="text-[10px] font-mono tabular text-neutral-500 w-14 shrink-0">
                  {formatResolveAtJp(r.resolveAt)}
                </span>
                <span className="flex-1 text-[12px] font-bold text-neutral-800 truncate">
                  {r.headline}
                </span>
                <span className={`text-[12px] font-mono tabular font-black ${v.color}`}>
                  {d.value}%
                </span>
                <span
                  className={`text-[10px] font-bold tracking-widest ${v.color}`}
                >
                  {d.direction === "up" ? "上がる" : "下がる"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// パンくず
// ─────────────────────────────────────────────────────────

function Breadcrumb({
  targetName,
  headline,
}: {
  targetName: string;
  headline: string;
}) {
  return (
    <nav className="text-[11px] font-medium text-neutral-500 flex flex-wrap items-center gap-1" aria-label="パンくず">
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3 h-3" />
        トップ
      </Link>
      <span>/</span>
      <Link href="/forecasts" className="hover:text-neutral-900">
        AIの明日予想
      </Link>
      <span>/</span>
      <span className="text-neutral-700">{targetName}</span>
      <ChevronRight className="w-3 h-3 text-neutral-300" />
      <span className="text-neutral-700 truncate max-w-[260px]">{headline}</span>
    </nav>
  );
}
