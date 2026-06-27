import { SITE_NAME, SITE_URL, absoluteUrl } from "@/shared/site";

const SCHEMA = "https://schema.org";

type BreadcrumbItem = { name: string; href: string };

/**
 * パンくず JSON-LD。先頭の「ホーム」は自動で含めるので呼び出し側からは渡さない。
 */
export function breadcrumbList(items: BreadcrumbItem[]) {
  const elements = [{ name: "ホーム", href: "/" }, ...items].map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.href),
  }));
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
}

export function collectionPageLd(input: {
  name: string;
  path: string;
  description: string;
  about?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": SCHEMA,
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    ...(input.about ? { about: { "@type": "Thing", name: input.about } } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

export function organizationLd(input: {
  name: string;
  path: string;
  description: string;
  alternateName?: string;
  identifier?: string;
  industry?: string;
}) {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    ...(input.identifier ? { identifier: input.identifier } : {}),
    ...(input.industry ? { industry: input.industry } : {}),
  };
}

export function financialProductLd(input: {
  name: string;
  identifier: string;
  description: string;
}) {
  return {
    "@context": SCHEMA,
    "@type": "FinancialProduct",
    name: input.name,
    category: "Equity / Common Stock",
    provider: { "@type": "Organization", name: "東京証券取引所" },
    identifier: input.identifier,
    description: input.description,
  };
}

export function articleLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  articleSection?: string;
  keywords?: string[];
  authorName: string;
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": SCHEMA,
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: "ja",
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
    ...(input.keywords && input.keywords.length > 0
      ? { keywords: input.keywords.join(", ") }
      : {}),
    author: { "@type": "Organization", name: input.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function websiteLd() {
  return {
    "@context": SCHEMA,
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon-512.png") },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: absoluteUrl("/stocks?q={search_term_string}"),
      "query-input": "required name=search_term_string",
    },
  };
}

export function siteOrganizationLd(input: { description: string; sameAs: string[] }) {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
    description: input.description,
    sameAs: input.sameAs,
  };
}
