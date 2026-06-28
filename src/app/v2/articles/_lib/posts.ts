// ─────────────────────────────────────────────────────────
// 記事ドメイン (モック)
//
// 設計:
//   - 記事 = 編集が書く読み物 (5〜10分)
//   - シグナル (signals.ts) = DB の更新から自動生成される 1 行通知 (15秒)
//   - 両者は性質が違うため、画面でも分けて扱う。
//
//   読者が記事一覧に来る動機は次の3つだけ:
//     (1) 今日の主な解釈を読みたい
//     (2) テーマで横断したい
//     (3) 特定企業の過去解釈を探したい
//
//   読者は社内KPIには関心がない (本数/更新ペース/読了時間統計は出さない)
// ─────────────────────────────────────────────────────────

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Globe,
  Sparkles,
  Activity,
  Cpu,
  Zap,
  Coins,
} from "lucide-react";

// ─── 主役 ──────────────────────────────────────────────
export type SubjectKind = "company" | "industry" | "theme" | "metric";

export type Subject =
  | { kind: "company"; code: string; name: string }
  | { kind: "industry"; slug: string; name: string }
  | { kind: "theme"; slug: string; name: string }
  | { kind: "metric"; slug: string; name: string };

// ─── 記事の角度 (主役のKind依存) ────────────────────────
export type Angle =
  | "earnings" // 決算解釈
  | "industry_overview" // 業界俯瞰
  | "theme_dive" // テーマ深掘り
  | "primer"; // 指標プライマー

export const ANGLE_META: Record<
  Angle,
  { label: string; icon: LucideIcon; color: string }
> = {
  earnings: {
    label: "決算解釈",
    icon: Activity,
    color: "bg-blue-50 text-blue-700",
  },
  industry_overview: {
    label: "業界俯瞰",
    icon: Globe,
    color: "bg-amber-50 text-amber-700",
  },
  theme_dive: {
    label: "テーマ深掘り",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-700",
  },
  primer: {
    label: "プライマー",
    icon: Coins,
    color: "bg-emerald-50 text-emerald-700",
  },
};

// ─── 読了後アクション ──────────────────────────────────
export type Action = {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
};

// ─── 記事 ──────────────────────────────────────────────
export type Post = {
  slug: string;
  angle: Angle;
  title: string;
  subject: Subject;
  /** リード文 (一覧 & 詳細冒頭で共用) */
  lede: string;
  publishedAt: string; // 表示用 (例: "2026/6/28")
  publishedAtIso: string; // sort 用 ISO
  readMin: number;
  /** Unsplash photo ID (任意) */
  image?: string;
  /** タグ: テーマやセグメント (回遊用) */
  tags: { slug: string; label: string }[];
  /** 読了後アクション (主役詳細 / 業界 / 同テーマ等の必須3つ) */
  actions: [Action, Action, Action];
};

// ─── サンプル記事 (実運用ではDB/CMSから) ─────────────
export const posts: Post[] = [
  {
    slug: "softbank-ai-quality",
    angle: "earnings",
    title: "ソフトバンクGの最高益、本当に「最高益」と呼んでいいのか",
    subject: { kind: "company", code: "9984", name: "ソフトバンクグループ" },
    lede:
      "通期5.7兆円。数字は派手だが、8割は時価評価益で、本業のキャッシュは前期比+2%とほぼ横ばい。表面と中身の温度差を、いつもの粒度で分けて読む。",
    publishedAt: "2026/6/28",
    publishedAtIso: "2026-06-28T13:42:00+09:00",
    readMin: 5,
    image: "photo-1518770660439-4636190af475",
    tags: [
      { slug: "theme:ai-investment", label: "AI投資" },
      { slug: "theme:semiconductor", label: "半導体" },
    ],
    actions: [
      {
        href: "/v2/stocks/7203",
        label: "ソフトバンクGの詳細",
        hint: "PER / 株主構成 / 配当 / 10年史",
        icon: Building2,
      },
      {
        href: "/v2/articles",
        label: "業界:情報・通信",
        hint: "583社の比較",
        icon: Globe,
      },
      {
        href: "/v2/articles",
        label: "テーマ:AI投資",
        hint: "同テーマ 12本",
        icon: Sparkles,
      },
    ],
  },
  {
    slug: "trading-house-q1-overview",
    angle: "industry_overview",
    title: "商社4社のQ1、資源と非資源で「読み筋」が割れた",
    subject: { kind: "industry", slug: "trading-house", name: "総合商社" },
    lede:
      "三菱・三井・伊藤忠・住友のQ1決算が出揃った。資源価格軟化を非資源で吸収できるかが分水嶺。セグメント別の利益寄与をDBから抜いて比較する。",
    publishedAt: "2026/6/27",
    publishedAtIso: "2026-06-27T09:10:00+09:00",
    readMin: 7,
    image: "photo-1554224155-6726b3ff858f",
    tags: [
      { slug: "theme:resource", label: "資源市況" },
      { slug: "theme:consumer", label: "消費" },
    ],
    actions: [
      {
        href: "/v2/articles",
        label: "業界:商社",
        hint: "総合商社 7社の横並び",
        icon: Globe,
      },
      {
        href: "/v2/stocks/7203",
        label: "三菱商事の詳細",
        hint: "8058",
        icon: Building2,
      },
      {
        href: "/v2/articles",
        label: "テーマ:資源市況",
        hint: "同テーマ 24本",
        icon: Sparkles,
      },
    ],
  },
  {
    slug: "hbm-process-supplier-share",
    angle: "theme_dive",
    title: "HBM3E vs HBM4 — 装置メーカー4社の取り分はどう変わるか",
    subject: { kind: "theme", slug: "semiconductor", name: "半導体" },
    lede:
      "TSV工程の歩留り改善で東エレと愛知電機の検査需要が伸びる。SCREENとアドバンの取り分の組み替えを、工程ごとの設備投資配分で読み解く。",
    publishedAt: "2026/6/26",
    publishedAtIso: "2026-06-26T20:00:00+09:00",
    readMin: 8,
    image: "photo-1591488320449-011701bb6704",
    tags: [
      { slug: "theme:hbm", label: "HBM" },
      { slug: "theme:semiconductor", label: "半導体" },
    ],
    actions: [
      {
        href: "/v2#semiconductor",
        label: "テーマ:半導体",
        hint: "47記事 / 32銘柄",
        icon: Cpu,
      },
      {
        href: "/v2/stocks/7203",
        label: "東京エレクトロン",
        hint: "8035",
        icon: Building2,
      },
      {
        href: "/v2/articles",
        label: "前回: HBM3E 装置別シェア",
        hint: "1ヶ月前 / 同シリーズ",
        icon: Activity,
      },
    ],
  },
  {
    slug: "payout-ratio-primer",
    angle: "primer",
    title: "配当性向の「健全な水準」は業界で全然違う",
    subject: { kind: "metric", slug: "payout-ratio", name: "配当性向" },
    lede:
      "配当性向30%が普通、と言われるのは銀行・商社の話で、IT・成長企業に当てはめると意味がない。業界別の中央値をDBから抜いて比較する。",
    publishedAt: "2026/6/25",
    publishedAtIso: "2026-06-25T12:00:00+09:00",
    readMin: 4,
    image: "photo-1554224155-6726b3ff858f",
    tags: [
      { slug: "theme:dividend", label: "配当" },
      { slug: "theme:primer", label: "指標の読み方" },
    ],
    actions: [
      {
        href: "/v2/articles",
        label: "業界別配当性向の一覧",
        hint: "33業種の中央値",
        icon: Globe,
      },
      {
        href: "/v2/stocks/7203",
        label: "トヨタの配当方針",
        hint: "総還元利回りの推移",
        icon: Building2,
      },
      {
        href: "/v2/articles",
        label: "プライマー一覧",
        hint: "指標の読み方シリーズ",
        icon: Coins,
      },
    ],
  },
  {
    slug: "nidec-post-nagamori",
    angle: "earnings",
    title: "ニデック、永守体制から実質的な「ポスト永守」へ",
    subject: { kind: "company", code: "6594", name: "ニデック" },
    lede:
      "車載モーターの構造調整に踏み込んだ。減損後の収益力は意外に底堅く、市場の織り込みは前向き不足に見える。",
    publishedAt: "2026/6/24",
    publishedAtIso: "2026-06-24T10:00:00+09:00",
    readMin: 5,
    image: "photo-1487754180451-c456f719a1fc",
    tags: [
      { slug: "theme:ev", label: "車載" },
      { slug: "theme:governance", label: "ガバナンス" },
    ],
    actions: [
      {
        href: "/v2/stocks/7203",
        label: "ニデックの詳細",
        hint: "6594",
        icon: Building2,
      },
      {
        href: "/v2/articles",
        label: "業界:電気機器",
        hint: "248社",
        icon: Globe,
      },
      {
        href: "/v2/articles",
        label: "テーマ:車載モーター",
        hint: "同テーマ 8本",
        icon: Sparkles,
      },
    ],
  },
];

// ─── テーマ別エントリ (横断回遊用) ────────────────────
export type ThemeEntry = {
  slug: string;
  name: string;
  blurb: string;
  count: { posts: number; companies: number };
  latestSlug?: string;
  icon: LucideIcon;
  accent: "purple" | "emerald" | "amber" | "blue";
};

export const themeEntries: ThemeEntry[] = [
  {
    slug: "semiconductor",
    name: "半導体",
    blurb: "前工程・後工程・装置・材料・OSAT を工程別に追う",
    count: { posts: 47, companies: 32 },
    latestSlug: "hbm-process-supplier-share",
    icon: Cpu,
    accent: "purple",
  },
  {
    slug: "ai-investment",
    name: "AI 投資",
    blurb: "孫正義 / Mag7 / 国内ベンダーの動きを記事で",
    count: { posts: 12, companies: 8 },
    latestSlug: "softbank-ai-quality",
    icon: Sparkles,
    accent: "emerald",
  },
  {
    slug: "energy",
    name: "電力・送配電",
    blurb: "AIデータセンタ向け需要で系統増強、電線・変圧器が連動",
    count: { posts: 18, companies: 15 },
    icon: Zap,
    accent: "amber",
  },
  {
    slug: "dividend",
    name: "配当・株主還元",
    blurb: "業界別中央値、自社株買い、連続増配",
    count: { posts: 24, companies: 120 },
    latestSlug: "payout-ratio-primer",
    icon: Coins,
    accent: "blue",
  },
];

// ─── ヘルパ ──────────────────────────────────────────

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function postsSorted(): Post[] {
  return [...posts].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso)
  );
}

export function findRelated(post: Post, limit = 3): Post[] {
  const tagSet = new Set(post.tags.map((t) => t.slug));
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const overlap = p.tags.filter((t) => tagSet.has(t.slug)).length;
      const sameSubject =
        p.subject.kind === post.subject.kind &&
        "code" in p.subject &&
        "code" in post.subject &&
        p.subject.code === post.subject.code;
      const score = (sameSubject ? 10 : 0) + overlap;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/** 日付ごとに記事をグループ化 (新しい順) */
export function groupByDay(
  list: Post[]
): { label: string; date: string; items: Post[] }[] {
  const map = new Map<string, Post[]>();
  for (const p of list) {
    const date = p.publishedAtIso.slice(0, 10);
    const arr = map.get(date) ?? [];
    arr.push(p);
    map.set(date, arr);
  }
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return sortedKeys.map((date) => ({
    date,
    label: humanizeDate(date),
    items: map.get(date)!,
  }));
}

function humanizeDate(iso: string): string {
  // 「今日 / 昨日 / 7/25」のような表記。モックの「今日」は 2026-06-28。
  const today = "2026-06-28";
  const yesterday = "2026-06-27";
  if (iso === today) return "今日";
  if (iso === yesterday) return "昨日";
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 月別アーカイブ (新しい順)。実運用ではDBから本数を引く。
 *  モックでは現存記事を集計し、過去月はダミー件数を足す。 */
export function archiveByMonth(): { ym: string; label: string; count: number }[] {
  const current = new Map<string, number>();
  for (const p of posts) {
    const ym = p.publishedAtIso.slice(0, 7); // "2026-06"
    current.set(ym, (current.get(ym) ?? 0) + 1);
  }
  // モック: 過去5ヶ月分のダミー件数を加える
  const mockPast: [string, number][] = [
    ["2026-05", 22],
    ["2026-04", 18],
    ["2026-03", 25],
    ["2026-02", 16],
    ["2026-01", 19],
  ];
  for (const [ym, n] of mockPast) {
    if (!current.has(ym)) current.set(ym, n);
  }
  return [...current.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([ym, count]) => {
      const [y, m] = ym.split("-");
      return { ym, label: `${y}年${Number(m)}月`, count };
    });
}
