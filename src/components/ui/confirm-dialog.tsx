"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

export type ConfirmDialogProps = {
  /** 制御モード: 親で open を握りたい場合 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** 非制御モード: トリガーをこの中にラップする */
  trigger?: React.ReactNode;

  title: React.ReactNode;
  description?: React.ReactNode;

  /** "delete" のように厳密一致を求めたい場合に指定 */
  confirmWord?: string;
  /** confirmWord 入力欄の placeholder。未指定なら confirmWord を流用 */
  confirmWordPlaceholder?: string;

  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;

  /** 確定時に呼ばれる。Promise を返すと pending 表示する。formAction を使う場合は不要。 */
  onConfirm?: () => void | Promise<void>;

  /** 確定後にダイアログを閉じるか。デフォルト true */
  closeOnConfirm?: boolean;

  /** ボタンを Server Action の `<form action>` に流したいユースケース用。
   * 与えると onConfirm は無視され、フォームが submit される。 */
  formAction?: (formData: FormData) => void | Promise<void>;
  /** formAction に渡したい hidden フィールド */
  formFields?: Record<string, string | number>;
};

export function ConfirmDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
  title,
  description,
  confirmWord,
  confirmWordPlaceholder,
  cancelLabel = "キャンセル",
  confirmLabel = "OK",
  confirmVariant = "default",
  onConfirm,
  closeOnConfirm = true,
  formAction,
  formFields,
}: ConfirmDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [confirmInput, setConfirmInput] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setConfirmInput("");
        setPending(false);
      }
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const canConfirm = !pending && (!confirmWord || confirmInput === confirmWord);

  const runConfirm = async () => {
    if (!canConfirm || formAction || !onConfirm) return;
    try {
      setPending(true);
      await onConfirm();
      if (closeOnConfirm) setOpen(false);
    } finally {
      setPending(false);
    }
  };

  const body = (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      {confirmWord && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            続行するには
            <span className="mx-1 px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
              {confirmWord}
            </span>
            と入力してください。
          </p>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={confirmWordPlaceholder ?? confirmWord}
            className={cn(
              "w-full bg-background border border-border rounded-md px-3 py-2 text-sm",
              "focus:outline-none focus:border-border-strong",
            )}
            autoFocus
          />
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        {formAction ? (
          <Button
            type="submit"
            variant={confirmVariant}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant={confirmVariant}
            disabled={!canConfirm}
            onClick={runConfirm}
          >
            {pending ? "処理中…" : confirmLabel}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  return (
    <>
      {trigger && !isControlled && (
        <span
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {trigger}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {formAction ? (
            <form action={formAction} className="contents">
              {formFields &&
                Object.entries(formFields).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
              {body}
            </form>
          ) : (
            body
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
