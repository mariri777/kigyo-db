import { listHomeHighlights } from "@/server/usecase";
import { listPosts } from "@/content/posts";
import { industries, industryAggregates } from "@/content/industries";
import { listPredictions } from "@/content/predictions";
import { Hero } from "@/components/home/Hero";
import { UndervaluedSection } from "@/components/home/UndervaluedSection";
import { ExpansionSection } from "@/components/home/ExpansionSection";
import { CoverageMap } from "@/components/home/CoverageMap";
import { AiTrackRecordSection } from "@/components/home/AiTrackRecordSection";
import { CrossIndustryPairsSection } from "@/components/home/CrossIndustryPairsSection";
import { FactorAnomaliesSection } from "@/components/home/FactorAnomaliesSection";
import { WhatYouCanDo } from "@/components/home/WhatYouCanDo";
import { LatestPostsSection } from "@/components/home/LatestPostsSection";


export default async function Home() {
  const { briefs, overlayStocks, undervalued, expansion } = await listHomeHighlights();
  const latestPosts = (await listPosts()).slice(0, 3);

  const briefsByCode = new Map(briefs.map((b) => [b.code, b]));
  const coverage = industries.map((ind) => ({
    industry: ind,
    agg: industryAggregates(ind, briefsByCode),
  }));
  const totalStocks = coverage.reduce((acc, c) => acc + c.agg.count, 0);

  const allPredictions = listPredictions();
  const resolved = allPredictions.filter((p) => p.status === "resolved");
  const hits = resolved.filter((p) => p.resolution?.outcomeKey === p.aiReasoning.pick);
  const accuracy = resolved.length > 0 ? (hits.length / resolved.length) * 100 : 0;
  const recentResolved = [...resolved]
    .sort((a, b) =>
      (b.resolution?.resolvedAt ?? "").localeCompare(a.resolution?.resolvedAt ?? ""),
    )
    .slice(0, 3);
  const liveOrUpcoming = allPredictions.filter((p) => p.status !== "resolved").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Hero
        stockCount={briefs.length}
        industryCount={industries.length}
        firstStock={overlayStocks[0] ?? briefs[0]}
      />
      <UndervaluedSection stocks={undervalued} />
      <ExpansionSection stocks={expansion} />
      <CoverageMap coverage={coverage} totalStocks={totalStocks} />
      <AiTrackRecordSection
        totalPredictions={allPredictions.length}
        liveOrUpcoming={liveOrUpcoming}
        resolvedCount={resolved.length}
        hitCount={hits.length}
        accuracy={accuracy}
        recentResolved={recentResolved}
      />
      <CrossIndustryPairsSection />
      <FactorAnomaliesSection />
      <WhatYouCanDo />
      <LatestPostsSection posts={latestPosts} />
    </div>
  );
}
