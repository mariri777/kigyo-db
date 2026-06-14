import { listStocks } from "@/lib/data";
import { listPosts } from "@/lib/posts";
import { industries, industryAggregates } from "@/lib/industries";
import { listPredictions } from "@/lib/predictions";
import { Hero } from "@/components/home/Hero";
import { UndervaluedSection } from "@/components/home/UndervaluedSection";
import { ExpansionSection } from "@/components/home/ExpansionSection";
import { CoverageMap } from "@/components/home/CoverageMap";
import { AiTrackRecordSection } from "@/components/home/AiTrackRecordSection";
import { CrossIndustryPairsSection } from "@/components/home/CrossIndustryPairsSection";
import { FactorAnomaliesSection } from "@/components/home/FactorAnomaliesSection";
import { WhatYouCanDo } from "@/components/home/WhatYouCanDo";
import { LatestPostsSection } from "@/components/home/LatestPostsSection";

export default function Home() {
  const stocks = listStocks();
  const latestPosts = listPosts().slice(0, 3);

  const undervaluedHighlights = [...stocks]
    .filter((s) => s.valuationCall.verdict === "割安")
    .sort((a, b) => b.valuationCall.score - a.valuationCall.score)
    .slice(0, 4);
  const expansionHighlights = [...stocks]
    .sort((a, b) => b.phaseScores.expansion - a.phaseScores.expansion)
    .slice(0, 4);

  const coverage = industries.map((ind) => ({
    industry: ind,
    agg: industryAggregates(ind),
  }));
  const totalStocks = coverage.reduce((acc, c) => acc + c.agg.count, 0);

  const allPredictions = listPredictions();
  const resolved = allPredictions.filter((p) => p.status === "resolved");
  const hits = resolved.filter((p) => p.resolution?.outcomeKey === p.aiReasoning.pick);
  const accuracy = resolved.length > 0 ? (hits.length / resolved.length) * 100 : 0;
  const recentResolved = [...resolved]
    .sort((a, b) => (b.resolution?.resolvedAt ?? "").localeCompare(a.resolution?.resolvedAt ?? ""))
    .slice(0, 3);
  const liveOrUpcoming = allPredictions.filter((p) => p.status !== "resolved").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Hero
        stockCount={stocks.length}
        industryCount={industries.length}
        firstStock={stocks[0]}
      />
      <UndervaluedSection stocks={undervaluedHighlights} />
      <ExpansionSection stocks={expansionHighlights} />
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
