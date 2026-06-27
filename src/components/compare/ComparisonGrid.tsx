import Link from "next/link";
import type { Stock } from "@/domain/types";
import type { ComparisonObservation } from "@/domain/compare";
import { VERDICT_STYLE } from "@/domain/verdict";
import { ROUTES } from "@/shared/links";
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
import { CompareGrid, CompareSection } from "./CompareLayout";
import { CompareTable, type CompareRow } from "./CompareTable";
import {
  highlightMaxNullable,
  highlightMaxPhase,
  highlightMinNullable,
  signTone,
} from "./highlights";

export function ComparisonGrid({
  stocks,
  observations,
}: {
  stocks: Stock[];
  observations: ComparisonObservation[];
}) {
  return (
    <>
      {observations.length > 0 && (
        <CompareSection
          title="違いの分析"
          subtitle={`${stocks.length} 社の比較から自動抽出された ${observations.length} 件の観察`}
        >
          <div className="space-y-3">
            {observations.map((ob) => (
              <div
                key={ob.key}
                className="bg-surface border border-border rounded-md p-4 grid sm:grid-cols-[120px_1fr] gap-2 sm:gap-4"
              >
                <div className="text-[10px] text-foreground/60 tracking-wider self-start">
                  {ob.category}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{ob.headline}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{ob.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CompareSection>
      )}

      <CompareSection title="基本情報">
        <CompareGrid stocks={stocks}>
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
        </CompareGrid>
      </CompareSection>

      <CompareSection title="規範的判断">
        <CompareGrid stocks={stocks}>
          {(s) =>
            s.valuationCall ? (
              <div>
                <div className="mb-3">
                  <span
                    className={`inline-block text-xs font-bold border rounded-full px-3 py-1 ${
                      VERDICT_STYLE[s.valuationCall.verdict]
                    }`}
                  >
                    {s.valuationCall.verdict}
                  </span>
                  <div className="text-[10px] text-foreground/60 mt-2 tracking-wider">割安度スコア</div>
                  <div className="text-2xl font-bold tabular">
                    {s.valuationCall.score}
                    <span className="text-[10px] text-foreground/60 ml-1 font-normal">/100</span>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {s.valuationCall.rationale}
                </p>
              </div>
            ) : (
              <div className="text-[12px] text-foreground/60">判断データ未取得</div>
            )
          }
        </CompareGrid>
      </CompareSection>

      <CompareSection title="数値指標">
        <CompareTable rows={METRIC_ROWS} stocks={stocks} />
      </CompareSection>

      <CompareSection title="成長フェーズ">
        <CompareTable rows={PHASE_ROWS} stocks={stocks} />
      </CompareSection>

      <CompareSection title="ファクター感応度(ベータ)">
        <CompareTable rows={FACTOR_ROWS} stocks={stocks} />
      </CompareSection>

      <CompareSection title="詳細を見る">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}
        >
          {stocks.map((s) => (
            <Link
              key={s.code}
              href={`${ROUTES.stocks}/${s.code}`}
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="text-[11px] text-foreground/60 tabular">{s.code}</div>
              <div className="font-bold group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-muted-foreground mt-2">個別銘柄ページへ →</div>
            </Link>
          ))}
        </div>
      </CompareSection>
    </>
  );
}

const METRIC_ROWS: CompareRow[] = [
  { label: "株価", get: (s) => formatPriceOpt(s.priceJpy) },
  {
    label: "前日比",
    get: (s) => formatSignedPct2Opt(s.changePct),
    tone: (s) =>
      s.changePct === null ? undefined : s.changePct >= 0 ? "positive" : "negative",
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
];

const PHASE_ROWS: CompareRow[] = (
  ["launch", "expansion", "mature", "decline"] as const
).map((key, idx) => {
  const labels = ["ローンチ期", "拡大期", "成熟期", "衰退期"];
  return {
    label: labels[idx],
    get: (s) => (s.phaseScores ? `${s.phaseScores[key]}` : "—"),
    highlight: highlightMaxPhase(key),
  } satisfies CompareRow;
});

const FACTOR_ROWS: CompareRow[] = (
  [
    { key: "usdjpy", label: "ドル円" },
    { key: "us10y", label: "米 10 年金利" },
    { key: "sox", label: "SOX" },
    { key: "china", label: "中国経済" },
    { key: "market", label: "市場ベータ" },
    { key: "size", label: "サイズ" },
    { key: "value", label: "バリュー" },
    { key: "momentum", label: "モメンタム" },
  ] as const
).map(
  ({ key, label }) =>
    ({
      label,
      get: (s) => (s.factorBetas ? formatBeta(s.factorBetas[key]) : "—"),
      tone: (s) => (s.factorBetas ? signTone(s.factorBetas[key]) : undefined),
    }) satisfies CompareRow,
);
