import {
  TrendingUp,
  TrendingDown,
  Activity,
  Scale,
  BarChart3,
  Coins,
} from "lucide-react";

import { SectionHeader, type StockData } from "./primitives";

export function TechnicalSection({ data }: { data: StockData }) {
  const { technical, stockTrend } = data;
  const { ma25, ma75, ma200, high52w, low52w, avgVolume, creditBuy, creditSell, creditRatio, rsi14, comment } = technical;
  const currentPrice = stockTrend.currentPrice;
  const range52w = high52w - low52w;
  const pos52w = range52w > 0 ? ((currentPrice - low52w) / range52w) * 100 : 50;
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
      {comment && (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3 items-start">
          <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5" /></div>
          <p className="text-sm text-amber-900 leading-relaxed">{comment}</p>
        </div>
      )}
    </section>
  );
}

function MARow({ label, value, current }: { label: string; value: number; current: number }) {
  const above = current > value;
  const diff = value > 0 ? ((current - value) / value) * 100 : 0;
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
