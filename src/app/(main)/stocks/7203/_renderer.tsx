import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Activity,
  Briefcase,
  ChevronLeft,
  BookOpen,
  CircleDot,
  Globe,
  Scale,
  Target,
  Coins,
  PieChart,
  AlertTriangle,
  Zap,
  BarChart3,
  Gauge,
  Flag,
  Wallet,
} from "lucide-react";

import { loadStockPageData } from "./_live";
import { StorySlider } from "./_StorySlider";

export type LiveData = Awaited<ReturnType<typeof loadStockPageData>>;
type Catalyst = LiveData["catalysts"]["upside"][number];

function unsplashUrl(id: string, w: number, h?: number) {
  const params = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "75" });
  if (h) params.set("h", String(h));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

/** 業界 hero 画像が未設定の銘柄向け汎用画像(モノクロのビル) */
const DEFAULT_HERO_IMAGE = "photo-1496664444929-8c75efb9546f";

function fmtOku(oku: number | null | undefined) {
  if (oku == null) return "—";
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆円`;
  return `${oku.toLocaleString()}億円`;
}

export function StockDetailRenderer({ data }: { data: LiveData }) {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-10">
        <Breadcrumb data={data} />
        <Hero data={data} />
        <Summary data={data} />
        <InvestmentVerdict data={data} />
        <AnalystTargets data={data} />
        <StockTrendSection data={data} />
        <DividendSection data={data} />
        <TechnicalSection data={data} />
        <LatestEarnings data={data} />
        <FinancialsHistory data={data} />
        <Positioning data={data} />
        <Peers data={data} />
        <ShareholdersSection data={data} />
        <CatalystsSection data={data} />
        <StoryDeckSection data={data} />
        <Footer />
      </div>
    </div>
  );
}

function Breadcrumb({ data }: { data: LiveData }) {
  return (
    <nav className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
      <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" />ホーム
      </Link>
      <span>/</span>
      <Link href={`/#industries`} className="hover:text-neutral-900">{data.industryName}</Link>
      <span>/</span>
      <span className="text-neutral-900 font-semibold">{data.basics.name}</span>
    </nav>
  );
}

function Hero({ data }: { data: LiveData }) {
  const { basics, stockTrend } = data;
  const heroImage = data.industryHeroImage ?? DEFAULT_HERO_IMAGE;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-sm">
      <Image src={unsplashUrl(heroImage, 1400, 600)} alt="" fill sizes="100vw" className="object-cover opacity-30" priority />
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-neutral-900/50" />
      <div className="relative p-6 sm:p-10">
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
                <span>株価 · リアルタイム</span>
                <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />LIVE</span>
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

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
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

function Summary({ data }: { data: LiveData }) {
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

function StockTrendSection({ data }: { data: LiveData }) {
  const { stockTrend } = data;
  return (
    <section>
      <SectionHeader kicker="株価トレンド分析" title={`今、市場は${data.basics.name}をどう評価しているか`} icon={Activity} tag={{ label: "AI 分析", color: "bg-emerald-500 text-white" }} />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <p className="text-base leading-relaxed text-neutral-800">{stockTrend.aiAnalysis}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">主要ファクター</div>
          <ul className="divide-y divide-neutral-100">
            {stockTrend.factors.map((f) => (
              <li key={f.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold">{f.label}</span>
                  <span className="font-mono tabular text-sm font-bold text-emerald-600">{f.value}</span>
                </div>
                <p className="text-xs text-neutral-500">{f.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function LatestEarnings({ data }: { data: LiveData }) {
  const { latestEarnings } = data;
  return (
    <section>
      <SectionHeader kicker={latestEarnings.period} title="直近の決算" icon={TrendingUp} />
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <BigStat label="売上高" value={fmtOku(latestEarnings.revenueOku)} accent="blue" />
        <BigStat label="営業利益" value={fmtOku(latestEarnings.operatingProfitOku)} accent="emerald" />
        <BigStat label="営業利益率" value={`${latestEarnings.operatingMargin.toFixed(2)}%`} accent="neutral" />
        <BigStat label="EPS" value={`¥${latestEarnings.eps.toFixed(1)}`} accent="amber" />
      </div>
      {latestEarnings.highlights.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">ハイライト</div>
          <ul className="space-y-2.5">
            {latestEarnings.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-mono tabular text-emerald-600 font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-neutral-700">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent: "blue" | "emerald" | "neutral" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", neutral: "bg-neutral-100 text-neutral-700", amber: "bg-amber-50 text-amber-700" }[accent];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors}`}>{label}</div>
      <div className="font-mono tabular text-2xl sm:text-3xl font-bold tracking-tight mt-2">{value}</div>
    </div>
  );
}

function FinancialsHistory({ data }: { data: LiveData }) {
  const { history10y } = data;
  const maxRev = Math.max(...history10y.map((h) => h.revenueOku));
  const maxOp = Math.max(...history10y.map((h) => h.operatingProfitOku));
  return (
    <section>
      <SectionHeader kicker="この10年" title="決算の歴史" icon={Building2} />
      <div className="mt-5 bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="text-left border-b border-neutral-200">
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500">期</th>
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-right">売上高</th>
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500 pl-4 w-[35%]">推移</th>
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-right">営業利益</th>
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500 pl-4 w-[20%]">推移</th>
              <th className="py-2 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-right">利益率</th>
            </tr>
          </thead>
          <tbody>
            {history10y.map((h) => (
              <tr key={h.period} className="border-b border-neutral-50 last:border-b-0 hover:bg-neutral-50/50 transition">
                <td className="py-3 font-mono tabular font-bold">{h.period}</td>
                <td className="py-3 font-mono tabular text-right">{fmtOku(h.revenueOku)}</td>
                <td className="py-3 pl-4">
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${(h.revenueOku / maxRev) * 100}%` }} />
                  </div>
                </td>
                <td className="py-3 font-mono tabular text-right">{fmtOku(h.operatingProfitOku)}</td>
                <td className="py-3 pl-4">
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${(h.operatingProfitOku / maxOp) * 100}%` }} />
                  </div>
                </td>
                <td className="py-3 font-mono tabular text-right font-semibold">{h.operatingMargin.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Positioning({ data }: { data: LiveData }) {
  const { positioning } = data;
  return (
    <section>
      <SectionHeader kicker="業界における位置" title={`${data.industryName}でのポジショニング`} icon={Globe} tag={{ label: "AI 分析", color: "bg-emerald-500 text-white" }} />
      <div className="mt-5 bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <p className="text-lg sm:text-xl font-bold leading-snug tracking-tight">{positioning.headline}</p>
        <p className="text-sm leading-relaxed text-neutral-700">{positioning.analysis}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
              <h4 className="text-sm font-bold uppercase tracking-wider">強み</h4>
            </div>
            <ul className="space-y-2.5">
              {positioning.strengths.map((s, i) => (<li key={i} className="text-sm leading-relaxed text-neutral-700 pl-4 border-l-2 border-emerald-300">{s}</li>))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center"><TrendingDown className="w-4 h-4" /></div>
              <h4 className="text-sm font-bold uppercase tracking-wider">課題</h4>
            </div>
            <ul className="space-y-2.5">
              {positioning.challenges.map((c, i) => (<li key={i} className="text-sm leading-relaxed text-neutral-700 pl-4 border-l-2 border-rose-300">{c}</li>))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Peers({ data }: { data: LiveData }) {
  const { peers, industryLinkSlug, industryName } = data;
  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <SectionHeader kicker="同業 · 時価総額順" title="同じ業界の主要10社" icon={Briefcase} />
        <Link href={`/industries/${industryLinkSlug}`} className="text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
          {industryName}の全企業<ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {peers.map((p) => {
          const positive = p.changePct >= 0;
          return (
            <Link key={p.code} href={`/stocks/${p.code}`} className="group bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono tabular text-[11px] text-neutral-500 font-semibold">{p.code}</span>
                <span className={`flex items-center gap-0.5 font-mono tabular text-[11px] font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                  {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {positive ? "+" : ""}{p.changePct.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm font-bold leading-tight tracking-tight line-clamp-2">{p.name}</div>
              <div className="mt-auto pt-2 border-t border-neutral-100 flex items-baseline justify-between text-[11px] text-neutral-500">
                <span>時価総額</span>
                <span className="font-mono tabular font-bold text-neutral-900">{fmtOku(p.marketCapOku)}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-neutral-500">
                <span>PER</span>
                <span className="font-mono tabular font-semibold">{p.per < 0 ? "—" : `${p.per.toFixed(1)}倍`}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StoryDeckSection({ data }: { data: LiveData }) {
  if (data.storyDeck.slides.length === 0) return null;
  return (
    <section>
      <SectionHeader kicker="特別コンテンツ" title={data.storyDeck.deckTitle} icon={BookOpen} tag={{ label: "STORY", color: "bg-purple-500 text-white" }} />
      <p className="mt-2 text-sm text-neutral-600 max-w-3xl">{data.storyDeck.subtitle || `${data.basics.name}の歩みを ${data.storyDeck.slides.length} 枚の紙芝居で振り返ります。`}</p>
      <div className="mt-5">
        <StorySlider deck={data.storyDeck} />
      </div>
    </section>
  );
}

const VERDICT_STYLE: Record<"割安" | "ほぼ妥当" | "やや割高" | "割高", { bg: string; text: string; barColor: string }> = {
  割安: { bg: "bg-emerald-500", text: "text-emerald-700", barColor: "from-emerald-400 to-emerald-600" },
  ほぼ妥当: { bg: "bg-blue-500", text: "text-blue-700", barColor: "from-blue-400 to-blue-600" },
  やや割高: { bg: "bg-amber-500", text: "text-amber-700", barColor: "from-amber-400 to-amber-600" },
  割高: { bg: "bg-rose-500", text: "text-rose-700", barColor: "from-rose-400 to-rose-600" },
};

function InvestmentVerdict({ data }: { data: LiveData }) {
  const { valuation } = data;
  const style = VERDICT_STYLE[valuation.verdict];
  return (
    <section>
      <SectionHeader kicker="投資判断ダッシュボード" title={`今、${data.basics.name}は買いか?`} icon={Scale} tag={{ label: "AI 評価", color: "bg-emerald-500 text-white" }} />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">総合バリュエーション</div>
          <div className="flex items-baseline gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-bold ${style.bg}`}>
              <Gauge className="w-4 h-4" />{valuation.verdict}
            </span>
            <div className="ml-auto text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">SCORE</div>
              <div className="font-mono tabular text-3xl font-bold tracking-tight">{valuation.score}<span className="text-base text-neutral-400">/100</span></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${style.barColor} rounded-full`} style={{ width: `${valuation.score}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-1.5"><span>割高</span><span>妥当</span><span>割安</span></div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-neutral-700">{valuation.rationale}</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">バリュエーション指標</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left border-b border-neutral-100">
                  <th className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">指標</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">自社</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">業界平均</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">過去5年平均</th>
                  <th className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">コメント</th>
                </tr>
              </thead>
              <tbody>
                {valuation.metrics.map((m) => (
                  <tr key={m.label} className="border-b border-neutral-50 last:border-b-0 hover:bg-neutral-50/50">
                    <td className="px-5 py-3 font-semibold">{m.label}</td>
                    <td className="px-3 py-3 font-mono tabular text-right font-bold">{m.value}</td>
                    <td className="px-3 py-3 font-mono tabular text-right text-blue-600">{m.industryAvg}</td>
                    <td className="px-3 py-3 font-mono tabular text-right text-neutral-400">{m.self5yAvg}</td>
                    <td className="px-5 py-3 text-xs text-neutral-600">{m.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalystTargets({ data }: { data: LiveData }) {
  const { analystTargets } = data;
  const { consensus, high, low, currentPrice, upsidePct, ratingCount, analystComment } = analystTargets;
  const totalRatings = ratingCount.buy + ratingCount.hold + ratingCount.sell;
  // アナリストカバレッジが無い銘柄はサマリだけ出す(consensus/レンジは未公表とする)
  if (totalRatings === 0 || high <= low) {
    if (!analystComment) return null;
    return (
      <section>
        <SectionHeader kicker="アナリストカバレッジは未公表" title="アナリスト目標株価" icon={Target} />
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></div>
            <span className="text-sm font-bold">サマリ</span>
          </div>
          <p className="text-sm leading-relaxed text-neutral-700">{analystComment}</p>
        </div>
      </section>
    );
  }
  const buyPct = (ratingCount.buy / totalRatings) * 100;
  const holdPct = (ratingCount.hold / totalRatings) * 100;
  const sellPct = (ratingCount.sell / totalRatings) * 100;
  const posCurrent = ((currentPrice - low) / (high - low)) * 100;
  const posConsensus = ((consensus - low) / (high - low)) * 100;
  return (
    <section>
      <SectionHeader kicker={`${totalRatings}社のアナリスト · 直近30日`} title="アナリスト目標株価" icon={Target} />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">最低</div>
              <div className="font-mono tabular text-2xl font-bold text-rose-600 mt-1">¥{low.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">コンセンサス (中央値)</div>
              <div className="font-mono tabular text-3xl font-bold mt-1">¥{consensus.toLocaleString()}</div>
              <div className="font-mono tabular text-sm font-bold text-emerald-600 inline-flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" />+{upsidePct.toFixed(1)}% 上昇余地
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">最高</div>
              <div className="font-mono tabular text-2xl font-bold text-emerald-600 mt-1">¥{high.toLocaleString()}</div>
            </div>
          </div>
          <div className="relative h-4 mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200" />
            <div className="absolute -top-1 -translate-x-1/2" style={{ left: `${posCurrent}%` }}>
              <div className="w-6 h-6 rounded-full bg-neutral-900 border-2 border-white shadow-md" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                <div className="text-[10px] font-bold text-neutral-500 uppercase">現在</div>
                <div className="font-mono tabular text-sm font-bold">¥{currentPrice.toLocaleString()}</div>
              </div>
            </div>
            <div className="absolute -top-1 -translate-x-1/2" style={{ left: `${posConsensus}%` }}>
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">目標</div>
                <div className="font-mono tabular text-sm font-bold text-emerald-700">¥{consensus.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">レーティング分布</div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${buyPct}%` }}>買い {ratingCount.buy}</div>
              <div className="bg-neutral-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${holdPct}%` }}>中立 {ratingCount.hold}</div>
              <div className="bg-rose-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${sellPct}%` }}>売り {ratingCount.sell}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></div>
            <span className="text-sm font-bold">サマリ</span>
          </div>
          <p className="text-sm leading-relaxed text-neutral-700">{analystComment}</p>
        </div>
      </div>
    </section>
  );
}

function DividendSection({ data }: { data: LiveData }) {
  const { dividend } = data;
  const maxDiv = Math.max(...dividend.history.map((h) => h.amount));
  return (
    <section>
      <SectionHeader kicker="株主還元" title="配当・自社株買い" icon={Coins} />
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={Coins} label="年間配当" value={`¥${dividend.annualPerShare}`} accent="emerald" />
        <StatCard icon={TrendingUp} label="配当利回り" value={`${dividend.yield.toFixed(2)}%`} accent="emerald" />
        <StatCard icon={Wallet} label="総還元利回り" value={`${dividend.totalReturnYield.toFixed(1)}%`} accent="blue" />
        <StatCard icon={BarChart3} label="配当性向" value={`${dividend.payoutRatio.toFixed(1)}%`} accent="neutral" />
        <StatCard icon={Flag} label="連続増配等" value={`${dividend.consecutiveYears}年`} accent="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">配当推移 (1株あたり)</div>
            <div className="text-[11px] text-neutral-500 font-mono">過去10年</div>
          </div>
          <div className="grid grid-cols-10 gap-1.5 h-32 items-end">
            {dividend.history.map((h) => (
              <div key={h.fy} className="flex flex-col items-center gap-1 group">
                <div className="font-mono tabular text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">¥{h.amount}</div>
                <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t group-hover:from-emerald-700 group-hover:to-emerald-500 transition relative" style={{ height: `${(h.amount / maxDiv) * 90}%` }} title={`${h.fy}: ¥${h.amount}`}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono tabular text-[10px] font-bold whitespace-nowrap">¥{h.amount}</span>
                </div>
                <div className="text-[9px] text-neutral-500 font-mono">{h.fy}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-baseline gap-2 text-xs text-neutral-600">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-neutral-900">自社株買い</span><span>進行中 ·</span>
            <span className="font-mono tabular font-bold text-neutral-900">{(dividend.buybackOku / 10000).toFixed(1)}兆円規模</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">次の配当スケジュール</div>
          <ul className="space-y-3">
            <ScheduleRow label="権利付き最終日" value={dividend.schedule.exDate} />
            <ScheduleRow label="権利確定日" value={dividend.schedule.recordDate} />
            <ScheduleRow label="支払開始日" value={dividend.schedule.payDate} />
          </ul>
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">今期予想</div>
            <div className="text-sm font-semibold text-emerald-900 mt-0.5">{dividend.schedule.estimate}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScheduleRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between border-b border-neutral-100 pb-2 last:border-b-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="font-mono tabular text-sm font-bold">{value}</span>
    </li>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Coins; label: string; value: string; accent: "emerald" | "blue" | "neutral" | "amber" | "rose" }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", neutral: "bg-neutral-100 text-neutral-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" }[accent];
  return (
    <div className="bg-white rounded-xl shadow-sm p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
        <div className="font-mono tabular font-bold text-base truncate">{value}</div>
      </div>
    </div>
  );
}

function TechnicalSection({ data }: { data: LiveData }) {
  const { technical, stockTrend } = data;
  const { ma25, ma75, ma200, high52w, low52w, avgVolume, creditBuy, creditSell, creditRatio, rsi14, comment } = technical;
  const currentPrice = stockTrend.currentPrice;
  const pos52w = ((currentPrice - low52w) / (high52w - low52w)) * 100;
  return (
    <section>
      <SectionHeader kicker="テクニカル指標" title="株価の足元、需給とトレンド" icon={Activity} />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">移動平均線</div>
          <ul className="space-y-2.5">
            <MARow label="25日MA" value={ma25} current={currentPrice} />
            <MARow label="75日MA" value={ma75} current={currentPrice} />
            <MARow label="200日MA" value={ma200} current={currentPrice} />
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">52週レンジ</div>
          <div className="text-center">
            <div className="font-mono tabular text-2xl font-bold">¥{currentPrice.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-500 font-bold">現在値</div>
          </div>
          <div className="relative h-2 bg-neutral-100 rounded-full mt-4 mb-1">
            <div className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 rounded-full" style={{ width: "100%" }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-neutral-900 border-2 border-white shadow" style={{ left: `calc(${pos52w}% - 7px)` }} />
          </div>
          <div className="flex justify-between text-xs">
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase">安値</div>
              <div className="font-mono tabular font-bold text-rose-600">¥{low52w.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 font-bold uppercase">高値</div>
              <div className="font-mono tabular font-bold text-emerald-600">¥{high52w.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">RSI(14)</span>
            <span className="font-mono tabular font-bold">{rsi14.toFixed(1)}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">出来高・信用取引</div>
          <ul className="space-y-2.5">
            <KvRow label="平均出来高 (3M)" value={avgVolume} icon={BarChart3} />
            <KvRow label="信用買残" value={creditBuy} icon={TrendingUp} accent="emerald" />
            <KvRow label="信用売残" value={creditSell} icon={TrendingDown} accent="rose" />
            <KvRow label="貸借倍率" value={`${creditRatio.toFixed(1)}倍`} icon={Scale} bold />
          </ul>
        </div>
      </div>
      <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3 items-start">
        <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5" /></div>
        <p className="text-sm text-amber-900 leading-relaxed">{comment}</p>
      </div>
    </section>
  );
}

function MARow({ label, value, current }: { label: string; value: number; current: number }) {
  const above = current > value;
  const diff = ((current - value) / value) * 100;
  return (
    <li className="flex items-baseline justify-between gap-3 pb-2 border-b border-neutral-100 last:border-b-0">
      <span className="text-xs text-neutral-500 font-semibold">{label}</span>
      <span className="font-mono tabular text-sm font-bold">¥{value.toLocaleString()}</span>
      <span className={`font-mono tabular text-xs font-bold inline-flex items-center gap-0.5 shrink-0 ${above ? "text-emerald-600" : "text-rose-600"}`}>
        {above ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {above ? "+" : ""}{diff.toFixed(1)}%
      </span>
    </li>
  );
}

function KvRow({ label, value, icon: Icon, accent, bold }: { label: string; value: string; icon?: typeof Coins; accent?: "emerald" | "rose"; bold?: boolean }) {
  const color = accent === "emerald" ? "text-emerald-600" : accent === "rose" ? "text-rose-600" : "text-neutral-900";
  return (
    <li className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-100 last:border-b-0">
      <span className="text-xs text-neutral-500 font-semibold inline-flex items-center gap-1.5">{Icon && <Icon className="w-3 h-3" />}{label}</span>
      <span className={`font-mono tabular text-sm ${bold ? "font-bold" : "font-semibold"} ${color}`}>{value}</span>
    </li>
  );
}

function ShareholdersSection({ data }: { data: LiveData }) {
  const { shareholders, ownerActivism } = data;
  const { foreignOwnership, individualOwnership, stableOwnership, top } = shareholders;
  return (
    <section>
      <SectionHeader kicker="株主構成" title={`誰が${data.basics.name}を持っているか`} icon={PieChart} />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">所有者種別</div>
          <OwnershipBar label="外国人持株" value={foreignOwnership} color="bg-blue-500" />
          <OwnershipBar label="個人持株" value={individualOwnership} color="bg-amber-500" />
          <OwnershipBar label="安定株主" value={stableOwnership} color="bg-emerald-500" note="グループ・銀行・生損保等" />
          <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">浮動株比率 (推計)</span>
              <span className="font-mono tabular font-bold">{(100 - stableOwnership).toFixed(1)}%</span>
            </div>
            <div className="text-[11px] text-neutral-500 leading-relaxed pt-1">海外勢の比率は高めだが、グループ・金融法人の安定株主が約4割を占める。</div>
          </div>
        </div>
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">大株主 TOP10</div>
          <ul className="divide-y divide-neutral-100">
            {top.map((s) => (
              <li key={s.rank} className="px-5 py-2.5 flex items-center gap-3 hover:bg-neutral-50/50 transition">
                <span className="font-mono tabular text-[10px] font-bold text-neutral-400 w-6 shrink-0">#{String(s.rank).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.name}</div>
                  <div className="text-[10px] text-neutral-500">{s.type}</div>
                </div>
                <div className="font-mono tabular font-bold text-sm shrink-0">{s.share > 0 ? `${s.share.toFixed(2)}%` : "—"}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {ownerActivism.map((a, i) => (
          <div key={i} className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
              <Sparkles className="w-3 h-3" />注目の動き #{i + 1}
            </div>
            <div className="text-sm font-bold leading-tight mb-1.5">{a.title}</div>
            <p className="text-xs text-neutral-300 leading-relaxed">{a.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OwnershipBar({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-semibold">{label}</span>
        <span className="font-mono tabular text-sm font-bold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      {note && <div className="text-[10px] text-neutral-500 mt-1">{note}</div>}
    </div>
  );
}

function CatalystsSection({ data }: { data: LiveData }) {
  const { catalysts } = data;
  return (
    <section>
      <SectionHeader kicker="投資シナリオ" title="株価を動かす材料" icon={AlertTriangle} tag={{ label: "AI 分析", color: "bg-emerald-500 text-white" }} />
      <p className="text-sm text-neutral-600 mt-2 max-w-3xl">この先{data.basics.name}の株価を押し上げそうな材料と、逆に押し下げそうなリスクを並べました。</p>
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CatalystColumn kind="upside" title="上がりそうな材料" icon={TrendingUp} items={catalysts.upside} />
        <CatalystColumn kind="downside" title="下がりそうなリスク" icon={TrendingDown} items={catalysts.downside} />
      </div>
    </section>
  );
}

const IMPACT_STYLE: Record<"強" | "中" | "弱", string> = { 強: "bg-rose-100 text-rose-700", 中: "bg-amber-100 text-amber-700", 弱: "bg-neutral-100 text-neutral-700" };

function CatalystColumn({ kind, title, icon: Icon, items }: { kind: "upside" | "downside"; title: string; icon: typeof TrendingUp; items: Catalyst[] }) {
  const accent = kind === "upside" ? { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-500" } : { bg: "bg-rose-50", text: "text-rose-700", iconBg: "bg-rose-500" };
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`px-5 py-3 ${accent.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${accent.iconBg} text-white flex items-center justify-center`}><Icon className="w-3.5 h-3.5" /></div>
          <span className={`text-sm font-bold ${accent.text}`}>{title}</span>
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-wider ${accent.text} font-bold`}>{items.length} 件</span>
      </div>
      <ul className="divide-y divide-neutral-100">
        {items.map((it, i) => (
          <li key={i} className="px-5 py-4 hover:bg-neutral-50/50 transition">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="font-bold text-sm leading-snug flex-1">{it.title}</div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${IMPACT_STYLE[it.impact]} shrink-0`}>影響 {it.impact}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-1.5">
              <Calendar className="w-3 h-3" /><span className="font-mono tabular">{it.when}</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">{it.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-xs text-neutral-500 leading-relaxed pt-6 border-t border-neutral-200">
      本ページのデータは Cloudflare D1 + 一部プロトタイプ用ダミーで構成されています。
    </div>
  );
}

function SectionHeader({ kicker, title, icon: Icon, tag }: { kicker?: string; title: string; icon?: typeof Calendar; tag?: { label: string; color: string } }) {
  return (
    <div>
      {kicker && (<div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">{kicker}</div>)}
      <div className="flex items-center gap-3 flex-wrap">
        {Icon && (<div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center"><Icon className="w-4 h-4" /></div>)}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {tag && (<span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tag.color}`}>{tag.label}</span>)}
      </div>
    </div>
  );
}
