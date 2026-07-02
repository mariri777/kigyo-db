import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Globe,
  Briefcase,
  ArrowUpRight,
  PieChart,
  AlertTriangle,
  Calendar,
  BookOpen,
} from "lucide-react";

import { fmtOku, SectionHeader, type StockData } from "./primitives";
import { StorySlider } from "./StorySlider";

type Catalyst = StockData["catalysts"]["upside"][number];

export function Positioning({ data }: { data: StockData }) {
  const { positioning } = data;
  return (
    <section>
      <SectionHeader kicker="業界における位置" title={`${data.industryName}でのポジショニング`} icon={Globe} tag={{ label: "AI 分析", color: "bg-emerald-500 text-white" }} />
      <div className="mt-5 bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <p className="text-lg sm:text-xl font-bold leading-snug tracking-tight">{positioning.headline}</p>
        <p className="text-sm leading-relaxed text-neutral-700">{positioning.analysis}</p>
        {(positioning.strengths.length > 0 || positioning.challenges.length > 0) && (
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
        )}
      </div>
    </section>
  );
}

export function Peers({ data }: { data: StockData }) {
  const { peers, industryLinkSlug, industryName } = data;
  if (peers.length === 0) return null;
  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <SectionHeader kicker="同業 · 時価総額順" title="同じ業界の主要10社" icon={Briefcase} />
        {industryLinkSlug && (
          <Link href={`/industries/${industryLinkSlug}`} className="text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
            {industryName}の全企業<ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
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

export function ShareholdersSection({ data }: { data: StockData }) {
  const { shareholders, ownerActivism } = data;
  const { foreignOwnership, individualOwnership, stableOwnership, top } = shareholders;
  if (top.length === 0) return null;
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
      {ownerActivism.length > 0 && (
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
      )}
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

const IMPACT_STYLE: Record<"強" | "中" | "弱", string> = { 強: "bg-rose-100 text-rose-700", 中: "bg-amber-100 text-amber-700", 弱: "bg-neutral-100 text-neutral-700" };

export function CatalystsSection({ data }: { data: StockData }) {
  const { catalysts } = data;
  if (catalysts.upside.length === 0 && catalysts.downside.length === 0) return null;
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

export function StoryDeckSection({ data }: { data: StockData }) {
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
