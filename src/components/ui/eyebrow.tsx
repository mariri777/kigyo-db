import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * セクション・ページの上に置く小さなラベル。
 * `text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground` という
 * 15+ 箇所で繰り返されていたタイポを共通化したもの。
 */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "div" | "span";
}) {
  return (
    <Tag
      className={cn(
        "text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
