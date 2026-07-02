import {
  TrendingUp,
  Building2,
  Coins,
  Wallet,
  BarChart3,
  Flag,
  Zap,
} from "lucide-react";

import { fmtOku, SectionHeader, BigStat, StatCard, type StockData } from "./primitives";

export function LatestEarnings({ data }: { data: StockData }) {
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

export function FinancialsHistory({ data }: { data: StockData }) {
  const { history10y } = data;
  if (history10y.length === 0) return null;
  const maxRev = Math.max(...history10y.map((h) => h.revenueOku));
  const maxOp = Math.max(...history10y.map((h) => h.operatingProfitOku));
  return (
    <section>
      <SectionHeader kicker="この10年" title="決算の歴史" icon={Building2} />
      <div className="mt-5 bg-white rounded-2xl shadow-sm p-6 overflow-x-auto overscroll-x-contain">
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

export function DividendSection({ data }: { data: StockData }) {
  const { dividend } = data;
  if (dividend.history.length === 0 && dividend.annualPerShare === 0) return null;
  const maxDiv = Math.max(...dividend.history.map((h) => h.amount), 1);
  // 常時ラベルは狭くなりがちなので、年数が多いときは最初・最後・ピークだけ額を出す。
  const peakIdx = dividend.history.reduce((best, h, i, arr) => (h.amount > arr[best].amount ? i : best), 0);
  const labelEvery = dividend.history.length > 7;
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
            <div className="text-[11px] text-neutral-500 font-mono">過去{dividend.history.length}年</div>
          </div>
          {/* 金額は常時表示 (hover 依存を廃止)。年数が多い場合は最初/最後/ピークのみ額を出す。 */}
          <div className="flex gap-1.5 h-40 items-end">
            {dividend.history.map((h, i) => {
              const showAmount = !labelEvery || i === 0 || i === dividend.history.length - 1 || i === peakIdx;
              return (
                <div key={h.fy} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                  <div className={`font-mono tabular text-[10px] font-bold text-neutral-700 leading-none ${showAmount ? "" : "invisible"}`}>
                    ¥{h.amount}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                    style={{ height: `${(h.amount / maxDiv) * 100}%` }}
                    title={`${h.fy}: ¥${h.amount}`}
                  />
                  <div className="text-[9px] text-neutral-500 font-mono leading-none">{h.fy}</div>
                </div>
              );
            })}
          </div>
          {dividend.buybackOku > 0 && (
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-baseline gap-2 text-xs text-neutral-600">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-neutral-900">自社株買い</span><span>進行中 ·</span>
              <span className="font-mono tabular font-bold text-neutral-900">{(dividend.buybackOku / 10000).toFixed(1)}兆円規模</span>
            </div>
          )}
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
