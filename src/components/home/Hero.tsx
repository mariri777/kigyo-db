import Link from "next/link";
import type { StockBrief } from "@/lib/types";

/** トップページのヒーローセクション。 */
export function Hero({
  stockCount,
  industryCount,
  firstStock,
}: {
  stockCount: number;
  industryCount: number;
  firstStock: StockBrief;
}) {
  return (
    <section className="mb-20 pb-16 border-b border-border">
      <div className="max-w-3xl">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-6">
          AI で読み解く、日本の上場企業
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-8">
          事業の本質、似た会社、
          <br />
          <span className="relative inline-block">
            隠れたリスクを、一枚に。
            <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-foreground opacity-10" />
          </span>
        </h1>
        <p className="text-muted leading-relaxed mb-3 text-base max-w-2xl">
          <strong className="text-foreground">「超！企業DB」</strong>は、有報・決算資料・適時開示を AI が解析し、
          <strong className="text-foreground">事業類似銘柄・成長フェーズ判定・ファクター感応度</strong>を一枚に可視化します。
          投資を始めたばかりの方にも、専門家の補助線としても。
        </p>
        <p className="text-dim text-sm">
          現在 {stockCount} 社・{industryCount} 業界に対応。順次拡大中。
          <span className="ml-2 text-[11px] border border-border rounded px-1.5 py-0.5">
            ※ 株価は実勢（{firstStock.priceDate} 終値・週次更新）／財務指標・分析はサンプルデータ
          </span>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 text-sm border border-foreground bg-foreground text-background rounded-md px-4 py-2 hover:opacity-90 transition"
          >
            はじめての方へ — 5 分ガイド →
          </Link>
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 text-sm border border-border-strong rounded-md px-4 py-2 hover:bg-surface-elev transition"
          >
            業界から探す →
          </Link>
        </div>
      </div>
    </section>
  );
}
