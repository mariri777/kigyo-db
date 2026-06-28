/**
 * v2 記事用のカスタム Tiptap Node。
 * - lead:     リード段落 (左に緑のボーダー)
 * - callout:  注意喚起ボックス (warn のみ、シンプル)
 * - statGrid: 数値カード (2〜4列)
 * - ticker:   銘柄コード参照 (本文中のインライン銘柄カード)
 */
import { Node, mergeAttributes } from "@tiptap/core";

// ─── lead ────────────────────────────────────────────────
export const LeadNode = Node.create({
  name: "lead",
  group: "block",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "p[data-lead]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(HTMLAttributes, {
        "data-lead": "true",
        class: "v2-lead",
      }),
      0,
    ];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () => this.editor.commands.toggleNode("lead", "paragraph"),
    };
  },
});

// ─── callout (warn) ─────────────────────────────────────
export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      title: {
        default: "ここで賭けが入る",
        parseHTML: (el) => el.getAttribute("data-title") ?? "",
      },
    };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "warn",
        "data-title": node.attrs.title,
        class: "v2-callout",
      }),
      ["div", { class: "v2-callout-title" }, node.attrs.title],
      ["div", { class: "v2-callout-body" }, 0],
    ];
  },
});

// ─── stat-grid ───────────────────────────────────────────
//   atom: stat-grid-item を中に持つ
export const StatGridItemNode = Node.create({
  name: "statGridItem",
  group: "statGridItem",
  content: "inline*",
  defining: true,
  addAttributes() {
    return {
      label: { default: "ラベル" },
      sub: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-stat]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-stat": "item",
        "data-label": node.attrs.label,
        "data-sub": node.attrs.sub,
        class: "v2-stat-item",
      }),
      ["div", { class: "v2-stat-label" }, node.attrs.label],
      ["div", { class: "v2-stat-value" }, 0],
      node.attrs.sub
        ? ["div", { class: "v2-stat-sub" }, node.attrs.sub]
        : ["span", { style: "display:none" }],
    ];
  },
});

export const StatGridNode = Node.create({
  name: "statGrid",
  group: "block",
  content: "statGridItem+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-stat-grid]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-stat-grid": "true",
        class: "v2-stat-grid",
      }),
      0,
    ];
  },
});

// ─── ticker (atom) ───────────────────────────────────────
export const TickerNode = Node.create({
  name: "ticker",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      code: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-ticker]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-ticker": node.attrs.code,
        class: "v2-ticker",
      }),
      `[ticker code=${node.attrs.code}]`,
    ];
  },
});
