import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStockDetail, listOverlayStocks } from "@/server/usecase";
import {
  similarStocksByBusiness,
  phaseSimilarDifferentIndustry,
  riskComplementStocks,
} from "@/domain/similarity";
import type { BusinessTag, TagDimension } from "@/domain/types";
import { Section } from "@/components/Section";
import { SimilarCard } from "@/components/SimilarCard";
import { FactorTable } from "@/components/FactorTable";
import { PhaseChart } from "@/components/PhaseChart";
import { SourceList, SourceChip } from "@/components/SourceChip";
import { AiBadge, AiDisclaimer } from "@/components/AiNotice";
import { ScoreBar } from "@/components/ScoreBar";
import { Term } from "@/components/Term";
import { postsForStock } from "@/content/posts";
import { PostCard } from "@/components/PostCard";
import { industries } from "@/content/industries";
import { Disclose } from "@/components/Disclose";
import { HistoryChart } from "@/components/HistoryChart";
import { getPredictionsByStock } from "@/content/predictions";
import { PredictionCard } from "@/components/PredictionCard";
import { verdictBlockClass } from "@/domain/verdict";
import { formatOkuOpt, formatPct1Opt, formatPriceOpt, formatSignedPct2Opt, formatPerOpt, formatPbrOpt } from "@/shared/format";
import { Metric } from "@/components/stock/Metric";
import { splitInsight } from "@/domain/insight";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const stock = await getStockDetail(code);
  if (!stock) return { title: "見つかりません", robots: { index: false, follow: false } };
  const title = `${stock.name}(${stock.code})の事業構造・類似銘柄・AI 評価`;
  const oneLiner = stock.oneLiner?.trim() || stock.description.slice(0, 70);
  const description = `${stock.name}(${stock.code}・東証${stock.exchange}・${stock.industryCluster})の事業構造タグ、競合・類似銘柄、AI が拾い上げた見落とし論点、PER/PBR/配当利回りを 1 ページで把握。${oneLiner}`;
  const url = `/stocks/${stock.code}`;
  return {
    title,
    description,
    keywords: [stock.name, stock.code, stock.industryCluster, stock.sectorTSE, "類似銘柄", "競合", "PER", "PBR", "配当利回り"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "超!企業DB",
    },
    twitter: { card: "summary_large_image", title, description },
    other: {
      "stock:ticker": stock.code,
      "stock:exchange": `東証 ${stock.exchange}`,
    },
  };
}

const DIM_LABEL: Record<TagDimension, string> = {
  product: "製品・サービス",
  customer: "顧客セグメント",
  channel: "販売チャネル",
  revenue_model: "収益モデル",
  value_chain: "バリューチェーン",
  geography: "地理的売上構成",
};
const DIM_ORDER: TagDimension[] = ["product", "customer", "revenue_model", "value_chain", "channel", "geography"];

function groupTags(tags: BusinessTag[]) {
  const groups: Partial<Record<TagDimension, BusinessTag[]>> = {};
  for (const t of tags) {
    (groups[t.dimension] ??= []).push(t);
  }
  return groups;
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const stock = await getStockDetail(code);
  if (!stock) notFound();

  const pool = await listOverlayStocks();
  const similar = similarStocksByBusiness(stock, pool, 5);
  const phaseAdj = phaseSimilarDifferentIndustry(stock, pool, 4);
  const riskComp = riskComplementStocks(stock, pool, 4);
  const tagGroups = groupTags(stock.tags);
  const relatedPosts = postsForStock(stock.code).slice(0, 3);
  const containingIndustry = industries.find((ind) =>
    ind.subClusters.some((sc) => sc.companyCodes.includes(stock.code))
  );
  const predictions = getPredictionsByStock(stock.code);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://kigyo.cho-super.com/" },
        { "@type": "ListItem", position: 2, name: "銘柄一覧", item: "https://kigyo.cho-super.com/stocks" },
        {
          "@type": "ListItem",
          position: 3,
          name: `${stock.name}(${stock.code})`,
          item: `https://kigyo.cho-super.com/stocks/${stock.code}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: stock.name,
      alternateName: stock.nameEn,
      identifier: stock.code,
      description: stock.description,
      industry: stock.industryCluster,
      url: `https://kigyo.cho-super.com/stocks/${stock.code}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FinancialProduct",
      name: `${stock.name}(${stock.code})`,
      category: "Equity / Common Stock",
      provider: { "@type": "Organization", name: "東京証券取引所" },
      identifier: stock.code,
      description: `${stock.name}の上場株式(東証 ${stock.exchange} / ${stock.industryCluster})`,
    },
  ];

  return (
    <article className="max-w-6xl mx-auto px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== ヘッダー：基本情報層 ===== */}
      <header className="border-b border-border pb-6 mb-8">
        <div className="flex flex-wrap items-baseline gap-3 mb-2">
          <span className="text-dim tabular text-sm">{stock.code}</span>
          <h1 className="text-3xl font-bold leading-tight">{stock.name}</h1>
          {stock.nameEn && <span className="text-muted text-sm">{stock.nameEn}</span>}
          <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
            東証 {stock.exchange}
          </span>
          <span className="text-[10px] text-accent border border-accent/40 bg-accent/10 rounded px-1.5 py-0.5">
            Tier {stock.tier}
          </span>
          {containingIndustry ? (
            <Link
              href={`/industries/${containingIndustry.slug}`}
              className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5 hover:border-border-strong hover:text-foreground transition"
            >
              {stock.industryCluster} ↗
            </Link>
          ) : (
            <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
              {stock.industryCluster}
            </span>
          )}
          <Link
            href={`/compare?codes=${stock.code}`}
            className="ml-auto text-[10px] text-foreground border border-foreground rounded px-2 py-0.5 hover:bg-foreground hover:text-background transition"
          >
            ＋ 比較する
          </Link>
        </div>
        <details className="mb-3 group">
          <summary className="text-[10px] text-dim cursor-pointer hover:text-muted inline-flex items-center gap-1 select-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
            ラベルの意味
          </summary>
          <div className="text-[10px] text-muted leading-relaxed mt-2 pl-3 border-l border-border max-w-3xl space-y-1">
            <div>
              <strong className="text-foreground font-bold tabular">{stock.code}</strong>
              <span className="ml-2">銘柄コード — 東証で各上場企業に割り振られた4桁の識別番号</span>
            </div>
            <div>
              <strong className="text-foreground font-bold">東証 {stock.exchange}</strong>
              <span className="ml-2">
                {stock.exchange === "Prime" && "最上位市場（約1,600社、大型株中心）"}
                {stock.exchange === "Standard" && "中位市場（約1,600社、中堅企業向け）"}
                {stock.exchange === "Growth" && "新興企業向け市場（約600社、高成長企業中心）"}
              </span>
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
          </div>
        </details>
        {/* 一行サマリー＋折りたたみ詳細（progressive disclosure） */}
        <div className="bg-surface-elev border-l-2 border-foreground rounded-r-md p-4 my-5 max-w-3xl">
          <div className="text-[10px] text-muted tracking-widest mb-1">ひとことで言うと</div>
          <p className="text-base leading-relaxed font-medium">{stock.oneLiner}</p>
        </div>

        <details className="max-w-3xl">
          <summary className="text-xs text-muted cursor-pointer hover:text-foreground inline-block">
            もう少し詳しく
          </summary>
          <p className="text-sm text-muted leading-relaxed mt-2">{stock.description}</p>
        </details>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
          <Metric label="株価" value={formatPriceOpt(stock.priceJpy)} sub={stock.priceDate ?? ""} accent />
          <Metric
            label="前日比"
            value={formatSignedPct2Opt(stock.changePct)}
            sub=""
            tone={
              stock.changePct === null
                ? undefined
                : stock.changePct >= 0
                  ? "positive"
                  : "negative"
            }
          />
          <Metric labelNode={<Term>時価総額</Term>} value={formatOkuOpt(stock.marketCapOku)} sub="" />
          <Metric labelNode={<Term>PER</Term>} value={formatPerOpt(stock.per)} sub="実績" />
          <Metric labelNode={<Term>PBR</Term>} value={formatPbrOpt(stock.pbr)} sub="" />
          <Metric labelNode={<Term>配当利回り</Term>} value={formatPct1Opt(stock.dividendYield)} sub="予想" />
          <Metric labelNode={<Term>ROE</Term>} value={formatPct1Opt(stock.roe)} sub="" />
        </div>
        <div className="mt-3 text-[10px] text-dim leading-relaxed">
          指標:{stock.segmentsPeriod ?? "—"} 期実績ベース。出典は EDINET XBRL / J-Quants。
          <span className="ml-2 text-[10px] border border-border rounded px-1.5 py-0.5">
            ※ 株価は実勢({stock.priceDate ?? "—"} 終値・週次更新)/財務指標・分析はサンプルデータ
          </span>
        </div>
        <details className="mt-2 group">
          <summary className="text-[10px] text-dim cursor-pointer hover:text-muted inline-flex items-center gap-1 select-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
            指標の見方
          </summary>
          <div className="text-[10px] text-muted leading-relaxed mt-2 pl-3 border-l border-border max-w-3xl grid sm:grid-cols-2 gap-x-4 gap-y-1">
            <div><strong className="text-foreground font-bold">時価総額</strong> 発行株数 × 株価。会社全体の市場価値。</div>
            <div><strong className="text-foreground font-bold">PER</strong> 株価 ÷ 1株利益。市場平均15倍、低いほど割安。</div>
            <div><strong className="text-foreground font-bold">PBR</strong> 株価 ÷ 1株純資産。1倍未満で「解散価値以下」。</div>
            <div><strong className="text-foreground font-bold">配当利回り</strong> 年配当 ÷ 株価。3%超で高配当扱い。</div>
            <div><strong className="text-foreground font-bold">ROE</strong> 純利益 ÷ 自己資本。10%超で優秀、20%超で卓越。</div>
            <div><strong className="text-foreground font-bold">前日比</strong> 前営業日終値からの変化率（％）。</div>
          </div>
        </details>
      </header>

      {/* ===== 予測カード（ライブ・学習統合） ===== */}
      {predictions.length > 0 && (
        <Section
          id="predictions"
          title="近づくイベントを予測する"
          subtitle="決算・適時開示・マクロイベント — 結果が出るまで短期、答え合わせで学ぶ"
          guide={
            <>
              「<strong>確率で考える練習</strong>」のカードです。賭けません、賞金もありません。
              AI の推論を検証したい方も、これから学びたい方も、それぞれの読み方で楽しめます。「<strong>見るべきポイント</strong>」「<strong>考え方のフレーム</strong>」を開けば、その場で学びながら予測できます。
              結果が出ると「<strong>教訓</strong>」が追加され、毎回ミニレッスンになります。
            </>
          }
        >
          <div className="space-y-5">
            {predictions.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        </Section>
      )}

      {/* ===== 規範的判断（AI 評価サマリー） ===== */}
      <Section
        title="超！企業DBの評価"
        subtitle="一次情報（有報・決算資料）を引用した AI 評価。投資助言ではなく一般情報提供。"
        guide={
          <>
            「<strong>割安</strong>」=同業他社や過去と比べて株価が安いというサイン。
            ただし安い ＝ 買い、ではありません。安いには安い理由があることも多いので、
            根拠の文章と「見落とし論点」もあわせて読んでください。
          </>
        }
        rightSlot={<AiBadge />}
        ai
      >
        {stock.valuationCall ? (
          <div className={`border rounded-md p-5 ${verdictBlockClass(stock.valuationCall.verdict)}`}>
            <div className="flex items-baseline gap-4 mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest opacity-80">評価</div>
                <div className="text-3xl font-bold">{stock.valuationCall.verdict}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-widest opacity-80 mb-1">割安度スコア</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold tabular">{stock.valuationCall.score}</div>
                  <div className="text-[11px] opacity-70 tabular">/ 100</div>
                  <div className="flex-1 max-w-xs">
                    <ScoreBar score={stock.valuationCall.score} />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{stock.valuationCall.rationale}</p>
            <div className="mt-3">
              <SourceList sources={stock.valuationCall.citations} />
            </div>
            <div className="mt-3 text-[11px] opacity-70">
              判断基準の詳細は <Link href="/legal/editorial-policy" className="underline">編集方針</Link> をご確認ください。
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border border-dashed rounded-md p-5 text-sm text-dim">
            この銘柄の AI 評価はまだ生成されていません。
          </div>
        )}
        <AiDisclaimer />
      </Section>

      {/* ===== A 軸：事業構造タグ ===== */}
      <Section
        id="business"
        title="事業構造"
        subtitle="公式書類（有報・決算説明会・統合報告書）から AI が抽出した事業タグ"
        guide={
          <>
            この会社が「<strong>誰に / 何を / どうやって売っているか</strong>」をタグで構造化したもの。
            タグが似ている会社は、ビジネスのパターンも似ている可能性が高いです。
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {DIM_ORDER.filter((d) => tagGroups[d]?.length).map((dim) => (
            <div key={dim} className="bg-surface border border-border rounded-md p-4">
              <div className="text-[11px] text-dim tracking-widest mb-2">{DIM_LABEL[dim]}</div>
              <div className="flex flex-wrap gap-1.5">
                {tagGroups[dim]!.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-[12px] border border-border-strong bg-surface-elev rounded px-2 py-0.5"
                  >
                    {t.value}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <SourceChip source={tagGroups[dim]![0].source} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold mt-8 mb-3">セグメント別売上({stock.segmentsPeriod ?? "—"})</h3>
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_70px_90px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2">
            <div>セグメント</div>
            <div className="text-right">売上（億円）</div>
            <div className="text-right">構成比</div>
            <div className="text-right">営業利益率</div>
          </div>
          {stock.segments.map((seg) => (
            <div
              key={seg.name}
              className="grid grid-cols-[1fr_100px_70px_90px] items-center px-4 py-2.5 border-b border-border last:border-b-0 text-sm"
            >
              <div>{seg.name}</div>
              <div className="text-right tabular font-mono">{seg.revenueOku.toLocaleString()}</div>
              <div className="text-right tabular font-mono">{seg.share.toFixed(1)}%</div>
              <div className="text-right tabular font-mono text-muted">
                {seg.operatingMargin !== undefined ? `${seg.operatingMargin.toFixed(1)}%` : "—"}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 業績推移 ===== */}
      <Section
        id="history"
        title="業績推移"
        subtitle="売上と営業利益率の 5 年トレンド"
        guide={
          <>
            売上の伸びと利益率の変化を 5 年間で確認できます。
            <strong>売上が伸びていても利益率が下がっている</strong>場合、競争激化や先行投資負担が示唆されます。
          </>
        }
      >
        <HistoryChart stock={stock} />
      </Section>

      {/* ===== 発見セクション：A 軸 ===== */}
      <Section
        id="similar"
        title={`${stock.name} と似た会社`}
        subtitle="事業構造・収益モデルが似ている会社トップ 5（事業類似スコア）"
        guide={
          <>
            事業の重なりで判定。スコアは <strong>0–100 の整数</strong>で、高いほど「同じビジネスをやっている会社」。
            業種分類より細かい粒度で隣接銘柄が見つかります。
          </>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {similar.map((s) => (
            <SimilarCard key={s.stock.code} s={s} />
          ))}
        </div>
      </Section>

      {/* ===== C 軸：成長フェーズ ===== */}
      <Section
        id="phase"
        title="成長フェーズ"
        subtitle="業界内で比較した成長段階（売上成長 / 利益率安定性 / 設備投資比率を業界内で正規化）"
        guide={
          <>
            会社が今どの成長段階にあるかを 4 つの位相（<Term>ローンチ期</Term>・<Term>拡大期</Term>・<Term>成熟期</Term>・<Term>衰退期</Term>）で表示。
            業界の中で比較した相対値です。投資スタイル（成長 / 配当）に合う会社を選ぶ材料に。
          </>
        }
      >
        <PhaseChart scores={stock.phaseScores} rationale={stock.phaseRationale ?? ""} />
        <h3 className="text-sm font-bold mt-8 mb-3">同じフェーズで、異なる業界の銘柄</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {phaseAdj.map((s) => (
            <SimilarCard key={s.stock.code} s={s} scoreLabel="フェーズ類似" />
          ))}
        </div>
      </Section>

      {/* ===== D 軸：リスクプロファイル ===== */}
      <Section
        id="risk"
        title="リスクプロファイル"
        subtitle="株価が外部要因（ドル円・金利・SOX など）にどれだけ動かされるか（ファクター感応度ベータ）"
        guide={
          <>
            株価が何の影響を受けやすいかを数値化。たとえば <Term>SOX</Term> が <strong>+1.32</strong> なら、
            「半導体株全体が 1% 上がると、この株は約 1.32% 上がる」という意味。
            ポートフォリオを組むときに「同じ方向に動く銘柄ばかり」を避ける材料になります。
          </>
        }
      >
        <FactorTable betas={stock.factorBetas} period={stock.factorPeriod ?? ""} />
        <h3 className="text-sm font-bold mt-8 mb-3">ポートフォリオを補完する銘柄（感応度が逆方向）</h3>
        <p className="text-xs text-muted mb-3 max-w-2xl leading-relaxed">
          似た銘柄ではなく、{stock.name} のリスクを相殺する方向に動く銘柄を提示します。ポートフォリオ構築時の補完候補として。
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {riskComp.map((s) => (
            <SimilarCard key={s.stock.code} s={s} scoreLabel="補完度" />
          ))}
        </div>
      </Section>

      {/* ===== AI 論点抽出 ===== */}
      <Section
        id="insights"
        title="あなたが見落としているかもしれない論点"
        subtitle="市場で広く知られている論点は AI が機械的に除外（多段フィルタで汎用論点・既知論点を排除）"
        guide={
          <>
            IR 資料を AI が深読みし、市場であまり話題になっていない論点を抽出したもの。
            <strong>「為替リスク」「人口減少」のようなありきたりな論点は機械的に排除</strong>しています。
            投資判断の根拠にする前に、必ず引用元の資料を確認してください。
          </>
        }
        rightSlot={<AiBadge />}
        ai
      >
        <div className="space-y-4">
          {stock.insights.map((ins, i) => {
            const { lede, rest } = splitInsight(ins);
            return (
              <div key={i} className="bg-surface border border-border rounded-md p-5">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-foreground/60 text-sm font-mono">0{i + 1}</span>
                  <h3 className="font-bold leading-tight">{ins.title}</h3>
                </div>
                <p className="text-sm leading-relaxed">{lede}</p>
                {rest ? (
                  <Disclose label="根拠と詳細を読む">
                    <p className="text-muted leading-relaxed mb-3">{rest}</p>
                    <SourceList sources={ins.citations} />
                  </Disclose>
                ) : (
                  <div className="mt-3">
                    <SourceList sources={ins.citations} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <AiDisclaimer />
      </Section>

      {/* ===== 関連ブログ記事 ===== */}
      {relatedPosts.length > 0 && (
        <Section
          id="related-posts"
          title={`${stock.name} に関する記事`}
          subtitle="ブログでさらに深掘り"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedPosts.map((p) => (
              <PostCard key={p.slug} post={p} compact />
            ))}
          </div>
        </Section>
      )}

      {/* ===== 注記 ===== */}
      <section className="border-t border-border pt-6 mt-12">
        <details className="text-xs text-dim leading-relaxed">
          <summary className="cursor-pointer hover:text-muted">この銘柄ページの作り方</summary>
          <div className="mt-3 space-y-2 pl-2 border-l-2 border-border">
            <p>
              <strong className="text-muted">定量データ</strong>：EDINET XBRL から決定的に取得。日付・出典をすべて記録。AI は数値を生成しません。
            </p>
            <p>
              <strong className="text-muted">事業タグ</strong>：有報の「事業の内容」「セグメント情報」と決算説明会資料・統合報告書を LLM で構造化。タグマスター語彙は半導体クラスタで先行設計。
            </p>
            <p>
              <strong className="text-muted">類似度スコア</strong>：A 軸はタグ jaccard 加重、C 軸はフェーズ連続スコアの cos 類似、D 軸はファクター感応度ベクトルの距離。全て決定的計算。
            </p>
            <p>
              <strong className="text-muted">論点抽出</strong>：三段階プロンプト（差分抽出 → 影響要素フィルタ → 非自明性フィルタ）で汎用論点と既知論点を排除。引用検証パイプラインで根拠未確認の出力は非表示。
            </p>
          </div>
        </details>
      </section>
    </article>
  );
}

