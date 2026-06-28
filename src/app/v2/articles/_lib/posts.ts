/**
 * v2 記事画面で使う共通の型 + カテゴリメタ。
 *
 * 実データは DB の articles テーブル (src/server/repo/articleRepo) から取得する。
 * このファイルはモックを保持しない。画面側で UI ラベル / アイコンを引くための
 * 静的メタだけを置く。
 */

import type { LucideIcon } from "lucide-react";
import { Activity, Coins, Globe, Sparkles } from "lucide-react";

// ─── 主役 ──────────────────────────────────────────────
export type SubjectKind = "company" | "industry" | "theme" | "metric";

export type Subject =
  | { kind: "company"; code: string; name: string }
  | { kind: "industry"; slug: string; name: string }
  | { kind: "theme"; slug: string; name: string }
  | { kind: "metric"; slug: string; name: string };

// ─── カテゴリ (= angle) ───────────────────────────────
//   DB 上は categories テーブルの slug。表示メタはここに固定で持つ。
export type Angle = "earnings" | "industry_overview" | "theme_dive" | "primer";

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

export function angleFromCategorySlug(slug: string): Angle | null {
  return slug in ANGLE_META ? (slug as Angle) : null;
}

// ─── レガシー互換 (v2/page.tsx が古い参照を残しているための一時 export) ──
//   TODO: v2/page.tsx の `_allArticles` / `themeEntries` を DB ベースに置き換えたら
//         これらは削除する。
export type Post = {
  slug: string;
  title: string;
  lede: string;
  publishedAt: string;
  publishedAtIso: string;
  readMin: number;
  image?: string;
  angle: Angle;
  subject: Subject;
  tags: { slug: string; label: string }[];
};

export const posts: Post[] = [];

export type ThemeEntry = {
  slug: string;
  name: string;
  count: { posts: number };
  icon: LucideIcon;
};

export const themeEntries: ThemeEntry[] = [];
