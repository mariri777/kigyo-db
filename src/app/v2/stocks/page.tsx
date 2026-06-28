import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getDb } from "@/server/db/client";
import { companies, stockSnapshot, stocks } from "@/server/db/schema";

const PAGE_SIZE = 50;

type SortKey = "marketCap" | "change1d" | "per" | "yield" | "code";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "marketCap", label: "時価総額" },
  { key: "change1d", label: "前日比" },
  { key: "per", label: "PER" },
  { key: "yield", label: "配当利回り" },
  { key: "code", label: "コード" },
];

export const metadata: Metadata = {
  title: "銘柄一覧 — 東証 3,800 社のAI分析",
  description:
    "東証プライム・スタンダード・グロース 約3,800社の銘柄一覧。コード・社名検索、JPX 33業種フィルタ、時価総額・前日比・PER・配当利回りでソートし、AI分析つき個別ページへ。",
  alternates: { canonical: "/v2/stocks" },
  openGraph: {
    title: "銘柄一覧 — 東証 3,800 社のAI分析 | 超!企業DB",
    description:
      "コード・社名検索、JPX 33業種フィルタ、各種ソートで東証 3,800 社から目的の銘柄をすばやく特定。",
    url: "/v2/stocks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "銘柄一覧 — 東証 3,800 社のAI分析 | 超!企業DB",
    description:
      "コード・社名検索、JPX 33業種フィルタ、各種ソートで東証 3,800 社から目的の銘柄をすばやく特定。",
  },
};

type SearchParams = Promise<{
  q?: string;
  sector?: string;
  exchange?: string;
  sort?: string;
  page?: string;
}>;

export default async function StocksIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sector = (sp.sector ?? "").trim();
  const exchange = (sp.exchange ?? "").trim();
  const sortKey: SortKey = isSortKey(sp.sort) ? sp.sort : "marketCap";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const db = await getDb();

  // ── WHERE 句構築 ─────────────────────────────────
  const conditions = [] as ReturnType<typeof eq>[];
  if (q) {
    const pat = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`LOWER(${companies.name})`, pat),
        like(sql`LOWER(${companies.nameEn})`, pat),
        like(sql`LOWER(${stocks.code})`, pat),
      )!,
    );
  }
  if (sector) conditions.push(eq(stocks.sectorTse, sector));
  if (exchange === "Prime" || exchange === "Standard" || exchange === "Growth") {
    conditions.push(eq(stocks.exchange, exchange));
  }
  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  // ── ORDER BY ──────────────────────────────────────
  const orderExpr = (() => {
    switch (sortKey) {
      case "code":
        return asc(stocks.code);
      case "change1d":
        return desc(stockSnapshot.change1dPct);
      case "per":
        // 低い順。NULL は最後
        return sql`${stockSnapshot.per} IS NULL, ${stockSnapshot.per} ASC`;
      case "yield":
        return desc(stockSnapshot.dividendYield);
      case "marketCap":
      default:
        return desc(stockSnapshot.marketCapOku);
    }
  })();

  // ── 件数 + ページ ──────────────────────────────────
  const baseFrom = db
    .select({ c: sql<number>`COUNT(*)` })
    .from(stocks)
    .innerJoin(companies, eq(companies.id, stocks.companyId))
    .leftJoin(stockSnapshot, eq(stockSnapshot.code, stocks.code));
  const totalRow = (
    whereExpr ? await baseFrom.where(whereExpr).all() : await baseFrom.all()
  )[0];
  const total = Number(totalRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  // ── 一覧取得 ──────────────────────────────────────
  const rowsQ = db
    .select({
      code: stocks.code,
      name: companies.name,
      nameEn: companies.nameEn,
      exchange: stocks.exchange,
      sector: stocks.sectorTse,
      price: stockSnapshot.priceJpy,
      change1d: stockSnapshot.change1dPct,
      marketCapOku: stockSnapshot.marketCapOku,
      per: stockSnapshot.per,
      pbr: stockSnapshot.pbr,
      dividendYield: stockSnapshot.dividendYield,
    })
    .from(stocks)
    .innerJoin(companies, eq(companies.id, stocks.companyId))
    .leftJoin(stockSnapshot, eq(stockSnapshot.code, stocks.code))
    .orderBy(orderExpr)
    .limit(PAGE_SIZE)
    .offset(offset);
  const rows = whereExpr ? await rowsQ.where(whereExpr).all() : await rowsQ.all();

  // ── セクター候補(プルダウン) ────────────────────
  const sectorRows = await db
    .selectDistinct({ sector: stocks.sectorTse })
    .from(stocks)
    .orderBy(asc(stocks.sectorTse))
    .all();
  const sectorOptions = sectorRows.map((r) => r.sector).filter(Boolean);

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        <Breadcrumb />

        <header className="flex items-end justify-between gap-3 flex-wrap pb-3 border-b-2 border-neutral-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              銘柄一覧
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              東証 <span className="font-mono tabular font-bold">{total.toLocaleString()}</span> 件
              {(q || sector || exchange) && " (絞り込み後)"}
            </p>
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            {safePage} / {totalPages} ページ
          </div>
        </header>

        <FilterBar
          q={q}
          sector={sector}
          exchange={exchange}
          sortKey={sortKey}
          sectorOptions={sectorOptions}
        />

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <Th className="text-left w-[88px]">コード</Th>
                  <Th className="text-left">銘柄名</Th>
                  <Th className="text-left hidden md:table-cell w-[140px]">業界</Th>
                  <Th className="text-center hidden sm:table-cell w-[64px]">市場</Th>
                  <Th className="text-right w-[100px]">株価</Th>
                  <Th className="text-right w-[88px]">前日比</Th>
                  <Th className="text-right hidden lg:table-cell w-[120px]">時価総額</Th>
                  <Th className="text-right hidden lg:table-cell w-[72px]">PER</Th>
                  <Th className="text-right hidden xl:table-cell w-[80px]">配当利回</Th>
                  <Th className="w-[36px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-sm text-neutral-500">
                      該当する銘柄が見つかりませんでした。
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <StockRow key={r.code} row={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={total}
          q={q}
          sector={sector}
          exchange={exchange}
          sort={sortKey}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <nav className="text-xs text-neutral-500 flex items-center gap-1.5">
      <Link href="/v2" className="inline-flex items-center gap-1 hover:text-neutral-900">
        <ChevronLeft className="w-3 h-3" />
        ホーム
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="text-neutral-700 font-semibold">銘柄一覧</span>
    </nav>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 font-bold ${className}`}>{children}</th>
  );
}

function FilterBar({
  q,
  sector,
  exchange,
  sortKey,
  sectorOptions,
}: {
  q: string;
  sector: string;
  exchange: string;
  sortKey: SortKey;
  sectorOptions: string[];
}) {
  return (
    <form
      action="/v2/stocks"
      method="get"
      className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3"
    >
      <div className="flex items-center bg-neutral-50 rounded-lg pl-2.5 pr-1 flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:bg-white transition">
        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="銘柄コード・社名で検索 (例: 7203, トヨタ)"
          className="flex-1 bg-transparent px-2.5 py-2 text-sm placeholder:text-neutral-400 focus:outline-none"
          aria-label="銘柄検索"
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
        <Filter className="w-3.5 h-3.5" />
        <select
          name="sector"
          defaultValue={sector}
          className="bg-neutral-50 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
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
        className="bg-neutral-50 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        aria-label="市場で絞り込み"
      >
        <option value="">すべての市場</option>
        <option value="Prime">プライム</option>
        <option value="Standard">スタンダード</option>
        <option value="Growth">グロース</option>
      </select>

      <select
        name="sort"
        defaultValue={sortKey}
        className="bg-neutral-50 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        aria-label="並び替え"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            並び:{o.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition"
      >
        適用
      </button>

      {(q || sector || exchange || sortKey !== "marketCap") && (
        <Link
          href="/v2/stocks"
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 underline-offset-2 hover:underline"
        >
          条件をクリア
        </Link>
      )}
    </form>
  );
}

type Row = {
  code: string;
  name: string;
  nameEn: string | null;
  exchange: "Prime" | "Standard" | "Growth";
  sector: string;
  price: number | null;
  change1d: number | null;
  marketCapOku: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
};

function StockRow({ row: r }: { row: Row }) {
  const positive = r.change1d != null && r.change1d >= 0;
  return (
    <tr className="hover:bg-neutral-50 transition group">
      <td className="px-3 py-3 font-mono tabular text-sm font-bold text-neutral-900">
        <Link href={`/v2/stocks/${r.code}`} className="hover:underline">
          {r.code}
        </Link>
      </td>
      <td className="px-3 py-3 min-w-0">
        <Link href={`/v2/stocks/${r.code}`} className="block group/n">
          <div className="font-bold text-sm tracking-tight truncate group-hover/n:text-neutral-900">
            {r.name}
          </div>
          {r.nameEn && (
            <div className="text-[10px] text-neutral-500 truncate">{r.nameEn}</div>
          )}
        </Link>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <Link
          href={`/v2/stocks?sector=${encodeURIComponent(r.sector)}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 transition"
        >
          <Building2 className="w-3 h-3" />
          {r.sector}
        </Link>
      </td>
      <td className="px-3 py-3 hidden sm:table-cell text-center">
        <ExchangeBadge exchange={r.exchange} />
      </td>
      <td className="px-3 py-3 text-right font-mono tabular font-semibold">
        {r.price != null ? `¥${r.price.toLocaleString()}` : "—"}
      </td>
      <td className="px-3 py-3 text-right font-mono tabular">
        {r.change1d == null ? (
          <span className="text-neutral-400">—</span>
        ) : (
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {positive ? "+" : ""}
            {r.change1d.toFixed(2)}%
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-right hidden lg:table-cell font-mono tabular text-neutral-700">
        {formatOku(r.marketCapOku)}
      </td>
      <td className="px-3 py-3 text-right hidden lg:table-cell font-mono tabular text-neutral-700">
        {r.per != null ? `${r.per.toFixed(1)}x` : "—"}
      </td>
      <td className="px-3 py-3 text-right hidden xl:table-cell font-mono tabular text-neutral-700">
        {r.dividendYield != null ? `${r.dividendYield.toFixed(2)}%` : "—"}
      </td>
      <td className="px-3 py-3 text-right">
        <Link
          href={`/v2/stocks/${r.code}`}
          aria-label={`${r.name} の詳細`}
          className="inline-flex w-7 h-7 items-center justify-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}

function ExchangeBadge({ exchange }: { exchange: Row["exchange"] }) {
  const map = {
    Prime: { label: "Prime", color: "bg-emerald-50 text-emerald-700" },
    Standard: { label: "Std", color: "bg-blue-50 text-blue-700" },
    Growth: { label: "Growth", color: "bg-purple-50 text-purple-700" },
  } as const;
  const m = map[exchange];
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${m.color}`}>
      {m.label}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  q,
  sector,
  exchange,
  sort,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  sector: string;
  exchange: string;
  sort: SortKey;
}) {
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sector) params.set("sector", sector);
    if (exchange) params.set("exchange", exchange);
    if (sort !== "marketCap") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/v2/stocks?${s}` : "/v2/stocks";
  };

  if (totalPages <= 1) {
    return (
      <p className="text-center text-[11px] text-neutral-500 font-mono">
        {total.toLocaleString()} 件すべて表示
      </p>
    );
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <nav className="flex items-center justify-between gap-3 flex-wrap pt-1">
      <p className="text-[11px] text-neutral-500 font-mono">
        {start.toLocaleString()}–{end.toLocaleString()} / {total.toLocaleString()} 件
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={hrefFor(page - 1)} disabled={page === 1}>
          <ChevronLeft className="w-3.5 h-3.5" /> 前へ
        </PageLink>
        <span className="px-3 text-xs font-mono tabular text-neutral-700">
          {page} / {totalPages}
        </span>
        <PageLink href={hrefFor(page + 1)} disabled={page === totalPages}>
          次へ <ChevronRight className="w-3.5 h-3.5" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md text-neutral-300 cursor-not-allowed">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition"
    >
      {children}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────

function isSortKey(v: string | undefined): v is SortKey {
  return v === "marketCap" || v === "change1d" || v === "per" || v === "yield" || v === "code";
}

function formatOku(oku: number | null | undefined): string {
  if (oku == null) return "—";
  if (oku >= 10000) return `${(oku / 10000).toFixed(2)}兆円`;
  if (oku >= 1000) return `${oku.toLocaleString()}億円`;
  return `${oku.toLocaleString()}億`;
}
