import type { StockPageData } from "../_lib/loadStockPageData";

import { Breadcrumb, Hero, Summary } from "./StockHero";
import { InvestmentVerdict, AnalystTargets, StockTrendSection } from "./AnalystSection";
import { LatestEarnings, FinancialsHistory, DividendSection } from "./EarningsSection";
import { TechnicalSection } from "./TechnicalSection";
import {
  Positioning,
  Peers,
  ShareholdersSection,
  CatalystsSection,
  StoryDeckSection,
} from "./OwnershipSection";

/**
 * 銘柄詳細ページの組み立て。各セクションは _components 配下に分割済み。
 * データ取得は _lib/loadStockPageData.ts が担当し、ここは表示の順序のみ持つ。
 */
export function StockDetail({ data }: { data: StockPageData }) {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-10">
        <Breadcrumb data={data} />
        <Hero data={data} />
        <Summary data={data} />
        <InvestmentVerdict data={data} />
        <AnalystTargets data={data} />
        <StockTrendSection data={data} />
        <DividendSection data={data} />
        <TechnicalSection data={data} />
        <LatestEarnings data={data} />
        <FinancialsHistory data={data} />
        <Positioning data={data} />
        <Peers data={data} />
        <ShareholdersSection data={data} />
        <CatalystsSection data={data} />
        <StoryDeckSection data={data} />
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-xs text-neutral-500 leading-relaxed pt-6 border-t border-neutral-200">
      本ページのデータは Cloudflare D1 + 一部サンプル値で構成されています。
    </div>
  );
}
