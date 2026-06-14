"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { MultiCombobox, type ComboOption } from "@/components/admin/MultiCombobox";

export type RelationsInitial = {
  relatedStocks: string[];
  /** 編集中の永続値からラベルを復元するための初期マップ */
  relatedStocksLabels?: Record<string, string>;
  relatedIndustries: string[];
  tagSlugs: string[];
};

/**
 * 関連銘柄(動的検索) + 関連業界(固定) + タグ(固定 + 新規) を 3 列で並べる。
 * 値は内部 state に持ち、 hidden input でフォーム submit 時に CSV 文字列として渡す。
 */
export function PostRelations({
  initial,
  availableTags,
  availableIndustries,
}: {
  initial: RelationsInitial;
  availableTags: { slug: string; name: string }[];
  availableIndustries: { slug: string; name: string }[];
}) {
  const [relatedStocks, setRelatedStocks] = useState(initial.relatedStocks);
  const [relatedIndustries, setRelatedIndustries] = useState(initial.relatedIndustries);
  const [tagSlugs, setTagSlugs] = useState(initial.tagSlugs);

  // 動的検索の Combobox では、検索クエリを変えると候補から消えてしまった既選択銘柄の
  // ラベル(会社名)が引けなくなる。親側で「過去に出会ったラベル」を蓄積する。
  const [stockLabels, setStockLabels] = useState<Record<string, string>>(
    () => initial.relatedStocksLabels ?? {},
  );

  const tagOptions: ComboOption[] = useMemo(
    () => availableTags.map((t) => ({ value: t.slug, label: t.name })),
    [availableTags],
  );
  const industryOptions: ComboOption[] = useMemo(
    () =>
      availableIndustries.map((i) => ({
        value: i.slug,
        label: i.name,
        hint: i.slug,
      })),
    [availableIndustries],
  );

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <input type="hidden" name="relatedStocks" value={relatedStocks.join(",")} />
      <input type="hidden" name="relatedIndustries" value={relatedIndustries.join(",")} />
      <input type="hidden" name="tagSlugs" value={tagSlugs.join(",")} />

      <div>
        <Label className="mb-2 block">関連銘柄</Label>
        <MultiCombobox
          value={relatedStocks}
          onChange={(next, selected) => {
            setRelatedStocks(next);
            if (selected) {
              setStockLabels((prev) =>
                prev[selected.value] === selected.label
                  ? prev
                  : { ...prev, [selected.value]: selected.label },
              );
            }
          }}
          loadOptions={loadStockOptions}
          placeholder="銘柄を検索して追加"
          searchPlaceholder="コード または 会社名 で検索"
          emptyText="該当銘柄なし"
          resolveLabel={(code) => stockLabels[code]}
        />
      </div>
      <div>
        <Label className="mb-2 block">関連業界</Label>
        <MultiCombobox
          value={relatedIndustries}
          onChange={setRelatedIndustries}
          options={industryOptions}
          placeholder="業界を選択"
          searchPlaceholder="業界名で検索"
          emptyText="該当業界なし"
        />
      </div>
      <div>
        <Label className="mb-2 block">タグ</Label>
        <MultiCombobox
          value={tagSlugs}
          onChange={setTagSlugs}
          options={tagOptions}
          placeholder="タグを選択 / 追加"
          searchPlaceholder="タグ名で検索"
          allowCreate
          emptyText="候補なし"
        />
      </div>
    </div>
  );
}

async function loadStockOptions(q: string): Promise<ComboOption[]> {
  const params = new URLSearchParams({ q });
  const res = await fetch(`/api/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results: { code: string; name: string }[];
  };
  return data.results.map((r) => ({
    value: r.code,
    label: `${r.code} — ${r.name}`,
    hint: r.code,
  }));
}
