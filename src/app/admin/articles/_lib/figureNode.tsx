"use client";

/**
 * 本文中の画像ブロック (figure + figcaption)。
 *
 * 設計:
 *   - figure (block): 画像と figcaption を子に持つ
 *     attrs.src / alt / href / width("full"|"wide"|"normal"|"narrow")
 *   - figcaption (block): inline コンテンツ。空でも構わない (表示時に非表示)
 *
 *   NodeView (React):
 *     - src 未設定: URL 入力 inline UI を表示 (placeholder)
 *     - src 設定済み: 画像 + キャプション + フローティングツールバー
 *         (差し替え / 幅切替 / alt 編集 / リンク / 削除)
 *
 *   いずれも prompt() / alert() を使わずすべて inline UI。
 */

import { useEffect, useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Replace,
  Trash2,
  Maximize2,
  Minimize2,
  Check,
  X,
} from "lucide-react";
import { normalizeImageSrc } from "./imageSrc";

type Width = "narrow" | "normal" | "wide" | "full";

const WIDTH_CLASS: Record<Width, string> = {
  narrow: "max-w-[480px]",
  normal: "max-w-[640px]",
  wide: "max-w-[920px]",
  full: "w-full",
};

const WIDTH_ORDER: Width[] = ["narrow", "normal", "wide", "full"];

// ─── figcaption ノード ─────────────────────────────────
export const FigcaptionNode = Node.create({
  name: "figcaption",
  group: "figcaption",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "figcaption" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figcaption",
      mergeAttributes(HTMLAttributes, { class: "v2-figcaption" }),
      0,
    ];
  },
});

// ─── figure ノード ─────────────────────────────────────
export const FigureNode = Node.create({
  name: "figure",
  group: "block",
  content: "figcaption",
  draggable: true,
  isolating: true,
  atom: false,
  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      href: { default: "" },
      width: {
        default: "normal" as Width,
        parseHTML: (el) => el.getAttribute("data-width") ?? "normal",
        renderHTML: (attrs) => ({ "data-width": attrs.width }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "figure[data-v2-figure]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    // SSR/HTML キャッシュ用
    const src = String(node.attrs.src ?? "");
    const alt = String(node.attrs.alt ?? "");
    const href = String(node.attrs.href ?? "");
    const width = (node.attrs.width as Width) ?? "normal";
    const imgAttrs: Record<string, string> = {
      src,
      alt,
      class: "v2-figure-img",
    };
    const imgEl: ["img", Record<string, string>] = ["img", imgAttrs];
    const wrapped: unknown = href
      ? ["a", { href, target: "_blank", rel: "noopener noreferrer" }, imgEl]
      : imgEl;
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-v2-figure": "true",
        "data-width": width,
        class: `v2-figure v2-figure--${width}`,
      }),
      wrapped as ReturnType<typeof mergeAttributes>,
      ["figcaption", { class: "v2-figcaption" }, 0],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
  addCommands() {
    return {
      insertFigure:
        (attrs?: { src?: string; alt?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: "figure",
            attrs: { src: attrs?.src ?? "", alt: attrs?.alt ?? "" },
            content: [{ type: "figcaption" }],
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs?: { src?: string; alt?: string }) => ReturnType;
    };
  }
}

// ─── React NodeView ────────────────────────────────────

function FigureView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  const href = String(node.attrs.href ?? "");
  const width = (node.attrs.width as Width) ?? "normal";

  const [draftSrc, setDraftSrc] = useState("");
  const [editingAlt, setEditingAlt] = useState(false);
  const [editingHref, setEditingHref] = useState(false);
  const [altDraft, setAltDraft] = useState(alt);
  const [hrefDraft, setHrefDraft] = useState(href);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setAltDraft(alt);
  }, [alt]);
  useEffect(() => {
    setHrefDraft(href);
  }, [href]);
  useEffect(() => {
    setLoadError(false);
  }, [src]);

  const widthClass = WIDTH_CLASS[width];

  const cycleWidth = (dir: 1 | -1) => {
    const i = WIDTH_ORDER.indexOf(width);
    const next = WIDTH_ORDER[(i + dir + WIDTH_ORDER.length) % WIDTH_ORDER.length];
    updateAttributes({ width: next });
  };

  const commitSrc = () => {
    const v = normalizeImageSrc(draftSrc);
    if (!v) return;
    updateAttributes({ src: v });
    setDraftSrc("");
  };

  const commitAlt = () => {
    updateAttributes({ alt: altDraft });
    setEditingAlt(false);
  };
  const commitHref = () => {
    updateAttributes({ href: hrefDraft.trim() });
    setEditingHref(false);
  };

  // src 未設定 → URL 入力プレースホルダ
  if (!src) {
    return (
      <NodeViewWrapper as="figure" className="v2-figure-edit v2-figure-empty my-6">
        <div
          className={`rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 ${
            selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
            <ImageIcon className="w-4 h-4" />
            画像 URL を貼り付け
            <span className="text-[11px] text-neutral-400 ml-1">
              (Unsplash の <code className="font-mono">photo-...</code> でも OK)
            </span>
          </div>
          <UrlField
            value={draftSrc}
            onChange={setDraftSrc}
            onSubmit={commitSrc}
            placeholder="https://... or photo-1518770660439-..."
            submitLabel="挿入"
          />
        </div>
        {/* figcaption は HTML 構造上必須なので非表示で持たせる (空でレンダリング) */}
        <NodeViewContent<"figcaption"> as="figcaption" className="hidden" />
        <div className="mt-2 flex items-center justify-end">
          <ToolbarButton onClick={() => deleteNode()} label="削除" icon={Trash2} />
        </div>
      </NodeViewWrapper>
    );
  }

  // src 設定済み → 画像 + キャプション + ツールバー
  return (
    <NodeViewWrapper as="figure" className={`v2-figure-edit my-8 ${widthClass} mx-auto`}>
      <div
        className={`group relative rounded-lg overflow-hidden bg-neutral-100 ${
          selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""
        }`}
      >
        {loadError ? (
          <div className="aspect-[16/9] flex items-center justify-center text-xs text-rose-600 bg-rose-50">
            画像が読み込めませんでした
          </div>
        ) : (
          // 普通の img: Tiptap NodeView 内で next/image は使いにくいため
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block"
            onError={() => setLoadError(true)}
          />
        )}
        {/* フローティング上部ツールバー (画像が選択されている時に出す) */}
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 transition opacity-0 group-hover:opacity-100 ${
            selected ? "opacity-100" : ""
          }`}
        >
          <ToolbarChip onClick={() => cycleWidth(-1)} label="幅 小さく" icon={Minimize2} />
          <ToolbarChip onClick={() => cycleWidth(1)} label="幅 大きく" icon={Maximize2} />
          <ToolbarChip
            onClick={() => {
              setDraftSrc(src);
              updateAttributes({ src: "" });
            }}
            label="差し替え"
            icon={Replace}
          />
          <ToolbarChip
            onClick={() => setEditingHref((v) => !v)}
            label="リンク"
            icon={LinkIcon}
            active={!!href}
          />
          <ToolbarChip onClick={() => deleteNode()} label="削除" icon={Trash2} tone="danger" />
        </div>
      </div>

      {/* alt 編集 inline */}
      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
        {editingAlt ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              autoFocus
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAlt();
                }
                if (e.key === "Escape") setEditingAlt(false);
              }}
              onBlur={commitAlt}
              placeholder="代替テキスト (alt)"
              className="flex-1 text-xs px-2 py-1 bg-white border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitAlt();
              }}
              className="p-1 text-neutral-500 hover:text-neutral-900"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingAlt(true)}
            className={`text-left text-xs px-1 py-0.5 rounded hover:bg-neutral-100 ${
              alt ? "text-neutral-600" : "text-neutral-400 italic"
            }`}
          >
            {alt || "alt を追加…"}
          </button>
        )}
      </div>

      {/* リンク入力 (LinkIcon を押した時だけ表示) */}
      {editingHref && (
        <div className="mt-1 flex items-center gap-1">
          <input
            autoFocus
            value={hrefDraft}
            onChange={(e) => setHrefDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitHref();
              }
              if (e.key === "Escape") setEditingHref(false);
            }}
            placeholder="クリック時のリンク先 URL (任意)"
            className="flex-1 text-xs px-2 py-1 bg-white border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              commitHref();
            }}
            className="p-1 text-neutral-500 hover:text-neutral-900"
          >
            <Check className="w-3 h-3" />
          </button>
          {href && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                updateAttributes({ href: "" });
                setHrefDraft("");
                setEditingHref(false);
              }}
              className="p-1 text-neutral-500 hover:text-rose-600"
              title="リンク解除"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* キャプション (本文と同じ編集体験) */}
      <NodeViewContent<"figcaption">
        as="figcaption"
        className="v2-figcaption-edit mt-2 text-xs text-neutral-500 leading-relaxed empty:before:content-['キャプションを追加…'] empty:before:text-neutral-400 empty:before:italic empty:before:cursor-text"
      />
    </NodeViewWrapper>
  );
}

// ─── 小物 ──────────────────────────────────────────────

function UrlField({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 text-sm font-mono px-3 py-2 bg-white border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="px-3 py-2 rounded bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ToolbarChip({
  onClick,
  label,
  icon: Icon,
  active,
  tone,
}: {
  onClick: () => void;
  label: string;
  icon: typeof Trash2;
  active?: boolean;
  tone?: "danger";
}) {
  const base =
    "w-7 h-7 inline-flex items-center justify-center rounded bg-white/95 backdrop-blur border border-neutral-200 shadow-sm transition hover:bg-white hover:border-neutral-400";
  const toneClass =
    tone === "danger"
      ? "text-rose-600 hover:text-rose-700 hover:border-rose-400"
      : active
        ? "text-emerald-600 border-emerald-300"
        : "text-neutral-700";
  return (
    <button type="button" onClick={onClick} title={label} className={`${base} ${toneClass}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function ToolbarButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: typeof Trash2;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] text-neutral-500 hover:text-rose-600 inline-flex items-center gap-1"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
