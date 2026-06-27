// ブログ記事の表示用ビューと DB クエリのラッパ。
// 本文は 0003 マイグレーションで posts テーブルに移行済みで、ここでは
// repo 層が返す行をビューに整形して返すだけの薄いラッパに留める。

import "server-only";

import { getDb } from "@/server/db/client";
import {
  findBySlug,
  listAll as repoListAll,
  listPublished as repoListPublished,
  listAllTags as repoListAllTags,
  listTagsForPostIds,
  parsePostJsonArray,
  type PostCategory as RepoPostCategory,
  type PostRow,
} from "@/server/repo/postRepo";

export type PostCategory = RepoPostCategory;

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  earnings: "決算分析",
  "industry-watch": "業界ウォッチ",
  analysis: "オリジナル分析",
  disclosure: "適時開示読み解き",
  primer: "3 分でわかる",
};

/**
 * 公開済みの記事 1 件分の表示用ビュー。HTML はサーバで sanitize 済み前提。
 */
export type Post = {
  id: number;
  slug: string;
  title: string;
  lede: string;
  bodyHtml: string;
  category: PostCategory;
  /** 下書きは ""、公開済みは YYYY-MM-DD */
  publishedAt: string;
  status: "draft" | "published";
  updatedAt: string;
  author: "editor" | "ai-editor";
  readTimeMin: number;
  relatedStocks: string[];
  relatedIndustries: string[];
  fiscalPeriod?: string;
  tags: { id: number; slug: string; name: string }[];
};

function rowToPost(
  row: PostRow,
  tags: { id: number; slug: string; name: string }[],
): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    lede: row.lede,
    bodyHtml: row.bodyHtml,
    category: row.category,
    publishedAt: row.publishedAt ?? "",
    status: row.status,
    updatedAt: row.updatedAt,
    author: row.author,
    readTimeMin: row.readTimeMin,
    relatedStocks: parsePostJsonArray(row.relatedStocksJson),
    relatedIndustries: parsePostJsonArray(row.relatedIndustriesJson),
    fiscalPeriod: row.fiscalPeriod ?? undefined,
    tags,
  };
}

export async function listPosts(opts?: { tagSlug?: string }): Promise<Post[]> {
  const db = await getDb();
  const rows = await repoListPublished(db, opts);
  const tagMap = await listTagsForPostIds(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) => rowToPost(r, tagMap.get(r.id) ?? []));
}

export async function listPostsForAdmin(): Promise<Post[]> {
  const db = await getDb();
  const rows = await repoListAll(db);
  const tagMap = await listTagsForPostIds(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) => rowToPost(r, tagMap.get(r.id) ?? []));
}

export async function getPost(slug: string): Promise<Post | null> {
  const db = await getDb();
  const row = await findBySlug(db, slug);
  if (!row || row.status !== "published") return null;
  const tags = (await listTagsForPostIds(db, [row.id])).get(row.id) ?? [];
  return rowToPost(row, tags);
}

export async function postsByCategory(cat: PostCategory): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.category === cat);
}

export async function postsForStock(code: string): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.relatedStocks.includes(code));
}

export async function postsForIndustry(slug: string): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.relatedIndustries.includes(slug));
}

export async function listAllTags() {
  const db = await getDb();
  return repoListAllTags(db);
}
