"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { GlobalSearchKbd, GLOBAL_SEARCH_INPUT_ID } from "./_SearchHotkey";

type Hit = {
  code: string;
  name: string;
  nameEn: string | null;
  sectorTSE: string;
};

type Props = {
  variant?: "header" | "mobile";
  onNavigate?: () => void;
};

export function SearchBox({ variant = "header", onNavigate }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length === 0) return;
    setLoading(true);
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: { results: Hit[] }) => {
          setHits(data.results);
          setActive(0);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          setHits([]);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [q]);

  const onChangeInput = (v: string) => {
    setQ(v);
    if (v.trim().length === 0) {
      setHits([]);
      setLoading(false);
      setOpen(false);
      abortRef.current?.abort();
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const go = (code: string) => {
    setOpen(false);
    setQ("");
    setHits([]);
    onNavigate?.();
    router.push(`/stocks/${code}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.code);
    }
  };

  const isHeader = variant === "header";

  return (
    <div ref={wrapRef} className={isHeader ? "relative flex-1 max-w-md ml-auto hidden md:block" : "relative"}>
      <div
        className={
          "flex items-center bg-neutral-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:bg-white focus-within:border-neutral-300 border border-transparent transition"
        }
      >
        <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <input
          ref={inputRef}
          id={isHeader ? GLOBAL_SEARCH_INPUT_ID : undefined}
          type="text"
          value={q}
          onChange={(e) => onChangeInput(e.target.value)}
          onFocus={() => {
            if (hits.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="銘柄・業界・キーワードを検索"
          className="flex-1 bg-transparent px-2.5 text-sm placeholder:text-neutral-500 focus:outline-none"
          aria-label="検索"
          aria-autocomplete="list"
          aria-controls="site-search-listbox"
          aria-expanded={open && hits.length > 0}
          role="combobox"
          autoComplete="off"
        />
        {isHeader && <GlobalSearchKbd />}
      </div>

      {open && q.trim().length > 0 && (
        <div
          id="site-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
        >
          {loading && hits.length === 0 && (
            <div className="px-4 py-3 text-xs text-neutral-500">検索中…</div>
          )}
          {!loading && hits.length === 0 && (
            <div className="px-4 py-3 text-xs text-neutral-500">該当する銘柄がありません</div>
          )}
          {hits.map((h, i) => (
            <Link
              key={h.code}
              href={`/stocks/${h.code}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(h.code)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                i === active ? "bg-neutral-100" : "hover:bg-neutral-50"
              }`}
            >
              <span className="font-mono tabular text-[11px] font-bold text-neutral-500 w-12 shrink-0">{h.code}</span>
              <span className="flex-1 min-w-0 truncate font-semibold text-neutral-900">{h.name}</span>
              <span className="hidden sm:block text-[11px] text-neutral-500 shrink-0">{h.sectorTSE}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
