/**
 * Tiptap JSON を React 要素に変換する renderer。
 *
 * 入力: contentJson (string) — Tiptap の getJSON 出力をそのまま文字列化したもの
 * 出力: <article> 内に置ける React 要素群
 *
 * カスタムノード:
 *   - lead, callout, statGrid + statGridItem, ticker
 *   - heading H2 / paragraph / blockquote / bulletList / orderedList / horizontalRule
 *   - inline: text + bold/italic/code/link mark
 *
 * ticker ノードは TickerCard (DB から銘柄スナップショットを引いた React コンポーネント)
 * に置き換える。tickerByCode はあらかじめ詳細ページが用意する。
 */
import React from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, ArrowUpRight, AlertTriangle } from "lucide-react";

export type TickerSnapshot = {
  code: string;
  name: string;
  href: string;
  initial: string;
  logoColor: string;
  priceAtPublish: string | null;
  changeAtPublish: string | null;
  positive: boolean | null;
  marketCap: string | null;
  per: string | null;
  note: string | null;
};

type RenderCtx = {
  tickerByCode: Record<string, TickerSnapshot>;
};

type Mark = { type: string; attrs?: Record<string, unknown> };

type AnyNode = {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: Mark[];
  content?: AnyNode[];
  text?: string;
};

export function renderArticleContent(
  contentJson: string,
  ctx: RenderCtx,
): React.ReactNode {
  let doc: AnyNode;
  try {
    doc = JSON.parse(contentJson) as AnyNode;
  } catch {
    return null;
  }
  if (!doc?.content) return null;
  return doc.content.map((node, i) => (
    <Fragment key={i}>{renderNode(node, ctx)}</Fragment>
  ));
}

const Fragment = React.Fragment;

// 見出しに id を振るための簡易関数 (TOC との対応用)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-ぁ-んァ-ン一-龯]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function renderNode(node: AnyNode, ctx: RenderCtx): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p className="mt-5 text-[15.5px] leading-[1.95] tracking-[0.005em] text-neutral-800">
          {renderInline(node.content ?? [])}
        </p>
      );

    case "lead":
      return (
        <p className="mt-2 text-[17px] sm:text-[19px] font-bold leading-[1.85] tracking-tight text-neutral-900 border-l-4 border-emerald-500 pl-5">
          {renderInline(node.content ?? [])}
        </p>
      );

    case "heading": {
      const text = collectText(node);
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="mt-14 mb-3 text-2xl sm:text-[26px] font-black tracking-tight scroll-mt-20 text-neutral-900"
        >
          {renderInline(node.content ?? [])}
        </h2>
      );
    }

    case "blockquote":
      return (
        <blockquote className="my-6 border-l-4 border-neutral-300 pl-4 text-neutral-600 italic">
          {(node.content ?? []).map((c, i) => (
            <Fragment key={i}>{renderNode(c, ctx)}</Fragment>
          ))}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul className="my-4 list-disc pl-6 space-y-1 text-[15.5px] leading-[1.85] text-neutral-800">
          {(node.content ?? []).map((c, i) => (
            <Fragment key={i}>{renderNode(c, ctx)}</Fragment>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="my-4 list-decimal pl-6 space-y-1 text-[15.5px] leading-[1.85] text-neutral-800">
          {(node.content ?? []).map((c, i) => (
            <Fragment key={i}>{renderNode(c, ctx)}</Fragment>
          ))}
        </ol>
      );

    case "listItem":
      return <li>{(node.content ?? []).map((c, i) => <Fragment key={i}>{renderNode(c, ctx)}</Fragment>)}</li>;

    case "horizontalRule":
      return <hr className="my-10 border-t border-neutral-200" />;

    case "callout": {
      const title = String(node.attrs?.title ?? "");
      return (
        <aside className="mt-8 rounded-xl bg-amber-50 border-l-4 border-amber-400 p-5 flex gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            {title && (
              <div className="text-sm font-bold text-amber-900 mb-1">{title}</div>
            )}
            <div className="text-sm text-neutral-800 leading-relaxed">
              {(node.content ?? []).map((c, i) => (
                <Fragment key={i}>{renderNode(c, ctx)}</Fragment>
              ))}
            </div>
          </div>
        </aside>
      );
    }

    case "statGrid": {
      const items = (node.content ?? []).filter((c) => c.type === "statGridItem");
      return (
        <div className="my-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
          {items.map((item, i) => (
            <div key={i} className="bg-white px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {String(item.attrs?.label ?? "")}
              </div>
              <div
                className="font-black tracking-tight mt-1 text-neutral-900 text-2xl"
                style={{ fontFamily: "var(--font-serif, ui-serif, Georgia, serif)", fontVariantNumeric: "tabular-nums" }}
              >
                {collectText(item)}
              </div>
              {item.attrs?.sub ? (
                <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                  {String(item.attrs.sub)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    case "ticker": {
      const code = String(node.attrs?.code ?? "");
      const t = ctx.tickerByCode[code];
      if (!t) {
        return (
          <div className="my-6 px-4 py-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-xs font-mono text-neutral-500">
            ticker code={code} (DB に銘柄が見つかりません)
          </div>
        );
      }
      return <TickerCard t={t} />;
    }

    default:
      return null;
  }
}

function renderInline(nodes: AnyNode[]): React.ReactNode {
  return nodes.map((n, i) => {
    if (n.type !== "text") {
      // hardBreak など
      if (n.type === "hardBreak") return <br key={i} />;
      return null;
    }
    let el: React.ReactNode = n.text;
    for (const mark of n.marks ?? []) {
      el = wrapMark(el, mark, i);
    }
    return <Fragment key={i}>{el}</Fragment>;
  });
}

function wrapMark(child: React.ReactNode, mark: Mark, key: number): React.ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong key={`b-${key}`} className="font-bold">{child}</strong>;
    case "italic":
      return <em key={`i-${key}`}>{child}</em>;
    case "code":
      return (
        <code key={`c-${key}`} className="px-1 py-0.5 rounded bg-neutral-100 text-[0.9em] font-mono">
          {child}
        </code>
      );
    case "link": {
      const href = String(mark.attrs?.href ?? "#");
      return (
        <a
          key={`l-${key}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline underline-offset-2"
        >
          {child}
        </a>
      );
    }
    default:
      return child;
  }
}

function collectText(node: AnyNode): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(collectText).join("");
}

// ─── TickerCard ──────────────────────────────────────────

function TickerCard({ t }: { t: TickerSnapshot }) {
  const showPrice = t.priceAtPublish && t.changeAtPublish;
  return (
    <Link
      href={t.href}
      className="not-prose group my-8 flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/70 transition no-underline"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
        style={{ background: t.logoColor }}
      >
        {t.initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
          <span className="font-bold">{t.code}</span>
          {t.marketCap && (
            <>
              <span>·</span>
              <span>時価総額 {t.marketCap}</span>
            </>
          )}
          {t.per && (
            <>
              <span>·</span>
              <span>PER {t.per}</span>
            </>
          )}
        </div>
        <div className="text-sm font-bold truncate text-neutral-900">{t.name}</div>
      </div>
      {showPrice && (
        <div className="text-right shrink-0">
          <div className="font-mono tabular text-base font-bold tracking-tight text-neutral-900">
            {t.priceAtPublish}
          </div>
          <div
            className={`font-mono tabular text-xs font-bold inline-flex items-center gap-0.5 ${
              t.positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {t.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {t.changeAtPublish}
          </div>
          {t.note && (
            <div className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest mt-0.5">
              {t.note}
            </div>
          )}
        </div>
      )}
      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition shrink-0" />
    </Link>
  );
}

// ─── 見出しから TOC を抽出 ──────────────────────────────

export function extractToc(
  contentJson: string,
): { id: string; label: string }[] {
  try {
    const doc = JSON.parse(contentJson) as AnyNode;
    return (doc.content ?? [])
      .filter((n) => n.type === "heading" && (n.attrs?.level ?? 2) === 2)
      .map((n) => {
        const text = collectText(n);
        return { id: slugify(text), label: text };
      });
  } catch {
    return [];
  }
}
