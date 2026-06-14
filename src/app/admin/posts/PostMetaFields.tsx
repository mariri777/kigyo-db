"use client";

import { Field, FieldTextArea, SelectField } from "./_fields";

const CATEGORY_OPTIONS = [
  { value: "earnings", label: "決算分析" },
  { value: "industry-watch", label: "業界ウォッチ" },
  { value: "analysis", label: "オリジナル分析" },
  { value: "disclosure", label: "適時開示読み解き" },
  { value: "primer", label: "3 分でわかる" },
];

const AUTHOR_OPTIONS = [
  { value: "editor", label: "編集部" },
  { value: "ai-editor", label: "AI + 編集部レビュー" },
];

export type MetaInitial = {
  title: string;
  slug: string;
  lede: string;
  category: string;
  author: "editor" | "ai-editor";
  fiscalPeriod: string;
  publishedAt: string;
};

/**
 * 記事のメタ情報フォーム部分 (タイトル / スラッグ / リード / カテゴリ / 執筆者 / 公開日 / 決算期)。
 * フォーム要素は uncontrolled で、submit 時に Server Action が FormData から拾う。
 */
export function PostMetaFields({
  initial,
  fieldErrors,
}: {
  initial: MetaInitial;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="タイトル"
          name="title"
          required
          defaultValue={initial.title}
          error={fieldErrors?.title}
        />
        <Field
          label="スラッグ (URL)"
          name="slug"
          required
          defaultValue={initial.slug}
          mono
          error={fieldErrors?.slug}
          hint="英小文字・数字・ハイフン"
        />
      </div>

      <FieldTextArea
        label="リード文 (一覧・OG で使う要約)"
        name="lede"
        required
        rows={3}
        defaultValue={initial.lede}
        error={fieldErrors?.lede}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <SelectField
          label="カテゴリ"
          name="category"
          defaultValue={initial.category}
          options={CATEGORY_OPTIONS}
          error={fieldErrors?.category}
        />
        <SelectField
          label="執筆者"
          name="author"
          defaultValue={initial.author}
          options={AUTHOR_OPTIONS}
        />
        <Field
          label="公開日 (YYYY-MM-DD)"
          name="publishedAt"
          type="date"
          defaultValue={initial.publishedAt}
          hint="公開時に未入力なら本日"
        />
      </div>

      <Field
        label="対象決算期 (任意)"
        name="fiscalPeriod"
        defaultValue={initial.fiscalPeriod}
        hint="例: 2025年3月期 通期"
      />
    </>
  );
}
