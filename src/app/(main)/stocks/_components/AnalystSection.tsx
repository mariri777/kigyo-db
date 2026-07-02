import { TrendingUp, Sparkles, Scale, Target, Gauge, Activity } from "lucide-react";

import { SectionHeader, type StockData } from "./primitives";

const VERDICT_STYLE: Record<"割安" | "ほぼ妥当" | "やや割高" | "割高", { bg: string; text: string; barColor: string }> = {
  割安: { bg: "bg-emerald-500", text: "text-emerald-700", barColor: "from-emerald-400 to-emerald-600" },
  ほぼ妥当: { bg: "bg-blue-500", text: "text-blue-700", barColor: "from-blue-400 to-blue-600" },
  やや割高: { bg: "bg-amber-500", text: "text-amber-700", barColor: "from-amber-400 to-amber-600" },
  割高: { bg: "bg-rose-500", text: "text-rose-700", barColor: "from-rose-400 to-rose-600" },
};

export function StockTrendSection({ data }: { data: StockData }) {
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

export function InvestmentVerdict({ data }: { data: StockData }) {
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
          <div className="overflow-x-auto overscroll-x-contain">
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

export function AnalystTargets({ data }: { data: StockData }) {
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
