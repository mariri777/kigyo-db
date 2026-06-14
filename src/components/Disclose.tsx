import type { ReactNode } from "react";

/**
 * Progressive disclosure 用の展開可能ブロック。
 * 要約だけ知りたい方は読んで離脱、詳しく知りたい方は展開して詳細へ。同じページで両方を満たす。
 * native <details> なので JS 不要・アクセシブル・SSR フレンドリ。
 */
export function Disclose({
  label = "詳しく見る",
  openLabel = "折りたたむ",
  children,
  className = "",
}: {
  label?: string;
  openLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`group/disclose mt-3 ${className}`}>
      <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground select-none transition">
        <span className="inline-block transition-transform duration-150 group-open/disclose:rotate-90 text-foreground/70">
          ▸
        </span>
        <span className="underline decoration-dotted underline-offset-2 group-open/disclose:hidden">
          {label}
        </span>
        <span className="hidden underline decoration-dotted underline-offset-2 group-open/disclose:inline">
          {openLabel}
        </span>
      </summary>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </details>
  );
}
