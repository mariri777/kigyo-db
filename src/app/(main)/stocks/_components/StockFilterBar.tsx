"use client";

import { useRef } from "react";
import Form from "next/form";
import Link from "next/link";
import { Filter, Search } from "lucide-react";

/**
 * 銘柄一覧のフィルタバー。
 *  - action="/stocks" の GET フォーム(next/form でクライアント遷移 + prefetch)。
 *  - 業界 / 市場の <select> は変更で即 requestSubmit()。「適用」ボタンは廃止。
 *  - 検索 <input> は Enter (フォーム submit) のまま。即時 submit はしない。
 *  - ページ番号は絞り込み変更でリセットしたいので、page パラメータは持たない。
 */
export function StockFilterBar({
  q,
  sector,
  exchange,
  sectorOptions,
}: {
  q: string;
  sector: string;
  exchange: string;
  sectorOptions: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const submitNow = () => formRef.current?.requestSubmit();

  return (
    <Form
      ref={formRef}
      action="/stocks"
      scroll={false}
      className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3"
    >
      <div className="flex items-center bg-neutral-50 rounded-lg pl-2.5 pr-1 flex-1 min-w-[200px] focus-within:bg-white transition">
        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          autoComplete="off"
          placeholder="銘柄コード・社名で検索 (例: 7203, トヨタ)"
          className="flex-1 bg-transparent px-2.5 py-2 text-sm placeholder:text-neutral-400"
          aria-label="銘柄検索"
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
        <Filter className="w-3.5 h-3.5" />
        <select
          name="sector"
          defaultValue={sector}
          onChange={submitNow}
          className="bg-white text-neutral-900 rounded-lg px-2.5 py-2 text-sm font-semibold"
          aria-label="業界で絞り込み"
        >
          <option value="">すべての業界</option>
          {sectorOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <select
        name="exchange"
        defaultValue={exchange}
        onChange={submitNow}
        className="bg-white text-neutral-900 rounded-lg px-2.5 py-2 text-sm font-semibold"
        aria-label="市場で絞り込み"
      >
        <option value="">すべての市場</option>
        <option value="Prime">プライム</option>
        <option value="Standard">スタンダード</option>
        <option value="Growth">グロース</option>
      </select>

      {(q || sector || exchange) && (
        <Link
          href="/stocks"
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 underline-offset-2 hover:underline"
        >
          条件をクリア
        </Link>
      )}
    </Form>
  );
}
