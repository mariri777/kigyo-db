import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Globe,
  Briefcase,
  Sparkles,
  FlaskConical,
} from "lucide-react";

import { fmtOku, safeHost, type StockData } from "./primitives";

/** "2026-06-28" → "6/28" の静かな鮮度ラベル。パースできなければそのまま返す。 */
function formatPriceDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[2])}/${Number(m[3])}`;
}

export function Breadcrumb({ data }: { data: StockData }) {
  return (
    <nav className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" />ホーム
      </Link>
      <span>/</span>
      <Link
        href={`/stocks?sector=${encodeURIComponent(data.basics.sectorTSE)}`}
        className="hover:text-neutral-900"
      >
        {data.industryName}
      </Link>
      <span>/</span>
      <span className="text-neutral-900 font-semibold">{data.basics.name}</span>
    </nav>
  );
}

export function Hero({ data }: { data: StockData }) {
  const { basics, stockTrend } = data;
  const priceLabel = formatPriceDate(stockTrend.priceDate);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-sm">
      {/* 企業と無関係なストック写真は信頼を損なうため使わない。静かなグリッド+グローのみ。 */}
      <svg className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true">
        <defs>
          <pattern id="stock-hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
          <radialGradient id="stock-hero-glow" cx="85%" cy="0%" r="90%">
            <stop offset="0%" stopColor="rgba(52,211,153,0.10)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#stock-hero-grid)" />
        <rect width="100%" height="100%" fill="url(#stock-hero-glow)" />
      </svg>
      <div className="relative p-6 sm:p-10">
        {data.usesSampleData && (
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-400/40">
            <FlaskConical className="w-3 h-3" />
            サンプルデータ · 実データは未整備
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ background: basics.logoColor }}>
                {basics.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-xs text-neutral-300 font-mono tabular uppercase tracking-wider">{basics.exchange} · {basics.sectorTSE}</div>
                <div className="font-mono tabular text-2xl font-bold tracking-tight">{basics.code}</div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{basics.name}</h1>
              <p className="text-sm text-neutral-300 mt-1.5 font-mono">{basics.nameEn}</p>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-2">
              <Info icon={Calendar} label="設立" value={basics.founded} />
              <Info icon={Building2} label="上場" value={basics.listed} />
              <Info icon={Users} label="従業員" value={basics.employees} />
              <Info icon={Briefcase} label="代表者" value={basics.ceo} />
              <Info icon={MapPin} label="本社" value={basics.headquarters} />
              <Info icon={Globe} label="公式サイト" value={
                <a href={basics.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-emerald-300">
                  {safeHost(basics.website)}<ExternalLink className="w-3 h-3" />
                </a>
              } />
            </dl>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl bg-white/5 backdrop-blur p-5">
              <div className="flex items-center justify-between text-xs text-neutral-300 font-mono uppercase mb-2">
                <span>株価</span>
                {priceLabel ? (
                  <span className="text-neutral-400 normal-case tracking-normal">{priceLabel} 終値</span>
                ) : (
                  <span className="text-neutral-500 normal-case tracking-normal">終値</span>
                )}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono tabular text-4xl sm:text-5xl font-bold tracking-tight">¥{stockTrend.currentPrice.toLocaleString()}</span>
                <span className={`flex items-center gap-1 font-mono tabular text-lg font-bold ${stockTrend.positive ? "text-emerald-400" : "text-rose-400"}`}>
                  {stockTrend.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stockTrend.change1d}
                </span>
              </div>
              <PriceChart data={stockTrend.priceSeries} />
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <ChangeStat label="1ヶ月" value={stockTrend.change1m} />
                <ChangeStat label="1年" value={stockTrend.change1y} />
                <ChangeStat label="時価総額" value={fmtOku(stockTrend.marketCapOku)} mono />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="PER" value={`${stockTrend.per.toFixed(1)}倍`} />
              <Metric label="PBR" value={`${stockTrend.pbr.toFixed(2)}倍`} />
              <Metric label="配当利回り" value={`${stockTrend.dividendYield.toFixed(2)}%`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono uppercase tracking-wider mb-0.5"><Icon className="w-3 h-3" />{label}</dt>
      <dd className="text-sm font-semibold truncate">{value}</dd>
    </div>
  );
}

function ChangeStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const positive = value.startsWith("+");
  const negative = value.startsWith("-");
  return (
    <div>
      <div className="text-[10px] text-neutral-400 font-semibold uppercase">{label}</div>
      <div className={`font-mono tabular text-sm font-bold ${mono ? "text-white" : positive ? "text-emerald-400" : negative ? "text-rose-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur p-3 text-center">
      <div className="text-[10px] text-neutral-400 font-semibold uppercase">{label}</div>
      <div className="font-mono tabular text-base font-bold mt-0.5">{value}</div>
    </div>
  );
}

function PriceChart({ data }: { data: number[] }) {
  const w = 400;
  const h = 90;
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((d, i) => `${i * step},${h - ((d - min) / range) * h * 0.85 - h * 0.05}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 mt-3" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hero-price-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#hero-price-fill)" />
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Summary({ data }: { data: StockData }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
        <h2 className="text-xl font-bold tracking-tight">この会社をひとことで</h2>
      </div>
      <p className="text-base sm:text-lg leading-relaxed text-neutral-800 tracking-tight">{data.summary}</p>
    </section>
  );
}
