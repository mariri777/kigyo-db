"use client";

/**
 * Tiptap のスラッシュコマンドメニュー。
 *   - 空段落で "/" を打つとフローティングメニューが開く
 *   - 矢印↑↓で選択、Enter で挿入、Escape で閉じる
 *   - "/h" のように打つと前方一致でフィルタ
 */
import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { Editor, Extension, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance } from "tippy.js";

export type SlashItem = {
  key: string;
  label: string;
  hint?: string;
  /** "/" のあとに打って前方一致させたい語 (英) */
  aliases: string[];
  command: (args: { editor: Editor; range: Range }) => void;
};

const ITEMS: SlashItem[] = [
  {
    key: "h2",
    label: "見出し H2",
    hint: "セクションの区切り",
    aliases: ["h2", "heading", "midashi"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run(),
  },
  {
    key: "lead",
    label: "リード段落",
    hint: "本文冒頭の太字 + 左ボーダー",
    aliases: ["lead", "リード", "intro"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("lead").run(),
  },
  {
    key: "p",
    label: "本文段落",
    hint: "通常の段落に戻す",
    aliases: ["p", "paragraph", "honbun"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("paragraph").run(),
  },
  {
    key: "quote",
    label: "引用",
    hint: "blockquote",
    aliases: ["quote", "引用", "blockquote"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    key: "ul",
    label: "箇条書き",
    aliases: ["ul", "list", "bullet"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    key: "ol",
    label: "番号付きリスト",
    aliases: ["ol", "numbered", "ordered"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    key: "callout",
    label: "Callout (注意ボックス)",
    hint: "warn 風の引用枠",
    aliases: ["callout", "warn", "note", "alert"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "callout",
          attrs: { title: "ここで賭けが入る" },
          content: [{ type: "paragraph" }],
        })
        .run(),
  },
  {
    key: "stat-grid",
    label: "Stat Grid (数値カード)",
    hint: "2〜4列の指標表示",
    aliases: ["stat", "statgrid", "数値"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "statGrid",
          content: Array.from({ length: 4 }, (_, i) => ({
            type: "statGridItem",
            attrs: { label: `項目 ${i + 1}`, sub: "" },
            content: [{ type: "text", text: "0" }],
          })),
        })
        .run(),
  },
  {
    key: "ticker",
    label: "Ticker (銘柄カード)",
    hint: "本文中に銘柄を差し込む",
    aliases: ["ticker", "stock", "銘柄"],
    command: ({ editor, range }) => {
      const code = window.prompt("銘柄コード or slug", "9984");
      if (!code) return;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "ticker", attrs: { code } })
        .run();
    },
  },
  {
    key: "divider",
    label: "区切り線",
    aliases: ["divider", "hr", "horizontal"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ITEMS;
  return ITEMS.filter((it) =>
    [it.key, it.label, ...it.aliases].some((s) =>
      s.toLowerCase().includes(q),
    ),
  );
}

// ─── React UI (popup の中身) ──────────────────────────────

type MenuRef = { onKeyDown: (props: { event: KeyboardEvent }) => boolean };

const SlashMenu = forwardRef<
  MenuRef,
  {
    items: SlashItem[];
    command: (item: SlashItem) => void;
  }
>(function SlashMenuComp({ items, command }, ref) {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % Math.max(1, items.length));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % Math.max(1, items.length));
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs text-neutral-500">
        該当なし
      </div>
    );
  }
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-1 w-[260px] max-h-[280px] overflow-y-auto">
      {items.map((it, i) => {
        const active = i === selected;
        return (
          <button
            key={it.key}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              command(it);
            }}
            onMouseEnter={() => setSelected(i)}
            className={`w-full text-left px-2.5 py-1.5 rounded text-sm flex items-baseline gap-2 transition ${
              active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
            }`}
          >
            <span className="font-semibold flex-1 truncate">{it.label}</span>
            {it.hint && (
              <span
                className={`text-[10px] font-mono ${active ? "text-neutral-300" : "text-neutral-500"}`}
              >
                {it.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

// ─── Extension factory ────────────────────────────────────

export function createSlashCommandExtension() {
  return Extension.create({
    name: "slashCommand",
    addOptions() {
      return {
        suggestion: {
          char: "/",
          startOfLine: false,
          command: ({
            editor,
            range,
            props,
          }: {
            editor: Editor;
            range: Range;
            props: SlashItem;
          }) => {
            props.command({ editor, range });
          },
        },
      };
    },
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => filterItems(query),
          render: () => {
            let component: ReactRenderer<MenuRef> | null = null;
            let popup: Instance[] | null = null;
            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props,
                  editor: props.editor,
                });
                if (!props.clientRect) return;
                popup = tippy("body", {
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(),
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate: (props) => {
                component?.updateProps(props);
                if (!props.clientRect) return;
                popup?.[0]?.setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(),
                });
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }
                return component?.ref?.onKeyDown?.(props) ?? false;
              },
              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
                popup = null;
                component = null;
              },
            };
          },
        }),
      ];
    },
  });
}
