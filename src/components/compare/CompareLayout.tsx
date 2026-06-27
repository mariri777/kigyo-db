import type { ReactNode } from "react";
import type { Stock } from "@/domain/types";

/**
 * `<section>` ヘッダ + 子要素。`Section` と機能が重複していたので比較画面専用に独立。
 */
export function CompareSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

/** 銘柄数に応じてカラム数が変わるグリッド。 */
export function CompareGrid({
  stocks,
  children,
}: {
  stocks: Stock[];
  children: (s: Stock) => ReactNode;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}
    >
      {stocks.map((s) => (
        <div key={s.code} className="bg-surface border border-border rounded-md p-4">
          {children(s)}
        </div>
      ))}
    </div>
  );
}
