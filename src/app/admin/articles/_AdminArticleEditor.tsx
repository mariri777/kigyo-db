"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TipLink from "@tiptap/extension-link";
import {
  CalloutNode,
  LeadNode,
  StatGridItemNode,
  StatGridNode,
  TickerNode,
} from "./_lib/nodes";
import { createSlashCommandExtension } from "./_lib/slashCommand";
import {
  saveArticleAction,
  deleteArticleAction,
  updateStatusAction,
} from "@/server/articles/actions";
import type {
  ArticleAction,
  ArticleStatus,
  ArticleWriteInput,
  SubjectKind,
} from "@/server/repo/articleRepo";
import "./_lib/editor.css";

type Category = { id: number; slug: string; name: string };

type Props = {
  /** 既存記事の id (新規なら null) */
  id: number | null;
  /** 既存記事の初期値 (新規なら undefined) */
  initial?: Partial<ArticleWriteInput> & { id?: number; slug?: string };
  categories: Category[];
};

const SUBJECT_KINDS: { value: SubjectKind; label: string }[] = [
  { value: "company", label: "企業" },
  { value: "industry", label: "業界" },
  { value: "theme", label: "テーマ" },
  { value: "metric", label: "指標" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

const DEFAULT_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function AdminArticleEditor({ id, initial, categories }: Props) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<number | null>(id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initial?.slug),
  );
  const [lede, setLede] = useState(initial?.lede ?? "");
  const [subjectKind, setSubjectKind] = useState<SubjectKind>(
    initial?.subjectKind ?? "company",
  );
  const [subjectRef, setSubjectRef] = useState(initial?.subjectRef ?? "");
  const [subjectName, setSubjectName] = useState(initial?.subjectName ?? "");
  const [categoryId, setCategoryId] = useState<number>(
    initial?.categoryId ?? categories[0]?.id ?? 0,
  );
  const [heroImageKey, setHeroImageKey] = useState(initial?.heroImageKey ?? "");
  const [heroImageAlt, setHeroImageAlt] = useState(initial?.heroImageAlt ?? "");
  const [heroImageCredit, setHeroImageCredit] = useState(
    initial?.heroImageCredit ?? "",
  );
  const [status, setStatus] = useState<ArticleStatus>(initial?.status ?? "draft");
  const [companyCodes, setCompanyCodes] = useState(
    (initial?.companyCodes ?? []).join(", "),
  );
  const [industrySlugs, setIndustrySlugs] = useState(
    (initial?.industrySlugs ?? []).join(", "),
  );
  const [tagSlugs, setTagSlugs] = useState((initial?.tagSlugs ?? []).join(", "));
  const [actions, setActions] = useState<ArticleAction[]>(
    initial?.actions ??
      ([
        { label: "", href: "", hint: "" },
        { label: "", href: "", hint: "" },
        { label: "", href: "", hint: "" },
      ] as ArticleAction[]),
  );
  const [saveState, setSaveState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: string }
    | { kind: "error"; msg: string }
    | { kind: "dirty" }
  >({ kind: "idle" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "本文を書く… `/` でブロック挿入",
      }),
      TipLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      LeadNode,
      CalloutNode,
      StatGridNode,
      StatGridItemNode,
      TickerNode,
      createSlashCommandExtension(),
    ],
    content: initial?.contentJson
      ? safeParseJson(initial.contentJson)
      : DEFAULT_CONTENT,
    editorProps: {
      attributes: {
        class: "v2-editor min-h-[400px]",
      },
    },
    immediatelyRender: false,
    onUpdate: () => markDirty(),
  });

  // タイトル↔スラッグの自動同期 (上書きしてない時のみ)
  useEffect(() => {
    if (!slugManuallyEdited) setSlug(slugify(title));
  }, [title, slugManuallyEdited]);

  // dirty フラグの記録
  const markDirty = useCallback(() => {
    setSaveState({ kind: "dirty" });
  }, []);

  // 自動保存 (1.5s debounce)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const buildInput = useCallback((): Omit<ArticleWriteInput, "authorId"> => {
    const json = editor?.getJSON() ?? DEFAULT_CONTENT;
    const html = editor?.getHTML() ?? "";
    const text = editor?.getText() ?? "";
    const readMinutes = Math.max(1, Math.round(text.length / 400));
    const trim = (s: string) =>
      s
        .split(/[,\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    return {
      slug: slug.trim(),
      title: title.trim(),
      lede: lede.trim(),
      heroImageKey: heroImageKey.trim() || null,
      heroImageAlt: heroImageAlt.trim() || null,
      heroImageCredit: heroImageCredit.trim() || null,
      subjectKind,
      subjectRef: subjectRef.trim(),
      subjectName: subjectName.trim(),
      contentJson: JSON.stringify(json),
      contentHtml: html,
      readMinutes,
      actions: actions.filter((a) => a.label.trim() && a.href.trim()),
      categoryId,
      status,
      publishedAt:
        status === "published"
          ? initial?.publishedAt ?? new Date().toISOString().slice(0, 10)
          : null,
      scheduledAt: null,
      companyCodes: trim(companyCodes),
      industrySlugs: trim(industrySlugs),
      tagSlugs: trim(tagSlugs),
    };
  }, [
    editor,
    slug,
    title,
    lede,
    heroImageKey,
    heroImageAlt,
    heroImageCredit,
    subjectKind,
    subjectRef,
    subjectName,
    categoryId,
    status,
    actions,
    companyCodes,
    industrySlugs,
    tagSlugs,
    initial?.publishedAt,
  ]);

  const save = useCallback(async (): Promise<void> => {
    const input = buildInput();
    // 未入力でガード (新規時、タイトル空なら保存しない)
    if (!input.title || !input.subjectRef || !input.subjectName) {
      setSaveState({ kind: "dirty" });
      return;
    }
    const snap = JSON.stringify(input);
    if (snap === lastSavedSnapshotRef.current) return;
    setSaveState({ kind: "saving" });
    const result = await saveArticleAction(currentId, input);
    if (result.ok) {
      lastSavedSnapshotRef.current = snap;
      setSaveState({ kind: "saved", at: result.savedAt });
      if (currentId == null) {
        setCurrentId(result.id);
        router.replace(`/admin/articles/${result.id}`, { scroll: false });
      }
    } else {
      setSaveState({ kind: "error", msg: result.error });
    }
  }, [buildInput, currentId, router]);

  // 自動保存 (フィールド変更 → 1.5s 後)
  useEffect(() => {
    if (saveState.kind !== "dirty") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save();
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [saveState.kind, save]);

  // dirty マーク: フィールド側
  useEffect(() => {
    setSaveState((prev) => (prev.kind === "saving" ? prev : { kind: "dirty" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    slug,
    lede,
    subjectKind,
    subjectRef,
    subjectName,
    categoryId,
    heroImageKey,
    heroImageAlt,
    heroImageCredit,
    status,
    companyCodes,
    industrySlugs,
    tagSlugs,
    actions,
  ]);

  // 初期マウント時に dirty にしないようにする
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setSaveState({ kind: "idle" });
    }
  }, []);

  // cmd+S 手動保存
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const handlePublish = async () => {
    if (currentId == null) {
      // まず保存してから公開
      await save();
    }
    if (currentId == null) return;
    const next: ArticleStatus = status === "published" ? "draft" : "published";
    const r = await updateStatusAction(currentId, next);
    if (r.ok) setStatus(next);
  };

  const handleDelete = async () => {
    if (currentId == null) {
      router.push("/admin/articles");
      return;
    }
    if (
      !window.confirm(
        "この記事を完全に削除します。元に戻せません。本当に削除しますか?",
      )
    ) {
      return;
    }
    await deleteArticleAction(currentId);
  };

  const updateAction = (i: number, patch: Partial<ArticleAction>) => {
    setActions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const previewHref = currentId != null ? `/v2/articles/${slug}` : null;

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      {/* sticky header */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-2.5 bg-white border-b border-neutral-200 flex items-center gap-3 flex-wrap">
        <Link
          href="/admin/articles"
          className="text-xs font-bold text-neutral-500 hover:text-neutral-900"
        >
          ← 一覧
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          className="flex-1 min-w-[200px] text-sm font-bold bg-transparent focus:outline-none placeholder:text-neutral-400"
        />
        <SaveBadge state={saveState} />
        {previewHref && (
          <Link
            href={previewHref}
            target="_blank"
            className="text-xs font-bold text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1"
          >
            プレビュー ↗
          </Link>
        )}
        <button
          type="button"
          onClick={() => save()}
          className="text-xs font-bold px-3 py-1.5 rounded border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50"
        >
          保存 <kbd className="ml-1 text-[10px] text-neutral-500">⌘S</kbd>
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={currentId == null}
          className={`text-xs font-bold px-3 py-1.5 rounded transition disabled:opacity-50 ${
            status === "published"
              ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
        >
          {status === "published" ? "下書きに戻す" : "公開する"}
        </button>
      </div>

      {/* 2 column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-6">
        <main className="min-w-0">
          {/* slug + lede */}
          <div className="space-y-3 mb-5">
            <SlugInput
              value={slug}
              onChange={(v) => {
                setSlug(v);
                setSlugManuallyEdited(true);
              }}
            />
            <Field label="リード (一覧 & 詳細冒頭に出る要約)">
              <textarea
                value={lede}
                onChange={(e) => setLede(e.target.value)}
                rows={3}
                placeholder="1〜3 文で記事の論旨を要約"
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 focus:bg-white focus:border-neutral-900 focus:outline-none resize-y"
              />
            </Field>
          </div>

          {/* editor */}
          <div className="border border-neutral-200 rounded-lg p-5 bg-white">
            <EditorContent editor={editor} />
          </div>

          {/* footer: ブロック挿入 + 削除 */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <BlockInsertButton
                label="リード"
                onClick={() =>
                  editor?.chain().focus().setNode("lead").run()
                }
              />
              <BlockInsertButton
                label="H2"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
              />
              <BlockInsertButton
                label="引用"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              />
              <BlockInsertButton
                label="箇条書き"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              />
              <BlockInsertButton
                label="番号付き"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              />
              <BlockInsertButton
                label="Callout"
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({
                      type: "callout",
                      attrs: { title: "ここで賭けが入る" },
                      content: [{ type: "paragraph" }],
                    })
                    .run()
                }
              />
              <BlockInsertButton
                label="Stat Grid"
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({
                      type: "statGrid",
                      content: Array.from({ length: 4 }, (_, i) => ({
                        type: "statGridItem",
                        attrs: { label: `項目 ${i + 1}`, sub: "" },
                        content: [{ type: "text", text: "0" }],
                      })),
                    })
                    .run()
                }
              />
              <BlockInsertButton
                label="Ticker"
                onClick={() => {
                  const code = window.prompt("銘柄コード or slug", "9984");
                  if (!code) return;
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({ type: "ticker", attrs: { code } })
                    .run();
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              この記事を削除
            </button>
          </div>
        </main>

        {/* meta panel */}
        <aside className="space-y-5">
          <Field label="カテゴリ" required>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 focus:bg-white focus:border-neutral-900 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="主役 (Subject)" required>
            <div className="flex gap-1 mb-1.5">
              {SUBJECT_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setSubjectKind(k.value)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition ${
                    subjectKind === k.value
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <input
              value={subjectRef}
              onChange={(e) => setSubjectRef(e.target.value)}
              placeholder={
                subjectKind === "company" ? "9984" : "trading-house"
              }
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none font-mono"
            />
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="主役の表示名 (例: ソフトバンクグループ)"
              className="mt-1.5 w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </Field>

          <Field label="カバー画像 (Unsplash photo ID)">
            <input
              value={heroImageKey}
              onChange={(e) => setHeroImageKey(e.target.value)}
              placeholder="photo-1518770660439-..."
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 font-mono focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
            <input
              value={heroImageAlt}
              onChange={(e) => setHeroImageAlt(e.target.value)}
              placeholder="代替テキスト (alt)"
              className="mt-1.5 w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
            <input
              value={heroImageCredit}
              onChange={(e) => setHeroImageCredit(e.target.value)}
              placeholder="クレジット (例: Photo · Taylor Vick / Unsplash)"
              className="mt-1.5 w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </Field>

          <Field label="タグ (カンマ区切り)">
            <input
              value={tagSlugs}
              onChange={(e) => setTagSlugs(e.target.value)}
              placeholder="ai-investment, semiconductor"
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </Field>

          <Field label="関連企業 (銘柄コード、カンマ区切り)">
            <input
              value={companyCodes}
              onChange={(e) => setCompanyCodes(e.target.value)}
              placeholder="9984, 8035"
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 font-mono focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </Field>

          <Field label="関連業界 (slug、カンマ区切り)">
            <input
              value={industrySlugs}
              onChange={(e) => setIndustrySlugs(e.target.value)}
              placeholder="information-tech, semiconductor"
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </Field>

          <Field label="この記事のあとに (最大 3)">
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div
                  key={i}
                  className="border border-neutral-200 rounded-md p-2 space-y-1.5 bg-neutral-50/50"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    アクション {i + 1}
                  </div>
                  <input
                    value={a.label}
                    onChange={(e) => updateAction(i, { label: e.target.value })}
                    placeholder="ラベル (例: ソフトバンクGの詳細)"
                    className="w-full text-sm bg-white border border-neutral-200 rounded px-2 py-1 focus:border-neutral-900 focus:outline-none"
                  />
                  <input
                    value={a.href}
                    onChange={(e) => updateAction(i, { href: e.target.value })}
                    placeholder="リンク (/v2/stocks/9984)"
                    className="w-full text-sm bg-white border border-neutral-200 rounded px-2 py-1 font-mono focus:border-neutral-900 focus:outline-none"
                  />
                  <input
                    value={a.hint ?? ""}
                    onChange={(e) => updateAction(i, { hint: e.target.value })}
                    placeholder="補足 (任意)"
                    className="w-full text-xs bg-white border border-neutral-200 rounded px-2 py-1 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </Field>
        </aside>
      </div>
    </div>
  );
}

// ─── small components ──────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SlugInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="スラッグ (URL の一部、英小文字)" required>
      <div className="flex items-center gap-1 text-sm">
        <span className="text-neutral-400 font-mono">/v2/articles/</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="softbank-ai-quality"
          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 font-mono focus:bg-white focus:border-neutral-900 focus:outline-none"
        />
      </div>
    </Field>
  );
}

function BlockInsertButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-bold px-2 py-1 rounded border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50"
    >
      + {label}
    </button>
  );
}

function SaveBadge({
  state,
}: {
  state:
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: string }
    | { kind: "error"; msg: string }
    | { kind: "dirty" };
}) {
  if (state.kind === "idle") return <span className="text-[11px] text-neutral-400">—</span>;
  if (state.kind === "dirty") {
    return <span className="text-[11px] text-amber-600 font-mono">未保存</span>;
  }
  if (state.kind === "saving") {
    return <span className="text-[11px] text-neutral-500 font-mono">保存中…</span>;
  }
  if (state.kind === "saved") {
    const t = new Date(state.at);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    return (
      <span className="text-[11px] text-emerald-600 font-mono">
        ✓ 保存済 {hh}:{mm}
      </span>
    );
  }
  return (
    <span className="text-[11px] text-rose-600 font-mono truncate max-w-[200px]" title={state.msg}>
      ⚠ {state.msg}
    </span>
  );
}

function safeParseJson(s: string): object {
  try {
    return JSON.parse(s);
  } catch {
    return DEFAULT_CONTENT;
  }
}
