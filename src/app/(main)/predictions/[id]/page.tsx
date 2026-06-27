import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPrediction,
  listPredictions,
  predictionWithLiveStatus,
} from "@/content/predictions";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionListItem } from "@/components/PredictionListItem";
import { StructuredData } from "@/components/StructuredData";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo/metadata";
import { articleLd, breadcrumbList } from "@/lib/seo/structuredData";
import { ROUTES } from "@/shared/links";
import { absoluteUrl, SITE_NAME } from "@/shared/site";
import { getStockBrief } from "@/server/usecase";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const prediction = getPrediction(id);
  if (!prediction) return NOT_FOUND_METADATA;
  const stock = prediction.stockCode ? await getStockBrief(prediction.stockCode) : null;
  const title = stock
    ? `予測:${stock.name}(${stock.code})— ${prediction.question}`
    : `予測:${prediction.question}`;
  const description = `${
    prediction.questionNote ?? prediction.eventName
  }。AI と編集部がイベント前に確率を提示し、結果と教訓まで公開する予測カード。`;
  return pageMetadata({
    title,
    description,
    path: `${ROUTES.predictions}/${prediction.id}`,
    keywords: ["予測", prediction.eventName, stock?.name ?? "マクロ", "AI 予測"],
  });
}

export default async function PredictionDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const raw = getPrediction(id);
  if (!raw) notFound();
  const prediction = predictionWithLiveStatus(raw);
  const stock = prediction.stockCode ? await getStockBrief(prediction.stockCode) : null;

  const sameStock = prediction.stockCode
    ? listPredictions()
        .filter(
          (p) => p.stockCode === prediction.stockCode && p.id !== prediction.id,
        )
        .slice(0, 3)
    : [];
  const others = listPredictions()
    .filter((p) => p.id !== prediction.id && p.stockCode !== prediction.stockCode)
    .slice(0, 3);

  const predictionPath = `${ROUTES.predictions}/${prediction.id}`;
  const stockOrMacroCrumb = stock
    ? { name: `${stock.name}(${stock.code})`, href: `${ROUTES.stocks}/${stock.code}` }
    : { name: "マクロ", href: ROUTES.predictions };

  const predictionJsonLd = [
    breadcrumbList([
      { name: "予測", href: ROUTES.predictions },
      stockOrMacroCrumb,
      { name: prediction.question, href: predictionPath },
    ]),
    articleLd({
      title: prediction.question,
      description: prediction.questionNote ?? prediction.eventName,
      path: predictionPath,
      datePublished: prediction.deadlineAt,
      dateModified: prediction.resolution?.resolvedAt ?? prediction.deadlineAt,
      authorName: `${SITE_NAME} 編集部`,
    }),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <StructuredData data={predictionJsonLd} />
      <nav className="flex items-center gap-2 text-[11px] text-muted-foreground mb-6 flex-wrap">
        <Link href={ROUTES.predictions} className="hover:text-foreground transition">
          予測ハブ
        </Link>
        <span className="text-foreground/60">/</span>
        {stock ? (
          <>
            <Link
              href={`${ROUTES.stocks}/${stock.code}`}
              className="hover:text-foreground transition"
            >
              {stock.code} {stock.name}
            </Link>
            <span className="text-foreground/60">/</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">マクロ</span>
            <span className="text-foreground/60">/</span>
          </>
        )}
        <span className="text-foreground truncate max-w-[60%]">{prediction.question}</span>
      </nav>

      <PredictionCard prediction={prediction} />

      {sameStock.length > 0 && stock && (
        <RelatedPredictions
          heading={`${stock.name} の他の予測`}
          predictions={sameStock}
          highlightStockName={stock.name}
          highlightStockCode={stock.code}
        />
      )}

      {others.length > 0 && (
        <RelatedPredictions
          heading="その他の予測カード"
          predictions={others}
          highlightStockName={stock?.name ?? null}
          highlightStockCode={prediction.stockCode ?? null}
        />
      )}

      <section className="mt-12 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">この予測を共有する</h2>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          このページの URL を共有すると、相手も同じ予測カードを見られます。
          投票内容は各ブラウザのローカルに保存されるため、相手の投票は見えません。
        </p>
        <div className="bg-surface-elev border border-border rounded-md px-3 py-2 text-[11px] text-muted-foreground tabular font-mono break-all">
          {absoluteUrl(predictionPath)}
        </div>
      </section>

      <section className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={ROUTES.predictions}
            className="text-muted-foreground hover:text-foreground transition"
          >
            ← 予測ハブに戻る
          </Link>
          {stock && (
            <Link
              href={`${ROUTES.stocks}/${stock.code}`}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {stock.name} の銘柄ページ →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function RelatedPredictions({
  heading,
  predictions,
  highlightStockName,
  highlightStockCode,
}: {
  heading: string;
  predictions: ReturnType<typeof listPredictions>;
  highlightStockName: string | null;
  highlightStockCode: string | null;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">
        {heading}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {predictions.map((p) => (
          <PredictionListItem
            key={p.id}
            prediction={p}
            stockName={p.stockCode === highlightStockCode ? highlightStockName : null}
          />
        ))}
      </div>
    </section>
  );
}
