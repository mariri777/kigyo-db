"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { stocks } from "@/lib/data";
import { industries } from "@/lib/industries";
import { listPosts, CATEGORY_LABEL } from "@/lib/posts";

type StockHit = { type: "stock"; code: string; name: string; nameEn?: string; cluster: string };
type IndustryHit = { type: "industry"; slug: string; name: string };
type PostHit = { type: "post"; slug: string; title: string; category: string };
type Hit = StockHit | IndustryHit | PostHit;

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo<Hit[]>(() => {
    const items: Hit[] = [];
    for (const s of stocks) {
      items.push({
        type: "stock",
        code: s.code,
        name: s.name,
        nameEn: s.nameEn,
        cluster: s.industryCluster,
      });
    }
    for (const i of industries) {
      items.push({ type: "industry", slug: i.slug, name: i.name });
    }
    for (const p of listPosts()) {
      items.push({
        type: "post",
        slug: p.slug,
        title: p.title,
        category: CATEGORY_LABEL[p.category],
      });
    }
    return items;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((item) => {
        if (item.type === "stock") {
          return (
            item.code.includes(q) ||
            item.name.includes(q) ||
            item.nameEn?.toLowerCase().includes(q) ||
            item.cluster.includes(q)
          );
        }
        if (item.type === "industry") {
          return item.name.includes(q);
        }
        return item.title.toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [query, index]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 「/」キーで検索にフォーカス
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const href = (hit: Hit) =>
    hit.type === "stock"
      ? `/stocks/${hit.code}`
      : hit.type === "industry"
        ? `/industries/${hit.slug}`
        : `/blog/${hit.slug}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      const hit = results[focusedIdx];
      if (hit) window.location.href = href(hit);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="銘柄・業界・記事を検索"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setFocusedIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-44 sm:w-56 pl-8 pr-2 py-1.5 text-xs bg-surface-elev border border-border rounded-md focus:outline-none focus:border-foreground transition"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[92vw] bg-background border border-border rounded-md shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-dim">該当なし</div>
          ) : (
            <ul className="py-1">
              {results.map((hit, i) => (
                <li key={`${hit.type}-${i}`}>
                  <Link
                    href={href(hit)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`block px-3 py-2 hover:bg-surface-elev transition ${
                      focusedIdx === i ? "bg-surface-elev" : ""
                    }`}
                  >
                    {hit.type === "stock" && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-dim tabular w-10">{hit.code}</span>
                        <span className="text-sm font-medium flex-1 truncate">{hit.name}</span>
                        <span className="text-[10px] text-dim shrink-0 ml-2">{hit.cluster}</span>
                      </div>
                    )}
                    {hit.type === "industry" && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-dim">業界</span>
                        <span className="text-sm font-medium flex-1">{hit.name}</span>
                      </div>
                    )}
                    {hit.type === "post" && (
                      <div>
                        <div className="text-[10px] text-dim mb-0.5">{hit.category}</div>
                        <div className="text-sm font-medium leading-tight">{hit.title}</div>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border px-3 py-2 text-[10px] text-dim flex items-center justify-between">
            <span>
              <kbd className="font-mono border border-border rounded px-1">↑↓</kbd> 移動 ·{" "}
              <kbd className="font-mono border border-border rounded px-1">Enter</kbd> 開く
            </span>
            <span>
              <kbd className="font-mono border border-border rounded px-1">/</kbd> 集中
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
