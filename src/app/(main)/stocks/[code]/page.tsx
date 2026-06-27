import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStockDetail, listOverlayStocks } from "@/server/usecase";
import {
  phaseSimilarDifferentIndustry,
  riskComplementStocks,
  similarStocksByBusiness,
} from "@/domain/similarity";
import { Section } from "@/components/Section";
import { SimilarCard } from "@/components/SimilarCard";
import { FactorTable } from "@/components/FactorTable";
import { PhaseChart } from "@/components/PhaseChart";
import { AiBadge, AiDisclaimer } from "@/components/AiNotice";
import { Term } from "@/components/Term";
import { postsForStock } from "@/content/posts";
import { PostCard } from "@/components/PostCard";
import { industries } from "@/content/industries";
import { HistoryChart } from "@/components/HistoryChart";
import { getPredictionsByStock } from "@/content/predictions";
import { PredictionCard } from "@/components/PredictionCard";
import { StockHeader } from "@/components/stock/StockHeader";
import { BusinessStructure } from "@/components/stock/BusinessStructure";
import { ValuationCard } from "@/components/stock/ValuationCard";
import { InsightList } from "@/components/stock/InsightList";
import { StructuredData } from "@/components/StructuredData";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbList,
  financialProductLd,
  organizationLd,
} from "@/lib/seo/structuredData";
import { ROUTES } from "@/shared/links";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const stock = await getStockDetail(code);
  if (!stock) return NOT_FOUND_METADATA;

  const oneLiner = stock.oneLiner?.trim() || stock.description.slice(0, 70);
  const title = `${stock.name}(${stock.code})の事業構造・類似銘柄・AI 評価`;
  const description = `${stock.name}(${stock.code}・東証${stock.exchange}・${stock.industryCluster})の事業構造タグ、競合・類似銘柄、AI が拾い上げた見落とし論点、PER/PBR/配当利回りを 1 ページで把握。${oneLiner}`;

  return pageMetadata({
    title,
    description,
    path: `${ROUTES.stocks}/${stock.code}`,
    keywords: [
      stock.name,
      stock.code,
      stock.industryCluster,
      stock.sectorTSE,
      "類似銘柄",
      "競合",
      "PER",
      "PBR",
      "配当利回り",
    ],
    other: {
      "stock:ticker": stock.code,
      "stock:exchange": `東証 ${stock.exchange}`,
    },
  });
}

export default async function StockPage({ params }: { params: Params }) {
  const { code } = await params;
  const stock = await getStockDetail(code);
  if (!stock) notFound();

  const pool = await listOverlayStocks();
  const similar = similarStocksByBusiness(stock, pool, 5);
  const phaseAdj = phaseSimilarDifferentIndustry(stock, pool, 4);
  const riskComp = riskComplementStocks(stock, pool, 4);
  const relatedPosts = (await postsForStock(stock.code)).slice(0, 3);
  const containingIndustry = industries.find((ind) =>
    ind.subClusters.some((sc) => sc.companyCodes.includes(stock.code)),
  );
  const predictions = getPredictionsByStock(stock.code);

  const path = `${ROUTES.stocks}/${stock.code}`;
  const jsonLd = [
    breadcrumbList([
      { name: "銘柄一覧", href: ROUTES.stocks },
      { name: `${stock.name}(${stock.code})`, href: path },
    ]),
    organizationLd({
      name: stock.name,
      path,
      description: stock.description,
      alternateName: stock.nameEn ?? undefined,
      identifier: stock.code,
      industry: stock.industryCluster,
    }),
    financialProductLd({
      name: `${stock.name}(${stock.code})`,
      identifier: stock.code,
      description: `${stock.name}の上場株式(東証 ${stock.exchange} / ${stock.industryCluster})`,
    }),
  ];

  return (
    <article className="max-w-6xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />

      <StockHeader stock={stock} containingIndustry={containingIndustry} />

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

      <Section
        title="超！企業DBの評価"
        subtitle="一次情報(有報・決算資料)を引用した AI 評価。投資助言ではなく一般情報提供。"
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
        <ValuationCard stock={stock} />
        <AiDisclaimer />
      </Section>

      <Section
        id="business"
        title="事業構造"
        subtitle="公式書類(有報・決算説明会・統合報告書)から AI が抽出した事業タグ"
        guide={
          <>
            この会社が「<strong>誰に / 何を / どうやって売っているか</strong>」をタグで構造化したもの。
            タグが似ている会社は、ビジネスのパターンも似ている可能性が高いです。
          </>
        }
      >
        <BusinessStructure stock={stock} />
      </Section>

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

      <Section
        id="similar"
        title={`${stock.name} と似た会社`}
        subtitle="事業構造・収益モデルが似ている会社トップ 5(事業類似スコア)"
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

      <Section
        id="phase"
        title="成長フェーズ"
        subtitle="業界内で比較した成長段階(売上成長 / 利益率安定性 / 設備投資比率を業界内で正規化)"
        guide={
          <>
            会社が今どの成長段階にあるかを 4 つの位相(<Term>ローンチ期</Term>・<Term>拡大期</Term>・<Term>成熟期</Term>・<Term>衰退期</Term>)で表示。
            業界の中で比較した相対値です。投資スタイル(成長 / 配当)に合う会社を選ぶ材料に。
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

      <Section
        id="risk"
        title="リスクプロファイル"
        subtitle="株価が外部要因(ドル円・金利・SOX など)にどれだけ動かされるか(ファクター感応度ベータ)"
        guide={
          <>
            株価が何の影響を受けやすいかを数値化。たとえば <Term>SOX</Term> が <strong>+1.32</strong> なら、
            「半導体株全体が 1% 上がると、この株は約 1.32% 上がる」という意味。
            ポートフォリオを組むときに「同じ方向に動く銘柄ばかり」を避ける材料になります。
          </>
        }
      >
        <FactorTable betas={stock.factorBetas} period={stock.factorPeriod ?? ""} />
        <h3 className="text-sm font-bold mt-8 mb-3">ポートフォリオを補完する銘柄(感応度が逆方向)</h3>
        <p className="text-xs text-muted-foreground mb-3 max-w-2xl leading-relaxed">
          似た銘柄ではなく、{stock.name} のリスクを相殺する方向に動く銘柄を提示します。ポートフォリオ構築時の補完候補として。
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {riskComp.map((s) => (
            <SimilarCard key={s.stock.code} s={s} scoreLabel="補完度" />
          ))}
        </div>
      </Section>

      <Section
        id="insights"
        title="あなたが見落としているかもしれない論点"
        subtitle="市場で広く知られている論点は AI が機械的に除外(多段フィルタで汎用論点・既知論点を排除)"
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
        <InsightList insights={stock.insights} />
        <AiDisclaimer />
      </Section>

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

      <section className="border-t border-border pt-6 mt-12">
        <details className="text-xs text-foreground/60 leading-relaxed">
          <summary className="cursor-pointer hover:text-muted-foreground">この銘柄ページの作り方</summary>
          <div className="mt-3 space-y-2 pl-2 border-l-2 border-border">
            <Method
              label="定量データ"
              body="EDINET XBRL から決定的に取得。日付・出典をすべて記録。AI は数値を生成しません。"
            />
            <Method
              label="事業タグ"
              body="有報の「事業の内容」「セグメント情報」と決算説明会資料・統合報告書を LLM で構造化。タグマスター語彙は半導体クラスタで先行設計。"
            />
            <Method
              label="類似度スコア"
              body="A 軸はタグ jaccard 加重、C 軸はフェーズ連続スコアの cos 類似、D 軸はファクター感応度ベクトルの距離。全て決定的計算。"
            />
            <Method
              label="論点抽出"
              body="三段階プロンプト(差分抽出 → 影響要素フィルタ → 非自明性フィルタ)で汎用論点と既知論点を排除。引用検証パイプラインで根拠未確認の出力は非表示。"
            />
          </div>
        </details>
      </section>

      {/* compare ページへの動線 */}
      <Link
        href={`${ROUTES.compare}?codes=${stock.code}`}
        className="sr-only focus:not-sr-only"
      >
        比較画面で開く
      </Link>
    </article>
  );
}

function Method({ label, body }: { label: string; body: string }) {
  return (
    <p>
      <strong className="text-muted-foreground">{label}</strong>:{body}
    </p>
  );
}
