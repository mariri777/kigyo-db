import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getIndustry,
  industryAggregates,
} from "@/content/industries";
import { Section } from "@/components/Section";
import { AiBadge, AiDisclaimer } from "@/components/AiNotice";
import { Eyebrow } from "@/components/ui/eyebrow";
import { postsForIndustry } from "@/content/posts";
import { PostCard } from "@/components/PostCard";
import { listStockBriefs } from "@/server/usecase";
import { IndustryMap } from "@/components/industry/IndustryMap";
import { CompetitiveStructure } from "@/components/industry/CompetitiveStructure";
import { KpiList } from "@/components/industry/KpiList";
import { IndustryStocksTable } from "@/components/industry/IndustryStocksTable";
import { IndustryInsightList } from "@/components/industry/IndustryInsightList";
import { StructuredData } from "@/components/StructuredData";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbList, collectionPageLd } from "@/lib/seo/structuredData";
import { ROUTES } from "@/shared/links";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return NOT_FOUND_METADATA;
  const title = `${ind.name}業界マップ — 競争構造・主要プレイヤー・投資論点`;
  const description = `${ind.name}業界の競争構造、バリューチェーン上のサブクラスタ、主要 KPI、市場が見落とした論点、上場企業一覧を一枚に。${ind.description.slice(0, 70)}`;
  return pageMetadata({
    title,
    description,
    path: `${ROUTES.industries}/${ind.slug}`,
    keywords: [ind.name, "業界マップ", "競争構造", ...ind.theme2025.slice(0, 4)],
  });
}

export default async function IndustryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const briefsByCode = new Map((await listStockBriefs()).map((b) => [b.code, b]));
  const agg = industryAggregates(industry, briefsByCode);
  const relatedPosts = (await postsForIndustry(industry.slug)).slice(0, 3);

  const path = `${ROUTES.industries}/${industry.slug}`;
  const jsonLd = [
    breadcrumbList([
      { name: "業界マップ", href: ROUTES.industries },
      { name: industry.name, href: path },
    ]),
    collectionPageLd({
      name: `${industry.name}業界マップ`,
      path,
      description: industry.description.slice(0, 160),
      about: industry.name,
    }),
  ];

  return (
    <article className="max-w-6xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />

      <header className="border-b border-border pb-10 mb-12">
        <Eyebrow className="mb-4">Industry Deep Dive</Eyebrow>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          {industry.name}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-3xl text-base mb-8">
          {industry.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {industry.theme2025.map((t) => (
            <span
              key={t}
              className="text-[11px] font-medium border border-border-strong rounded-full px-3 py-1"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden">
          <StatCell label="市場規模" value={industry.marketScale.headline} sub={industry.marketScale.growth} />
          <StatCell
            label="カバー銘柄"
            value={`${agg.count} 社`}
            valueSuffix="(株価実勢・財務はサンプル)"
            sub={`時価総額合計 ${agg.totalMcap.toLocaleString()} 億円`}
          />
          <StatCell
            label="カバー銘柄の平均"
            value={`PER ${agg.avgPer.toFixed(1)} 倍`}
            sub={industry.marketScale.breakdown}
          />
        </div>
      </header>

      <Section
        id="map"
        title="業界マップ"
        subtitle="バリューチェーン上の位置でサブクラスタを 3 群に整理"
        guide={
          <>
            半導体ビジネスは「<strong>材料 → 装置 → 設計 → 製造 → テスト</strong>」の長い連鎖で成り立っています。
            それぞれの工程に別の会社がいて、別の業績パターンを持ちます。まずはこのマップで「どこに位置する会社か」を掴むのがおすすめです。
          </>
        }
      >
        <IndustryMap industry={industry} briefsByCode={briefsByCode} />
      </Section>

      <Section
        id="competitive-structure"
        title="競争構造"
        subtitle="サブクラスタごとの主要プレイヤーと勢力図"
        guide={
          <>
            まず<strong>サマリー</strong>で各サブクラスタの勢力図をざっくり把握。
            気になるところだけ「詳しく見る」「シェア比較」を開けば、具体的な分析や数値に降りられます。
          </>
        }
      >
        <CompetitiveStructure blocks={industry.competitiveStructure} />
      </Section>

      <Section
        id="kpis"
        title="主要 KPI と市場動向"
        subtitle="業界の方向感を測るために定期ウォッチすべき指標"
        guide={
          <>
            各指標の<strong>現在値</strong>がまず見えます。
            「これは何？」で意味を、「推移を見る」で時系列を展開できます。
          </>
        }
      >
        <KpiList kpis={industry.keyKpis} />
      </Section>

      <Section
        id="insights"
        title="業界レベルの見落とし論点"
        subtitle="個別銘柄に分解する前に、業界全体として押さえるべき論点"
        guide={
          <>
            「個別の会社ではなく <strong>業界全体</strong> として、市場であまり話題になっていない論点」を抽出。
            「半導体に投資するなら、最低限ここは押さえておいたほうがいい」というレベル感の論点群です。
          </>
        }
        rightSlot={<AiBadge />}
        ai
      >
        <IndustryInsightList insights={industry.industryInsights} />
        <AiDisclaimer />
      </Section>

      <Section
        id="companies"
        title="主要銘柄一覧"
        subtitle="サブクラスタ別の上場企業(クリックで個別銘柄ページへ)"
      >
        <IndustryStocksTable industry={industry} briefsByCode={briefsByCode} />
      </Section>

      {relatedPosts.length > 0 && (
        <Section
          id="related-posts"
          title={`${industry.name}に関する記事`}
          subtitle="ブログで業界の最新動向を追う"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedPosts.map((p) => (
              <PostCard key={p.slug} post={p} compact />
            ))}
          </div>
        </Section>
      )}

      <div className="border-t border-border pt-8 mt-12 flex items-center justify-between text-sm">
        <Link href={ROUTES.industries} className="text-muted-foreground hover:text-foreground transition">
          ← 業界マップ一覧へ
        </Link>
        <Link href={ROUTES.home} className="text-muted-foreground hover:text-foreground transition">
          トップへ →
        </Link>
      </div>
    </article>
  );
}

function StatCell({
  label,
  value,
  valueSuffix,
  sub,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  sub?: string;
}) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] text-foreground/60 tracking-wider mb-1">{label}</div>
      <div className="font-bold tabular">
        {value}
        {valueSuffix && (
          <span className="text-xs text-muted-foreground font-normal ml-1">{valueSuffix}</span>
        )}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
