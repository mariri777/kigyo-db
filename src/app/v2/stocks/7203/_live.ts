/**
 * 7203 ページの D1 ライブデータローダ。
 *
 * page.tsx が _data.ts から import している export と同じ shape を返す。
 * D1 から取れたカラムは置き換え、無いカラムは _data.ts の値を流用する。
 *
 * 本来は [code] 動的ページに統合すべきだが、まずは 7203 のリッチ版を D1 で
 * 駆動できることを確認するための bridge。
 */
import "server-only";

import { eq, asc, desc, sql } from "drizzle-orm";

import {
  companies,
  companyAiBrief,
  dividends,
  financialsAnnual,
  stockSnapshot,
  stocks,
  storyDecks,
  storySlides,
  topShareholders,
} from "@/server/db/schema";
import { getDb } from "@/server/db/client";

import {
  basics as fallbackBasics,
  summary as fallbackSummary,
  latestEarnings as fallbackLatestEarnings,
  history10y as fallbackHistory10y,
  stockTrend as fallbackStockTrend,
  positioning as fallbackPositioning,
  peers as fallbackPeers,
  industryLinkSlug as fallbackIndustrySlug,
  industryName as fallbackIndustryName,
  storyDeck as fallbackStoryDeck,
  valuation as fallbackValuation,
  dividend as fallbackDividend,
  shareholders as fallbackShareholders,
  analystTargets as fallbackAnalystTargets,
  technical as fallbackTechnical,
  catalysts as fallbackCatalysts,
  ownerActivism as fallbackOwnerActivism,
  type StoryDeck,
} from "./_data";

export async function loadToyotaLiveData() {
  return loadStockPageData("7203");
}

export async function loadStockPageData(code: string) {
  const db = await getDb();

  // 銘柄 + 会社
  const stockRow = (await db.select().from(stocks).where(eq(stocks.code, code)).all())[0];
  if (!stockRow) return fallbackBundle();
  const company = (await db.select().from(companies).where(eq(companies.id, stockRow.companyId)).all())[0];
  const snap = (await db.select().from(stockSnapshot).where(eq(stockSnapshot.code, code)).all())[0];
  const brief = (
    await db.select().from(companyAiBrief).where(eq(companyAiBrief.companyId, company.id)).all()
  )[0];
  const annual = await db
    .select()
    .from(financialsAnnual)
    .where(eq(financialsAnnual.companyId, company.id))
    .orderBy(asc(financialsAnnual.fy))
    .all();
  const divs = await db
    .select()
    .from(dividends)
    .where(eq(dividends.companyId, company.id))
    .orderBy(asc(dividends.fy))
    .all();
  const shareholdersRows = await db
    .select()
    .from(topShareholders)
    .where(eq(topShareholders.companyId, company.id))
    .orderBy(asc(topShareholders.rank))
    .all();
  const deckRow = (
    await db.select().from(storyDecks).where(eq(storyDecks.companyId, company.id)).limit(1).all()
  )[0];
  const deckSlides = deckRow
    ? await db
        .select()
        .from(storySlides)
        .where(eq(storySlides.deckId, deckRow.id))
        .orderBy(asc(storySlides.n))
        .all()
    : [];

  // 同セクター 10 銘柄(自社除く、時価総額順)
  const peerRows = await db
    .select({
      code: stocks.code,
      name: companies.name,
      marketCapOku: stockSnapshot.marketCapOku,
      per: stockSnapshot.per,
      changePct: stockSnapshot.change1dPct,
    })
    .from(stocks)
    .innerJoin(companies, eq(companies.id, stocks.companyId))
    .leftJoin(stockSnapshot, eq(stockSnapshot.code, stocks.code))
    .where(sql`${stocks.sectorTse} = ${stockRow.sectorTse} AND ${stocks.code} != ${code}`)
    .orderBy(desc(stockSnapshot.marketCapOku))
    .limit(10)
    .all();

  // トヨタは既存ハードコード _data.ts が「過去手作りした実値」なので fallback として尊重。
  // それ以外の銘柄は「データなし時は "—" or NULL を返す」汎用 fallback。
  const isToyota = code === "7203";
  const placeholderColor = "#525252";

  const basics = {
    code: stockRow.code,
    name: company.name,
    nameEn: company.nameEn ?? (isToyota ? fallbackBasics.nameEn : ""),
    exchange: stockRow.exchange,
    sectorTSE: stockRow.sectorTse,
    founded: company.founded ?? (isToyota ? fallbackBasics.founded : "—"),
    listed: company.listed ?? (isToyota ? fallbackBasics.listed : "—"),
    headquarters:
      company.headquarters ?? (isToyota ? fallbackBasics.headquarters : "—"),
    employees: company.employeesConsolidated
      ? `約 ${(company.employeesConsolidated / 10000).toFixed(0)}万人 (連結)`
      : isToyota
        ? fallbackBasics.employees
        : "—",
    ceo: company.ceoName ?? (isToyota ? fallbackBasics.ceo : "—"),
    website: company.website ?? (isToyota ? fallbackBasics.website : "https://www.jpx.co.jp/"),
    logoColor: company.logoColor ?? (isToyota ? fallbackBasics.logoColor : placeholderColor),
  };

  const summary =
    brief?.summary ??
    company.description ??
    (isToyota ? fallbackSummary : `${company.name}(${stockRow.code})は${stockRow.sectorTse}セクターの上場企業。サマリは順次 AI が生成します。`);

  // history10y は financials_annual から組み立て、欠落は fallback で補完
  const fyMap = new Map(annual.map((a) => [a.fy, a]));
  const history10y = fallbackHistory10y.map((h) => {
    const live = fyMap.get(h.period);
    if (!live || live.revenueOku == null) return h;
    return {
      period: h.period,
      revenueOku: live.revenueOku,
      operatingProfitOku: live.operatingProfitOku ?? h.operatingProfitOku,
      operatingMargin: live.operatingMargin ?? h.operatingMargin,
    };
  });

  // latestEarnings は最新 fy から(無ければ fallback)
  const latestFy = annual[annual.length - 1];
  const latestEarnings = latestFy && latestFy.revenueOku != null
    ? {
        period: `${latestFy.fy} 通期`,
        revenueOku: latestFy.revenueOku,
        operatingProfitOku: latestFy.operatingProfitOku ?? fallbackLatestEarnings.operatingProfitOku,
        netProfitOku: latestFy.netProfitOku ?? fallbackLatestEarnings.netProfitOku,
        operatingMargin: latestFy.operatingMargin ?? fallbackLatestEarnings.operatingMargin,
        roe: snap?.roe ?? fallbackLatestEarnings.roe,
        eps: latestFy.eps ?? fallbackLatestEarnings.eps,
        dividend: fallbackLatestEarnings.dividend,
        highlights: fallbackLatestEarnings.highlights,
      }
    : fallbackLatestEarnings;

  // stockTrend は snapshot + ai_brief から
  const priceSeries = snap?.priceHistoryJson
    ? (JSON.parse(snap.priceHistoryJson) as number[])
    : fallbackStockTrend.priceSeries;
  const stockTrend = {
    currentPrice: snap?.priceJpy ?? fallbackStockTrend.currentPrice,
    change1d: fmtPct(snap?.change1dPct, fallbackStockTrend.change1d),
    change1m: fmtPct(snap?.change1mPct, fallbackStockTrend.change1m),
    change1y: fmtPct(snap?.change1yPct, fallbackStockTrend.change1y),
    marketCapOku: snap?.marketCapOku ?? fallbackStockTrend.marketCapOku,
    per: snap?.per ?? fallbackStockTrend.per,
    pbr: snap?.pbr ?? fallbackStockTrend.pbr,
    dividendYield: snap?.dividendYield ?? fallbackStockTrend.dividendYield,
    positive: (snap?.change1dPct ?? 0) >= 0,
    aiAnalysis: brief?.stockTrendAnalysis ?? fallbackStockTrend.aiAnalysis,
    factors: brief?.stockTrendFactorsJson
      ? (JSON.parse(brief.stockTrendFactorsJson) as typeof fallbackStockTrend.factors)
      : fallbackStockTrend.factors,
    priceSeries,
  };

  const positioning = brief?.positioningAnalysis
    ? {
        headline: brief.positioningHeadline ?? fallbackPositioning.headline,
        analysis: brief.positioningAnalysis,
        strengths: parseJsonArr(brief.positioningStrengthsJson).map(extractDetail),
        challenges: parseJsonArr(brief.positioningChallengesJson).map(extractDetail),
      }
    : isToyota
      ? fallbackPositioning
      : {
          headline: `${company.name} はまだ AI 分析が生成されていません。`,
          analysis: `${stockRow.sectorTse} セクター内のポジショニング解析は次回月次バッチで生成予定です。`,
          strengths: [],
          challenges: [],
        };

  const peers =
    peerRows.length > 0
      ? peerRows.map((p) => ({
          code: p.code,
          name: p.name,
          marketCapOku: p.marketCapOku ?? 0,
          per: p.per ?? -1,
          changePct: p.changePct ?? 0,
        }))
      : fallbackPeers;

  // セクター平均(同 sectorTse 銘柄から AVG を都度計算)
  const sectorAvgRow = (
    await db
      .select({
        per: sql<number | null>`AVG(${stockSnapshot.per})`,
        pbr: sql<number | null>`AVG(${stockSnapshot.pbr})`,
        psr: sql<number | null>`AVG(${stockSnapshot.psr})`,
        evEbitda: sql<number | null>`AVG(${stockSnapshot.evEbitda})`,
        peg: sql<number | null>`AVG(${stockSnapshot.peg})`,
        roe: sql<number | null>`AVG(${stockSnapshot.roe})`,
      })
      .from(stockSnapshot)
      .innerJoin(stocks, eq(stocks.code, stockSnapshot.code))
      .where(eq(stocks.sectorTse, stockRow.sectorTse))
      .all()
  )[0];

  // 同セクター peer comparison(scatter chart 用、PER/PBR/marketCap)
  const peerScatter = await db
    .select({
      code: stocks.code,
      name: companies.name,
      per: stockSnapshot.per,
      pbr: stockSnapshot.pbr,
      marketCapOku: stockSnapshot.marketCapOku,
    })
    .from(stocks)
    .innerJoin(companies, eq(companies.id, stocks.companyId))
    .leftJoin(stockSnapshot, eq(stockSnapshot.code, stocks.code))
    .where(eq(stocks.sectorTse, stockRow.sectorTse))
    .orderBy(desc(stockSnapshot.marketCapOku))
    .limit(12)
    .all();

  const valuation = snap?.valuationVerdict
    ? {
        verdict: snap.valuationVerdict as typeof fallbackValuation.verdict,
        score: snap.valuationScore ?? fallbackValuation.score,
        rationale: brief?.valuationRationale ?? fallbackValuation.rationale,
        metrics: buildValuationMetrics(snap, sectorAvgRow, fallbackValuation.metrics),
        peerComparison:
          peerScatter.length > 0
            ? peerScatter
                .filter((p) => p.pbr != null && p.marketCapOku != null)
                .map((p) => ({
                  code: p.code,
                  name: p.name.length > 8 ? p.name.slice(0, 7) + "…" : p.name,
                  per: p.per,
                  pbr: p.pbr ?? 0,
                  marketCapOku: p.marketCapOku ?? 0,
                  isSelf: p.code === code,
                }))
            : fallbackValuation.peerComparison,
      }
    : fallbackValuation;

  // 連続増配年数(配当履歴を新しい順に走査して、amount が増加し続けた連続数)
  const consecutiveYears = computeConsecutiveIncreaseYears(divs.map((d) => d.amount));

  // 自社株買い合計(events kind=buyback を集計、テキスト fallback)
  // events.body に金額が入っていれば抽出を試みるが、複雑なので雑に件数 + fallback の amount を保持
  // 詳細化はここではせず、events に件数があれば fallback.buybackOku を尊重
  const buybackOku = fallbackDividend.buybackOku;

  // 直近の配当スケジュール(最新 fy の dividends から)
  const latestDiv = divs[divs.length - 1];
  const schedule = latestDiv
    ? {
        exDate: latestDiv.exDate ?? fallbackDividend.schedule.exDate,
        recordDate: latestDiv.recordDate ?? fallbackDividend.schedule.recordDate,
        payDate: latestDiv.payDate ?? fallbackDividend.schedule.payDate,
        estimate: snap?.dividendAnnual
          ? `年間予想 ¥${snap.dividendAnnual}`
          : fallbackDividend.schedule.estimate,
      }
    : fallbackDividend.schedule;

  const dividend = divs.length > 0
    ? {
        annualPerShare: snap?.dividendAnnual ?? fallbackDividend.annualPerShare,
        yield: snap?.dividendYield ?? fallbackDividend.yield,
        payoutRatio: snap?.dividendPayoutRatio ?? fallbackDividend.payoutRatio,
        totalReturnYield: snap?.totalReturnYield ?? fallbackDividend.totalReturnYield,
        buybackOku,
        consecutiveYears: consecutiveYears > 0 ? consecutiveYears : fallbackDividend.consecutiveYears,
        history: divs.map((d) => ({ fy: d.fy, amount: d.amount ?? 0 })),
        schedule,
      }
    : fallbackDividend;

  const shareholdersResolved = shareholdersRows.length > 0
    ? {
        foreignOwnership: snap?.foreignOwnership ?? fallbackShareholders.foreignOwnership,
        individualOwnership: snap?.individualOwnership ?? fallbackShareholders.individualOwnership,
        stableOwnership: snap?.stableOwnership ?? fallbackShareholders.stableOwnership,
        top: shareholdersRows.map((s) => ({
          rank: s.rank,
          name: s.name,
          share: s.sharePct ?? 0,
          type: s.holderType ?? "—",
        })),
      }
    : isToyota
      ? fallbackShareholders
      : {
          foreignOwnership: snap?.foreignOwnership ?? 0,
          individualOwnership: snap?.individualOwnership ?? 0,
          stableOwnership: snap?.stableOwnership ?? 0,
          top: [],
        };

  const analystTargets = snap?.targetConsensus
    ? {
        consensus: snap.targetConsensus,
        high: snap.targetHigh ?? fallbackAnalystTargets.high,
        low: snap.targetLow ?? fallbackAnalystTargets.low,
        currentPrice: snap.priceJpy ?? fallbackAnalystTargets.currentPrice,
        upsidePct: snap.priceJpy && snap.targetConsensus
          ? ((snap.targetConsensus - snap.priceJpy) / snap.priceJpy) * 100
          : fallbackAnalystTargets.upsidePct,
        ratingCount: {
          buy: snap.analystBuy ?? fallbackAnalystTargets.ratingCount.buy,
          hold: snap.analystHold ?? fallbackAnalystTargets.ratingCount.hold,
          sell: snap.analystSell ?? fallbackAnalystTargets.ratingCount.sell,
        },
        analystComment: brief?.analystSummary ?? fallbackAnalystTargets.analystComment,
      }
    : fallbackAnalystTargets;

  const technical = snap
    ? {
        ma25: snap.ma25 ?? fallbackTechnical.ma25,
        ma75: snap.ma75 ?? fallbackTechnical.ma75,
        ma200: snap.ma200 ?? fallbackTechnical.ma200,
        high52w: snap.high52w ?? fallbackTechnical.high52w,
        low52w: snap.low52w ?? fallbackTechnical.low52w,
        avgVolume: snap.avgVolume3m ?? fallbackTechnical.avgVolume,
        creditBuy: snap.creditBuy ?? fallbackTechnical.creditBuy,
        creditSell: snap.creditSell ?? fallbackTechnical.creditSell,
        creditRatio: snap.creditRatio ?? fallbackTechnical.creditRatio,
        rsi14: snap.rsi14 ?? fallbackTechnical.rsi14,
        comment: brief?.technicalComment ?? fallbackTechnical.comment,
      }
    : fallbackTechnical;

  const ownerActivism = brief?.ownerActivismJson
    ? (JSON.parse(brief.ownerActivismJson) as typeof fallbackOwnerActivism)
    : isToyota
      ? fallbackOwnerActivism
      : [];

  const storyDeck: StoryDeck = deckRow && deckSlides.length > 0
    ? {
        deckTitle: deckRow.title,
        subtitle: deckRow.subtitle ?? "",
        source: deckRow.sourceNote ?? "",
        slides: deckSlides.map((s) => ({
          n: s.n,
          era: s.era ?? "",
          year: s.year ?? "",
          title: s.title,
          lead: s.lead ?? "",
          body: s.body ?? "",
          image: s.image ?? "",
          imageAlt: s.title,
          highlight: s.highlight,
        })),
      }
    : isToyota
      ? fallbackStoryDeck
      : { deckTitle: "", subtitle: "", source: "", slides: [] };

  return {
    basics,
    summary,
    latestEarnings,
    history10y,
    stockTrend,
    positioning,
    peers,
    industryLinkSlug: fallbackIndustrySlug,
    industryName: fallbackIndustryName,
    storyDeck,
    valuation,
    dividend,
    shareholders: shareholdersResolved,
    analystTargets,
    technical,
    catalysts: isToyota ? fallbackCatalysts : { upside: [], downside: [] },
    ownerActivism,
  };
}

function fallbackBundle() {
  return {
    basics: fallbackBasics,
    summary: fallbackSummary,
    latestEarnings: fallbackLatestEarnings,
    history10y: fallbackHistory10y,
    stockTrend: fallbackStockTrend,
    positioning: fallbackPositioning,
    peers: fallbackPeers,
    industryLinkSlug: fallbackIndustrySlug,
    industryName: fallbackIndustryName,
    storyDeck: fallbackStoryDeck,
    valuation: fallbackValuation,
    dividend: fallbackDividend,
    shareholders: fallbackShareholders,
    analystTargets: fallbackAnalystTargets,
    technical: fallbackTechnical,
    catalysts: fallbackCatalysts,
    ownerActivism: fallbackOwnerActivism,
  };
}

function computeConsecutiveIncreaseYears(amounts: Array<number | null>): number {
  // 末尾(最新)から遡って前年より increasing が続く期数。同額は break、減配で break。
  let count = 0;
  for (let i = amounts.length - 1; i > 0; i--) {
    const cur = amounts[i];
    const prev = amounts[i - 1];
    if (cur != null && prev != null && cur > prev) {
      count += 1;
    } else if (cur != null && prev != null && cur === prev) {
      break;
    } else {
      break;
    }
  }
  return count;
}

function buildValuationMetrics(
  snap: { per: number | null; perForecast: number | null; pbr: number | null; psr: number | null; evEbitda: number | null; peg: number | null; roe: number | null } | undefined,
  sectorAvg: { per: number | null; pbr: number | null; psr: number | null; evEbitda: number | null; peg: number | null; roe: number | null } | undefined,
  fallback: typeof fallbackValuation.metrics,
): typeof fallbackValuation.metrics {
  if (!snap) return fallback;
  // 値があるカラムだけライブ、なければ fallback の対応行
  const out = fallback.map((row) => ({ ...row }));
  const update = (label: string, value: string, industryAvg: string) => {
    const t = out.find((r) => r.label === label);
    if (t) {
      t.value = value;
      t.industryAvg = industryAvg;
    }
  };
  if (snap.per != null) update("PER (実績)", `${snap.per.toFixed(1)}倍`, sectorAvg?.per != null ? `${sectorAvg.per.toFixed(1)}倍` : "—");
  if (snap.perForecast != null) update("PER (予想)", `${snap.perForecast.toFixed(1)}倍`, "—");
  if (snap.pbr != null) update("PBR", `${snap.pbr.toFixed(2)}倍`, sectorAvg?.pbr != null ? `${sectorAvg.pbr.toFixed(2)}倍` : "—");
  if (snap.psr != null) update("PSR", `${snap.psr.toFixed(2)}倍`, sectorAvg?.psr != null ? `${sectorAvg.psr.toFixed(2)}倍` : "—");
  if (snap.evEbitda != null) update("EV/EBITDA", `${snap.evEbitda.toFixed(1)}倍`, sectorAvg?.evEbitda != null ? `${sectorAvg.evEbitda.toFixed(1)}倍` : "—");
  if (snap.peg != null) update("PEG", `${snap.peg.toFixed(1)}倍`, sectorAvg?.peg != null ? `${sectorAvg.peg.toFixed(1)}倍` : "—");
  if (snap.roe != null) update("ROE", `${snap.roe.toFixed(1)}%`, sectorAvg?.roe != null ? `${sectorAvg.roe.toFixed(1)}%` : "—");
  return out;
}

function fmtPct(n: number | null | undefined, fallback: string): string {
  if (n == null) return fallback;
  const s = n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
  return s;
}

function parseJsonArr(s: string | null | undefined): Array<{ title?: string; detail?: string }> {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    if (Array.isArray(arr)) return arr;
  } catch {
    /* noop */
  }
  return [];
}

function extractDetail(it: { title?: string; detail?: string } | string): string {
  if (typeof it === "string") return it;
  return it.detail ?? it.title ?? "";
}
