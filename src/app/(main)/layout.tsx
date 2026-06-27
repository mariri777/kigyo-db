import Script from "next/script";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StructuredData } from "@/components/StructuredData";
import { siteOrganizationLd, websiteLd } from "@/lib/seo/structuredData";
import { SITE_DESCRIPTION, SITE_SAME_AS } from "@/shared/site";

// Cookie 不使用・個人を追跡しない計測。本番ビルドのみロード。
const CF_ANALYTICS_TOKEN = "6a7cbafe0c2b4fed9c18724aabea76e6";

/**
 * 公開サイト全体の chrome (ヘッダー / フッター / JSON-LD / Web Analytics)。
 * 管理画面 (`/admin/*`) はこの layout に入らないので、フッター・検索ボックス・
 * JSON-LD 等は admin 側に一切混ざらない。
 */
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <StructuredData data={websiteLd()} />
      <StructuredData data={siteOrganizationLd({ description: SITE_DESCRIPTION, sameAs: SITE_SAME_AS })} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {process.env.NODE_ENV === "production" && (
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token": "${CF_ANALYTICS_TOKEN}"}`}
        />
      )}
    </>
  );
}
