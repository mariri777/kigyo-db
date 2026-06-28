"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

type TocItem = { id: string; label: string };

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="目次" className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
        <List className="w-3 h-3" />
        Table of Contents
      </div>
      <ol className="space-y-1.5">
        {items.map((it, i) => {
          const isActive = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={`group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-xs transition ${
                  isActive
                    ? "bg-neutral-900 text-white font-bold"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <span
                  className={`font-mono tabular text-[10px] font-bold mt-0.5 shrink-0 ${
                    isActive ? "text-emerald-300" : "text-neutral-400"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-snug">{it.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
