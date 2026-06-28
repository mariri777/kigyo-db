/**
 * 記事 (articles) の DB アクセス層。
 * v2 の記事フォーマット (Block[] JSON + 派生 HTML) を扱う。
 */
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  articles,
  articleCompanies,
  articleIndustries,
  articleTags,
  categories,
  tags,
  adminUsers,
} from "@/server/db/schema";
import type { Db as DbClient } from "@/server/db/client";

// ─────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────

export type ArticleStatus = "draft" | "published" | "scheduled" | "archived";
export type SubjectKind = "company" | "industry" | "theme" | "metric";

export type ArticleAction = {
  label: string;
  hint?: string;
  href: string;
  iconKey?: string;
};

export type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  lede: string;
  status: ArticleStatus;
  publishedAt: string | null;
  updatedAt: string;
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  authorName: string | null;
  heroImageKey: string | null;
  readMinutes: number;
};

export type ArticleDetail = ArticleListItem & {
  heroImageAlt: string | null;
  heroImageCredit: string | null;
  contentJson: string;
  contentHtml: string;
  actions: ArticleAction[];
  scheduledAt: string | null;
  createdAt: string;
  companyCodes: string[];
  industrySlugs: string[];
  tagSlugs: string[];
};

export type ArticleWriteInput = {
  slug: string;
  title: string;
  lede: string;
  heroImageKey: string | null;
  heroImageAlt: string | null;
  heroImageCredit: string | null;
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  contentJson: string;
  contentHtml: string;
  readMinutes: number;
  actions: ArticleAction[];
  categoryId: number;
  status: ArticleStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  authorId: number | null;
  companyCodes: string[];
  industrySlugs: string[];
  tagSlugs: string[];
};

// ─────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────

export async function listAll(db: DbClient): Promise<ArticleListItem[]> {
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      lede: articles.lede,
      status: articles.status,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      subjectKind: articles.subjectKind,
      subjectRef: articles.subjectRef,
      subjectName: articles.subjectName,
      categoryId: articles.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      authorName: adminUsers.name,
      heroImageKey: articles.heroImageKey,
      readMinutes: articles.readMinutes,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(adminUsers, eq(articles.authorId, adminUsers.id))
    .orderBy(desc(articles.updatedAt))
    .all();
  return rows as ArticleListItem[];
}

export async function findById(
  db: DbClient,
  id: number,
): Promise<ArticleDetail | null> {
  const row = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      lede: articles.lede,
      heroImageKey: articles.heroImageKey,
      heroImageAlt: articles.heroImageAlt,
      heroImageCredit: articles.heroImageCredit,
      subjectKind: articles.subjectKind,
      subjectRef: articles.subjectRef,
      subjectName: articles.subjectName,
      contentJson: articles.contentJson,
      contentHtml: articles.contentHtml,
      readMinutes: articles.readMinutes,
      actionsJson: articles.actionsJson,
      categoryId: articles.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      status: articles.status,
      publishedAt: articles.publishedAt,
      scheduledAt: articles.scheduledAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorName: adminUsers.name,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(adminUsers, eq(articles.authorId, adminUsers.id))
    .where(eq(articles.id, id))
    .get();
  if (!row) return null;

  const companyRows = await db
    .select({ code: articleCompanies.code })
    .from(articleCompanies)
    .where(eq(articleCompanies.articleId, id))
    .orderBy(articleCompanies.position)
    .all();
  const industryRows = await db
    .select({ slug: articleIndustries.industrySlug })
    .from(articleIndustries)
    .where(eq(articleIndustries.articleId, id))
    .orderBy(articleIndustries.position)
    .all();
  const tagRows = await db
    .select({ slug: tags.slug })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, id))
    .all();

  return {
    ...row,
    actions: safeParseActions(row.actionsJson),
    companyCodes: companyRows.map((r) => r.code),
    industrySlugs: industryRows.map((r) => r.slug),
    tagSlugs: tagRows.map((r) => r.slug),
  } as ArticleDetail;
}

export async function findBySlug(
  db: DbClient,
  slug: string,
): Promise<ArticleDetail | null> {
  const row = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .get();
  if (!row) return null;
  return findById(db, row.id);
}

function safeParseActions(json: string): ArticleAction[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 3);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// CATEGORIES (記事編集で使う)
// ─────────────────────────────────────────────────────────

export type CategoryRow = { id: number; slug: string; name: string };

export async function listCategories(db: DbClient): Promise<CategoryRow[]> {
  return await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(categories.sortOrder, categories.id)
    .all();
}

// ─────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────

export async function createArticle(
  db: DbClient,
  input: ArticleWriteInput,
): Promise<number> {
  const now = new Date().toISOString();
  const result = await db
    .insert(articles)
    .values({
      slug: input.slug,
      title: input.title,
      lede: input.lede,
      heroImageKey: input.heroImageKey,
      heroImageAlt: input.heroImageAlt,
      heroImageCredit: input.heroImageCredit,
      subjectKind: input.subjectKind,
      subjectRef: input.subjectRef,
      subjectName: input.subjectName,
      contentJson: input.contentJson,
      contentHtml: input.contentHtml,
      readMinutes: input.readMinutes,
      actionsJson: JSON.stringify(input.actions ?? []),
      categoryId: input.categoryId,
      status: input.status,
      publishedAt: input.publishedAt,
      scheduledAt: input.scheduledAt,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: articles.id });
  const id = result[0]?.id;
  if (id == null) throw new Error("createArticle: returning が空");
  await replaceRelations(db, id, {
    companyCodes: input.companyCodes,
    industrySlugs: input.industrySlugs,
    tagSlugs: input.tagSlugs,
  });
  return id;
}

export async function updateArticle(
  db: DbClient,
  id: number,
  input: ArticleWriteInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(articles)
    .set({
      slug: input.slug,
      title: input.title,
      lede: input.lede,
      heroImageKey: input.heroImageKey,
      heroImageAlt: input.heroImageAlt,
      heroImageCredit: input.heroImageCredit,
      subjectKind: input.subjectKind,
      subjectRef: input.subjectRef,
      subjectName: input.subjectName,
      contentJson: input.contentJson,
      contentHtml: input.contentHtml,
      readMinutes: input.readMinutes,
      actionsJson: JSON.stringify(input.actions ?? []),
      categoryId: input.categoryId,
      status: input.status,
      publishedAt: input.publishedAt,
      scheduledAt: input.scheduledAt,
      authorId: input.authorId,
      updatedAt: now,
    })
    .where(eq(articles.id, id));
  await replaceRelations(db, id, {
    companyCodes: input.companyCodes,
    industrySlugs: input.industrySlugs,
    tagSlugs: input.tagSlugs,
  });
}

export async function deleteArticle(db: DbClient, id: number): Promise<void> {
  // 関連は CASCADE で自動削除
  await db.delete(articles).where(eq(articles.id, id));
}

async function replaceRelations(
  db: DbClient,
  articleId: number,
  rels: { companyCodes: string[]; industrySlugs: string[]; tagSlugs: string[] },
): Promise<void> {
  // companies
  await db.delete(articleCompanies).where(eq(articleCompanies.articleId, articleId));
  if (rels.companyCodes.length > 0) {
    await db
      .insert(articleCompanies)
      .values(
        rels.companyCodes.map((code, i) => ({
          articleId,
          code,
          position: i,
        })),
      );
  }

  // industries
  await db.delete(articleIndustries).where(eq(articleIndustries.articleId, articleId));
  if (rels.industrySlugs.length > 0) {
    await db
      .insert(articleIndustries)
      .values(
        rels.industrySlugs.map((slug, i) => ({
          articleId,
          industrySlug: slug,
          position: i,
        })),
      );
  }

  // tags (slug が無ければ自動作成)
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (rels.tagSlugs.length > 0) {
    const existing = await db
      .select({ id: tags.id, slug: tags.slug })
      .from(tags)
      .where(inArray(tags.slug, rels.tagSlugs))
      .all();
    const existingSlugs = new Set(existing.map((t) => t.slug));
    const toCreate = rels.tagSlugs.filter((s) => !existingSlugs.has(s));
    let created: { id: number; slug: string }[] = [];
    if (toCreate.length > 0) {
      const now = new Date().toISOString();
      created = await db
        .insert(tags)
        .values(toCreate.map((slug) => ({ slug, name: slug, createdAt: now })))
        .returning({ id: tags.id, slug: tags.slug });
    }
    const all = [...existing, ...created];
    const tagIdBySlug = new Map(all.map((t) => [t.slug, t.id]));
    await db
      .insert(articleTags)
      .values(
        rels.tagSlugs
          .map((slug) => tagIdBySlug.get(slug))
          .filter((id): id is number => id != null)
          .map((tagId) => ({ articleId, tagId })),
      );
  }
}

// ─────────────────────────────────────────────────────────
// RELATED (詳細ページの「この記事のあとに」用)
// ─────────────────────────────────────────────────────────

/**
 * 同じ主役 (subject_kind + subject_ref) の他の公開記事を最新順で返す。
 */
export async function listBySubject(
  db: DbClient,
  subjectKind: SubjectKind,
  subjectRef: string,
  opts: { excludeId?: number; limit?: number } = {},
): Promise<ArticleListItem[]> {
  const limit = opts.limit ?? 5;
  const conditions = [
    eq(articles.subjectKind, subjectKind),
    eq(articles.subjectRef, subjectRef),
    eq(articles.status, "published"),
  ];
  if (opts.excludeId != null) conditions.push(ne(articles.id, opts.excludeId));
  return (await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      lede: articles.lede,
      status: articles.status,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      subjectKind: articles.subjectKind,
      subjectRef: articles.subjectRef,
      subjectName: articles.subjectName,
      categoryId: articles.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      authorName: adminUsers.name,
      heroImageKey: articles.heroImageKey,
      readMinutes: articles.readMinutes,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(adminUsers, eq(articles.authorId, adminUsers.id))
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .all()) as ArticleListItem[];
}

/**
 * 同じカテゴリの他の公開記事を最新順で返す。
 */
export async function listByCategory(
  db: DbClient,
  categoryId: number,
  opts: { excludeId?: number; limit?: number } = {},
): Promise<ArticleListItem[]> {
  const limit = opts.limit ?? 5;
  const conditions = [
    eq(articles.categoryId, categoryId),
    eq(articles.status, "published"),
  ];
  if (opts.excludeId != null) conditions.push(ne(articles.id, opts.excludeId));
  return (await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      lede: articles.lede,
      status: articles.status,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      subjectKind: articles.subjectKind,
      subjectRef: articles.subjectRef,
      subjectName: articles.subjectName,
      categoryId: articles.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      authorName: adminUsers.name,
      heroImageKey: articles.heroImageKey,
      readMinutes: articles.readMinutes,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(adminUsers, eq(articles.authorId, adminUsers.id))
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .all()) as ArticleListItem[];
}
