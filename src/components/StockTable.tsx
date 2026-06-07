"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Stock, ValuationCall } from "@/lib/types";

type SortKey = "code" | "priceJpy" | "marketCapOku" | "per" | "pbr" | "dividendYield" | "roe" | "revenueGrowth3y";
type SortDir = "asc" | "desc";

const VERDICTS: ValuationCall["verdict"][] = ["割安", "ほぼ妥当", "やや割高", "割高"];

const VERDICT_STYLE: Record<ValuationCall["verdict"], string> = {
  割安: "text-positive bg-positive/10 border-positive/30",
  ほぼ妥当: "text-foreground bg-foreground/10 border-foreground/30",
  やや割高: "text-negative/80 bg-negative/5 border-negative/30",
  割高: "text-negative bg-negative/10 border-negative/30",
};

export function StockTable({
  stocks,
  industryOptions,
}: {
  stocks: Stock[];
  /** 業界カテゴリ（半導体 / 医薬品 等）と所属銘柄コード */
  industryOptions: { slug: string; name: string; codes: string[] }[];
}) {
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [verdictFilter, setVerdictFilter] = useState<ValuationCall["verdict"][]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let list = [...stocks];

    if (industryFilter.length > 0) {
      const allowed = new Set(
        industryOptions
          .filter((o) => industryFilter.includes(o.slug))
          .flatMap((o) => o.codes)
      );
      list = list.filter((s) => allowed.has(s.code));
    }
    if (verdictFilter.length > 0) {
      list = list.filter((s) => verdictFilter.includes(s.valuationCall.verdict));
    }

    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return list;
  }, [stocks, industryOptions, industryFilter, verdictFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "code" ? "asc" : "desc");
    }
  };

  const toggleArr = <T,>(setter: (v: T[]) => void, current: T[], value: T) => {
    setter(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  return (
    <div>
      {/* フィルタバー */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] text-dim w-16">業界：</span>
          {industryOptions.map((opt) => {
            const active = industryFilter.includes(opt.slug);
            return (
              <button
                key={opt.slug}
                onClick={() => toggleArr(setIndustryFilter, industryFilter, opt.slug)}
                className={`text-[11px] rounded-full px-3 py-1 border transition ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                {opt.name} <span className="opacity-60 ml-1 tabular">{opt.codes.length}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] text-dim w-16">評価：</span>
          {VERDICTS.map((v) => {
            const active = verdictFilter.includes(v);
            const count = stocks.filter((s) => s.valuationCall.verdict === v).length;
            return (
              <button
                key={v}
                onClick={() => toggleArr(setVerdictFilter, verdictFilter, v)}
                className={`text-[11px] rounded-full px-3 py-1 border transition ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : `border-border text-muted hover:border-border-strong hover:text-foreground`
                }`}
              >
                {v} <span className="opacity-60 ml-1 tabular">{count}</span>
              </button>
            );
          })}
        </div>
        {(industryFilter.length > 0 || verdictFilter.length > 0) && (
          <button
            onClick={() => {
              setIndustryFilter([]);
              setVerdictFilter([]);
            }}
            className="text-[11px] text-dim hover:text-foreground transition underline decoration-dotted"
          >
            すべてクリア
          </button>
        )}
      </div>

      <div className="text-[11px] text-dim mb-2 tabular">
        {filtered.length} / {stocks.length} 社
      </div>

      {/* テーブル */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="hidden md:grid grid-cols-[70px_1fr_140px_100px_60px_60px_80px_80px_90px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2 gap-2">
          <SortHeader label="コード" k="code" current={sortKey} dir={sortDir} onClick={toggleSort} />
          <div>銘柄</div>
          <div>業界クラスタ</div>
          <SortHeader label="株価" k="priceJpy" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
          <SortHeader label="PER" k="per" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
          <SortHeader label="ROE" k="roe" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
          <SortHeader label="配当" k="dividendYield" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
          <SortHeader label="3年成長" k="revenueGrowth3y" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
          <div className="text-right">評価</div>
        </div>
        {filtered.map((s) => (
          <Link
            key={s.code}
            href={`/stocks/${s.code}`}
            className="grid grid-cols-1 md:grid-cols-[70px_1fr_140px_100px_60px_60px_80px_80px_90px] gap-2 md:gap-2 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm"
          >
            <div className="text-dim tabular text-xs">{s.code}</div>
            <div>
              <div className="font-medium group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-dim md:hidden">{s.industryCluster}</div>
            </div>
            <div className="text-[11px] text-muted hidden md:block truncate">{s.industryCluster}</div>
            <div className="text-right tabular font-mono text-xs sm:text-sm">
              ¥{s.priceJpy.toLocaleString()}
            </div>
            <div className="text-right tabular font-mono">{s.per.toFixed(1)}</div>
            <div className="text-right tabular font-mono">{s.roe.toFixed(1)}%</div>
            <div className="text-right tabular font-mono">{s.dividendYield.toFixed(1)}%</div>
            <div
              className={`text-right tabular font-mono ${
                s.revenueGrowth3y >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {s.revenueGrowth3y >= 0 ? "+" : ""}
              {s.revenueGrowth3y.toFixed(1)}%
            </div>
            <div className="text-right">
              <span
                className={`inline-block text-[10px] border rounded px-1.5 py-0.5 ${VERDICT_STYLE[s.valuationCall.verdict]}`}
              >
                {s.valuationCall.verdict}
              </span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-dim">
            条件に合う銘柄がありません。フィルタを調整してください。
          </div>
        )}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  k,
  current,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  k: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = current === k;
  return (
    <button
      onClick={() => onClick(k)}
      className={`text-[11px] hover:text-foreground transition flex items-center gap-0.5 ${
        align === "right" ? "justify-end" : ""
      } ${active ? "text-foreground" : "text-dim"}`}
    >
      {label}
      {active && <span className="text-[8px]">{dir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}
