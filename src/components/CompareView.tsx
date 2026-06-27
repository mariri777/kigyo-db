"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Stock } from "@/domain/types";
import { analyzeComparison } from "@/domain/compare";
import { ComparisonGrid } from "@/components/compare/ComparisonGrid";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ROUTES } from "@/shared/links";

const MAX_COMPARE = 3;

export function CompareView({
  initialCodes,
  allStocks,
}: {
  initialCodes: string[];
  allStocks: Stock[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>(initialCodes);

  const stocksByCode = useMemo(
    () => new Map(allStocks.map((s) => [s.code, s])),
    [allStocks],
  );
  const stocks = useMemo(
    () =>
      codes
        .map((c) => stocksByCode.get(c))
        .filter((s): s is Stock => Boolean(s)),
    [codes, stocksByCode],
  );
  const available = allStocks.filter((s) => !codes.includes(s.code));
  const observations = analyzeComparison(stocks);

  const updateUrl = (next: string[]) => {
    router.replace(next.length === 0 ? ROUTES.compare : `${ROUTES.compare}?codes=${next.join(",")}`);
  };

  const addCode = (c: string) => {
    if (!c || codes.length >= MAX_COMPARE || codes.includes(c)) return;
    const next = [...codes, c];
    setCodes(next);
    updateUrl(next);
  };

  const removeCode = (c: string) => {
    const next = codes.filter((x) => x !== c);
    setCodes(next);
    updateUrl(next);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="pb-8 border-b border-border mb-8">
        <Eyebrow className="mb-3">Compare</Eyebrow>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-4">
          銘柄を並べて比較
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          最大 3 銘柄を選んで、基本情報・規範的判断・指標・成長フェーズ・リスクプロファイルを横並びで確認。
          「違いの分析」セクションで、AI が比較対象の特徴的な差を抽出します。
        </p>
      </header>

      <section className="mb-8">
        <div className="text-[11px] text-foreground/60 tracking-widest mb-3">
          SELECTED ({codes.length}/{MAX_COMPARE})
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {stocks.map((s) => (
            <div
              key={s.code}
              className="inline-flex items-center gap-2 bg-surface border border-border-strong rounded-md pl-3 pr-1 py-1.5"
            >
              <span className="text-[10px] text-foreground/60 tabular">{s.code}</span>
              <Link
                href={`${ROUTES.stocks}/${s.code}`}
                className="text-sm font-medium hover:underline"
              >
                {s.name}
              </Link>
              <button
                onClick={() => removeCode(s.code)}
                className="text-foreground/60 hover:text-foreground w-5 h-5 rounded inline-flex items-center justify-center transition"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
          {codes.length < MAX_COMPARE && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addCode(e.target.value);
                e.target.value = "";
              }}
              className="text-sm bg-surface-elev border border-border rounded-md px-3 py-1.5 hover:border-border-strong transition cursor-pointer"
            >
              <option value="">+ 銘柄を追加</option>
              {available.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} {s.name} — {s.industryCluster}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {stocks.length === 0 ? (
        <EmptyState />
      ) : stocks.length === 1 ? (
        <SingleStockHint stock={stocks[0]} />
      ) : (
        <ComparisonGrid stocks={stocks} observations={observations} />
      )}

      <div className="mt-12 text-[11px] text-foreground/60 leading-relaxed">
        ※「違いの分析」は決定的なロジックで自動抽出された観察です。AI 生成ではなく、PER・ROE 等の数値差・業界クラスタ・成長フェーズなどから機械的に算出しています。
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-border border-dashed rounded-md p-12 text-center">
      <p className="text-muted-foreground mb-2">銘柄を 2 つ以上選んで比較を始めてください。</p>
      <p className="text-[12px] text-foreground/60">
        上の「+ 銘柄を追加」から選択するか、銘柄ページの「比較する」ボタンからもアクセスできます。
      </p>
    </div>
  );
}

function SingleStockHint({ stock }: { stock: Stock }) {
  return (
    <div className="bg-surface border border-border border-dashed rounded-md p-8 text-center">
      <p className="text-muted-foreground mb-1">
        現在 <strong className="text-foreground">{stock.name}</strong> のみ選択中。
      </p>
      <p className="text-[12px] text-foreground/60">あと 1 銘柄以上選択すると比較が表示されます。</p>
    </div>
  );
}
