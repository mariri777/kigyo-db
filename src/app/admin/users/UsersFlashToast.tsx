"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const DELETE_TOASTS: Record<string, { tone: "success" | "error"; text: string }> = {
  "1": { tone: "success", text: "ユーザーを削除しました。" },
  self: { tone: "error", text: "自分自身は削除できません。" },
  last: { tone: "error", text: "最後の管理者ユーザーは削除できません。" },
  missing: { tone: "error", text: "対象のユーザーが見つかりませんでした。" },
  invalid: { tone: "error", text: "削除リクエストが不正です。" },
};

export function UsersFlashToast() {
  const router = useRouter();
  const params = useSearchParams();
  const created = params.get("created");
  const deleted = params.get("deleted");

  useEffect(() => {
    let fired = false;
    if (created === "1") {
      toast.success("新しいユーザーを発行しました。");
      fired = true;
    }
    if (deleted) {
      const t = DELETE_TOASTS[deleted];
      if (t) {
        toast[t.tone](t.text);
        fired = true;
      }
    }
    if (fired) {
      // クエリを消してリロード時の二重発火を防ぐ
      router.replace("/admin/users", { scroll: false });
    }
  }, [created, deleted, router]);

  return null;
}
