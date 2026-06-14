import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDoc({
  eyebrow,
  title,
  effectiveDate,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="pb-8 border-b border-border mb-10">
        <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase mb-3">{eyebrow}</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-5">
          {title}
        </h1>
        {intro && <p className="text-muted-foreground leading-relaxed text-base max-w-2xl">{intro}</p>}
        <div className="mt-6 text-[11px] text-foreground/60">最終更新：{effectiveDate}</div>
      </header>
      <div className="space-y-10 text-[15px] leading-[1.9] text-foreground/90">{children}</div>
      <footer className="mt-16 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
        <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition">
          利用規約
        </Link>
        <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition">
          プライバシーポリシー
        </Link>
        <Link href="/legal/disclaimer" className="text-muted-foreground hover:text-foreground transition">
          免責事項
        </Link>
        <Link href="/legal/editorial-policy" className="text-muted-foreground hover:text-foreground transition">
          編集方針
        </Link>
        <Link href="/" className="text-muted-foreground hover:text-foreground transition ml-auto">
          トップへ →
        </Link>
      </footer>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold tracking-tight mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
