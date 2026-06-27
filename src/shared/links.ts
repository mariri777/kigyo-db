/**
 * サイト内 URL とフッターリンクの単一情報源。
 * パスのハードコードはここに集約し、ページ・フッター・JSON-LD から参照する。
 */

export const ROUTES = {
  home: "/",
  stocks: "/stocks",
  industries: "/industries",
  themes: "/themes",
  predictions: "/predictions",
  predictionsTrackRecord: "/predictions/track-record",
  screens: "/screens",
  compare: "/compare",
  blog: "/blog",
  guide: "/guide",
  about: "/about",
  legal: {
    terms: "/legal/terms",
    privacy: "/legal/privacy",
    disclaimer: "/legal/disclaimer",
    editorial: "/legal/editorial-policy",
  },
} as const;

export type FooterLink = { href: string; label: string };

export const LEGAL_LINKS: FooterLink[] = [
  { href: ROUTES.legal.terms, label: "利用規約" },
  { href: ROUTES.legal.privacy, label: "プライバシーポリシー" },
  { href: ROUTES.legal.disclaimer, label: "免責事項" },
  { href: ROUTES.legal.editorial, label: "編集方針" },
];

export const FOOTER_PRIMARY_LINKS: FooterLink[] = [
  { href: ROUTES.guide, label: "初めての方へ" },
  { href: ROUTES.themes, label: "特集" },
  { href: ROUTES.predictions, label: "予測" },
  { href: ROUTES.screens, label: "スクリーン" },
  { href: ROUTES.compare, label: "比較" },
];

export const FOOTER_SECONDARY_LINKS: FooterLink[] = [
  { href: ROUTES.about, label: "超!企業DBとは" },
];
