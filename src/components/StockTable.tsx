"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { StockBrief } from "@/domain/types";
import {
  formatPriceOpt,
  formatPct1Opt,
  formatPbrOpt,
  formatPerOpt,
} from "@/shared/format";

type SortKey =
  | "code"
  | "priceJpy"
  | "marketCapOku"
  | "per"
  | "pbr"
  | "dividendYield";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 100;

/**
 * /stocks 一覧テーブル。
 *
 * - 初回 SSR で受け取る `initial` 100 件をそのまま表示
 * - 業界フィルタ・ソートを変えたら /api/stocks に投げて結果を置き換え
 * - 「もっと見る」で次の 100 件を fetch して append
 *
 * これにより:
 *   - HTML に 3,572 銘柄を一切埋めず、SSR コストと payload を最小化
 *   - 並び替え/フィルタが SQL 側で行われるため client CPU も軽い
 *   - 同じパラメータ組は /api/stocks の CDN cache (30分) で共有
 */
export function StockTable({
  initial,
  industryOptions,
}: {
  initial: StockBrief[];
  industryOptions: { slug: string; name: string; codes: string[] }[];
}) {
  const [stocks, setStocks] = useState<StockBrief[]>(initial);
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("marketCapOku");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // フィルタ/ソート変更時にリセット fetch、初回は initial を尊重するため skip フラグ
  const firstRender = useRef(true);

  const buildQuery = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      for (const slug of industryFilter) params.append("industry", slug);
      params.set("sort", sortKey);
      params.set("dir", sortDir);
      params.set("offset", String(offset));
      params.set("limit", String(PAGE_SIZE));
      return `/api/stocks?${params.toString()}`;
    },
    [industryFilter, sortKey, sortDir],
  );

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(buildQuery(offset), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          results: StockBrief[];
          hasMore: boolean;
        };
        setStocks((prev) =>
          replace ? data.results : [...prev, ...data.results],
        );
        setHasMore(data.hasMore);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          // 失敗時は黙って前の結果を残す
        }
      } finally {
        setLoading(false);
      }
    },
    [buildQuery],
  );

  // フィルタ/ソート変更で 0 オフセットから取り直す
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void fetchPage(0, true);
  }, [fetchPage]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "code" ? "asc" : "desc");
    }
  };

  const toggleArr = <T,>(setter: (v: T[]) => void, current: T[], value: T) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  return (
    <div>
      {/* フィルタバー */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] text-dim w-16">業界:</span>
          {industryOptions.map((opt) => {
            const active = industryFilter.includes(opt.slug);
            return (
              <button
                key={opt.slug}
                onClick={() =>
                  toggleArr(setIndustryFilter, industryFilter, opt.slug)
                }
                className={`text-[11px] rounded-full px-3 py-1 border transition ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                {opt.name}{" "}
                <span className="opacity-60 ml-1 tabular">
                  {opt.codes.length}
                </span>
              </button>
            );
          })}
        </div>
        {industryFilter.length > 0 && (
          <button
            onClick={() => setIndustryFilter([])}
            className="text-[11px] text-dim hover:text-foreground transition underline decoration-dotted"
          >
            すべてクリア
          </button>
        )}
      </div>

      <div className="text-[11px] text-dim mb-2 tabular">
        {stocks.length} 社 表示中{loading && "(更新中…)"}
      </div>

      {/* テーブル */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="hidden md:grid grid-cols-[70px_1fr_140px_100px_70px_70px_80px_100px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2 gap-2">
          <SortHeader
            label="コード"
            k="code"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
          />
          <div>銘柄</div>
          <div>業種</div>
          <SortHeader
            label="株価"
            k="priceJpy"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
            align="right"
          />
          <SortHeader
            label="PER"
            k="per"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
            align="right"
          />
          <SortHeader
            label="PBR"
            k="pbr"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
            align="right"
          />
          <SortHeader
            label="配当"
            k="dividendYield"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
            align="right"
          />
          <SortHeader
            label="時価総額"
            k="marketCapOku"
            current={sortKey}
            dir={sortDir}
            onClick={toggleSort}
            align="right"
          />
        </div>
        {stocks.map((s) => (
          <Link
            key={s.code}
            href={`/stocks/${s.code}`}
            className="grid grid-cols-1 md:grid-cols-[70px_1fr_140px_100px_70px_70px_80px_100px] gap-2 md:gap-2 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm"
          >
            <div className="text-dim tabular text-xs">{s.code}</div>
            <div>
              <div className="font-medium group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-dim md:hidden">
                {s.sectorTSE}
              </div>
            </div>
            <div className="text-[11px] text-muted hidden md:block truncate">
              {s.sectorTSE}
            </div>
            <div className="text-right tabular font-mono text-xs sm:text-sm">
              {formatPriceOpt(s.priceJpy)}
            </div>
            <div className="text-right tabular font-mono">
              {formatPerOpt(s.per)}
            </div>
            <div className="text-right tabular font-mono">
              {formatPbrOpt(s.pbr)}
            </div>
            <div className="text-right tabular font-mono">
              {formatPct1Opt(s.dividendYield)}
            </div>
            <div className="text-right tabular font-mono text-xs">
              {s.marketCapOku !== null && s.marketCapOku > 0
                ? `${s.marketCapOku.toLocaleString()}億`
                : "—"}
            </div>
          </Link>
        ))}
        {stocks.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-sm text-dim">
            条件に合う銘柄がありません。フィルタを調整してください。
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchPage(stocks.length, false)}
            className="text-[12px] font-medium border border-border-strong rounded-md px-4 py-2 hover:bg-surface-elev transition disabled:opacity-50"
          >
            {loading ? "読み込み中…" : `さらに ${PAGE_SIZE} 件読み込む`}
          </button>
        </div>
      )}
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
      {active && (
        <span className="text-[8px]">{dir === "asc" ? "▲" : "▼"}</span>
      )}
    </button>
  );
}
