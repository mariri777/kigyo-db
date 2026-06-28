import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminTop() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  // 新 admin の本拠地は /admin/articles
  redirect("/admin/articles");
}
