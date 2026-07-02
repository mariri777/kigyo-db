/**
 * 銘柄詳細ページの各セクションで共有する小さな表示部品とフォーマッタ。
 */
import { Calendar, Coins } from "lucide-react";

import type { StockPageData } from "../_lib/loadStockPageData";

export type StockData = StockPageData;

/** 億円 → 兆/億 の丸め表示 */
export function fmtOku(oku: number | null | undefined) {
  if (oku == null) return "—";
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆円`;
  return `${oku.toLocaleString()}億円`;
}

export function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function SectionHeader({
  kicker,
  title,
  icon: Icon,
  tag,
}: {
  kicker?: string;
  title: string;
  icon?: typeof Calendar;
  tag?: { label: string; color: string };
}) {
  return (
    <div>
      {kicker && (
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">{kicker}</div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {tag && (
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tag.color}`}>
            {tag.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  accent: "emerald" | "blue" | "neutral" | "amber" | "rose";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    neutral: "bg-neutral-100 text-neutral-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  }[accent];
  return (
    <div className="bg-white rounded-xl shadow-sm p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
        <div className="font-mono tabular font-bold text-base truncate">{value}</div>
      </div>
    </div>
  );
}

export function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "emerald" | "neutral" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    neutral: "bg-neutral-100 text-neutral-700",
    amber: "bg-amber-50 text-amber-700",
  }[accent];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors}`}>
        {label}
      </div>
      <div className="font-mono tabular text-2xl sm:text-3xl font-bold tracking-tight mt-2">{value}</div>
    </div>
  );
}
