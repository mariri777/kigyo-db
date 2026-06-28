import { notFound, redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { findById, listCategories } from "@/server/repo/articleRepo";
import { AdminArticleEditor } from "../_AdminArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId)) notFound();
  const db = await getDb();
  const [article, categories] = await Promise.all([
    findById(db, articleId),
    listCategories(db),
  ]);
  if (!article) notFound();
  return (
    <AdminArticleEditor
      id={article.id}
      categories={categories}
      initial={{
        slug: article.slug,
        title: article.title,
        lede: article.lede,
        heroImageKey: article.heroImageKey,
        heroImageAlt: article.heroImageAlt,
        heroImageCredit: article.heroImageCredit,
        subjectKind: article.subjectKind,
        subjectRef: article.subjectRef,
        subjectName: article.subjectName,
        contentJson: article.contentJson,
        contentHtml: article.contentHtml,
        readMinutes: article.readMinutes,
        actions: article.actions,
        categoryId: article.categoryId,
        status: article.status,
        publishedAt: article.publishedAt,
        scheduledAt: article.scheduledAt,
        companyCodes: article.companyCodes,
        industrySlugs: article.industrySlugs,
        tagSlugs: article.tagSlugs,
      }}
    />
  );
}
