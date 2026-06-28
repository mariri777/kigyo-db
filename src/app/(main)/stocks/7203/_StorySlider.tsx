"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import type { StoryDeck } from "./_data";

function unsplashUrl(id: string, w: number, h: number) {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(w),
    h: String(h),
    q: "75",
  });
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

const ERA_STYLES: Record<string, { gradient: string; accent: string }> = {
  創業前夜: { gradient: "from-amber-900 via-amber-800 to-amber-950", accent: "bg-amber-400 text-amber-950" },
  創業期: { gradient: "from-rose-900 via-red-900 to-red-950", accent: "bg-rose-400 text-rose-950" },
  成長期: { gradient: "from-emerald-900 via-green-900 to-green-950", accent: "bg-emerald-400 text-emerald-950" },
  グローバル巨人化: { gradient: "from-blue-900 via-indigo-900 to-indigo-950", accent: "bg-blue-400 text-blue-950" },
  次世代モビリティ: { gradient: "from-purple-900 via-violet-900 to-violet-950", accent: "bg-purple-400 text-purple-950" },
};

const DEFAULT_ERA_STYLE = ERA_STYLES["創業期"];

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
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") goTo(active + 1);
      else if (e.key === "ArrowLeft") goTo(active - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-100 p-10 text-center text-neutral-500">
        スライドの準備中…
      </div>
    );
  }

  const progress = ((active + 1) / slides.length) * 100;

  return (
    <div className="rounded-3xl overflow-hidden bg-neutral-900 text-white shadow-lg relative">
      {/* ヘッダー */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            紙芝居 · 30枚で読むトヨタ
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {deck.deckTitle}
          </h3>
          <p className="text-sm text-neutral-300 mt-1">{deck.subtitle}</p>
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
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
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
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[440px]">
                  {/* image side */}
                  <div className={`relative bg-gradient-to-br ${style.gradient} overflow-hidden`}>
                    <Image
                      src={unsplashUrl(s.image, 720, 540)}
                      alt={s.imageAlt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-50 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60 pointer-events-none" />

                    {/* 年代 large */}
                    <div className="absolute top-6 left-6">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${style.accent} text-[11px] font-bold uppercase tracking-wider`}>
                        {s.era}
                      </div>
                      <div className="mt-3 font-mono tabular text-5xl sm:text-6xl font-black text-white/90 leading-none tracking-tight drop-shadow">
                        {s.year}
                      </div>
                    </div>

                    {/* slide number */}
                    <div className="absolute bottom-5 left-6 font-mono tabular text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      No. {String(s.n).padStart(2, "0")}
                    </div>

                    {/* highlight chip */}
                    {s.highlight && (
                      <div className="absolute bottom-5 right-6 max-w-[60%]">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-neutral-900 text-xs font-bold shadow-lg">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          {s.highlight}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* text side */}
                  <div className="p-6 sm:p-8 flex flex-col gap-4 justify-center">
                    <h4 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                      {s.title}
                    </h4>
                    <p className="text-base sm:text-lg text-neutral-200 leading-relaxed">
                      {s.lead}
                    </p>
                    <div className="h-px bg-white/15 my-1" />
                    <p className="text-sm leading-relaxed text-neutral-300">
                      {s.body}
                    </p>
                  </div>
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
          aria-label="前へ"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === slides.length - 1}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-neutral-900 items-center justify-center shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="次へ"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* footer: thumbs + source */}
      <div className="px-6 py-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {slides.map((s, i) => (
            <button
              key={s.n}
              onClick={() => goTo(i)}
              className={`shrink-0 h-1.5 rounded-full transition-all ${
                i === active
                  ? "w-6 bg-emerald-400"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`スライド ${i + 1} へ`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 shrink-0">
          ← / → キーで移動
        </span>
      </div>

      {/* source */}
      <div className="px-6 pb-4 text-[10px] text-neutral-500 leading-relaxed">
        {deck.source}
      </div>
    </div>
  );
}
