"use client";

import { useActionState, useState } from "react";
import type { PostFormResult } from "@/server/blog/actions";
import { Button } from "@/components/ui/button";
import { PostMetaFields, type MetaInitial } from "./PostMetaFields";
import { PostRelations, type RelationsInitial } from "./PostRelations";
import { RichTextEditor } from "./RichTextEditor";

export type PostInitial = MetaInitial &
  RelationsInitial & {
    id?: number;
    bodyHtml: string;
    status: "draft" | "published";
  };

type ServerAction = (
  prev: PostFormResult | undefined,
  formData: FormData,
) => Promise<PostFormResult>;

const INITIAL: PostFormResult = { ok: false };

/**
 * 記事編集フォーム全体の親。
 * 構成は PostMetaFields(タイトル/スラッグ/カテゴリ等) + PostRelations(関連銘柄/業界/タグ) +
 * RichTextEditor(本文 WYSIWYG)。 hidden input + submitter button.value で
 * 「下書き」「公開」の intent を Server Action に渡す。
 */
export function PostEditor({
  action,
  initial,
  submitLabel,
  availableTags,
  availableIndustries,
}: {
  action: ServerAction;
  initial: PostInitial;
  submitLabel: string;
  availableTags: { slug: string; name: string }[];
  availableIndustries: { slug: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [intent, setIntent] = useState<"draft" | "publish">(
    initial.status === "published" ? "publish" : "draft",
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="intent" value={intent} />

      <PostMetaFields initial={initial} fieldErrors={state.fieldErrors} />
      <PostRelations
        initial={initial}
        availableTags={availableTags}
        availableIndustries={availableIndustries}
      />
      <RichTextEditor
        name="bodyHtml"
        initialHtml={initial.bodyHtml}
        error={state.fieldErrors?.bodyHtml}
      />

      {state.error && (
        <div className="bg-surface-elev border-l-2 border-red-500 text-sm text-red-300 p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Button
          type="submit"
          name="intentSubmit"
          value="draft"
          variant="outline"
          disabled={pending}
          onClick={() => setIntent("draft")}
        >
          下書き保存
        </Button>
        <Button
          type="submit"
          name="intentSubmit"
          value="publish"
          disabled={pending}
          onClick={() => setIntent("publish")}
        >
          {initial.status === "published" ? "更新して公開" : "公開する"}
        </Button>
        {pending && <span className="text-xs text-muted-foreground">{submitLabel}…</span>}
      </div>
    </form>
  );
}
