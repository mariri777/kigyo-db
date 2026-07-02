#!/usr/bin/env tsx
/**
 * 7203 (トヨタ) の v2 デモページが期待するデータを D1 に投入する。
 *
 * src/app/v2/stocks/7203/_data.ts のハードコード値を companies / stock_snapshot /
 * financials_annual / dividends / company_ai_brief / top_shareholders /
 * company_industries / story_decks / story_slides / industries に直接 UPSERT する。
 *
 * 1 回回せば D1 にデータが入り、ページが D1 駆動で動かせるようになる。
 *
 * 使い方:
 *   pnpm tsx scripts/poc/load-toyota-demo.ts
 */
import { eq, sql } from "drizzle-orm";

import {
  basics,
  summary,
  latestEarnings,
  history10y,
  stockTrend,
  positioning,
  storyDeck,
  valuation,
  dividend,
  shareholders,
  analystTargets,
  technical,
  catalysts,
  ownerActivism,
  industryLinkSlug,
  industryName,
} from "../../src/app/(main)/stocks/_lib/sampleStockData.js";
import {
  companies,
  companyAiBrief,
  companyIndustries,
  dividends,
  financialsAnnual,
  industries,
  stockSnapshot,
  stocks,
  storyDecks,
  storySlides,
  topShareholders,
} from "../../src/server/db/schema.js";
import { getLocalDb } from "../lib/local-db.js";

const CODE = "7203";

async function main() {
  const db = getLocalDb();
  const now = new Date().toISOString();

  // companies UPDATE(name はそのまま、その他をハードコードで埋める)
  const rows = await db
    .select({ id: companies.id })
    .from(companies)
    .innerJoin(stocks, eq(stocks.companyId, companies.id))
    .where(eq(stocks.code, CODE))
    .all();
  if (rows.length === 0) throw new Error("companies が無い。先に seed-local を回してください。");
  const companyId = rows[0].id;
  console.log(`📌 companyId=${companyId}`);

  await db
    .update(companies)
    .set({
      nameEn: basics.nameEn,
      founded: basics.founded,
      listed: basics.listed,
      headquarters: basics.headquarters,
      ceoName: basics.ceo,
      website: basics.website,
      employeesConsolidated: 380000,
      logoColor: basics.logoColor,
      description: summary,
      oneLiner: summary.split("。")[0] + "。",
      updatedAt: now,
    })
    .where(eq(companies.id, companyId))
    .run();
  console.log("✅ companies updated");

  // stock_snapshot UPSERT(Yahoo 取得済の上から _data.ts の数値で上書き)
  await db
    .insert(stockSnapshot)
    .values({
      code: CODE,
      priceJpy: stockTrend.currentPrice,
      priceDate: now.slice(0, 10),
      change1dPct: parseFloat(stockTrend.change1d.replace("%", "").replace("+", "")),
      change1mPct: parseFloat(stockTrend.change1m.replace("%", "").replace("+", "")),
      change1yPct: parseFloat(stockTrend.change1y.replace("%", "").replace("+", "")),
      marketCapOku: stockTrend.marketCapOku,
      marketCapTier: "メガ",
      per: stockTrend.per,
      perForecast: 11.8,
      pbr: stockTrend.pbr,
      psr: 0.84,
      evEbitda: 7.6,
      peg: 1.4,
      roe: 10.2,
      dividendYield: stockTrend.dividendYield,
      dividendAnnual: dividend.annualPerShare,
      dividendPayoutRatio: dividend.payoutRatio,
      totalReturnYield: dividend.totalReturnYield,
      ma25: technical.ma25,
      ma75: technical.ma75,
      ma200: technical.ma200,
      high52w: technical.high52w,
      low52w: technical.low52w,
      rsi14: technical.rsi14,
      avgVolume3m: technical.avgVolume,
      creditBuy: technical.creditBuy,
      creditSell: technical.creditSell,
      creditRatio: technical.creditRatio,
      priceHistoryJson: JSON.stringify(stockTrend.priceSeries),
      foreignOwnership: shareholders.foreignOwnership,
      individualOwnership: shareholders.individualOwnership,
      stableOwnership: shareholders.stableOwnership,
      latestRevenueOku: latestEarnings.revenueOku,
      latestOpProfitOku: latestEarnings.operatingProfitOku,
      latestOpMargin: latestEarnings.operatingMargin,
      targetConsensus: analystTargets.consensus,
      targetHigh: analystTargets.high,
      targetLow: analystTargets.low,
      analystBuy: analystTargets.ratingCount.buy,
      analystHold: analystTargets.ratingCount.hold,
      analystSell: analystTargets.ratingCount.sell,
      valuationVerdict: valuation.verdict,
      valuationScore: valuation.score,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: stockSnapshot.code,
      set: {
        priceJpy: sql`excluded.price_jpy`,
        priceDate: sql`excluded.price_date`,
        change1dPct: sql`excluded.change_1d_pct`,
        change1mPct: sql`excluded.change_1m_pct`,
        change1yPct: sql`excluded.change_1y_pct`,
        marketCapOku: sql`excluded.market_cap_oku`,
        marketCapTier: sql`excluded.market_cap_tier`,
        per: sql`excluded.per`,
        perForecast: sql`excluded.per_forecast`,
        pbr: sql`excluded.pbr`,
        psr: sql`excluded.psr`,
        evEbitda: sql`excluded.ev_ebitda`,
        peg: sql`excluded.peg`,
        roe: sql`excluded.roe`,
        dividendYield: sql`excluded.dividend_yield`,
        dividendAnnual: sql`excluded.dividend_annual`,
        dividendPayoutRatio: sql`excluded.dividend_payout_ratio`,
        totalReturnYield: sql`excluded.total_return_yield`,
        ma25: sql`excluded.ma_25`,
        ma75: sql`excluded.ma_75`,
        ma200: sql`excluded.ma_200`,
        high52w: sql`excluded.high_52w`,
        low52w: sql`excluded.low_52w`,
        rsi14: sql`excluded.rsi_14`,
        avgVolume3m: sql`excluded.avg_volume_3m`,
        creditBuy: sql`excluded.credit_buy`,
        creditSell: sql`excluded.credit_sell`,
        creditRatio: sql`excluded.credit_ratio`,
        priceHistoryJson: sql`excluded.price_history_json`,
        foreignOwnership: sql`excluded.foreign_ownership`,
        individualOwnership: sql`excluded.individual_ownership`,
        stableOwnership: sql`excluded.stable_ownership`,
        latestRevenueOku: sql`excluded.latest_revenue_oku`,
        latestOpProfitOku: sql`excluded.latest_op_profit_oku`,
        latestOpMargin: sql`excluded.latest_op_margin`,
        targetConsensus: sql`excluded.target_consensus`,
        targetHigh: sql`excluded.target_high`,
        targetLow: sql`excluded.target_low`,
        analystBuy: sql`excluded.analyst_buy`,
        analystHold: sql`excluded.analyst_hold`,
        analystSell: sql`excluded.analyst_sell`,
        valuationVerdict: sql`excluded.valuation_verdict`,
        valuationScore: sql`excluded.valuation_score`,
        updatedAt: now,
      },
    })
    .run();
  console.log("✅ stock_snapshot upserted");

  // financials_annual (history10y を流す)
  await db.delete(financialsAnnual).where(eq(financialsAnnual.companyId, companyId)).run();
  for (const h of history10y) {
    await db
      .insert(financialsAnnual)
      .values({
        companyId,
        fy: h.period,
        revenueOku: h.revenueOku,
        operatingProfitOku: h.operatingProfitOku,
        operatingMargin: h.operatingMargin,
        netProfitOku: null,
        eps: null,
      })
      .run();
  }
  // latest 期は eps/netProfit も入れる
  await db
    .update(financialsAnnual)
    .set({
      eps: latestEarnings.eps,
      netProfitOku: latestEarnings.netProfitOku,
    })
    .where(sql`${financialsAnnual.companyId} = ${companyId} AND ${financialsAnnual.fy} = ${latestEarnings.period.replace("年", "/").replace("月期 通期", "").replace("/3 通期", "/3")}`)
    .run();
  console.log(`✅ financials_annual ${history10y.length} 行 UPSERT`);

  // dividends 履歴
  await db.delete(dividends).where(eq(dividends.companyId, companyId)).run();
  for (const d of dividend.history) {
    await db
      .insert(dividends)
      .values({
        companyId,
        fy: d.fy,
        amount: d.amount,
        exDate: null,
        recordDate: null,
        payDate: null,
      })
      .run();
  }
  console.log(`✅ dividends ${dividend.history.length} 行 UPSERT`);

  // company_ai_brief(stock-trend は既に入ってる可能性あり、valuation/positioning/owner_activism を埋める)
  await db
    .insert(companyAiBrief)
    .values({
      companyId,
      summary,
      valuationRationale: valuation.rationale,
      stockTrendAnalysis: stockTrend.aiAnalysis,
      stockTrendFactorsJson: JSON.stringify(stockTrend.factors),
      analystSummary: analystTargets.analystComment,
      technicalComment: technical.comment,
      positioningHeadline: positioning.headline,
      positioningAnalysis: positioning.analysis,
      positioningStrengthsJson: JSON.stringify(positioning.strengths.map((s) => ({ title: s.slice(0, 12), detail: s }))),
      positioningChallengesJson: JSON.stringify(positioning.challenges.map((c) => ({ title: c.slice(0, 12), detail: c }))),
      ownerActivismJson: JSON.stringify(ownerActivism),
      generatedAt: now,
    })
    .onConflictDoUpdate({
      target: companyAiBrief.companyId,
      set: {
        summary,
        valuationRationale: valuation.rationale,
        stockTrendAnalysis: stockTrend.aiAnalysis,
        stockTrendFactorsJson: JSON.stringify(stockTrend.factors),
        analystSummary: analystTargets.analystComment,
        technicalComment: technical.comment,
        positioningHeadline: positioning.headline,
        positioningAnalysis: positioning.analysis,
        positioningStrengthsJson: JSON.stringify(
          positioning.strengths.map((s) => ({ title: s.slice(0, 12), detail: s })),
        ),
        positioningChallengesJson: JSON.stringify(
          positioning.challenges.map((c) => ({ title: c.slice(0, 12), detail: c })),
        ),
        ownerActivismJson: JSON.stringify(ownerActivism),
        generatedAt: now,
      },
    })
    .run();
  console.log("✅ company_ai_brief upserted");

  // top_shareholders
  await db.delete(topShareholders).where(eq(topShareholders.companyId, companyId)).run();
  for (const s of shareholders.top) {
    await db
      .insert(topShareholders)
      .values({
        companyId,
        rank: s.rank,
        name: s.name,
        sharePct: s.share,
        holderType: s.type,
        asOf: now.slice(0, 10),
      })
      .run();
  }
  console.log(`✅ top_shareholders ${shareholders.top.length} 行`);

  // industries + company_industries
  await db
    .insert(industries)
    .values({
      slug: industryLinkSlug,
      name: industryName,
      shortName: "自動車",
      description: "国内最大の輸送機器セクター。世界販売台数で圧倒的なシェアを持つ。",
      insightsJson: JSON.stringify([
        "EV シフトと HV 再評価の綱引き",
        "米国関税と為替の影響を強く受ける",
      ]),
    })
    .onConflictDoUpdate({
      target: industries.slug,
      set: { name: industryName, shortName: "自動車" },
    })
    .run();
  await db
    .insert(companyIndustries)
    .values({ companyId, industrySlug: industryLinkSlug })
    .onConflictDoNothing()
    .run();
  console.log("✅ industries + company_industries upserted");

  // story_decks + story_slides
  await db.delete(storyDecks).where(eq(storyDecks.companyId, companyId)).run();
  // 上記 cascade で storySlides も消える前提(FK on delete cascade)
  const inserted = await db
    .insert(storyDecks)
    .values({
      companyId,
      title: storyDeck.deckTitle,
      subtitle: storyDeck.subtitle,
      sourceNote: storyDeck.source,
      publishedAt: now.slice(0, 10),
    })
    .returning({ id: storyDecks.id })
    .all();
  const deckId = inserted[0].id;
  for (const s of storyDeck.slides) {
    await db
      .insert(storySlides)
      .values({
        deckId,
        n: s.n,
        era: s.era,
        year: s.year,
        title: s.title,
        lead: s.lead,
        body: s.body,
        image: s.image,
        highlight: s.highlight,
      })
      .run();
  }
  console.log(`✅ story_decks 1 + story_slides ${storyDeck.slides.length} 行`);

  // catalysts は events テーブル
  // (events のスキーマに合うように kind/scope/scopeRef を埋める)
  console.log("\n✅ 7203 デモデータ投入完了");
  void catalysts;
  void summary;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
