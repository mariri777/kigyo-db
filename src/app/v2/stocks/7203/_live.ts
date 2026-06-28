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
  companyIndustries,
  dividends,
  events,
  financialsAnnual,
  industries,
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

  // 業界(company_industries の最初のひとつを採用)
  const industryRow = (
    await db
      .select({
        slug: industries.slug,
        name: industries.name,
        heroImageId: industries.heroImageId,
      })
      .from(companyIndustries)
      .innerJoin(industries, eq(industries.slug, companyIndustries.industrySlug))
      .where(eq(companyIndustries.companyId, company.id))
      .limit(1)
      .all()
  )[0];

  // catalysts / risks を events から取得
  const eventRows = await db
    .select()
    .from(events)
    .where(
      sql`${events.scope} = 'company' AND ${events.scopeRef} = ${String(company.id)} AND ${events.kind} IN ('catalyst','risk')`,
    )
    .all();

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
      ? formatEmployees(company.employeesConsolidated)
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

  // history10y は financials_annual から組み立て。
  // トヨタは _data.ts に手作りの 10 期がある(fy ラベルは Toyota 固定)ので fallback ベースで上書き。
  // それ以外は D1 の annual を素直に並べる(無ければ空配列)。
  const history10y = isToyota
    ? (() => {
        const fyMap = new Map(annual.map((a) => [a.fy, a]));
        return fallbackHistory10y.map((h) => {
          const live = fyMap.get(h.period);
          if (!live || live.revenueOku == null) return h;
          return {
            period: h.period,
            revenueOku: live.revenueOku,
            operatingProfitOku: live.operatingProfitOku ?? h.operatingProfitOku,
            operatingMargin: live.operatingMargin ?? h.operatingMargin,
          };
        });
      })()
    : annual.map((a) => ({
        period: a.fy,
        revenueOku: a.revenueOku ?? 0,
        operatingProfitOku: a.operatingProfitOku ?? 0,
        operatingMargin: a.operatingMargin ?? 0,
      }));

  // latestEarnings は最新 fy から(無ければ Toyota だけ fallback、他は最小情報)
  const latestFy = annual[annual.length - 1];
  const latestEarnings = latestFy && latestFy.revenueOku != null
    ? {
        period: `${latestFy.fy} 通期`,
        revenueOku: latestFy.revenueOku,
        operatingProfitOku: latestFy.operatingProfitOku ?? 0,
        netProfitOku: latestFy.netProfitOku ?? 0,
        operatingMargin: latestFy.operatingMargin ?? 0,
        roe: snap?.roe ?? (isToyota ? fallbackLatestEarnings.roe : 0),
        eps: latestFy.eps ?? 0,
        dividend: snap?.dividendAnnual ?? (isToyota ? fallbackLatestEarnings.dividend : 0),
        highlights: isToyota ? fallbackLatestEarnings.highlights : [],
      }
    : isToyota
      ? fallbackLatestEarnings
      : {
          period: "—",
          revenueOku: 0,
          operatingProfitOku: 0,
          netProfitOku: 0,
          operatingMargin: 0,
          roe: 0,
          eps: 0,
          dividend: 0,
          highlights: [],
        };

  // stockTrend は snapshot + ai_brief から
  const priceSeries = snap?.priceHistoryJson
    ? (JSON.parse(snap.priceHistoryJson) as number[])
    : isToyota
      ? fallbackStockTrend.priceSeries
      : [];
  const stockTrend = {
    currentPrice: snap?.priceJpy ?? (isToyota ? fallbackStockTrend.currentPrice : 0),
    change1d: fmtPct(snap?.change1dPct, isToyota ? fallbackStockTrend.change1d : "—"),
    change1m: fmtPct(snap?.change1mPct, isToyota ? fallbackStockTrend.change1m : "—"),
    change1y: fmtPct(snap?.change1yPct, isToyota ? fallbackStockTrend.change1y : "—"),
    marketCapOku: snap?.marketCapOku ?? (isToyota ? fallbackStockTrend.marketCapOku : 0),
    per: snap?.per ?? (isToyota ? fallbackStockTrend.per : 0),
    pbr: snap?.pbr ?? (isToyota ? fallbackStockTrend.pbr : 0),
    dividendYield: snap?.dividendYield ?? (isToyota ? fallbackStockTrend.dividendYield : 0),
    positive: (snap?.change1dPct ?? 0) >= 0,
    aiAnalysis: brief?.stockTrendAnalysis ?? (isToyota ? fallbackStockTrend.aiAnalysis : "AI 分析は順次生成中です。"),
    factors: brief?.stockTrendFactorsJson
      ? (JSON.parse(brief.stockTrendFactorsJson) as typeof fallbackStockTrend.factors)
      : isToyota
        ? fallbackStockTrend.factors
        : [],
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
      : isToyota
        ? fallbackPeers
        : [];

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
        rationale: brief?.valuationRationale ?? (isToyota ? fallbackValuation.rationale : ""),
        metrics: buildValuationMetrics(snap, sectorAvgRow, isToyota ? fallbackValuation.metrics : emptyValuationMetrics()),
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
            : isToyota
              ? fallbackValuation.peerComparison
              : [],
      }
    : isToyota
      ? fallbackValuation
      : {
          verdict: "ほぼ妥当" as typeof fallbackValuation.verdict,
          score: 50,
          rationale: "",
          metrics: emptyValuationMetrics(),
          peerComparison: [],
        };

  // 連続増配年数(配当履歴を新しい順に走査して、amount が増加し続けた連続数)
  const consecutiveYears = computeConsecutiveIncreaseYears(divs.map((d) => d.amount));

  // 自社株買い合計(events kind=buyback を集計、テキスト fallback)
  // events.body に金額が入っていれば抽出を試みるが、複雑なので雑に件数 + fallback の amount を保持
  // 詳細化はここではせず、events に件数があれば fallback.buybackOku を尊重
  const buybackOku = isToyota ? fallbackDividend.buybackOku : 0;

  // 直近の配当スケジュール(最新 fy の dividends から)
  const latestDiv = divs[divs.length - 1];
  const emptySchedule = { exDate: "—", recordDate: "—", payDate: "—", estimate: "—" };
  const schedule = latestDiv
    ? {
        exDate: latestDiv.exDate ?? (isToyota ? fallbackDividend.schedule.exDate : "—"),
        recordDate: latestDiv.recordDate ?? (isToyota ? fallbackDividend.schedule.recordDate : "—"),
        payDate: latestDiv.payDate ?? (isToyota ? fallbackDividend.schedule.payDate : "—"),
        estimate: snap?.dividendAnnual
          ? `年間予想 ¥${snap.dividendAnnual}`
          : isToyota
            ? fallbackDividend.schedule.estimate
            : "—",
      }
    : isToyota
      ? fallbackDividend.schedule
      : emptySchedule;

  const dividend = divs.length > 0
    ? {
        annualPerShare: snap?.dividendAnnual ?? (isToyota ? fallbackDividend.annualPerShare : 0),
        yield: snap?.dividendYield ?? (isToyota ? fallbackDividend.yield : 0),
        payoutRatio: snap?.dividendPayoutRatio ?? (isToyota ? fallbackDividend.payoutRatio : 0),
        totalReturnYield: snap?.totalReturnYield ?? (isToyota ? fallbackDividend.totalReturnYield : 0),
        buybackOku,
        consecutiveYears: consecutiveYears > 0
          ? consecutiveYears
          : isToyota
            ? fallbackDividend.consecutiveYears
            : 0,
        history: divs.map((d) => ({ fy: d.fy, amount: d.amount ?? 0 })),
        schedule,
      }
    : isToyota
      ? fallbackDividend
      : {
          annualPerShare: 0,
          yield: 0,
          payoutRatio: 0,
          totalReturnYield: 0,
          buybackOku: 0,
          consecutiveYears: 0,
          history: [],
          schedule: emptySchedule,
        };

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
        high: snap.targetHigh ?? snap.targetConsensus,
        low: snap.targetLow ?? snap.targetConsensus,
        currentPrice: snap.priceJpy ?? 0,
        upsidePct: snap.priceJpy && snap.targetConsensus
          ? ((snap.targetConsensus - snap.priceJpy) / snap.priceJpy) * 100
          : 0,
        ratingCount: {
          buy: snap.analystBuy ?? 0,
          hold: snap.analystHold ?? 0,
          sell: snap.analystSell ?? 0,
        },
        analystComment: brief?.analystSummary ?? (isToyota ? fallbackAnalystTargets.analystComment : ""),
      }
    : isToyota
      ? fallbackAnalystTargets
      : {
          consensus: snap?.priceJpy ?? 0,
          high: snap?.priceJpy ?? 0,
          low: snap?.priceJpy ?? 0,
          currentPrice: snap?.priceJpy ?? 0,
          upsidePct: 0,
          ratingCount: { buy: 0, hold: 0, sell: 0 },
          analystComment: brief?.analystSummary ?? "",
        };

  const technical = snap
    ? {
        ma25: snap.ma25 ?? (isToyota ? fallbackTechnical.ma25 : snap.priceJpy ?? 0),
        ma75: snap.ma75 ?? (isToyota ? fallbackTechnical.ma75 : snap.priceJpy ?? 0),
        ma200: snap.ma200 ?? (isToyota ? fallbackTechnical.ma200 : snap.priceJpy ?? 0),
        high52w: snap.high52w ?? (isToyota ? fallbackTechnical.high52w : snap.priceJpy ?? 0),
        low52w: snap.low52w ?? (isToyota ? fallbackTechnical.low52w : snap.priceJpy ?? 0),
        avgVolume: snap.avgVolume3m ?? (isToyota ? fallbackTechnical.avgVolume : "—"),
        creditBuy: snap.creditBuy ?? (isToyota ? fallbackTechnical.creditBuy : "—"),
        creditSell: snap.creditSell ?? (isToyota ? fallbackTechnical.creditSell : "—"),
        creditRatio: snap.creditRatio ?? (isToyota ? fallbackTechnical.creditRatio : 1),
        rsi14: snap.rsi14 ?? (isToyota ? fallbackTechnical.rsi14 : 50),
        comment: brief?.technicalComment ?? (isToyota ? fallbackTechnical.comment : "テクニカル分析は順次生成中。"),
      }
    : isToyota
      ? fallbackTechnical
      : {
          ma25: 0, ma75: 0, ma200: 0, high52w: 0, low52w: 0,
          avgVolume: "—", creditBuy: "—", creditSell: "—", creditRatio: 1, rsi14: 50,
          comment: "テクニカル分析は順次生成中。",
        };

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

  // catalysts: events から組み立て(無ければ Toyota だけ fallback、他は空)
  const catalystsLive = {
    upside: eventRows
      .filter((e) => e.kind === "catalyst")
      .map((e) => ({
        title: e.title,
        when: e.occursAt ?? "—",
        impact: (e.impact ?? "中") as "強" | "中" | "弱",
        note: e.body ?? "",
      })),
    downside: eventRows
      .filter((e) => e.kind === "risk")
      .map((e) => ({
        title: e.title,
        when: e.occursAt ?? "—",
        impact: (e.impact ?? "中") as "強" | "中" | "弱",
        note: e.body ?? "",
      })),
  };
  const catalysts = catalystsLive.upside.length > 0 || catalystsLive.downside.length > 0
    ? catalystsLive
    : isToyota
      ? fallbackCatalysts
      : { upside: [], downside: [] };

  return {
    basics,
    summary,
    latestEarnings,
    history10y,
    stockTrend,
    positioning,
    peers,
    industryLinkSlug: industryRow?.slug ?? (isToyota ? fallbackIndustrySlug : ""),
    industryName: industryRow?.name ?? (isToyota ? fallbackIndustryName : stockRow.sectorTse),
    industryHeroImage: industryRow?.heroImageId ?? null,
    storyDeck,
    valuation,
    dividend,
    shareholders: shareholdersResolved,
    analystTargets,
    technical,
    catalysts,
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
    industryHeroImage: null as string | null,
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

function formatEmployees(n: number): string {
  // 万人/千人/人 のスケールに自動で寄せる(従業員 0万人 という見た目を避ける)
  if (n >= 10000) {
    const man = n / 10000;
    const digits = man >= 10 ? 0 : 1;
    return `約 ${man.toFixed(digits)}万人 (連結)`;
  }
  if (n >= 1000) {
    return `約 ${(n / 1000).toFixed(1)}千人 (連結)`;
  }
  return `${n.toLocaleString()}人 (連結)`;
}

function emptyValuationMetrics(): typeof fallbackValuation.metrics {
  const blank = { value: "—", industryAvg: "—", self5yAvg: "—", comment: "—" } as const;
  return [
    { label: "PER (実績)", ...blank },
    { label: "PER (予想)", ...blank },
    { label: "PBR", ...blank },
    { label: "PSR", ...blank },
    { label: "EV/EBITDA", ...blank },
    { label: "PEG", ...blank },
    { label: "ROE", ...blank },
  ];
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
