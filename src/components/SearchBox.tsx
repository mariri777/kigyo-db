"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * SearchBox(client component)
 *
 * 旧実装は layout.tsx で 3,572 銘柄の検索インデックスを丸ごと props で受け取り、
 * HTML に直埋めしていた(全ページに gzip 後 30-40KB の追加コスト)。
 *
 * 都度検索方式に置き換え。仕様:
 *  - 200ms の debounce で過剰リクエストを抑制
 *  - AbortController で前回の fetch をキャンセル(古いレスポンスで上書きされない)
 *  - `/api/search` は CDN で 5 分キャッシュされるため同じ q は無料配信になる
 *  - 検索対象は銘柄(code/name/nameEn/sectorTSE)のみ。業界・記事は別途固定リンクから誘導
 */

type SearchHit = {
  code: string;
  name: string;
  nameEn: string | null;
  sectorTSE: string;
};

const DEBOUNCE_MS = 200;

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 200ms debounce + AbortController で fetch
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results: SearchHit[] }) => {
          setResults(data.results);
          setLoading(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // 外側クリックで閉じる
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 「/」キーで検索にフォーカス、Esc で閉じる
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
      if (hit) window.location.href = `/stocks/${hit.code}`;
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
          <path
            d="M11 11L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="銘柄を検索(コード・社名)"
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
          {loading && results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-dim">検索中…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-dim">該当なし</div>
          ) : (
            <ul className="py-1">
              {results.map((hit, i) => (
                <li key={hit.code}>
                  <Link
                    href={`/stocks/${hit.code}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`block px-3 py-2 hover:bg-surface-elev transition ${
                      focusedIdx === i ? "bg-surface-elev" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-dim tabular w-10">
                        {hit.code}
                      </span>
                      <span className="text-sm font-medium flex-1 truncate">
                        {hit.name}
                      </span>
                      <span className="text-[10px] text-dim shrink-0 ml-2">
                        {hit.sectorTSE}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border px-3 py-2 text-[10px] text-dim flex items-center justify-between">
            <span>
              <kbd className="font-mono border border-border rounded px-1">
                ↑↓
              </kbd>{" "}
              移動 ·{" "}
              <kbd className="font-mono border border-border rounded px-1">
                Enter
              </kbd>{" "}
              開く
            </span>
            <span>
              <kbd className="font-mono border border-border rounded px-1">
                /
              </kbd>{" "}
              集中
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
