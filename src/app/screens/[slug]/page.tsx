import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { applyScreen, getScreen, screens } from "@/lib/screens";
import type { Stock } from "@/lib/types";

export function generateStaticParams() {
  return screens.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screen = getScreen(slug);
  if (!screen) return { title: "見つかりません" };
  return {
    title: screen.title,
    description: screen.metaDescription,
  };
}

const VERDICT_STYLE: Record<string, string> = {
  割安: "text-positive bg-positive/10 border-positive/30",
  ほぼ妥当: "text-foreground bg-foreground/10 border-foreground/30",
  やや割高: "text-negative/80 bg-negative/5 border-negative/30",
  割高: "text-negative bg-negative/10 border-negative/30",
};

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = getScreen(slug);
  if (!screen) notFound();

  const matching = applyScreen(screen);
  const otherScreens = screens.filter((s) => s.slug !== screen.slug);

  return (
    <article className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href="/screens"
        className="inline-block text-xs text-muted hover:text-foreground transition mb-6"
      >
        ← すべてのスクリーン
      </Link>

      <header className="pb-8 border-b border-border mb-8">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">Screen</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-5">
          {screen.title}
        </h1>
        <p className="text-muted text-base leading-relaxed max-w-2xl">{screen.description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-dim">
          <span className="text-foreground font-bold tabular">{matching.length}</span>
          <span>社が条件に合致（プロトタイプ 18 社中）</span>
        </div>
      </header>

      {/* メソドロジー */}
      <section className="mb-10 bg-surface-elev border-l-2 border-foreground rounded-r-md p-4">
        <div className="text-[10px] text-muted tracking-widest mb-2">METHODOLOGY</div>
        <p className="text-sm leading-relaxed">{screen.methodology}</p>
      </section>

      {/* マッチング銘柄テーブル */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">該当銘柄</h2>
        {matching.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-8 text-center text-muted">
            条件に合致する銘柄がありません。プロトタイプの掲載銘柄を拡大すると該当銘柄が増えます。
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="hidden md:grid grid-cols-[40px_70px_1fr_140px_70px_80px_80px_90px_90px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2 gap-2">
              <div>#</div>
              <div>コード</div>
              <div>銘柄</div>
              <div>業界クラスタ</div>
              <div className="text-right">PER</div>
              <div className="text-right">ROE</div>
              <div className="text-right">配当</div>
              <div className="text-right">{emphasisLabel(screen.emphasis)}</div>
              <div className="text-right">評価</div>
            </div>
            {matching.map((s, i) => (
              <Link
                key={s.code}
                href={`/stocks/${s.code}`}
                className="grid grid-cols-1 md:grid-cols-[40px_70px_1fr_140px_70px_80px_80px_90px_90px] items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-elev transition group text-sm gap-2"
              >
                <div className="text-dim font-mono text-xs tabular">{(i + 1).toString().padStart(2, "0")}</div>
                <div className="text-dim tabular text-xs">{s.code}</div>
                <div>
                  <div className="font-medium group-hover:underline">{s.name}</div>
                  <div className="text-[11px] text-muted md:hidden truncate">{s.industryCluster}</div>
                </div>
                <div className="text-[11px] text-muted hidden md:block truncate">{s.industryCluster}</div>
                <div className="text-right tabular font-mono">{s.per.toFixed(1)}</div>
                <div className="text-right tabular font-mono">{s.roe.toFixed(1)}%</div>
                <div className="text-right tabular font-mono">{s.dividendYield.toFixed(1)}%</div>
                <div className="text-right tabular font-mono">
                  <EmphasisCell stock={s} emphasis={screen.emphasis} />
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] border rounded px-1.5 py-0.5 ${VERDICT_STYLE[s.valuationCall.verdict]}`}
                  >
                    {s.valuationCall.verdict}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 関連スクリーン */}
      <section className="mb-10">
        <h2 className="text-sm font-bold tracking-widest text-muted uppercase mb-4">他のスクリーン</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherScreens.slice(0, 6).map((s) => (
            <Link
              key={s.slug}
              href={`/screens/${s.slug}`}
              className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong transition text-sm font-medium"
            >
              {s.shortTitle} →
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 text-[11px] text-dim leading-relaxed">
        ※ このスクリーンは公開情報に基づく機械的抽出です。投資判断は必ず個別銘柄ページの「規範的判断」と「見落とし論点」、および一次情報をご確認のうえご自身の責任で行ってください。
        判断基準の詳細は <Link href="/legal/editorial-policy" className="underline">編集方針</Link> を、注意事項は <Link href="/legal/disclaimer" className="underline">免責事項</Link> をご覧ください。
      </div>
    </article>
  );
}

function emphasisLabel(e: string): string {
  switch (e) {
    case "per": return "PER ↑";
    case "pbr": return "PBR";
    case "dividendYield": return "配当 ↓";
    case "roe": return "ROE ↓";
    case "operatingMargin": return "営業利益率";
    case "revenueGrowth3y": return "3年成長";
    case "expansion": return "拡大期スコア";
    case "valuationScore": return "割安スコア";
    default: return "";
  }
}

function EmphasisCell({ stock, emphasis }: { stock: Stock; emphasis: string }) {
  switch (emphasis) {
    case "per":
      return <span className="font-bold">{stock.per.toFixed(1)} 倍</span>;
    case "pbr":
      return <span className="font-bold">{stock.pbr.toFixed(2)} 倍</span>;
    case "dividendYield":
      return <span className="font-bold">{stock.dividendYield.toFixed(1)}%</span>;
    case "roe":
      return <span className="font-bold">{stock.roe.toFixed(1)}%</span>;
    case "operatingMargin":
      return <span className="font-bold">{stock.operatingMargin.toFixed(1)}%</span>;
    case "revenueGrowth3y":
      return (
        <span className={`font-bold ${stock.revenueGrowth3y >= 0 ? "text-positive" : "text-negative"}`}>
          {stock.revenueGrowth3y >= 0 ? "+" : ""}
          {stock.revenueGrowth3y.toFixed(1)}%
        </span>
      );
    case "expansion":
      return <span className="font-bold">{stock.phaseScores.expansion}</span>;
    case "valuationScore":
      return <span className="font-bold">{stock.valuationCall.score}</span>;
    default:
      return <span>—</span>;
  }
}
