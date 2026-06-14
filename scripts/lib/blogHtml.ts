// posts.ts の Block[] を 1 つの HTML 文字列に変換する。
// 既存の React コンポーネント PostContent / Disclose と同じクラス名を吐くので、
// DB から body_html を取り出して dangerouslySetInnerHTML すれば、見た目が
// 既存ページと一致する。

// posts.ts の型は import するとTS設定上の循環が出やすいのでローカルに置く。
type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "callout"; tone?: "info" | "warn"; title?: string; text: string }
  | { type: "ul"; items: string[] }
  | { type: "kv"; pairs: { key: string; value: string; sub?: string }[] }
  | { type: "quote"; text: string; cite?: string }
  | {
      type: "disclose";
      label: string;
      blocks: Exclude<Block, { type: "disclose" }>[];
    };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlock(b: Block): string {
  switch (b.type) {
    case "p":
      return `<p class="text-[15px] leading-[1.9] my-4 text-foreground/90">${escapeHtml(b.text)}</p>`;
    case "h2":
      return `<h2 class="text-2xl font-bold tracking-tight mt-12 mb-4 pb-2 border-b border-border">${escapeHtml(b.text)}</h2>`;
    case "h3":
      return `<h3 class="text-lg font-bold tracking-tight mt-8 mb-3">${escapeHtml(b.text)}</h3>`;
    case "callout": {
      const cls =
        b.tone === "warn"
          ? "my-6 p-4 rounded-md border-l-2 bg-surface-elev border-foreground/30"
          : "my-6 p-4 rounded-md border-l-2 bg-muted border-foreground";
      const title = b.title
        ? `<div class="text-[11px] font-bold tracking-widest text-muted-foreground mb-1">${escapeHtml(b.title)}</div>`
        : "";
      return `<aside class="${cls}">${title}<p class="text-sm leading-relaxed">${escapeHtml(b.text)}</p></aside>`;
    }
    case "ul": {
      const items = b.items
        .map(
          (it) =>
            `<li class="text-[15px] leading-relaxed text-foreground/90">${escapeHtml(it)}</li>`,
        )
        .join("");
      return `<ul class="my-4 space-y-2 list-disc pl-5">${items}</ul>`;
    }
    case "kv": {
      const pairs = b.pairs
        .map(
          (p) =>
            `<div class="grid grid-cols-[160px_1fr] sm:grid-cols-[200px_1fr_1fr] items-baseline gap-3 px-4 py-3"><div class="text-sm text-muted-foreground">${escapeHtml(p.key)}</div><div class="text-base font-bold tabular font-mono text-foreground">${escapeHtml(p.value)}</div>${p.sub ? `<div class="text-xs text-foreground/60 col-span-2 sm:col-span-1">${escapeHtml(p.sub)}</div>` : ""}</div>`,
        )
        .join("");
      return `<div class="my-5 bg-surface border border-border rounded-md divide-y divide-border">${pairs}</div>`;
    }
    case "quote": {
      const cite = b.cite
        ? `<cite class="block text-[11px] text-foreground/60 mt-2 not-italic">— ${escapeHtml(b.cite)}</cite>`
        : "";
      return `<blockquote class="my-6 pl-4 border-l-2 border-foreground/60 text-foreground/80 italic"><p class="text-[15px] leading-relaxed">${escapeHtml(b.text)}</p>${cite}</blockquote>`;
    }
    case "disclose": {
      const inner = b.blocks.map(renderBlock).join("");
      return `<details class="group/disclose mt-3 my-5"><summary class="list-none cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground select-none transition"><span class="inline-block transition-transform duration-150 group-open/disclose:rotate-90 text-foreground/70">▸</span><span class="underline decoration-dotted underline-offset-2 group-open/disclose:hidden">${escapeHtml(b.label)}</span><span class="hidden underline decoration-dotted underline-offset-2 group-open/disclose:inline">折りたたむ</span></summary><div class="mt-3 text-sm leading-relaxed"><div class="border-l-2 border-border pl-4 -ml-1">${inner}</div></div></details>`;
    }
  }
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(renderBlock).join("\n");
}
