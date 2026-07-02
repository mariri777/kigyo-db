import type { Metadata } from "next";

import { loadHomepageData } from "./_lib/homeData";
import { MarketSummary } from "./_components/MarketSummary";
import { MarketSignals } from "./_components/MarketSignals";
import { ArticlesSection } from "./_components/ArticlesSection";
import { Predictions } from "./_components/Predictions";
import { ExploreRails } from "./_components/ExploreRails";

// 動的データ取得 (D1) が入るため、build 時 prerender を避ける
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "日本株 3800 社のAI銘柄分析データベース",
  description:
    "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。今日の市場サマリ・今日のまとめ・AIの明日予想・記事を 1 つに。日々の見落とし論点と先回りキュレーションをまとめて読める。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・今日のまとめ・AIの明日予想・記事を 1 つに。",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・今日のまとめ・AIの明日予想・記事を 1 つに。",
  },
};

/**
 * トップページ。「AI の解釈」を主役に、鮮度の高い順に並べる:
 * 市場サマリ → 本日のハイライト → AIの明日予想 → 記事 → 全銘柄DB入口。
 * (準備中コンテンツの Coming Soon カードは置かない — 実在するものだけを見せる)
 */
export default async function HomePage() {
  const data = await loadHomepageData();
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-12">
        <h1 className="sr-only">超!企業DB — 日本株 3800 社の AI 銘柄分析データベース</h1>
        <MarketSummary
          indices={data.indices}
          brief={data.brief}
          today={data.today}
          asOfDate={data.asOfDate}
        />
        <MarketSignals highlights={data.highlights} today={data.today} />
        <Predictions forecasts={data.forecasts} />
        <ArticlesSection posts={data.latestArticles} />
        <ExploreRails />
      </div>
    </div>
  );
}
