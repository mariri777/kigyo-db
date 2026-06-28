"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Trash2,
  Replace,
  Check,
  X,
  Upload,
} from "lucide-react";
import { resolveMediaSrc } from "@/shared/media";
import { uploadImage } from "./_lib/uploadImage";

type Props = {
  value: { key: string; alt: string; credit: string };
  onChange: (next: { key: string; alt: string; credit: string }) => void;
};

export function HeroImageField({ value, onChange }: Props) {
  const [draftKey, setDraftKey] = useState(value.key);
  const [error, setError] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraftKey(value.key), [value.key]);
  useEffect(() => setError(false), [value.key]);

  const previewSrc = resolveMediaSrc(value.key, { w: 800 });

  const commitKey = () => {
    const k = draftKey.trim();
    if (k === value.key) return;
    onChange({ ...value, key: k });
    setPreviewing(false);
  };

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const { key } = await uploadImage(file);
      onChange({ ...value, key });
      setPreviewing(false);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "アップロードに失敗");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  // 未設定 & まだ URL/ファイル選択していない
  if (!value.key && !previewing) {
    return (
      <Field label="カバー画像 (任意)">
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`w-full aspect-[16/9] rounded-lg border-2 border-dashed transition flex flex-col items-center justify-center text-xs gap-2 ${
            dragOver
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-500 hover:bg-neutral-100"
          }`}
        >
          {uploading ? (
            <span className="text-neutral-600">アップロード中…</span>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              <span>ここに画像をドロップ</span>
              <div className="flex items-center gap-2 mt-1">
                <PrimaryButton onClick={onPickFile} icon={Upload}>
                  ファイルを選択
                </PrimaryButton>
                <span className="text-neutral-400">/</span>
                <SecondaryButton onClick={() => setPreviewing(true)}>
                  URL を貼り付け
                </SecondaryButton>
              </div>
              {uploadError && (
                <div className="text-rose-600 mt-1">{uploadError}</div>
              )}
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </Field>
    );
  }

  // URL 入力モード
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
            Unsplash の <code className="font-mono">photo-...</code> ID、 R2 オブジェクトキー、
            または <code className="font-mono">https://</code> で始まる URL。
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
          ) : previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={value.alt}
              onError={() => setError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <IconChip
              icon={Upload}
              label="新しい画像をアップロード"
              onClick={onPickFile}
            />
            <IconChip
              icon={Replace}
              label="URL を差し替え"
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
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 text-white text-xs font-bold">
              アップロード中…
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {uploadError && (
          <div className="px-2 py-1 text-[11px] text-rose-600 bg-rose-50 border-t border-rose-100">
            {uploadError}
          </div>
        )}
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
        placeholder="photo-... / articles/2026/06/abc.jpg / https://..."
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

function PrimaryButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: typeof Upload;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 text-white text-[11px] font-bold hover:bg-neutral-800"
    >
      <Icon className="w-3 h-3" />
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] text-neutral-600 hover:text-neutral-900 underline"
    >
      {children}
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
