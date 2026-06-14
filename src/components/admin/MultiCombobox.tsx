"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * 複数選択 Combobox。
 *
 * - 候補は `options` (固定リスト)、または `loadOptions` (検索クエリ → 候補) で渡す
 * - 値は `value: string[]` (option の value で識別)
 * - `allowCreate` で「入力中の文字列を新規に追加」を許可 (タグ用)
 * - `resolveLabel` で値からラベルを解決できる (動的検索のとき、選択時に親が
 *   ラベルを記録しておけば、 検索クエリが変わって候補から消えてもバッジ表示できる)
 */
export type ComboOption = {
  value: string;
  label: string;
  hint?: string;
};

export function MultiCombobox({
  value,
  onChange,
  options,
  loadOptions,
  placeholder = "選択",
  searchPlaceholder = "検索…",
  emptyText = "見つかりません",
  allowCreate = false,
  formatBadge,
  resolveLabel,
}: {
  value: string[];
  onChange: (next: string[], selectedOption?: ComboOption) => void;
  /** 固定リスト */
  options?: ComboOption[];
  /** 動的検索 (例: /api/search を叩く) */
  loadOptions?: (query: string) => Promise<ComboOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreate?: boolean;
  /** バッジ内に表示する文字列 (デフォルトは label) */
  formatBadge?: (option: ComboOption) => string;
  /** 値からラベルを解決する関数。動的検索のとき親側で記録しておく */
  resolveLabel?: (value: string) => string | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [dynamicOptions, setDynamicOptions] = React.useState<ComboOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const allOptions = options ?? dynamicOptions;

  // 動的 loadOptions の debounce
  React.useEffect(() => {
    if (!loadOptions) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await loadOptions(query);
        setDynamicOptions(res);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, loadOptions]);

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  function toggle(o: ComboOption) {
    if (selectedSet.has(o.value)) {
      onChange(
        value.filter((x) => x !== o.value),
        o,
      );
    } else {
      onChange([...value, o.value], o);
    }
  }

  function remove(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  function getBadgeText(v: string): string {
    const cached = allOptions.find((o) => o.value === v);
    if (cached) {
      return formatBadge ? formatBadge(cached) : cached.label;
    }
    return resolveLabel?.(v) ?? v;
  }

  const trimmed = query.trim();
  const canCreate =
    allowCreate &&
    trimmed.length > 0 &&
    !allOptions.some((o) => o.value === trimmed) &&
    !value.includes(trimmed);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={value.length === 0 ? "text-muted-foreground" : ""}>
              {value.length === 0
                ? placeholder
                : `${value.length} 件選択中`}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={!loadOptions}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="px-3 py-2 text-xs text-muted-foreground">読み込み中…</div>
              )}
              {!loading && allOptions.length === 0 && !canCreate && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              {allOptions.length > 0 && (
                <CommandGroup>
                  {allOptions.map((o) => (
                    <CommandItem
                      key={o.value}
                      value={o.value}
                      data-checked={selectedSet.has(o.value)}
                      onSelect={() => toggle(o)}
                    >
                      <Check
                        className={cn(
                          "mr-1 size-4",
                          selectedSet.has(o.value) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{o.label}</span>
                      {o.hint && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {o.hint}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <CommandGroup heading="新規">
                  <CommandItem
                    value={`__create__${trimmed}`}
                    onSelect={() => {
                      const newOpt: ComboOption = { value: trimmed, label: trimmed };
                      if (!value.includes(trimmed)) {
                        onChange([...value, trimmed], newOpt);
                      }
                      setQuery("");
                    }}
                  >
                    「{trimmed}」を追加
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pr-1 pl-2 py-0.5"
            >
              {getBadgeText(v)}
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label="削除"
                className="ml-1 rounded-sm p-0.5 hover:bg-foreground/10 transition"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
