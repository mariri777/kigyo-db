"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Stock } from "@/domain/types";
import { analyzeComparison, type ComparisonObservation } from "@/domain/compare";
import { VERDICT_STYLE } from "@/domain/verdict";
import {
  formatBeta,
  formatOkuOpt,
  formatPbrOpt,
  formatPct1Opt,
  formatPerOpt,
  formatPriceOpt,
  formatSignedPct1Opt,
  formatSignedPct2Opt,
} from "@/shared/format";

const MAX_COMPARE = 3;

export function CompareView({
  initialCodes,
  allStocks,
}: {
  initialCodes: string[];
  allStocks: Stock[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>(initialCodes);

  const stocksByCode = useMemo(
    () => new Map(allStocks.map((s) => [s.code, s])),
    [allStocks],
  );
  const stocks = useMemo(
    () =>
      codes
        .map((c) => stocksByCode.get(c))
        .filter((s): s is Stock => Boolean(s)),
    [codes, stocksByCode],
  );
  const available = allStocks.filter((s) => !codes.includes(s.code));

  const updateUrl = (next: string[]) => {
    if (next.length === 0) router.replace(`/compare`);
    else router.replace(`/compare?codes=${next.join(",")}`);
  };

  const addCode = (c: string) => {
    if (!c || codes.length >= MAX_COMPARE || codes.includes(c)) return;
    const next = [...codes, c];
    setCodes(next);
    updateUrl(next);
  };

  const removeCode = (c: string) => {
    const next = codes.filter((x) => x !== c);
    setCodes(next);
    updateUrl(next);
  };

  const observations = analyzeComparison(stocks);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="pb-8 border-b border-border mb-8">
        <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-3">Compare</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-4">
          銘柄を並べて比較
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          最大 3 銘柄を選んで、基本情報・規範的判断・指標・成長フェーズ・リスクプロファイルを横並びで確認。
          「違いの分析」セクションで、AI が比較対象の特徴的な差を抽出します。
        </p>
      </header>

      {/* 選択中の銘柄バー */}
      <section className="mb-8">
        <div className="text-[11px] text-foreground/60 tracking-widest mb-3">SELECTED ({codes.length}/{MAX_COMPARE})</div>
        <div className="flex flex-wrap gap-2 items-center">
          {stocks.map((s) => (
            <div
              key={s.code}
              className="inline-flex items-center gap-2 bg-surface border border-border-strong rounded-md pl-3 pr-1 py-1.5"
            >
              <span className="text-[10px] text-foreground/60 tabular">{s.code}</span>
              <Link
                href={`/stocks/${s.code}`}
                className="text-sm font-medium hover:underline"
              >
                {s.name}
              </Link>
              <button
                onClick={() => removeCode(s.code)}
                className="text-foreground/60 hover:text-foreground w-5 h-5 rounded inline-flex items-center justify-center transition"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
          {codes.length < MAX_COMPARE && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addCode(e.target.value);
                e.target.value = "";
              }}
              className="text-sm bg-surface-elev border border-border rounded-md px-3 py-1.5 hover:border-border-strong transition cursor-pointer"
            >
              <option value="">+ 銘柄を追加</option>
              {available.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} {s.name} — {s.industryCluster}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {stocks.length === 0 ? (
        <EmptyState />
      ) : stocks.length === 1 ? (
        <SingleStockHint stock={stocks[0]} />
      ) : (
        <ComparisonGrid stocks={stocks} observations={observations} />
      )}

      <div className="mt-12 text-[11px] text-foreground/60 leading-relaxed">
        ※「違いの分析」は決定的なロジックで自動抽出された観察です。AI 生成ではなく、PER・ROE 等の数値差・業界クラスタ・成長フェーズなどから機械的に算出しています。
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-border border-dashed rounded-md p-12 text-center">
      <p className="text-muted-foreground mb-2">銘柄を 2 つ以上選んで比較を始めてください。</p>
      <p className="text-[12px] text-foreground/60">
        上の「+ 銘柄を追加」から選択するか、銘柄ページの「比較する」ボタンからもアクセスできます。
      </p>
    </div>
  );
}

function SingleStockHint({ stock }: { stock: Stock }) {
  return (
    <div className="bg-surface border border-border border-dashed rounded-md p-8 text-center">
      <p className="text-muted-foreground mb-1">
        現在 <strong className="text-foreground">{stock.name}</strong> のみ選択中。
      </p>
      <p className="text-[12px] text-foreground/60">あと 1 銘柄以上選択すると比較が表示されます。</p>
    </div>
  );
}

function ComparisonGrid({
  stocks,
  observations,
}: {
  stocks: Stock[];
  observations: ComparisonObservation[];
}) {
  return (
    <>
      {/* AI による違いの分析 */}
      {observations.length > 0 && (
        <CompSection title="違いの分析" subtitle={`${stocks.length} 社の比較から自動抽出された ${observations.length} 件の観察`}>
          <div className="space-y-3">
            {observations.map((ob) => (
              <div
                key={ob.key}
                className="bg-surface border border-border rounded-md p-4 grid sm:grid-cols-[120px_1fr] gap-2 sm:gap-4"
              >
                <div className="text-[10px] text-foreground/60 tracking-wider self-start">{ob.category}</div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{ob.headline}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{ob.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CompSection>
      )}

      {/* 基本情報 */}
      <CompSection title="基本情報">
        <CompGrid stocks={stocks}>
          {(s) => (
            <div className="space-y-2">
              <div className="text-[11px] text-foreground/60 tabular">{s.code}</div>
              <div className="text-xl font-bold leading-tight">{s.name}</div>
              {s.nameEn && <div className="text-[11px] text-muted-foreground">{s.nameEn}</div>}
              <div className="text-[11px] text-muted-foreground">{s.industryCluster}</div>
              <div className="text-[10px] text-foreground border border-border rounded inline-block px-1.5 py-0.5">
                東証 {s.exchange}
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed mt-3 line-clamp-4">
                {s.oneLiner}
              </p>
            </div>
          )}
        </CompGrid>
      </CompSection>

      {/* 規範的判断 */}
      <CompSection title="規範的判断">
        <CompGrid stocks={stocks}>
          {(s) => (
            <div>
              {s.valuationCall ? (
                <>
                  <div className="mb-3">
                    <span
                      className={`inline-block text-xs font-bold border rounded-full px-3 py-1 ${VERDICT_STYLE[s.valuationCall.verdict]}`}
                    >
                      {s.valuationCall.verdict}
                    </span>
                    <div className="text-[10px] text-foreground/60 mt-2 tracking-wider">
                      割安度スコア
                    </div>
                    <div className="text-2xl font-bold tabular">
                      {s.valuationCall.score}
                      <span className="text-[10px] text-foreground/60 ml-1 font-normal">/100</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {s.valuationCall.rationale}
                  </p>
                </>
              ) : (
                <div className="text-[12px] text-foreground/60">判断データ未取得</div>
              )}
            </div>
          )}
        </CompGrid>
      </CompSection>

      {/* 数値指標 */}
      <CompSection title="数値指標">
        <CompTable
          rows={[
            { label: "株価", get: (s) => formatPriceOpt(s.priceJpy) },
            {
              label: "前日比",
              get: (s) => formatSignedPct2Opt(s.changePct),
              tone: (s) =>
                s.changePct === null
                  ? undefined
                  : s.changePct >= 0
                    ? "positive"
                    : "negative",
            },
            { label: "時価総額", get: (s) => formatOkuOpt(s.marketCapOku) },
            { label: "PER", get: (s) => formatPerOpt(s.per), highlight: highlightMinNullable("per") },
            { label: "PBR", get: (s) => formatPbrOpt(s.pbr), highlight: highlightMinNullable("pbr") },
            {
              label: "配当利回り",
              get: (s) => formatPct1Opt(s.dividendYield),
              highlight: highlightMaxNullable("dividendYield"),
            },
            { label: "ROE", get: (s) => formatPct1Opt(s.roe), highlight: highlightMaxNullable("roe") },
            {
              label: "営業利益率",
              get: (s) => formatPct1Opt(s.operatingMargin),
              highlight: highlightMaxNullable("operatingMargin"),
            },
            {
              label: "売上 3 年 CAGR",
              get: (s) => formatSignedPct1Opt(s.revenueGrowth3y),
              tone: (s) =>
                s.revenueGrowth3y === null
                  ? undefined
                  : s.revenueGrowth3y >= 0
                    ? "positive"
                    : "negative",
              highlight: highlightMaxNullable("revenueGrowth3y"),
            },
          ]}
          stocks={stocks}
        />
      </CompSection>

      {/* 成長フェーズ */}
      <CompSection title="成長フェーズ">
        <CompTable
          rows={[
            { label: "ローンチ期", get: (s) => s.phaseScores ? `${s.phaseScores.launch}` : "—", highlight: highlightMaxPhase("launch") },
            { label: "拡大期", get: (s) => s.phaseScores ? `${s.phaseScores.expansion}` : "—", highlight: highlightMaxPhase("expansion") },
            { label: "成熟期", get: (s) => s.phaseScores ? `${s.phaseScores.mature}` : "—", highlight: highlightMaxPhase("mature") },
            { label: "衰退期", get: (s) => s.phaseScores ? `${s.phaseScores.decline}` : "—", highlight: highlightMaxPhase("decline") },
          ]}
          stocks={stocks}
        />
      </CompSection>

      {/* ファクター感応度 */}
      <CompSection title="ファクター感応度(ベータ)">
        <CompTable
          rows={[
            { label: "ドル円", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.usdjpy) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.usdjpy) : undefined },
            { label: "米 10 年金利", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.us10y) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.us10y) : undefined },
            { label: "SOX", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.sox) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.sox) : undefined },
            { label: "中国経済", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.china) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.china) : undefined },
            { label: "市場ベータ", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.market) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.market) : undefined },
            { label: "サイズ", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.size) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.size) : undefined },
            { label: "バリュー", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.value) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.value) : undefined },
            { label: "モメンタム", get: (s) => s.factorBetas ? formatBeta(s.factorBetas.momentum) : "—", tone: (s) => s.factorBetas ? signTone(s.factorBetas.momentum) : undefined },
          ]}
          stocks={stocks}
        />
      </CompSection>

      {/* 個別ページへの導線 */}
      <CompSection title="詳細を見る">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}>
          {stocks.map((s) => (
            <Link
              key={s.code}
              href={`/stocks/${s.code}`}
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="text-[11px] text-foreground/60 tabular">{s.code}</div>
              <div className="font-bold group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-muted-foreground mt-2">個別銘柄ページへ →</div>
            </Link>
          ))}
        </div>
      </CompSection>
    </>
  );
}

function CompSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function CompGrid({
  stocks,
  children,
}: {
  stocks: Stock[];
  children: (s: Stock) => React.ReactNode;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}
    >
      {stocks.map((s) => (
        <div key={s.code} className="bg-surface border border-border rounded-md p-4">
          {children(s)}
        </div>
      ))}
    </div>
  );
}

type Row = {
  label: string;
  get: (s: Stock) => string;
  tone?: (s: Stock) => "positive" | "negative" | undefined;
  highlight?: (stocks: Stock[]) => string | undefined; // returns code to highlight
};

function CompTable({ rows, stocks }: { rows: Row[]; stocks: Stock[] }) {
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div
        className="grid items-center px-4 py-2 border-b border-border bg-surface-elev gap-3"
        style={{ gridTemplateColumns: `140px repeat(${stocks.length}, minmax(0, 1fr))` }}
      >
        <div className="text-[11px] text-foreground/60">指標</div>
        {stocks.map((s) => (
          <div key={s.code} className="text-[11px] font-bold truncate">
            {s.name}
          </div>
        ))}
      </div>
      {rows.map((row) => {
        const highlightCode = row.highlight?.(stocks);
        return (
          <div
            key={row.label}
            className="grid items-baseline px-4 py-2.5 border-b border-border last:border-b-0 text-sm gap-3"
            style={{ gridTemplateColumns: `140px repeat(${stocks.length}, minmax(0, 1fr))` }}
          >
            <div className="text-[12px] text-muted-foreground">{row.label}</div>
            {stocks.map((s) => {
              const tone = row.tone?.(s);
              const isHighlight = highlightCode === s.code;
              return (
                <div
                  key={s.code}
                  className={`tabular font-mono text-sm flex items-baseline gap-1.5 ${
                    tone === "positive"
                      ? "text-positive"
                      : tone === "negative"
                        ? "text-negative"
                        : ""
                  }`}
                >
                  <span className={isHighlight ? "font-bold" : ""}>{row.get(s)}</span>
                  {isHighlight && (
                    <span className="text-[9px] uppercase tracking-wider text-foreground bg-foreground/10 border border-foreground/20 rounded px-1 py-0.5">
                      best
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// helpers
function signTone(v: number): "positive" | "negative" | undefined {
  if (v > 0.1) return "positive";
  if (v < -0.1) return "negative";
  return undefined;
}

/** number | null フィールドを対象にした max ハイライト。null の銘柄は除外。 */
function highlightMaxNullable(
  key: keyof Stock,
): (stocks: Stock[]) => string | undefined {
  return (stocks) => {
    if (stocks.length < 2) return undefined;
    const valued = stocks
      .map((s) => ({ s, v: s[key] as unknown }))
      .filter((x): x is { s: Stock; v: number } => typeof x.v === "number");
    if (valued.length < 2) return undefined;
    valued.sort((a, b) => b.v - a.v);
    return valued[0].s.code;
  };
}

function highlightMinNullable(
  key: keyof Stock,
): (stocks: Stock[]) => string | undefined {
  return (stocks) => {
    if (stocks.length < 2) return undefined;
    const valued = stocks
      .map((s) => ({ s, v: s[key] as unknown }))
      .filter((x): x is { s: Stock; v: number } => typeof x.v === "number");
    if (valued.length < 2) return undefined;
    valued.sort((a, b) => a.v - b.v);
    return valued[0].s.code;
  };
}

function highlightMaxPhase(
  phase: "launch" | "expansion" | "mature" | "decline",
) {
  return (stocks: Stock[]) => {
    if (stocks.length < 2) return undefined;
    const valued = stocks
      .map((s) => ({ s, v: s.phaseScores?.[phase] }))
      .filter((x): x is { s: Stock; v: number } => typeof x.v === "number");
    if (valued.length < 2) return undefined;
    valued.sort((a, b) => b.v - a.v);
    return valued[0].s.code;
  };
}
