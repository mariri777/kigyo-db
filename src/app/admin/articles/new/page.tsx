import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listCategories } from "@/server/repo/articleRepo";
import { AdminArticleEditor } from "../_AdminArticleEditor";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const db = await getDb();
  const categories = await listCategories(db);
  return <AdminArticleEditor id={null} categories={categories} />;
}
