import type { ReactNode } from "react";

export function Section({
  id,
  title,
  subtitle,
  guide,
  rightSlot,
  children,
  ai = false,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  /** やさしい「これは何を見ればいい？」1行ガイド */
  guide?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
  ai?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 ${ai ? "ai-section pl-4 -ml-4" : ""} mb-12`}
    >
      <header className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </header>
      {guide && (
        <div className="text-[12px] text-muted-foreground leading-relaxed border-l-2 border-foreground/80 pl-3 py-1 mb-5 bg-muted/60">
          <span className="text-foreground mr-1">💡</span>
          {guide}
        </div>
      )}
      {children}
    </section>
  );
}
