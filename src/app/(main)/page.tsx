import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { resolveMediaSrc, shouldSkipImageOptimization } from "@/shared/media";
import {
  TrendingUp,
  TrendingDown,
  Bookmark,
  Share2,
  Sparkles,
  Zap,
  Building2,
  Cpu,
  Car,
  Globe,
  Search,
  ChevronRight,
  Star,
  Activity,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import {
  ANGLE_META,
  angleFromCategorySlug,
  type Subject as ArticleSubject,
} from "./articles/_lib/posts";
import { SIGNAL_META, type SignalKind } from "./articles/_lib/signals";
import { getDb } from "@/server/db/client";
import {
  findLatestMarketBrief,
  listLatestHighlights,
  listMarketIndices,
  type HighlightRow,
  type MarketBriefRow,
  type MarketIndexRow,
} from "@/server/repo/homepageRepo";
import {
  listLatestLiveForecasts,
  type ForecastShiftPoint,
  type ForecastSummary,
} from "@/server/repo/forecastRepo";
import { listAll as listAllArticles, type ArticleListItem } from "@/server/repo/articleRepo";

// 動的データ取得 (D1) が入るため、build 時 prerender を避ける
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "日本株 3800 社のAI銘柄分析データベース",
  description:
    "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。今日の市場サマリ・今日のまとめ・注目企業/業界カード・予測コーナー・業界マップ・記事を 1 つに。日々の見落とし論点と先回りキュレーションをまとめて読める。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・今日のまとめ・注目企業/業界・予測・業界マップ・記事を 1 つに。",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "日本株 3800 社のAI銘柄分析データベース | 超!企業DB",
    description:
      "東証上場 3,800 社をAIが掘り下げる銘柄分析データベース。市場サマリ・今日のまとめ・注目企業/業界・予測・業界マップ・記事を 1 つに。",
  },
};

// ─────────────────────────────────────────────────────────
// ダミーデータ (D1 接続失敗時の fallback)
// ─────────────────────────────────────────────────────────

const INDICES = [
  { name: "日経平均", value: "42,318.47", change: "+1.24%", delta: "+517.84", positive: true },
  { name: "TOPIX", value: "2,983.12", change: "+0.87%", delta: "+25.71", positive: true },
  { name: "東証グロース", value: "812.44", change: "-0.32%", delta: "-2.61", positive: false },
  { name: "USD/JPY", value: "152.18", change: "-0.41%", delta: "-0.62", positive: false },
  { name: "SOX 指数", value: "5,624.91", change: "+2.18%", delta: "+119.84", positive: true },
] as const;

const AI_SUMMARY = {
  lede: "半導体に火が戻った1日。HBM需要観測とSOX高で東エレク・アドバンが牽引、ディフェンシブは利確優勢で頭打ち。",
  bullets: [
    "東エレ +3.4% / アドバン +4.1%。米AI設備投資の上方修正が前場から効いた。",
    "三井物産・伊藤忠は商社の調整局面入りを示唆、円安一服も逆風。",
    "明日は決算ラッシュ初日。指数の動きより個別の予想ズレに資金が向きやすい。",
  ],
  watchThemes: [
    { name: "HBM・先端パッケージ", change: "+3.8%", icon: Cpu },
    { name: "電力インフラ", change: "+1.9%", icon: Zap },
    { name: "防衛・宇宙", change: "+0.7%", icon: Activity },
  ],
};

function unsplashUrl(id: string, w: number, h?: number) {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(w),
    q: "75",
  });
  if (h) params.set("h", String(h));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

const FEATURED_UPCOMING: Array<{
  name: string;
  caption: string;
  icon: typeof Cpu;
  tint: string;
  glow: string;
  iconBg: string;
}> = [
  {
    name: "半導体業界",
    caption: "前工程・後工程・装置・材料まで、工程ごとの企業ポジションを横断分析。",
    icon: Cpu,
    tint: "from-purple-500/15 via-purple-500/5 to-transparent",
    glow: "bg-purple-400/20",
    iconBg: "bg-purple-100 text-purple-700",
  },
  {
    name: "自動車業界",
    caption: "EV・ハイブリッド・サプライチェーンの構造変化と完成車メーカーの収益力。",
    icon: Car,
    tint: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    glow: "bg-emerald-400/20",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "アメリカ株",
    caption: "S&P500・ナスダックの主要銘柄を、日本株投資家の視点でキュレーション。",
    icon: Globe,
    tint: "from-blue-500/15 via-blue-500/5 to-transparent",
    glow: "bg-blue-400/20",
    iconBg: "bg-blue-100 text-blue-700",
  },
];


const SECTOR_CHIPS = [
  { name: "電気機器", count: 248, hot: true },
  { name: "情報・通信", count: 583, hot: true },
  { name: "輸送用機器", count: 92 },
  { name: "化学", count: 213 },
  { name: "機械", count: 234 },
  { name: "医薬品", count: 71 },
  { name: "卸売", count: 309 },
  { name: "小売", count: 320 },
  { name: "銀行", count: 81 },
  { name: "保険", count: 13 },
  { name: "建設", count: 162 },
  { name: "不動産", count: 142 },
];

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function HomePage() {
  // D1 取得は並列。ローカルで未seedの場合は空配列が返って fallback に倒れる。
  const data = await loadHomepageData();
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-12">
        <h1 className="sr-only">
          超!企業DB — 日本株 3800 社の AI 銘柄分析データベース
        </h1>
        <MarketSummary indices={data.indices} brief={data.brief} today={data.today} />
        <MarketSignals highlights={data.highlights} today={data.today} />
        <ArticlesSection posts={data.latestArticles} />
        <Featured />
        <Predictions forecasts={data.forecasts} />
        <ExploreRails />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Data loaders
// ─────────────────────────────────────────────────────────

type HomepageData = {
  today: string;
  indices: IndexView[];
  brief: BriefView;
  highlights: HighlightView[];
  latestArticles: ArticleListItem[];
  forecasts: ForecastSummary[];
};

async function loadHomepageData(): Promise<HomepageData> {
  try {
    const db = await getDb();
    const [indices, brief, highlights, articles, forecasts] = await Promise.all([
      listMarketIndices(db),
      findLatestMarketBrief(db),
      listLatestHighlights(db, 6),
      listAllArticles(db),
      listLatestLiveForecasts(db, 2),
    ]);
    return {
      today: formatTodayJp(brief?.date),
      indices: indices.length > 0 ? indices.map(toIndexView) : FALLBACK_INDICES,
      brief: brief ? toBriefView(brief) : FALLBACK_BRIEF,
      highlights:
        highlights.length > 0 ? highlights.map(toHighlightView) : FALLBACK_HIGHLIGHTS,
      latestArticles: articles
        .filter((a) => a.status === "published")
        .slice(0, 5),
      forecasts,
    };
  } catch {
    // D1 バインディングが無い (例: 一部の preview) ときは fallback で安全に表示
    return {
      today: formatTodayJp(undefined),
      indices: FALLBACK_INDICES,
      brief: FALLBACK_BRIEF,
      highlights: FALLBACK_HIGHLIGHTS,
      latestArticles: [],
      forecasts: [],
    };
  }
}

type IndexView = {
  key: string;
  name: string;
  value: string;
  change: string;
  delta: string;
  positive: boolean;
};

type BriefView = {
  lede: string;
  bullets: string[];
  watchThemes: Array<{ name: string; change: string; icon: typeof Cpu }>;
};

type HighlightView = {
  id: string;
  kind: SignalKind;
  publishedAt: string;
  publishedAtIso: string;
  subjectKind: ArticleSubject["kind"];
  subjectCode: string | null;
  subjectName: string;
  oneLiner: string;
  keyMetric: { label: string; value: string; positive: boolean | null };
  relatedHref: string | null;
};

function toIndexView(r: MarketIndexRow): IndexView {
  const positive = (r.change1dPct ?? 0) >= 0;
  return {
    key: r.symbol,
    name: r.name,
    value: r.value != null ? formatNumber(r.value) : "—",
    change: r.change1dPct != null ? formatPctSigned(r.change1dPct) : "—",
    delta: r.change1dAbs != null ? formatPctSigned(r.change1dAbs) : "—",
    positive,
  };
}

function toBriefView(b: MarketBriefRow): BriefView {
  return {
    lede: b.lede ?? "",
    bullets: b.bullets,
    watchThemes: b.watchThemes.map((t) => ({
      name: t.name,
      change: formatPctSigned(t.changePct),
      icon: themeIcon(t.name),
    })),
  };
}

function toHighlightView(h: HighlightRow): HighlightView {
  const SUPPORTED: SignalKind[] = ["earnings_brief", "price_anomaly", "indicator_shift"];
  const kind = (SUPPORTED.includes(h.kind as SignalKind) ? h.kind : "indicator_shift") as SignalKind;
  return {
    id: h.id,
    kind,
    publishedAt: h.publishedAt,
    publishedAtIso: h.publishedAtIso,
    subjectKind: h.subjectKind as ArticleSubject["kind"],
    subjectCode: h.subjectCode,
    subjectName: h.subjectName,
    oneLiner: h.oneLiner,
    keyMetric: {
      label: h.keyMetricLabel,
      value: h.keyMetricValue,
      positive: h.keyMetricPositive,
    },
    relatedHref: h.relatedArticleSlug
      ? `/articles/${h.relatedArticleSlug}`
      : h.subjectKind === "company" && h.subjectCode
        ? `/stocks/${h.subjectCode}`
        : null,
  };
}

// Watch テーマ名 → アイコンの軽いマッピング。当たらなければ Sparkles。
function themeIcon(name: string): typeof Cpu {
  if (/半導体|HBM|チップ/i.test(name)) return Cpu;
  if (/電力|エネルギ|送配電/i.test(name)) return Zap;
  if (/防衛|宇宙/i.test(name)) return Activity;
  return Sparkles;
}

function formatNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPctSigned(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function formatTodayJp(isoDate?: string): string {
  const d = isoDate ? new Date(`${isoDate}T00:00:00+09:00`) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${y}年${m}月${day}日 (${wd})`;
}

// D1 が空のときの fallback。デザイン崩れを防ぐ。
const FALLBACK_INDICES: IndexView[] = INDICES.map((i) => ({
  key: i.name,
  name: i.name,
  value: i.value,
  change: i.change,
  delta: i.delta,
  positive: i.positive,
}));

const FALLBACK_BRIEF: BriefView = {
  lede: AI_SUMMARY.lede,
  bullets: [...AI_SUMMARY.bullets],
  watchThemes: AI_SUMMARY.watchThemes.map((t) => ({
    name: t.name,
    change: t.change,
    icon: t.icon,
  })),
};

const FALLBACK_HIGHLIGHTS: HighlightView[] = [];

// ─────────────────────────────────────────────────────────
// Market Summary
// ─────────────────────────────────────────────────────────

function MarketSummary({
  indices,
  brief,
  today,
}: {
  indices: IndexView[];
  brief: BriefView;
  today: string;
}) {
  const hero = indices[0] ?? FALLBACK_INDICES[0];
  const subIndices = indices.slice(1);
  return (
    <section>
      <SectionHeader
        kicker={today}
        title="本日の市場サマリ"
        icon={Activity}
        tag={{ label: "AI 要約", color: "bg-emerald-500 text-white" }}
      />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ヒーロー: 日経平均 + 写真 + チャート背景 */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-sm min-h-[300px] flex flex-col">
          {/* 背景写真 (東京の街並み・トレーディングフロアなど) */}
          <Image
            src={unsplashUrl("photo-1535320903710-d993d3d77d29", 1200, 600)}
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-neutral-900/60" />
          <ChartBackdrop positive={hero.positive} />
          <div className="relative p-6 sm:p-7 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                <Activity className="w-3 h-3" />
                本日の主役指標
              </span>
              <span className="text-xs text-neutral-300 font-mono tabular">
                15:00 大引け
              </span>
            </div>

            <div className="mt-auto pt-8">
              <div className="text-sm font-semibold text-neutral-300 mb-1">
                {hero.name}
              </div>
              <div className="flex items-baseline gap-4 flex-wrap">
                <div className="font-mono tabular text-5xl sm:text-6xl font-bold tracking-tight">
                  {hero.value}
                </div>
                <div className="flex items-center gap-1.5 font-mono tabular font-bold text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-2xl">{hero.change}</span>
                  <span className="text-base text-neutral-300 font-normal">
                    {hero.delta}
                  </span>
                </div>
              </div>
            </div>

            {/* sub indices inline */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subIndices.map((idx) => (
                <div key={idx.key} className="rounded-xl bg-white/5 backdrop-blur px-3 py-2.5 hover:bg-white/10 transition cursor-pointer">
                  <div className="text-[10px] text-neutral-300 font-semibold mb-0.5 truncate">
                    {idx.name}
                  </div>
                  <div className="font-mono tabular text-sm font-bold truncate">
                    {idx.value}
                  </div>
                  <div
                    className={`flex items-center gap-0.5 font-mono tabular text-xs font-semibold ${
                      idx.positive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {idx.positive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {idx.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Brief サマリ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold">今日のまとめ</div>
                <div className="text-[10px] text-neutral-500">17時に生成</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition" aria-label="ブックマーク">
                <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition" aria-label="共有">
                <Share2 className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-4 flex-1">
            <p className="text-base font-bold leading-snug tracking-tight">
              {brief.lede}
            </p>
            <ul className="space-y-2.5">
              {brief.bullets.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                  <span className="font-mono text-emerald-600 font-bold tabular shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-neutral-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-neutral-100">
            <div className="px-5 pt-3 pb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold tracking-wider text-neutral-600">
                注目テーマ
              </span>
            </div>
            <ul className="px-3 pb-3">
              {brief.watchThemes.map((t) => {
                const Icon = t.icon;
                return (
                  <li
                    key={t.name}
                    className="px-2 py-2 flex items-center gap-2.5 hover:bg-neutral-50 rounded-lg transition cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1 text-xs font-semibold truncate">
                      {t.name}
                    </span>
                    <span className="text-xs text-emerald-600 font-mono tabular font-bold">
                      {t.change}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartBackdrop({ positive }: { positive: boolean }) {
  // ダミーの株価ラインを背景に大きく描く
  const data = [42, 41, 43, 42, 44, 43, 45, 47, 46, 48, 50, 51, 53, 52, 54, 56, 57, 58, 60, 62];
  const w = 600;
  const h = 240;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${h - ((d - min) / range) * h * 0.85 - h * 0.05}`)
    .join(" ");
  const stroke = positive ? "#10b981" : "#f43f5e";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 w-full h-full opacity-40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
        <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#hero-chart-fill)" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Articles (編集記事のみ。密度高い縦リスト + テーマrail)
// AI速報 (signals) は MarketSignals セクションに分離。
// ─────────────────────────────────────────────────────────

function ArticlesSection({ posts }: { posts: ArticleListItem[] }) {
  return (
    <section id="articles" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">記事</h2>
        <Link
          href="/articles"
          className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
        >
          すべての記事
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          公開済みの記事はまだありません。
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((p) => (
            <li key={p.id}>
              <ArticleCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function articleSubject(p: ArticleListItem): ArticleSubject {
  if (p.subjectKind === "company") {
    return { kind: "company", code: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "industry") {
    return { kind: "industry", slug: p.subjectRef, name: p.subjectName };
  }
  if (p.subjectKind === "theme") {
    return { kind: "theme", slug: p.subjectRef, name: p.subjectName };
  }
  return { kind: "metric", slug: p.subjectRef, name: p.subjectName };
}

function articleAngleMeta(p: ArticleListItem) {
  const key = angleFromCategorySlug(p.categorySlug);
  if (key) return ANGLE_META[key];
  return { label: p.categoryName, icon: Sparkles, color: "bg-neutral-100 text-neutral-700" };
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function ArticleCard({ post }: { post: ArticleListItem }) {
  const angle = articleAngleMeta(post);
  const AngleIcon = angle.icon;
  const thumbSrc = post.heroImageKey
    ? resolveMediaSrc(post.heroImageKey, { w: 480, h: 320 }) ?? ""
    : null;
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="group flex gap-3 sm:gap-4 bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden h-full"
    >
      {thumbSrc && (
        <div className="relative w-28 sm:w-36 shrink-0 bg-neutral-100">
          <Image
            src={thumbSrc}
            alt=""
            fill
            sizes="(min-width: 640px) 144px, 112px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={shouldSkipImageOptimization(thumbSrc)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 py-3 pr-3 sm:pr-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${angle.color}`}
          >
            <AngleIcon className="w-2.5 h-2.5" />
            {angle.label}
          </span>
          <ArticleSubjectChip subject={articleSubject(post)} compact />
        </div>
        <h3 className="text-[14px] sm:text-[15px] font-bold tracking-tight leading-snug group-hover:text-neutral-900 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[12px] text-neutral-600 leading-relaxed line-clamp-2">
          {post.lede}
        </p>
        <div className="mt-auto pt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {formatPublishedAt(post.publishedAt)} · {post.readMinutes}分
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// Market signals (シグナル: DBの更新から自動生成された通知)
// 市場サマリの下に、リアルタイム感のある縦リストとして出す。
// ─────────────────────────────────────────────────────────

function MarketSignals({ highlights, today }: { highlights: HighlightView[]; today: string }) {
  return (
    <section id="signals" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-3 pb-2 border-b-2 border-neutral-900">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          本日のハイライト
        </h2>
        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
          {today}
        </span>
      </div>
      {highlights.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 bg-white rounded-xl shadow-sm px-4 py-6 text-center">
          本日のハイライトは集計中です。市場の動きを反映してまもなく更新されます。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
          {highlights.map((h) => (
            <li key={h.id}>
              <SignalRow highlight={h} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignalRow({ highlight: h }: { highlight: HighlightView }) {
  const meta = SIGNAL_META[h.kind];
  const MetaIcon = meta.icon;
  const positive = h.keyMetric.positive;
  const subject: ArticleSubject =
    h.subjectKind === "company" && h.subjectCode
      ? { kind: "company", code: h.subjectCode, name: h.subjectName.replace(/^\d{4}\s*/, "") }
      : h.subjectKind === "industry"
        ? { kind: "industry", slug: "industry", name: h.subjectName }
        : h.subjectKind === "theme"
          ? { kind: "theme", slug: "theme", name: h.subjectName }
          : { kind: "metric", slug: "metric", name: h.subjectName };
  const href = h.relatedHref ?? "/articles";
  return (
    <Link href={href} className="group flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-neutral-50 transition">
      <div className="text-[10px] font-mono tabular text-neutral-500 w-12 shrink-0">
        {h.publishedAt}
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600 w-28 shrink-0">
        <MetaIcon className="w-3 h-3" />
        {meta.label}
      </div>
      <ArticleSubjectChip subject={subject} compact />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-neutral-800 leading-snug line-clamp-1 group-hover:text-neutral-900">
          {h.oneLiner}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className={`font-mono tabular text-sm font-black tracking-tight inline-flex items-center gap-0.5 ${
            positive === null
              ? "text-neutral-900"
              : positive
                ? "text-emerald-600"
                : "text-rose-600"
          }`}
        >
          {positive === true && <TrendingUp className="w-3 h-3" />}
          {positive === false && <TrendingDown className="w-3 h-3" />}
          {h.keyMetric.value}
        </div>
        <div className="text-[9px] text-neutral-500 font-mono">{h.keyMetric.label}</div>
      </div>
      {h.relatedHref && h.relatedHref.startsWith("/articles/") && (
        <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-widest text-emerald-700 shrink-0">
          解釈あり
        </span>
      )}
    </Link>
  );
}

function ArticleSubjectChip({
  subject,
  compact = false,
}: {
  subject: ArticleSubject;
  compact?: boolean;
}) {
  const map: Record<ArticleSubject["kind"], { icon: typeof Cpu; label: string; color: string }> =
    {
      company: {
        icon: Building2,
        label: "企業",
        color: "bg-blue-50 text-blue-700 border-blue-100",
      },
      industry: {
        icon: Building2,
        label: "業界",
        color: "bg-amber-50 text-amber-700 border-amber-100",
      },
      theme: {
        icon: Sparkles,
        label: "テーマ",
        color: "bg-purple-50 text-purple-700 border-purple-100",
      },
      metric: {
        icon: Activity,
        label: "指標",
        color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
    };
  const meta = map[subject.kind];
  const Icon = meta.icon;
  const text =
    subject.kind === "company"
      ? `${subject.code} ${subject.name}`
      : subject.name;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${meta.color}`}
    >
      <Icon className="w-3 h-3" />
      {compact ? text : `${meta.label}: ${text}`}
    </span>
  );
}


// ─────────────────────────────────────────────────────────
// Featured (注目企業/業界カード3列)
// ─────────────────────────────────────────────────────────

function Featured() {
  return (
    <section id="featured" className="scroll-mt-20">
      <SectionHeader
        kicker="編集キュレーション"
        title="今、注目すべき企業 / 業界"
        icon={Star}
      />

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURED_UPCOMING.map((f) => (
          <FeaturedComingSoonCard key={f.name} item={f} />
        ))}
      </div>
    </section>
  );
}

function FeaturedComingSoonCard({
  item,
}: {
  item: (typeof FEATURED_UPCOMING)[number];
}) {
  const Icon = item.icon;
  return (
    <article className="group relative overflow-hidden bg-white rounded-2xl shadow-sm flex flex-col min-h-[260px]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${item.tint} pointer-events-none`}
        aria-hidden
      />
      <div
        className={`absolute -right-16 -top-16 w-48 h-48 rounded-full ${item.glow} blur-3xl pointer-events-none`}
        aria-hidden
      />

      <div className="relative p-5 flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          準備中
        </span>
      </div>

      <div className="relative px-5 pb-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900">
          {item.name}
        </h3>
        <p className="mt-2 text-[13px] text-neutral-600 leading-relaxed">
          {item.caption}
        </p>

        <div className="mt-auto pt-5 flex items-center gap-2 text-[11px] text-neutral-500">
          <SkeletonBars />
          <span className="font-mono uppercase tracking-widest font-semibold ml-auto">
            Coming Soon
          </span>
        </div>
      </div>
    </article>
  );
}

function SkeletonBars() {
  return (
    <div className="flex items-end gap-0.5 h-5" aria-hidden>
      <div className="w-1 h-2 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-3 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-4 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-2.5 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-3.5 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-5 bg-neutral-300 rounded-sm" />
      <div className="w-1 h-2 bg-neutral-300 rounded-sm" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AIの明日予想 (元 AI Daily Forecast)
// 「日本株を中心に、明日マーケットがどう動くかを AI が予想する」
// 視覚的に「上がる/下がる/五分五分」が一瞬で分かるカード。
// ─────────────────────────────────────────────────────────

function Predictions({ forecasts }: { forecasts: ForecastSummary[] }) {
  return (
    <section id="predictions" className="scroll-mt-20">
      <SectionHeader
        kicker="6時間ごとに更新"
        title="AIの明日予想"
        subtitle="明日のマーケットがどう動くか、AIが指数別に確率で予想します。"
        icon={Sparkles}
        action={
          <Link
            href="/forecasts"
            className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
          >
            予想アーカイブ
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        }
      />
      {forecasts.length === 0 ? (
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-neutral-500">
          次回の予想はまもなく更新されます。
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {forecasts.map((f) => (
            <ForecastCard key={f.id} forecast={f} />
          ))}
        </div>
      )}
    </section>
  );
}

// 確率から「上がる寄り / 下がる寄り / 五分五分」を判定。
// pickLabel=「プラス」を「上がる」、noLabel=「マイナス」を「下がる」に正規化して見せる。
type Verdict = {
  tone: "up" | "down" | "neutral";
  label: string;
  color: string;
  bg: string;
  ring: string;
};

function readVerdict(p: number): Verdict {
  if (p >= 60) {
    return {
      tone: "up",
      label: "上がる寄り",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    };
  }
  if (p <= 40) {
    return {
      tone: "down",
      label: "下がる寄り",
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-100",
    };
  }
  return {
    tone: "neutral",
    label: "五分五分",
    color: "text-neutral-600",
    bg: "bg-neutral-100",
    ring: "ring-neutral-200",
  };
}

function ForecastCard({ forecast }: { forecast: ForecastSummary }) {
  const p = forecast.probability;
  const inverse = 100 - p;
  const yes = p;
  const no = inverse;
  const sideFallback: "yes" | "no" = p >= 50 ? "yes" : "no";
  const position = forecast.position ?? sideFallback;
  const yesActive = position === "yes";
  const noActive = position === "no";
  const tone: "up" | "down" = position === "yes" ? "up" : "down";
  const yesLabel = forecast.yesLabel ?? "プラス";
  const noLabel = forecast.noLabel ?? "マイナス";
  const shift = computeShiftDelta(forecast.shifts);

  return (
    <Link
      href={`/forecasts/${forecast.id}`}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden border border-neutral-100"
    >
      {/* 上ヘッダー: 対象指数 + 対象時刻 */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-wide">
          <Globe className="w-3 h-3" />
          {forecast.targetName}
        </span>
        <span className="text-[11px] text-neutral-500 font-mono tabular">
          対象 {formatResolveAtJp(forecast.resolveAt)}
        </span>
      </div>

      {/* Issue */}
      <div className="px-5 pt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
          ISSUE
        </div>
        <h3 className="font-black text-base sm:text-lg leading-snug tracking-tight text-neutral-900 group-hover:text-neutral-700 transition">
          {forecast.question}
        </h3>
        {forecast.headline && (
          <div className="mt-1 text-[12px] font-bold text-neutral-600 leading-snug">
            AIの結論: {forecast.headline}
          </div>
        )}
      </div>

      {/* Polymarket 風 Yes / No 大型表示 */}
      <div className="px-5 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {yesActive ? (
            <div className="rounded-xl ring-2 ring-emerald-500/60 bg-emerald-50 py-3 px-4 flex flex-col">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                YES ・ {yesLabel}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono tabular text-3xl sm:text-4xl font-black tracking-tight text-emerald-600">
                  {yes}
                </span>
                <span className="text-lg font-bold text-emerald-600">%</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-neutral-50 ring-1 ring-neutral-200 py-3 px-4 flex flex-col">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                YES ・ {yesLabel}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono tabular text-3xl sm:text-4xl font-black tracking-tight text-neutral-500">
                  {yes}
                </span>
                <span className="text-lg font-bold text-neutral-400">%</span>
              </div>
            </div>
          )}
          {noActive ? (
            <div className="rounded-xl ring-2 ring-rose-500/60 bg-rose-50 py-3 px-4 flex flex-col">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-rose-700">
                NO ・ {noLabel}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono tabular text-3xl sm:text-4xl font-black tracking-tight text-rose-600">
                  {no}
                </span>
                <span className="text-lg font-bold text-rose-600">%</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-neutral-50 ring-1 ring-neutral-200 py-3 px-4 flex flex-col">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                NO ・ {noLabel}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono tabular text-3xl sm:text-4xl font-black tracking-tight text-neutral-500">
                  {no}
                </span>
                <span className="text-lg font-bold text-neutral-400">%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* リード */}
      <div className="px-5 pb-4">
        <p className="text-[13px] text-neutral-700 leading-relaxed line-clamp-3">
          {forecast.lede}
        </p>
      </div>

      {/* 24h 推移 + CTA */}
      <div className="mt-auto border-t border-neutral-100">
        {forecast.shifts.length >= 2 && (
          <div className="px-5 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                24h の確率推移
              </div>
              {shift && <ShiftBadge delta={shift.delta} />}
            </div>
            <ShiftSparkline shifts={forecast.shifts} tone={tone} />
          </div>
        )}
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-bold tracking-wide">
          <span className="text-neutral-500 font-mono tabular">
            生成 {formatGeneratedAt(forecast.generatedAt)}
          </span>
          <span className="text-neutral-900 inline-flex items-center gap-1 group-hover:text-emerald-700 transition">
            根拠とシナリオを読む
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function VerdictGlyph({ tone }: { tone: Verdict["tone"] }) {
  if (tone === "up") {
    return (
      <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
        <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
      </div>
    );
  }
  if (tone === "down") {
    return (
      <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
        <TrendingDown className="w-5 h-5" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-neutral-500 text-white flex items-center justify-center shadow-sm">
      <Activity className="w-5 h-5" strokeWidth={2.5} />
    </div>
  );
}

function ShiftBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
        → 変わらず
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? "↑ 強気に" : "↓ 弱気に"} {Math.abs(delta)}pt
    </span>
  );
}

function ShiftSparkline({
  shifts,
  tone,
}: {
  shifts: ForecastShiftPoint[];
  tone: Verdict["tone"];
}) {
  if (shifts.length < 2) return null;
  const W = 320;
  const H = 56;
  const probs = shifts.map((s) => s.probability);
  const min = Math.min(...probs, 30);
  const max = Math.max(...probs, 70);
  const span = Math.max(max - min, 1);
  const stroke =
    tone === "up" ? "#10b981" : tone === "down" ? "#f43f5e" : "#737373";
  const fillId =
    tone === "up" ? "shift-fill-up" : tone === "down" ? "shift-fill-down" : "shift-fill-neutral";
  const pts = shifts.map((s, i) => {
    const x = (i / (shifts.length - 1)) * W;
    const y = H - ((s.probability - min) / span) * (H - 6) - 3;
    return { x, y, p: s.probability };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 50% 基準線 */}
      <line
        x1="0"
        x2={W}
        y1={H - ((50 - min) / span) * (H - 6) - 3}
        y2={H - ((50 - min) / span) * (H - 6) - 3}
        stroke="#e5e5e5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? "3.5" : "2"}
          fill={stroke}
        />
      ))}
      {/* 最新値ラベル */}
      <text
        x={Math.min(last.x + 8, W - 32)}
        y={Math.max(last.y - 6, 10)}
        fontSize="10"
        fontWeight="700"
        fill={stroke}
      >
        {last.p}%
      </text>
    </svg>
  );
}

function computeShiftDelta(shifts: ForecastShiftPoint[]): { delta: number } | null {
  if (shifts.length < 2) return null;
  const latest = shifts[shifts.length - 1];
  const prev = shifts[shifts.length - 2];
  return { delta: latest.probability - prev.probability };
}

function formatResolveAtJp(iso: string): string {
  // "2026-06-29T05:00:00+09:00" → "6/29 5:00"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso.slice(0, 16);
  const [, , mm, dd, hh, mi] = m;
  return `${Number(mm)}/${Number(dd)} ${Number(hh)}:${mi}`;
}

function formatGeneratedAt(iso: string): string {
  // "2026-06-28T08:15:00Z" → "06/28 17:15" (JST)
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

// ─────────────────────────────────────────────────────────
// Explore Rails (全企業DB)
// ─────────────────────────────────────────────────────────

function ExploreRails() {
  return (
    <section id="explore" className="scroll-mt-20">
      <div className="rounded-2xl bg-white shadow-sm p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
            <Building2 className="w-3 h-3" />
            FULL DATABASE
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
            東証 <span className="text-emerald-600">3,800</span> 社、すべて
          </h3>
          <Link
            href="/stocks"
            className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 group"
          >
            銘柄一覧へ
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>
        <form
          action="/stocks"
          method="get"
          className="flex items-center bg-neutral-50 rounded-xl pl-3 pr-2 py-1 focus-within:ring-2 focus-within:ring-neutral-900 transition"
        >
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            name="q"
            placeholder="銘柄コード・社名で検索 (例: 7203, トヨタ)"
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none"
            aria-label="銘柄検索"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            検索
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_CHIPS.map((s) => (
            <Link
              key={s.name}
              href={`/stocks?sector=${encodeURIComponent(s.name)}`}
              className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 transition ${
                s.hot
                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {s.hot && <Flame className="w-3 h-3" />}
              {s.name}
              <span className="font-mono tabular text-[10px] opacity-60">
                {s.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Section header (共通)
// ─────────────────────────────────────────────────────────

function SectionHeader({
  kicker,
  title,
  subtitle,
  icon: Icon,
  tag,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  icon?: typeof Cpu;
  tag?: { label: string; color: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {kicker && (
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            {kicker}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
          {tag && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tag.color}`}
            >
              {tag.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
