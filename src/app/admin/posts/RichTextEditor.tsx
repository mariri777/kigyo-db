"use client";

import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { estimateReadingMin } from "@/shared/readingTime";

/**
 * 管理画面用の最小限 WYSIWYG。 contenteditable + document.execCommand を使う。
 *
 * 親は `name` 属性付きの hidden input でフォームに値を載せ、保存時に Server Action へ渡す。
 * 「onChange に最新 HTML を渡す」「readMin を表示する」だけを責務とする。
 */
export function RichTextEditor({
  name,
  initialHtml,
  error,
}: {
  name: string;
  initialHtml: string;
  error?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const readMinRef = useRef<HTMLSpanElement | null>(null);

  function updateReadMin(html: string) {
    if (readMinRef.current) {
      readMinRef.current.textContent = String(estimateReadingMin(html));
    }
  }

  // 初期マウント時に DOM を直接書き換える (defaultValue 相当)
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml || "<p></p>";
    if (hiddenRef.current) hiddenRef.current.value = initialHtml;
    updateReadMin(initialHtml);
  }, [initialHtml]);

  function syncHtml() {
    if (!editorRef.current || !hiddenRef.current) return;
    const html = editorRef.current.innerHTML;
    hiddenRef.current.value = html;
    updateReadMin(html);
  }

  function exec(cmd: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    syncHtml();
  }

  function wrapBlock(tag: "p" | "h2" | "h3" | "blockquote") {
    exec("formatBlock", `<${tag}>`);
  }

  function insertCallout(tone: "info" | "warn") {
    const cls =
      tone === "warn"
        ? "my-6 p-4 rounded-md border-l-2 bg-surface-elev border-foreground/30"
        : "my-6 p-4 rounded-md border-l-2 bg-muted border-foreground";
    const html = `<aside class="${cls}"><p class="text-sm leading-relaxed">${tone === "warn" ? "注意点を記入" : "補足を記入"}</p></aside><p><br></p>`;
    exec("insertHTML", html);
  }

  function insertLink() {
    const url = window.prompt("リンク先 URL を入力してください (例: https://example.com)") ?? "";
    if (!url.trim()) return;
    exec("createLink", url.trim());
  }

  return (
    <div>
      <Label className="mb-2 block">本文</Label>
      <input type="hidden" name={name} ref={hiddenRef} />
      <div className="border border-border rounded-md bg-surface overflow-hidden">
        <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-border bg-surface-elev text-[11px]">
          <ToolbarButton onClick={() => wrapBlock("p")}>段落</ToolbarButton>
          <ToolbarButton onClick={() => wrapBlock("h2")}>H2</ToolbarButton>
          <ToolbarButton onClick={() => wrapBlock("h3")}>H3</ToolbarButton>
          <ToolbarButton onClick={() => exec("bold")}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("italic")}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("underline")}>
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("insertUnorderedList")}>•リスト</ToolbarButton>
          <ToolbarButton onClick={() => exec("insertOrderedList")}>1.リスト</ToolbarButton>
          <ToolbarButton onClick={() => wrapBlock("blockquote")}>引用</ToolbarButton>
          <ToolbarButton onClick={insertLink}>リンク</ToolbarButton>
          <ToolbarButton onClick={() => insertCallout("info")}>補足</ToolbarButton>
          <ToolbarButton onClick={() => insertCallout("warn")}>注意</ToolbarButton>
          <ToolbarButton onClick={() => exec("removeFormat")}>書式解除</ToolbarButton>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHtml}
          onBlur={syncHtml}
          className="prose-editor min-h-[400px] px-4 py-4 text-[15px] leading-[1.9] focus:outline-none"
        />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">
        読了目安 約 <span ref={readMinRef}>{estimateReadingMin(initialHtml)}</span> 分
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition"
    >
      {children}
    </button>
  );
}
