import Link from "next/link";
import type { Stock } from "@/domain/types";
import type { Industry } from "@/content/industries";
import { Metric } from "@/components/stock/Metric";
import { Term } from "@/components/Term";
import { ROUTES } from "@/shared/links";
import {
  formatOkuOpt,
  formatPbrOpt,
  formatPct1Opt,
  formatPerOpt,
  formatPriceOpt,
  formatSignedPct2Opt,
} from "@/shared/format";

const EXCHANGE_NOTE: Record<Stock["exchange"], string> = {
  Prime: "最上位市場（約1,600社、大型株中心）",
  Standard: "中位市場（約1,600社、中堅企業向け）",
  Growth: "新興企業向け市場（約600社、高成長企業中心）",
};

/**
 * 銘柄ページのヒーロー部分。コード/名前/Tier/指標カードと、ラベル説明の disclose を含む。
 * 旧 `app/(main)/stocks/[code]/page.tsx` から切り出した。
 */
export function StockHeader({
  stock,
  containingIndustry,
}: {
  stock: Stock;
  containingIndustry: Industry | undefined;
}) {
  return (
    <header className="border-b border-border pb-6 mb-8">
      <div className="flex flex-wrap items-baseline gap-3 mb-2">
        <span className="text-foreground/60 tabular text-sm">{stock.code}</span>
        <h1 className="text-3xl font-bold leading-tight">{stock.name}</h1>
        {stock.nameEn && <span className="text-muted-foreground text-sm">{stock.nameEn}</span>}
        <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
          東証 {stock.exchange}
        </span>
        <span className="text-[10px] text-foreground border border-accent/40 bg-foreground/10 rounded px-1.5 py-0.5">
          Tier {stock.tier}
        </span>
        {containingIndustry ? (
          <Link
            href={`${ROUTES.industries}/${containingIndustry.slug}`}
            className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hover:border-border-strong hover:text-foreground transition"
          >
            {stock.industryCluster} ↗
          </Link>
        ) : (
          <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {stock.industryCluster}
          </span>
        )}
        <Link
          href={`${ROUTES.compare}?codes=${stock.code}`}
          className="ml-auto text-[10px] text-foreground border border-foreground rounded px-2 py-0.5 hover:bg-foreground hover:text-background transition"
        >
          ＋ 比較する
        </Link>
      </div>

      <DiscloseChip summary="ラベルの意味">
        <div>
          <strong className="text-foreground font-bold tabular">{stock.code}</strong>
          <span className="ml-2">銘柄コード — 東証で各上場企業に割り振られた4桁の識別番号</span>
        </div>
        <div>
          <strong className="text-foreground font-bold">東証 {stock.exchange}</strong>
          <span className="ml-2">{EXCHANGE_NOTE[stock.exchange]}</span>
        </div>
        <div>
          <strong className="text-foreground font-bold">Tier {stock.tier}</strong>
          <span className="ml-2">
            超！企業DB 独自の業界内重要度ランク（Tier 1 = 業界の主要プレイヤー / Tier 2 = 中堅 / Tier 3 = 周辺）
          </span>
        </div>
        <div>
          <strong className="text-foreground font-bold">{stock.industryCluster}</strong>
          <span className="ml-2">業界クラスタ — 業界をさらに細かく分けたサブセグメント。クリックで業界詳細へ</span>
        </div>
      </DiscloseChip>

      <div className="bg-surface-elev border-l-2 border-foreground rounded-r-md p-4 my-5 max-w-3xl">
        <div className="text-[10px] text-muted-foreground tracking-widest mb-1">ひとことで言うと</div>
        <p className="text-base leading-relaxed font-medium">{stock.oneLiner}</p>
      </div>

      <details className="max-w-3xl">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground inline-block">
          もう少し詳しく
        </summary>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">{stock.description}</p>
      </details>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
        <Metric label="株価" value={formatPriceOpt(stock.priceJpy)} sub={stock.priceDate ?? ""} />
        <Metric
          label="前日比"
          value={formatSignedPct2Opt(stock.changePct)}
          tone={
            stock.changePct === null
              ? undefined
              : stock.changePct >= 0
                ? "positive"
                : "negative"
          }
        />
        <Metric labelNode={<Term>時価総額</Term>} value={formatOkuOpt(stock.marketCapOku)} />
        <Metric labelNode={<Term>PER</Term>} value={formatPerOpt(stock.per)} sub="実績" />
        <Metric labelNode={<Term>PBR</Term>} value={formatPbrOpt(stock.pbr)} />
        <Metric labelNode={<Term>配当利回り</Term>} value={formatPct1Opt(stock.dividendYield)} sub="予想" />
        <Metric labelNode={<Term>ROE</Term>} value={formatPct1Opt(stock.roe)} />
      </div>

      <div className="mt-3 text-[10px] text-foreground/60 leading-relaxed">
        指標:{stock.segmentsPeriod ?? "—"} 期実績ベース。出典は EDINET XBRL / J-Quants。
        <span className="ml-2 text-[10px] border border-border rounded px-1.5 py-0.5">
          ※ 株価は実勢({stock.priceDate ?? "—"} 終値・週次更新)/財務指標・分析はサンプルデータ
        </span>
      </div>

      <DiscloseChip
        summary="指標の見方"
        contentClassName="grid sm:grid-cols-2 gap-x-4 gap-y-1"
      >
        <Hint term="時価総額" desc="発行株数 × 株価。会社全体の市場価値。" />
        <Hint term="PER" desc="株価 ÷ 1株利益。市場平均15倍、低いほど割安。" />
        <Hint term="PBR" desc="株価 ÷ 1株純資産。1倍未満で「解散価値以下」。" />
        <Hint term="配当利回り" desc="年配当 ÷ 株価。3%超で高配当扱い。" />
        <Hint term="ROE" desc="純利益 ÷ 自己資本。10%超で優秀、20%超で卓越。" />
        <Hint term="前日比" desc="前営業日終値からの変化率（％）。" />
      </DiscloseChip>
    </header>
  );
}

function DiscloseChip({
  summary,
  children,
  contentClassName,
}: {
  summary: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <details className="mb-3 group">
      <summary className="text-[10px] text-foreground/60 cursor-pointer hover:text-muted-foreground inline-flex items-center gap-1 select-none">
        <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
        {summary}
      </summary>
      <div
        className={`text-[10px] text-muted-foreground leading-relaxed mt-2 pl-3 border-l border-border max-w-3xl space-y-1 ${
          contentClassName ?? ""
        }`}
      >
        {children}
      </div>
    </details>
  );
}

function Hint({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <strong className="text-foreground font-bold">{term}</strong> {desc}
    </div>
  );
}
