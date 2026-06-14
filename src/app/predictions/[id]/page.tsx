import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPrediction,
  listPredictions,
  predictionWithLiveStatus,
} from "@/lib/predictions";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionListItem } from "@/components/PredictionListItem";
import { getStockBrief } from "@/lib/stocksRepo";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prediction = getPrediction(id);
  if (!prediction) return { title: "見つかりません" };
  const stock = prediction.stockCode
    ? await getStockBrief(prediction.stockCode)
    : null;
  const title = stock
    ? `${stock.name}（${stock.code}） — ${prediction.question}`
    : prediction.question;
  return {
    title: `${title} | 予測`,
    description: prediction.questionNote ?? prediction.eventName,
  };
}

export default async function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = getPrediction(id);
  if (!raw) notFound();
  const prediction = predictionWithLiveStatus(raw);
  const stock = prediction.stockCode
    ? await getStockBrief(prediction.stockCode)
    : null;

  // 同銘柄の他予測（最大 3 件）
  const sameStock = prediction.stockCode
    ? listPredictions()
        .filter(
          (p) =>
            p.stockCode === prediction.stockCode && p.id !== prediction.id,
        )
        .slice(0, 3)
    : [];

  // 他の予測（同銘柄じゃないもの、最大 3 件）
  const others = listPredictions()
    .filter((p) => p.id !== prediction.id && p.stockCode !== prediction.stockCode)
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-[11px] text-muted mb-6 flex-wrap">
        <Link href="/predictions" className="hover:text-foreground transition">
          予測ハブ
        </Link>
        <span className="text-dim">/</span>
        {stock ? (
          <>
            <Link
              href={`/stocks/${stock.code}`}
              className="hover:text-foreground transition"
            >
              {stock.code} {stock.name}
            </Link>
            <span className="text-dim">/</span>
          </>
        ) : (
          <>
            <span className="text-muted">マクロ</span>
            <span className="text-dim">/</span>
          </>
        )}
        <span className="text-foreground truncate max-w-[60%]">
          {prediction.question}
        </span>
      </nav>

      {/* ===== メインカード ===== */}
      <PredictionCard prediction={prediction} />

      {/* ===== 同銘柄の他予測 ===== */}
      {sameStock.length > 0 && stock && (
        <section className="mt-12">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted mb-4">
            {stock.name} の他の予測
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sameStock.map((p) => (
              <PredictionListItem
                key={p.id}
                prediction={p}
                stockName={p.stockCode === prediction.stockCode ? stock?.name : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== その他の予測 ===== */}
      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted mb-4">
            その他の予測カード
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {others.map((p) => (
              <PredictionListItem
                key={p.id}
                prediction={p}
                stockName={p.stockCode === prediction.stockCode ? stock?.name : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== シェア用注記 ===== */}
      <section className="mt-12 pt-8 border-t border-border">
        <h2 className="text-sm font-bold mb-3">この予測を共有する</h2>
        <p className="text-[12px] text-muted leading-relaxed mb-3">
          このページの URL を共有すると、相手も同じ予測カードを見られます。
          投票内容は各ブラウザのローカルに保存されるため、相手の投票は見えません。
        </p>
        <div className="bg-surface-elev border border-border rounded-md px-3 py-2 text-[11px] text-muted tabular font-mono break-all">
          https://orekabu.example.com/predictions/{prediction.id}
        </div>
      </section>

      {/* ===== 関連 ===== */}
      <section className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/predictions"
            className="text-muted hover:text-foreground transition"
          >
            ← 予測ハブに戻る
          </Link>
          <Link
            href="/profile"
            className="text-muted hover:text-foreground transition"
          >
            マイ予測 →
          </Link>
          {stock && (
            <Link
              href={`/stocks/${stock.code}`}
              className="text-muted hover:text-foreground transition"
            >
              {stock.name} の銘柄ページ →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
