"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";

import type { StoryDeck } from "../_lib/sampleStockData";

// 時代ごとのアクセント。画像に頼らず、年号ブロックと帯の色だけで時代感を出す。
const ERA_STYLES: Record<string, { grad: string; ring: string; chip: string; year: string }> = {
  創業前夜: {
    grad: "from-neutral-950 via-neutral-900 to-amber-950/40",
    ring: "ring-amber-400/30",
    chip: "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30",
    year: "text-amber-200/90",
  },
  創業期: {
    grad: "from-neutral-950 via-neutral-900 to-rose-950/40",
    ring: "ring-rose-400/30",
    chip: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-400/30",
    year: "text-rose-200/90",
  },
  成長期: {
    grad: "from-neutral-950 via-neutral-900 to-emerald-950/40",
    ring: "ring-emerald-400/30",
    chip: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30",
    year: "text-emerald-200/90",
  },
  グローバル巨人化: {
    grad: "from-neutral-950 via-neutral-900 to-blue-950/40",
    ring: "ring-blue-400/30",
    chip: "bg-blue-400/15 text-blue-200 ring-1 ring-blue-400/30",
    year: "text-blue-200/90",
  },
  次世代モビリティ: {
    grad: "from-neutral-950 via-neutral-900 to-violet-950/40",
    ring: "ring-violet-400/30",
    chip: "bg-violet-400/15 text-violet-200 ring-1 ring-violet-400/30",
    year: "text-violet-200/90",
  },
};

const DEFAULT_ERA_STYLE = ERA_STYLES["創業期"];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function StorySlider({ deck }: { deck: StoryDeck }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slides = deck.slides;

  // 現在表示中のスライドを scroll 位置から推定
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        setActive(idx);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [slides.length]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    // グローバル CSS の reduce ルールは JS の scrollTo を止めないので、ここで分岐する。
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  // ← / → はスライダーにフォーカスがあるときだけ処理する (window 全体を奪わない)。
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  };

  if (slides.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-100 p-10 text-center text-neutral-500">
        スライドの準備中…
      </div>
    );
  }

  const progress = ((active + 1) / slides.length) * 100;

  return (
    <div
      className="rounded-3xl overflow-hidden bg-neutral-900 text-white shadow-lg relative"
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${deck.deckTitle} の歴史スライド`}
      onKeyDown={onKeyDown}
    >
      {/* ヘッダー */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            紙芝居 · {slides.length}枚で読む沿革
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{deck.deckTitle}</h3>
          {deck.subtitle && <p className="text-sm text-neutral-300 mt-1">{deck.subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="font-mono tabular text-xs text-neutral-400 uppercase">SLIDE</div>
          <div className="font-mono tabular text-2xl font-bold tracking-tight">
            {String(active + 1).padStart(2, "0")}
            <span className="text-neutral-500 text-base"> / {String(slides.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="px-6 pb-3">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* スライダー本体 */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {slides.map((s) => {
            const style = ERA_STYLES[s.era] ?? DEFAULT_ERA_STYLE;
            return (
              <article
                key={s.n}
                className="snap-center shrink-0 w-full"
                aria-label={`${s.n}枚目 ${s.title}`}
              >
                <div className={`relative bg-gradient-to-br ${style.grad} min-h-[440px] p-6 sm:p-10 flex flex-col`}>
                  {/* 上段: 時代バッジ + 大きな年号 */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {s.era && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.chip}`}>
                          {s.era}
                        </span>
                      )}
                      <div className={`mt-3 font-mono tabular text-6xl sm:text-8xl font-black leading-none tracking-tight ${style.year}`}>
                        {s.year}
                      </div>
                    </div>
                    <div className="font-mono tabular text-[10px] font-bold text-white/40 uppercase tracking-widest shrink-0 pt-1">
                      No. {String(s.n).padStart(2, "0")}
                    </div>
                  </div>

                  {/* 中段: タイトル + リード + 本文 */}
                  <div className="mt-8 sm:mt-10 max-w-3xl flex flex-col gap-4">
                    <h4 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">{s.title}</h4>
                    {s.lead && (
                      <p className="text-base sm:text-lg text-neutral-200 leading-relaxed">{s.lead}</p>
                    )}
                    <div className={`h-px w-16 bg-white/25 ring-0 ${style.ring}`} />
                    {s.body && <p className="text-sm leading-relaxed text-neutral-300">{s.body}</p>}
                  </div>

                  {/* 下段: ハイライトキャプション */}
                  {s.highlight && (
                    <div className="mt-auto pt-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/15 text-neutral-100 text-xs font-bold">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        {s.highlight}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* prev/next ボタン (md以上) */}
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-neutral-900 items-center justify-center shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="前のスライドへ"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === slides.length - 1}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-neutral-900 items-center justify-center shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="次のスライドへ"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* footer: dots + source */}
      <div className="px-6 py-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {slides.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => goTo(i)}
              className={`shrink-0 h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`スライド ${i + 1} へ`}
              aria-current={i === active ? "true" : undefined}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 shrink-0">
          ← / → キーで移動
        </span>
      </div>

      {/* source */}
      {deck.source && (
        <div className="px-6 pb-4 text-[10px] text-neutral-500 leading-relaxed">{deck.source}</div>
      )}
    </div>
  );
}
