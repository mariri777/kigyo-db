import Link from "next/link";
import { ChevronRight, Globe, Sparkles } from "lucide-react";

import type {
  ForecastShiftPoint,
  ForecastSummary,
} from "@/server/repo/forecastRepo";
import { SectionHeader } from "./SectionHeader";

export function Predictions({ forecasts }: { forecasts: ForecastSummary[] }) {
  return (
    <section id="predictions" className="scroll-mt-20" aria-label="AIの明日予想">
      <SectionHeader
        kicker="6時間ごとに更新"
        title="AIの明日予想"
        subtitle="明日のマーケットがどう動くか、AIが指数別に確率で予想します。"
        icon={Sparkles}
        action={
          <Link
            href="/forecasts"
            className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
          >
            予想アーカイブ
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        }
      />
      {forecasts.length === 0 ? (
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-sm text-neutral-500">
            現在進行中の予想はありません。次回の予想は毎晩の更新で追加されます。
          </p>
          <Link
            href="/forecasts"
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition"
          >
            過去の予想と的中結果を見る
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {forecasts.map((f) => (
            <ForecastCard key={f.id} forecast={f} />
          ))}
        </div>
      )}
    </section>
  );
}

function ForecastCard({ forecast }: { forecast: ForecastSummary }) {
  const yes = forecast.probability;
  const no = 100 - yes;
  const sideFallback: "yes" | "no" = yes >= 50 ? "yes" : "no";
  const position = forecast.position ?? sideFallback;
  const tone: "up" | "down" = position === "yes" ? "up" : "down";
  const yesLabel = forecast.yesLabel ?? "プラス";
  const noLabel = forecast.noLabel ?? "マイナス";
  const shift = computeShiftDelta(forecast.shifts);

  return (
    <Link
      href={`/forecasts/${forecast.id}`}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden border border-neutral-100"
    >
      {/* 上ヘッダー: 対象指数 + 対象時刻 */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-wide">
          <Globe className="w-3 h-3" />
          {forecast.targetName}
        </span>
        <span className="text-[11px] text-neutral-500 font-mono tabular">
          対象 {formatResolveAtJp(forecast.resolveAt)}
        </span>
      </div>

      {/* Issue */}
      <div className="px-5 pt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
          ISSUE
        </div>
        <h3 className="font-black text-base sm:text-lg leading-snug tracking-tight text-neutral-900 group-hover:text-neutral-700 transition">
          {forecast.question}
        </h3>
        {forecast.headline && (
          <div className="mt-1 text-[12px] font-bold text-neutral-600 leading-snug">
            AIの結論: {forecast.headline}
          </div>
        )}
      </div>

      {/* Yes / No 大型表示 */}
      <div className="px-5 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <ProbabilityBox
            label={`YES ・ ${yesLabel}`}
            value={yes}
            active={position === "yes"}
            tone="up"
          />
          <ProbabilityBox
            label={`NO ・ ${noLabel}`}
            value={no}
            active={position === "no"}
            tone="down"
          />
        </div>
      </div>

      {/* リード */}
      <div className="px-5 pb-4">
        <p className="text-[13px] text-neutral-700 leading-relaxed line-clamp-3">
          {forecast.lede}
        </p>
      </div>

      {/* 24h 推移 + CTA */}
      <div className="mt-auto border-t border-neutral-100">
        {forecast.shifts.length >= 2 && (
          <div className="px-5 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                24h の確率推移
              </div>
              {shift && <ShiftBadge delta={shift.delta} />}
            </div>
            <ShiftSparkline shifts={forecast.shifts} tone={tone} />
          </div>
        )}
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-bold tracking-wide">
          <span className="text-neutral-500 font-mono tabular">
            生成 {formatGeneratedAt(forecast.generatedAt)}
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

function ProbabilityBox({
  label,
  value,
  active,
  tone,
}: {
  label: string;
  value: number;
  active: boolean;
  tone: "up" | "down";
}) {
  const activeStyle =
    tone === "up"
      ? { box: "ring-2 ring-emerald-500/60 bg-emerald-50", label: "text-emerald-700", num: "text-emerald-600" }
      : { box: "ring-2 ring-rose-500/60 bg-rose-50", label: "text-rose-700", num: "text-rose-600" };
  const s = active
    ? activeStyle
    : { box: "bg-neutral-50 ring-1 ring-neutral-200", label: "text-neutral-500", num: "text-neutral-500" };
  return (
    <div className={`rounded-xl py-3 px-4 flex flex-col ${s.box}`}>
      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest ${s.label}`}>
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`font-mono tabular text-3xl sm:text-4xl font-black tracking-tight ${s.num}`}>
          {value}
        </span>
        <span className={`text-lg font-bold ${s.num}`}>%</span>
      </div>
    </div>
  );
}

function ShiftBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
        → 変わらず
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? "↑ 強気に" : "↓ 弱気に"} {Math.abs(delta)}pt
    </span>
  );
}

function ShiftSparkline({
  shifts,
  tone,
}: {
  shifts: ForecastShiftPoint[];
  tone: "up" | "down" | "neutral";
}) {
  if (shifts.length < 2) return null;
  const W = 320;
  const H = 56;
  const probs = shifts.map((s) => s.probability);
  const min = Math.min(...probs, 30);
  const max = Math.max(...probs, 70);
  const span = Math.max(max - min, 1);
  const stroke = tone === "up" ? "#10b981" : tone === "down" ? "#f43f5e" : "#737373";
  const fillId =
    tone === "up" ? "shift-fill-up" : tone === "down" ? "shift-fill-down" : "shift-fill-neutral";
  const pts = shifts.map((s, i) => {
    const x = (i / (shifts.length - 1)) * W;
    const y = H - ((s.probability - min) / span) * (H - 6) - 3;
    return { x, y, p: s.probability };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 50% 基準線 */}
      <line
        x1="0"
        x2={W}
        y1={H - ((50 - min) / span) * (H - 6) - 3}
        y2={H - ((50 - min) / span) * (H - 6) - 3}
        stroke="#e5e5e5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? "3.5" : "2"} fill={stroke} />
      ))}
      <text
        x={Math.min(last.x + 8, W - 32)}
        y={Math.max(last.y - 6, 10)}
        fontSize="10"
        fontWeight="700"
        fill={stroke}
      >
        {last.p}%
      </text>
    </svg>
  );
}

function computeShiftDelta(shifts: ForecastShiftPoint[]): { delta: number } | null {
  if (shifts.length < 2) return null;
  const latest = shifts[shifts.length - 1];
  const prev = shifts[shifts.length - 2];
  return { delta: latest.probability - prev.probability };
}

function formatResolveAtJp(iso: string): string {
  // "2026-06-29T05:00:00+09:00" → "6/29 5:00"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso.slice(0, 16);
  const [, , mm, dd, hh, mi] = m;
  return `${Number(mm)}/${Number(dd)} ${Number(hh)}:${mi}`;
}

function formatGeneratedAt(iso: string): string {
  // "2026-06-28T08:15:00Z" → "06/28 17:15" (JST)
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}
