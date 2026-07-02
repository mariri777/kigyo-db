import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getDb } from "@/server/db/client";
import { companies, stockSnapshot, stocks } from "@/server/db/schema";
import { StockFilterBar } from "./_components/StockFilterBar";

const PAGE_SIZE = 50;

type SortKey =
  | "code"
  | "name"
  | "sector"
  | "exchange"
  | "price"
  | "change1d"
  | "marketCap"
  | "per"
  | "yield";
type SortDir = "asc" | "desc";

// 列ごとのデフォルト方向(クリック時に未選択列ならこの向き)
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  code: "asc",
  name: "asc",
  sector: "asc",
  exchange: "asc",
  price: "desc",
  change1d: "desc",
  marketCap: "desc",
  per: "asc",
  yield: "desc",
};

export const metadata: Metadata = {
  title: "銘柄一覧 — 東証 3,800 社のAI分析",
  description:
    "東証プライム・スタンダード・グロース 約3,800社の銘柄一覧。コード・社名検索、JPX 33業種フィルタ、時価総額・前日比・PER・配当利回りでソートし、AI分析つき個別ページへ。",
  alternates: { canonical: "/stocks" },
  openGraph: {
    title: "銘柄一覧 — 東証 3,800 社のAI分析 | 超!企業DB",
    description:
      "コード・社名検索、JPX 33業種フィルタ、各種ソートで東証 3,800 社から目的の銘柄をすばやく特定。",
    url: "/stocks",
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
  const { key: sortKey, dir: sortDir } = parseSort(sp.sort);
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
  // NULL は常に末尾に寄せて、ユーザの「降順」操作で空欄が頭に来ないようにする。
  const orderExpr = (() => {
    const col = (() => {
      switch (sortKey) {
        case "code":
          return stocks.code;
        case "name":
          return companies.name;
        case "sector":
          return stocks.sectorTse;
        case "exchange":
          return stocks.exchange;
        case "price":
          return stockSnapshot.priceJpy;
        case "change1d":
          return stockSnapshot.change1dPct;
        case "per":
          return stockSnapshot.per;
        case "yield":
          return stockSnapshot.dividendYield;
        case "marketCap":
        default:
          return stockSnapshot.marketCapOku;
      }
    })();
    return sql`${col} IS NULL, ${col} ${sql.raw(sortDir.toUpperCase())}`;
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

        <StockFilterBar
          q={q}
          sector={sector}
          exchange={exchange}
          sectorOptions={sectorOptions}
        />

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  {/* モバイル(< md): 銘柄 / 株価+前日比 の 2 列に集約 */}
                  <SortTh sortKey="name" align="left" widthClass="md:hidden" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>銘柄</SortTh>
                  <SortTh sortKey="change1d" align="right" widthClass="md:hidden" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>株価 / 前日比</SortTh>

                  {/* md 以上: 全列 */}
                  <SortTh sortKey="code" align="left" widthClass="w-[88px] hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>コード</SortTh>
                  <SortTh sortKey="name" align="left" widthClass="hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>銘柄名</SortTh>
                  <SortTh sortKey="sector" align="left" widthClass="w-[140px] hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>業界</SortTh>
                  <SortTh sortKey="exchange" align="center" widthClass="w-[64px] hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>市場</SortTh>
                  <SortTh sortKey="price" align="right" widthClass="w-[100px] hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>株価</SortTh>
                  <SortTh sortKey="change1d" align="right" widthClass="w-[88px] hidden md:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>前日比</SortTh>
                  <SortTh sortKey="marketCap" align="right" widthClass="w-[120px] hidden lg:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>時価総額</SortTh>
                  <SortTh sortKey="per" align="right" widthClass="w-[72px] hidden lg:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>PER</SortTh>
                  <SortTh sortKey="yield" align="right" widthClass="w-[80px] hidden xl:table-cell" current={sortKey} dir={sortDir} ctx={{ q, sector, exchange }}>配当利回</SortTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-sm text-neutral-500">
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
          sortParam={serializeSort(sortKey, sortDir)}
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
      <Link href="/" className="inline-flex items-center gap-1 hover:text-neutral-900">
        <ChevronLeft className="w-3 h-3" />
        ホーム
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="text-neutral-700 font-semibold">銘柄一覧</span>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// クリック可能なソート ヘッダ
// ─────────────────────────────────────────────────────────

function SortTh({
  sortKey,
  current,
  dir,
  align,
  widthClass = "",
  ctx,
  children,
}: {
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  align: "left" | "right" | "center";
  widthClass?: string;
  ctx: { q: string; sector: string; exchange: string };
  children: React.ReactNode;
}) {
  const active = current === sortKey;
  // 同列クリック = 方向トグル、別列クリック = その列のデフォルト方向
  const nextDir: SortDir = active
    ? dir === "asc"
      ? "desc"
      : "asc"
    : DEFAULT_DIR[sortKey];
  const href = buildHref({
    ...ctx,
    sort: serializeSort(sortKey, nextDir),
  });
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const justifyClass =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <th className={`px-0 py-0 font-bold ${alignClass} ${widthClass}`}>
      <Link
        href={href}
        scroll={false}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
        className={`group flex items-center gap-1 px-3 py-2.5 w-full select-none cursor-pointer hover:text-neutral-900 transition ${justifyClass} ${
          active ? "text-neutral-900" : ""
        }`}
      >
        <span>{children}</span>
        <SortIcon active={active} dir={dir} />
      </Link>
    </th>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <ArrowUpDown className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500 transition" />
    );
  }
  return dir === "asc" ? (
    <ArrowUp className="w-3 h-3 text-emerald-600" />
  ) : (
    <ArrowDown className="w-3 h-3 text-emerald-600" />
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
  const href = `/stocks/${r.code}`;
  const priceText = r.price != null ? `¥${r.price.toLocaleString()}` : "—";
  return (
    <tr className="hover:bg-neutral-50 transition group">
      {/* ── モバイル(< md): 銘柄 / 株価+前日比 の 2 セルに集約 ── */}
      <td className="p-0 md:hidden min-w-0">
        <Link href={href} className="flex items-center gap-2 px-3 py-3 min-w-0">
          <span className="font-mono tabular text-[11px] font-bold text-neutral-500 shrink-0">
            {r.code}
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-sm tracking-tight truncate text-neutral-900">
              {r.name}
            </span>
            <span className="block text-[10px] text-neutral-500 truncate">{r.sector}</span>
          </span>
        </Link>
      </td>
      <td className="p-0 md:hidden w-[104px]">
        <Link href={href} className="flex flex-col items-end px-3 py-3 font-mono tabular leading-tight">
          <span className="font-semibold text-neutral-900">{priceText}</span>
          <ChangePct value={r.change1d} />
        </Link>
      </td>

      {/* ── md 以上: 全列 ── */}
      <td className="p-0 hidden md:table-cell w-[88px]">
        <Link href={href} className="block px-3 py-3 font-mono tabular text-sm font-bold text-neutral-900 group-hover:underline">
          {r.code}
        </Link>
      </td>
      <td className="p-0 hidden md:table-cell min-w-0">
        <Link href={href} className="block px-3 py-3 min-w-0">
          <span className="block font-bold text-sm tracking-tight truncate text-neutral-900">
            {r.name}
          </span>
          {r.nameEn && (
            <span className="block text-[10px] text-neutral-500 truncate">{r.nameEn}</span>
          )}
        </Link>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <Link
          href={`/stocks?sector=${encodeURIComponent(r.sector)}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 transition"
        >
          <Building2 className="w-3 h-3" />
          {r.sector}
        </Link>
      </td>
      <td className="p-0 hidden md:table-cell text-center">
        <Link href={href} className="block px-3 py-3">
          <ExchangeBadge exchange={r.exchange} />
        </Link>
      </td>
      <td className="p-0 hidden md:table-cell">
        <Link href={href} className="block px-3 py-3 text-right font-mono tabular font-semibold">
          {priceText}
        </Link>
      </td>
      <td className="p-0 hidden md:table-cell">
        <Link href={href} className="block px-3 py-3 text-right font-mono tabular">
          <ChangePct value={r.change1d} />
        </Link>
      </td>
      <td className="p-0 text-right hidden lg:table-cell">
        <Link href={href} className="block px-3 py-3 font-mono tabular text-neutral-700">
          {formatOku(r.marketCapOku)}
        </Link>
      </td>
      <td className="p-0 text-right hidden lg:table-cell">
        <Link href={href} className="block px-3 py-3 font-mono tabular text-neutral-700">
          {r.per != null ? `${r.per.toFixed(1)}x` : "—"}
        </Link>
      </td>
      <td className="p-0 text-right hidden xl:table-cell">
        <Link href={href} className="block px-3 py-3 font-mono tabular text-neutral-700">
          {r.dividendYield != null ? `${r.dividendYield.toFixed(2)}%` : "—"}
        </Link>
      </td>
    </tr>
  );
}

/** 前日比 % を色付きで描画。株価一覧のモバイル/デスクトップ両方で共用。 */
function ChangePct({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral-400">—</span>;
  const positive = value >= 0;
  return (
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
      {value.toFixed(2)}%
    </span>
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
  sortParam,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  sector: string;
  exchange: string;
  sortParam: string;
}) {
  const hrefFor = (p: number) =>
    buildHref({ q, sector, exchange, sort: sortParam, page: p });

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

const SORT_KEYS: SortKey[] = [
  "code",
  "name",
  "sector",
  "exchange",
  "price",
  "change1d",
  "marketCap",
  "per",
  "yield",
];

function parseSort(raw: string | undefined): { key: SortKey; dir: SortDir } {
  const fallback = { key: "marketCap" as SortKey, dir: "desc" as SortDir };
  if (!raw) return fallback;
  const [keyRaw, dirRaw] = raw.split(":");
  const key = SORT_KEYS.find((k) => k === keyRaw);
  if (!key) return fallback;
  const dir: SortDir = dirRaw === "asc" ? "asc" : dirRaw === "desc" ? "desc" : DEFAULT_DIR[key];
  return { key, dir };
}

function serializeSort(key: SortKey, dir: SortDir): string {
  // デフォルト (marketCap:desc) なら URL に乗せない
  if (key === "marketCap" && dir === "desc") return "";
  return `${key}:${dir}`;
}

function buildHref(opts: {
  q?: string;
  sector?: string;
  exchange?: string;
  sort?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.sector) params.set("sector", opts.sector);
  if (opts.exchange) params.set("exchange", opts.exchange);
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const s = params.toString();
  return s ? `/stocks?${s}` : "/stocks";
}

function formatOku(oku: number | null | undefined): string {
  if (oku == null) return "—";
  if (oku >= 10000) return `${(oku / 10000).toFixed(2)}兆円`;
  if (oku >= 1000) return `${oku.toLocaleString()}億円`;
  return `${oku.toLocaleString()}億`;
}
