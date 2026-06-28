"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Trash2, Replace, Check, X } from "lucide-react";
import { normalizeImageSrc } from "./_lib/imageSrc";

type Props = {
  value: { key: string; alt: string; credit: string };
  onChange: (next: { key: string; alt: string; credit: string }) => void;
};

export function HeroImageField({ value, onChange }: Props) {
  const [draftKey, setDraftKey] = useState(value.key);
  const [error, setError] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // 親から渡された value.key が変わったら入力も同期
  useEffect(() => setDraftKey(value.key), [value.key]);
  // src が変わったらエラーをクリア
  useEffect(() => setError(false), [value.key]);

  const previewSrc = value.key ? normalizeImageSrc(value.key, 800) : "";

  const commitKey = () => {
    const k = draftKey.trim();
    if (k === value.key) return;
    onChange({ ...value, key: k });
    setPreviewing(false);
  };

  // 未設定
  if (!value.key && !previewing) {
    return (
      <Field label="カバー画像 (任意)">
        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className="w-full aspect-[16/9] rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100 transition flex flex-col items-center justify-center text-neutral-500 text-xs"
        >
          <ImageIcon className="w-5 h-5 mb-1" />
          画像を設定
        </button>
      </Field>
    );
  }

  // URL 入力モード (未設定 → 「画像を設定」を押した) or 値あり時は値ありレイアウト
  if (!value.key && previewing) {
    return (
      <Field label="カバー画像 (任意)">
        <div className="rounded-lg border border-neutral-300 bg-white p-3 space-y-2">
          <KeyInput
            value={draftKey}
            onChange={setDraftKey}
            onCommit={commitKey}
            onCancel={() => {
              setPreviewing(false);
              setDraftKey("");
            }}
          />
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            Unsplash の <code className="font-mono">photo-...</code> ID、または{" "}
            <code className="font-mono">https://</code> で始まる URL を貼り付け。
          </p>
        </div>
      </Field>
    );
  }

  // 値あり: プレビュー + 操作 + alt/credit インライン編集
  return (
    <Field label="カバー画像">
      <div className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
        <div className="relative aspect-[16/9] bg-neutral-100 group">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-600 bg-rose-50">
              画像が読み込めませんでした
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={value.alt}
              onError={() => setError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <IconChip
              icon={Replace}
              label="差し替え"
              onClick={() => {
                setDraftKey(value.key);
                onChange({ ...value, key: "" });
                setPreviewing(true);
              }}
            />
            <IconChip
              icon={Trash2}
              label="外す"
              tone="danger"
              onClick={() => onChange({ key: "", alt: "", credit: "" })}
            />
          </div>
        </div>
        <div className="p-2 space-y-2 border-t border-neutral-100 bg-neutral-50/40">
          <InlineLabel label="代替テキスト (alt)">
            <input
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="画像が表示できない時の説明"
              className="w-full text-xs bg-white border border-neutral-200 rounded px-2 py-1 focus:border-neutral-900 focus:outline-none"
            />
          </InlineLabel>
          <InlineLabel label="クレジット">
            <input
              value={value.credit}
              onChange={(e) => onChange({ ...value, credit: e.target.value })}
              placeholder="Photo · 撮影者 / 出典"
              className="w-full text-xs bg-white border border-neutral-200 rounded px-2 py-1 focus:border-neutral-900 focus:outline-none"
            />
          </InlineLabel>
          <div className="text-[10px] font-mono text-neutral-400 truncate" title={value.key}>
            {value.key}
          </div>
        </div>
      </div>
    </Field>
  );
}

function KeyInput({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit();
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="photo-1518770660439-... or https://..."
        className="flex-1 text-xs font-mono px-2 py-1.5 bg-neutral-50 border border-neutral-300 rounded focus:bg-white focus:border-neutral-900 focus:outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommit();
        }}
        className="p-1.5 text-neutral-500 hover:text-neutral-900"
        title="設定"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        className="p-1.5 text-neutral-500 hover:text-rose-600"
        title="キャンセル"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function IconChip({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  const cls =
    tone === "danger"
      ? "text-rose-600 hover:text-rose-700 hover:border-rose-400"
      : "text-neutral-700";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-7 h-7 inline-flex items-center justify-center rounded bg-white/95 backdrop-blur border border-neutral-200 shadow-sm hover:bg-white hover:border-neutral-400 ${cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function InlineLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
