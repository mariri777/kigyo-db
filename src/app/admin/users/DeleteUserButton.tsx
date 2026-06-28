"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAdminUserAction } from "@/server/blog/userActions";

export function DeleteUserButton({ userId, name }: { userId: number; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-muted-foreground hover:text-red-400 transition"
        aria-label={`${name} を削除`}
      >
        削除
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ユーザーを削除"
        description={
          <>
            <span className="text-foreground font-medium">{name}</span>{" "}
            を完全に削除します。この操作は取り消せません。
          </>
        }
        confirmWord="削除"
        confirmLabel="削除する"
        confirmVariant="destructive"
        formAction={deleteAdminUserAction}
        formFields={{ userId }}
      />
    </>
  );
}
