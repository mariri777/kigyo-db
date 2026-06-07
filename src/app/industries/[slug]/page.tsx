import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getIndustry,
  getStocksForCluster,
  industries,
  industryAggregates,
} from "@/lib/industries";
import { Section } from "@/components/Section";
import { AiBadge, AiDisclaimer } from "@/components/AiNotice";
import { SourceList } from "@/components/SourceChip";
import { Disclose } from "@/components/Disclose";
import { postsForIndustry } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return { title: "見つかりません" };
  return {
    title: `${ind.name} — 業界マップ・主要企業・投資論点`,
    description: `${ind.name}業界の競争構造、主要KPI、見落とし論点、上場企業一覧。${ind.description.slice(0, 80)}`,
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const agg = industryAggregates(industry);
  const relatedPosts = postsForIndustry(industry.slug).slice(0, 3);

  return (
    <article className="max-w-6xl mx-auto px-6 py-8">
      {/* ===== Hero ===== */}
      <header className="border-b border-border pb-10 mb-12">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Industry Deep Dive
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-6">
          {industry.name}
        </h1>
        <p className="text-muted leading-relaxed max-w-3xl text-base mb-8">
          {industry.description}
        </p>

        {/* テーマ chips */}
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

        {/* 市場規模 stat row */}
        <div className="grid sm:grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden">
          <div className="bg-background p-4">
            <div className="text-[10px] text-dim tracking-wider mb-1">市場規模</div>
            <div className="font-bold tabular">{industry.marketScale.headline}</div>
            <div className="text-[11px] text-muted mt-1">{industry.marketScale.growth}</div>
          </div>
          <div className="bg-background p-4">
            <div className="text-[10px] text-dim tracking-wider mb-1">カバー銘柄</div>
            <div className="font-bold tabular">
              {agg.count} 社 <span className="text-xs text-muted font-normal">（サンプルデータ）</span>
            </div>
            <div className="text-[11px] text-muted mt-1">
              時価総額合計 {agg.totalMcap.toLocaleString()} 億円
            </div>
          </div>
          <div className="bg-background p-4">
            <div className="text-[10px] text-dim tracking-wider mb-1">カバー銘柄の平均</div>
            <div className="font-bold tabular">
              PER {agg.avgPer.toFixed(1)} 倍 / ROE {agg.avgRoe.toFixed(1)}%
            </div>
            <div className="text-[11px] text-muted mt-1">{industry.marketScale.breakdown}</div>
          </div>
        </div>
      </header>

      {/* ===== 業界マップ ===== */}
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
        <div className="grid lg:grid-cols-3 gap-4">
          {industry.chainColumns.map((col) => {
            const subs = industry.subClusters.filter((s) => col.positions.includes(s.position));
            return (
              <div key={col.title} className="bg-surface border border-border rounded-md p-5">
                <div className="border-b border-border pb-3 mb-4">
                  <div className="text-[11px] text-dim tracking-wider">{col.subtitle}</div>
                  <h3 className="text-xl font-bold mt-1">{col.title}</h3>
                </div>
                <div className="space-y-4">
                  {subs.map((sub) => {
                    const stocks = getStocksForCluster(sub);
                    return (
                      <div key={sub.key}>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm">{sub.name}</h4>
                          <span className="text-[10px] text-dim tabular">{stocks.length} 社</span>
                        </div>
                        <p className="text-[12px] text-muted leading-relaxed mb-2">{sub.role}</p>
                        <div className="flex flex-wrap gap-1">
                          {stocks.map((s) => (
                            <Link
                              key={s.code}
                              href={`/stocks/${s.code}`}
                              className="inline-flex items-center gap-1 text-[11px] border border-border rounded px-2 py-0.5 hover:bg-surface-elev hover:border-border-strong transition"
                            >
                              <span className="text-dim tabular">{s.code}</span>
                              <span className="font-medium">{s.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== 競争構造 ===== */}
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
        <div className="space-y-6">
          {industry.competitiveStructure.map((cs, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-8 pb-6 border-b border-border last:border-b-0 last:pb-0"
            >
              <h3 className="font-bold text-base">{cs.sub}</h3>
              <div>
                {/* サマリー：要約だけ知りたい方はここだけ読んで OK */}
                <p className="text-sm leading-relaxed">{cs.summary}</p>

                {/* 詳細分析（展開） */}
                <Disclose label="詳しい分析を見る">
                  <p className="text-muted leading-relaxed">{cs.detail}</p>
                </Disclose>

                {/* シェア比較（展開） */}
                {cs.shares && (
                  <Disclose label="シェア比較を見る">
                    <div className="text-[11px] text-dim mb-2">{cs.shares.metric}</div>
                    <ul className="space-y-1.5">
                      {cs.shares.entries.map((e, j) => (
                        <li
                          key={j}
                          className="grid grid-cols-[32px_1fr_120px] sm:grid-cols-[32px_1fr_140px_1fr] items-baseline gap-2 py-1.5 border-b border-border last:border-b-0"
                        >
                          <span className="text-dim tabular text-xs">
                            {e.rank ? `${e.rank}.` : "・"}
                          </span>
                          <span className="font-medium text-sm">{e.name}</span>
                          <span className="tabular font-mono text-sm text-right sm:text-left">
                            {e.value}
                          </span>
                          {e.note && (
                            <span className="text-[11px] text-muted col-span-3 sm:col-span-1 sm:text-right">
                              {e.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {cs.shares.note && (
                      <p className="text-[11px] text-dim mt-3 leading-relaxed">
                        ※ {cs.shares.note}
                      </p>
                    )}
                  </Disclose>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 主要 KPI ===== */}
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
        <div className="bg-surface border border-border rounded-md divide-y divide-border">
          {industry.keyKpis.map((kpi) => (
            <div key={kpi.name} className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-1 md:gap-6 items-baseline">
                <div className="font-bold text-sm">{kpi.name}</div>
                <div className="text-sm tabular">{kpi.current}</div>
              </div>
              <div className="md:pl-[244px]">
                <Disclose label="これは何？">
                  <p className="text-muted leading-relaxed">{kpi.desc}</p>
                </Disclose>
                {kpi.history && kpi.history.length > 0 && (
                  <Disclose label="推移を見る">
                    <ul className="space-y-1.5">
                      {kpi.history.map((h, j) => (
                        <li
                          key={j}
                          className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_180px_1fr] items-baseline gap-2 py-1 border-b border-border last:border-b-0"
                        >
                          <span className="text-dim text-xs tabular">{h.period}</span>
                          <span className="tabular font-mono">{h.value}</span>
                          {h.note && (
                            <span className="text-[11px] text-muted col-span-2 sm:col-span-1">
                              {h.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Disclose>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 業界レベル見落とし論点 ===== */}
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
        <div className="space-y-4">
          {industry.industryInsights.map((ins, i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-5">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-foreground/60 text-sm font-mono">
                  0{i + 1}
                </span>
                <h3 className="font-bold leading-tight">{ins.title}</h3>
              </div>
              <p className="text-sm leading-relaxed">{ins.lede}</p>
              <Disclose label="根拠を読む">
                <p className="text-muted leading-relaxed mb-3">{ins.body}</p>
                <SourceList sources={ins.citations.map((c) => ({ doc: c.doc, period: c.period }))} />
              </Disclose>
            </div>
          ))}
        </div>
        <AiDisclaimer />
      </Section>

      {/* ===== 主要銘柄一覧（サブクラスタ別） ===== */}
      <Section
        id="companies"
        title="主要銘柄一覧"
        subtitle="サブクラスタ別の上場企業（クリックで個別銘柄ページへ）"
      >
        <div className="space-y-8">
          {industry.subClusters.map((sub) => {
            const stocks = getStocksForCluster(sub);
            if (stocks.length === 0) return null;
            return (
              <div key={sub.key}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-bold text-base">{sub.name}</h3>
                  <span className="text-[11px] text-dim">{stocks.length} 社</span>
                </div>
                <div className="bg-surface border border-border rounded-md overflow-hidden">
                  <div className="hidden md:grid grid-cols-[70px_1fr_90px_70px_70px_90px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2">
                    <div>コード</div>
                    <div>銘柄</div>
                    <div className="text-right">株価</div>
                    <div className="text-right">PER</div>
                    <div className="text-right">ROE</div>
                    <div className="text-right">3年成長</div>
                  </div>
                  {stocks.map((s) => (
                    <Link
                      key={s.code}
                      href={`/stocks/${s.code}`}
                      className="grid grid-cols-1 md:grid-cols-[70px_1fr_90px_70px_70px_90px] gap-2 md:gap-0 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm"
                    >
                      <div className="text-dim tabular text-xs">{s.code}</div>
                      <div>
                        <div className="font-medium group-hover:underline">{s.name}</div>
                        <div className="text-[11px] text-muted line-clamp-1">{s.description.slice(0, 60)}…</div>
                      </div>
                      <div className="text-right tabular font-mono">
                        ¥{s.priceJpy.toLocaleString()}
                      </div>
                      <div className="text-right tabular font-mono">{s.per.toFixed(1)}</div>
                      <div className="text-right tabular font-mono">{s.roe.toFixed(1)}%</div>
                      <div
                        className={`text-right tabular font-mono ${
                          s.revenueGrowth3y >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {s.revenueGrowth3y >= 0 ? "+" : ""}
                        {s.revenueGrowth3y.toFixed(1)}%
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== 関連記事 ===== */}
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

      {/* ===== Footer link ===== */}
      <div className="border-t border-border pt-8 mt-12 flex items-center justify-between text-sm">
        <Link href="/industries" className="text-muted hover:text-foreground transition">
          ← 業界マップ一覧へ
        </Link>
        <Link href="/" className="text-muted hover:text-foreground transition">
          トップへ →
        </Link>
      </div>
    </article>
  );
}
