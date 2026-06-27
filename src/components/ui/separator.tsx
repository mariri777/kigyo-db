import { cn } from "@/lib/utils";

/**
 * `<hr>` の代替として使う水平区切り線。`border-t border-border` の重複を吸収する。
 * 区切り目的なので装飾上は CSS の `border-t` 1 本に統一。
 */
export function Separator({
  className,
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <hr
      role={decorative ? "presentation" : undefined}
      aria-orientation={decorative ? undefined : "horizontal"}
      className={cn("border-0 border-t border-border", className)}
    />
  );
}
