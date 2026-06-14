import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import { chunkedFetch } from "@/server/db/helpers";
import * as s from "@/server/db/schema";

/**
 * posts.related_stocks_json / related_industries_json は文字列 JSON 配列なので、
 * 安全にパースして string[] に変換するユーティリティ。 不正な JSON は空配列に倒す。
 */
export function parsePostJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export type PostStatus = "draft" | "published";
export type PostCategory =
  | "earnings"
  | "industry-watch"
  | "analysis"
  | "disclosure"
  | "primer";
export type PostAuthor = "editor" | "ai-editor";

export type PostRow = {
  id: number;
  slug: string;
  title: string;
  lede: string;
  bodyHtml: string;
  category: PostCategory;
  status: PostStatus;
  author: PostAuthor;
  readTimeMin: number;
  fiscalPeriod: string | null;
  relatedStocksJson: string;
  relatedIndustriesJson: string;
  publishedAt: string | null;
  authorUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PostWithTags = PostRow & { tags: { id: number; slug: string; name: string }[] };

const ALL_COLS = {
  id: s.posts.id,
  slug: s.posts.slug,
  title: s.posts.title,
  lede: s.posts.lede,
  bodyHtml: s.posts.bodyHtml,
  category: s.posts.category,
  status: s.posts.status,
  author: s.posts.author,
  readTimeMin: s.posts.readTimeMin,
  fiscalPeriod: s.posts.fiscalPeriod,
  relatedStocksJson: s.posts.relatedStocksJson,
  relatedIndustriesJson: s.posts.relatedIndustriesJson,
  publishedAt: s.posts.publishedAt,
  authorUserId: s.posts.authorUserId,
  createdAt: s.posts.createdAt,
  updatedAt: s.posts.updatedAt,
} as const;

export async function listPublished(db: Db, opts?: { tagSlug?: string }): Promise<PostRow[]> {
  if (opts?.tagSlug) {
    const tag = await db
      .select({ id: s.tags.id })
      .from(s.tags)
      .where(eq(s.tags.slug, opts.tagSlug))
      .all();
    if (tag.length === 0) return [];
    const postIds = await db
      .select({ postId: s.postTags.postId })
      .from(s.postTags)
      .where(eq(s.postTags.tagId, tag[0].id))
      .all();
    if (postIds.length === 0) return [];
    const ids = postIds.map((r) => r.postId);
    // D1 のパラメータ上限 (100) を超えるタグでも安全に動くようチャンク化する。
    // 並び順は publishedAt 降順で in-memory 再ソートする。
    const rows = await chunkedFetch(ids, (chunk) =>
      db
        .select(ALL_COLS)
        .from(s.posts)
        .where(
          and(eq(s.posts.status, "published"), inArray(s.posts.id, chunk)),
        ) as unknown as Promise<PostRow[]>,
    );
    return rows.sort((a, b) =>
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );
  }
  return (await db
    .select(ALL_COLS)
    .from(s.posts)
    .where(eq(s.posts.status, "published"))
    .orderBy(desc(s.posts.publishedAt))) as PostRow[];
}

export async function listAll(db: Db): Promise<PostRow[]> {
  return (await db
    .select(ALL_COLS)
    .from(s.posts)
    .orderBy(desc(sql`COALESCE(${s.posts.publishedAt}, ${s.posts.updatedAt})`))) as PostRow[];
}

export async function findBySlug(db: Db, slug: string): Promise<PostRow | null> {
  const rows = (await db
    .select(ALL_COLS)
    .from(s.posts)
    .where(eq(s.posts.slug, slug))
    .limit(1)) as PostRow[];
  return rows[0] ?? null;
}

export async function findById(db: Db, id: number): Promise<PostRow | null> {
  const rows = (await db
    .select(ALL_COLS)
    .from(s.posts)
    .where(eq(s.posts.id, id))
    .limit(1)) as PostRow[];
  return rows[0] ?? null;
}

export async function listTagsForPostIds(
  db: Db,
  postIds: number[],
): Promise<Map<number, { id: number; slug: string; name: string }[]>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .select({
      postId: s.postTags.postId,
      id: s.tags.id,
      slug: s.tags.slug,
      name: s.tags.name,
    })
    .from(s.postTags)
    .innerJoin(s.tags, eq(s.tags.id, s.postTags.tagId))
    .where(inArray(s.postTags.postId, postIds))
    .all();
  const map = new Map<number, { id: number; slug: string; name: string }[]>();
  for (const r of rows) {
    const list = map.get(r.postId) ?? [];
    list.push({ id: r.id, slug: r.slug, name: r.name });
    map.set(r.postId, list);
  }
  return map;
}

export async function listAllTags(db: Db): Promise<{ id: number; slug: string; name: string }[]> {
  return await db
    .select({ id: s.tags.id, slug: s.tags.slug, name: s.tags.name })
    .from(s.tags)
    .orderBy(s.tags.slug);
}

export type PostWriteInput = {
  slug: string;
  title: string;
  lede: string;
  bodyHtml: string;
  category: PostCategory;
  status: PostStatus;
  author: PostAuthor;
  readTimeMin: number;
  fiscalPeriod: string | null;
  relatedStocks: string[];
  relatedIndustries: string[];
  publishedAt: string | null;
  authorUserId: number | null;
  tagSlugs: string[];
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function createPost(db: Db, input: PostWriteInput): Promise<number> {
  const now = nowIso();
  const res = await db
    .insert(s.posts)
    .values({
      slug: input.slug,
      title: input.title,
      lede: input.lede,
      bodyHtml: input.bodyHtml,
      category: input.category,
      status: input.status,
      author: input.author,
      readTimeMin: input.readTimeMin,
      fiscalPeriod: input.fiscalPeriod,
      relatedStocksJson: JSON.stringify(input.relatedStocks),
      relatedIndustriesJson: JSON.stringify(input.relatedIndustries),
      publishedAt: input.publishedAt,
      authorUserId: input.authorUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: s.posts.id });
  const id = res[0].id;
  await replaceTags(db, id, input.tagSlugs);
  return id;
}

export async function updatePost(
  db: Db,
  id: number,
  input: PostWriteInput,
): Promise<void> {
  await db
    .update(s.posts)
    .set({
      slug: input.slug,
      title: input.title,
      lede: input.lede,
      bodyHtml: input.bodyHtml,
      category: input.category,
      status: input.status,
      author: input.author,
      readTimeMin: input.readTimeMin,
      fiscalPeriod: input.fiscalPeriod,
      relatedStocksJson: JSON.stringify(input.relatedStocks),
      relatedIndustriesJson: JSON.stringify(input.relatedIndustries),
      publishedAt: input.publishedAt,
      updatedAt: nowIso(),
    })
    .where(eq(s.posts.id, id));
  await replaceTags(db, id, input.tagSlugs);
}

export async function deletePost(db: Db, id: number): Promise<void> {
  await db.delete(s.posts).where(eq(s.posts.id, id));
}

async function replaceTags(db: Db, postId: number, tagSlugs: string[]): Promise<void> {
  await db.delete(s.postTags).where(eq(s.postTags.postId, postId));
  if (tagSlugs.length === 0) return;

  const existing = await db
    .select({ id: s.tags.id, slug: s.tags.slug })
    .from(s.tags)
    .where(inArray(s.tags.slug, tagSlugs))
    .all();
  const existingBySlug = new Map(existing.map((r) => [r.slug, r.id]));
  const now = nowIso();

  const newSlugs = tagSlugs.filter((sl) => !existingBySlug.has(sl));
  if (newSlugs.length > 0) {
    const inserted = await db
      .insert(s.tags)
      .values(newSlugs.map((sl) => ({ slug: sl, name: sl, createdAt: now })))
      .returning({ id: s.tags.id, slug: s.tags.slug });
    for (const r of inserted) existingBySlug.set(r.slug, r.id);
  }

  const links = tagSlugs
    .map((sl) => existingBySlug.get(sl))
    .filter((id): id is number => typeof id === "number")
    .map((tagId) => ({ postId, tagId }));
  if (links.length > 0) {
    await db.insert(s.postTags).values(links);
  }
}
