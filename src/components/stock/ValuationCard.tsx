import Link from "next/link";
import type { Stock } from "@/domain/types";
import { ScoreBar } from "@/components/ScoreBar";
import { SourceList } from "@/components/SourceChip";
import { verdictBlockClass } from "@/domain/verdict";
import { ROUTES } from "@/shared/links";

/**
 * 規範的判断 (AI 評価サマリー) カード。`stock.valuationCall` が無ければ空メッセージ。
 */
export function ValuationCard({ stock }: { stock: Stock }) {
  if (!stock.valuationCall) {
    return (
      <div className="bg-surface border border-border border-dashed rounded-md p-5 text-sm text-foreground/60">
        この銘柄の AI 評価はまだ生成されていません。
      </div>
    );
  }

  const v = stock.valuationCall;
  return (
    <div className={`border rounded-md p-5 ${verdictBlockClass(v.verdict)}`}>
      <div className="flex items-baseline gap-4 mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest opacity-80">評価</div>
          <div className="text-3xl font-bold">{v.verdict}</div>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-widest opacity-80 mb-1">割安度スコア</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tabular">{v.score}</div>
            <div className="text-[11px] opacity-70 tabular">/ 100</div>
            <div className="flex-1 max-w-xs">
              <ScoreBar score={v.score} />
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{v.rationale}</p>
      <div className="mt-3">
        <SourceList sources={v.citations} />
      </div>
      <div className="mt-3 text-[11px] opacity-70">
        判断基準の詳細は{" "}
        <Link href={ROUTES.legal.editorial} className="underline">
          編集方針
        </Link>{" "}
        をご確認ください。
      </div>
    </div>
  );
}
