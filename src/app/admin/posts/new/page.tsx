import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/session";
import { createPostAction } from "@/server/blog/actions";
import { getDb } from "@/server/db/client";
import { listAllTags } from "@/server/repo/postRepo";
import { industries } from "@/content/industries";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const db = await getDb();
  const tags = await listAllTags(db);
  const availableIndustries = industries.map((i) => ({ slug: i.slug, name: i.name }));

  return (
    <div>
      <Link
        href="/admin"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition mb-6"
      >
        ← 記事一覧へ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">新規記事</h1>
      <PostEditor
        action={createPostAction}
        submitLabel="保存中"
        availableTags={tags}
        availableIndustries={availableIndustries}
        initial={{
          slug: "",
          title: "",
          lede: "",
          bodyHtml: "<p></p>",
          category: "analysis",
          status: "draft",
          author: "editor",
          fiscalPeriod: "",
          publishedAt: "",
          relatedStocks: [],
          relatedIndustries: [],
          tagSlugs: [],
        }}
      />
    </div>
  );
}
