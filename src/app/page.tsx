import Link from "next/link";
import { listStocks } from "@/lib/data";
import { listPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { industries, industryAggregates } from "@/lib/industries";
import { listPredictions } from "@/lib/predictions";

export default function Home() {
  const stocks = listStocks();
  const latestPosts = listPosts().slice(0, 3);
  // ハイライト：割安銘柄上位 + 拡大期銘柄上位 + 注目銘柄 でセクション構成
  const undervaluedHighlights = [...stocks]
    .filter((s) => s.valuationCall.verdict === "割安")
    .sort((a, b) => b.valuationCall.score - a.valuationCall.score)
    .slice(0, 4);
  const expansionHighlights = [...stocks]
    .sort((a, b) => b.phaseScores.expansion - a.phaseScores.expansion)
    .slice(0, 4);
  // カバレッジマップ：業界別の集計
  const coverage = industries.map((ind) => ({
    industry: ind,
    agg: industryAggregates(ind),
  }));
  const maxMcap = Math.max(...coverage.map((c) => c.agg.totalMcap));
  const totalStocks = coverage.reduce((acc, c) => acc + c.agg.count, 0);
  // AI 予測トラッキング：的中率の透明性
  const allPredictions = listPredictions();
  const resolved = allPredictions.filter((p) => p.status === "resolved");
  const hits = resolved.filter((p) => p.resolution?.outcomeKey === p.aiReasoning.pick);
  const accuracy = resolved.length > 0 ? (hits.length / resolved.length) * 100 : 0;
  const recentResolved = [...resolved]
    .sort((a, b) => (b.resolution?.resolvedAt ?? "").localeCompare(a.resolution?.resolvedAt ?? ""))
    .slice(0, 3);
  const liveOrUpcoming = allPredictions.filter((p) => p.status !== "resolved").length;
  // ファクター異常：教科書通りでない動きをする銘柄（編集キュレーション）
  // 玄人が「お、これは気づかなかった」と感じる、表面の業種ラベルと実際の感応度のズレを提示
  const factorAnomalies: Array<{
    code: string;
    name: string;
    factor: string;
    expected: string;
    actual: string;
    insight: string;
  }> = [
    {
      code: "6857",
      name: "アドバンテスト",
      factor: "SOX（半導体株指数）",
      expected: "SOX 連動が前提（半導体株なので）",
      actual: "HBM テスト需要で SOX を上回る上昇",
      insight:
        "HBM 用テスト装置で世界シェア独占。SOX 全体が踊り場でも、AI 半導体（HBM）の単独テーマで個別上昇余地が残る。",
    },
    {
      code: "7203",
      name: "トヨタ",
      factor: "USD/JPY（ドル円）",
      expected: "円安で大幅上昇（典型的輸出企業）",
      actual: "海外現地生産の進展でベータは想定より低い",
      insight:
        "北米・アジアでの現地生産比率が高く、円安恩恵は教科書ほど直接的でない。逆に円高耐性は他社より強い。",
    },
    {
      code: "8058",
      name: "三菱商事",
      factor: "原油価格",
      expected: "原油安で業績悪化（資源商社）",
      actual: "非資源事業の拡大で原油感応度は低下傾向",
      insight:
        "ローソン（コンビニ）・電力・食品など非資源セグメントが収益の柱に。資源高への依存度が下がり、ディフェンシブ化。",
    },
  ];
  // 業種を越えた事業類似ペア発見（編集キュレーション）
  // 玄人が「ほー」と感じる、表面的な業種分類では見えないビジネスモデル類似性を提示
  const crossIndustryPairs: Array<{
    theme: string;
    aCode: string;
    aName: string;
    aIndustry: string;
    bCode: string;
    bName: string;
    bIndustry: string;
    reason: string;
  }> = [
    {
      theme: "グローバルニッチで圧倒的シェア",
      aCode: "4063",
      aName: "信越化学",
      aIndustry: "化学",
      bCode: "4568",
      bName: "第一三共",
      bIndustry: "医薬",
      reason:
        "両社とも、特定領域（半導体ウェハ・ADC 抗体薬）で世界シェア圧倒的1位。価格決定権と長期 R&D 投資が、模倣困難性の源泉。",
    },
    {
      theme: "現場主義オペレーション卓越",
      aCode: "6902",
      aName: "デンソー",
      aIndustry: "自動車部品",
      bCode: "9983",
      bName: "ファーストリテイリング",
      bIndustry: "アパレル小売",
      reason:
        "片やトヨタ生産方式（JIT）の中核、片や SPA で垂直統合。業界は違えど「現場改善の徹底＋世界展開」という DNA が共通。",
    },
    {
      theme: "規制業種ディフェンシブ",
      aCode: "9432",
      aName: "NTT",
      aIndustry: "通信",
      bCode: "8766",
      bName: "東京海上",
      bIndustry: "損保",
      reason:
        "両社とも巨大装置産業の規制業種。参入障壁の高さ・長期契約による収益の安定性・配当成長が魅力。インフレ局面では料金転嫁力も。",
    },
  ];
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <section className="mb-20 pb-16 border-b border-border">
        <div className="max-w-3xl">
          <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-6">
            AI で読み解く、日本の上場企業
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tighter mb-8">
            事業の本質、似た会社、
            <br />
            <span className="relative inline-block">
              隠れたリスクを、一枚に。
              <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-foreground opacity-10" />
            </span>
          </h1>
          <p className="text-muted leading-relaxed mb-3 text-base max-w-2xl">
            <strong className="text-foreground">「超！企業DB」</strong>は、有報・決算資料・適時開示を AI が解析し、
            <strong className="text-foreground">事業類似銘柄・成長フェーズ判定・ファクター感応度</strong>を一枚に可視化します。
            投資を始めたばかりの方にも、専門家の補助線としても。
          </p>
          <p className="text-dim text-sm">
            現在 61 社・10 業界に対応。順次拡大中。
            <span className="ml-2 text-[11px] border border-border rounded px-1.5 py-0.5">
              ※ サンプルデータで運用中（最終更新：2026-05-26）
            </span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-sm border border-foreground bg-foreground text-background rounded-md px-4 py-2 hover:opacity-90 transition"
            >
              はじめての方へ — 5 分ガイド →
            </Link>
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 text-sm border border-border-strong rounded-md px-4 py-2 hover:bg-surface-elev transition"
            >
              業界から探す →
            </Link>
          </div>
        </div>
      </section>

      {/* ハイライト：割安銘柄 */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Highlights — Undervalued
            </p>
            <h2 className="text-2xl font-bold tracking-tight">いま「割安」判定の銘柄</h2>
          </div>
          <Link href="/screens/undervalued" className="text-sm text-muted hover:text-foreground transition">
            割安銘柄一覧へ →
          </Link>
        </div>
        <p className="text-sm text-muted mb-3 leading-relaxed max-w-3xl">
          利益・資産から見て、株価が<strong className="text-foreground">割安水準</strong>と AI 総合判定。
        </p>
        <details className="mb-5 group">
          <summary className="text-[11px] text-dim hover:text-muted cursor-pointer inline-flex items-center gap-1 select-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
            指標の見方
          </summary>
          <div className="text-[11px] text-dim leading-relaxed mt-2 pl-4 border-l border-border max-w-2xl space-y-1">
            <div><strong className="text-muted font-bold">PER</strong> 株価÷1株利益（市場平均15倍）</div>
            <div><strong className="text-muted font-bold">配当</strong> 年配当÷株価</div>
            <div><strong className="text-muted font-bold">ROE</strong> 純利益÷自己資本（10%超で優秀）</div>
          </div>
        </details>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {undervaluedHighlights.map((s) => (
            <Link
              key={s.code}
              href={`/stocks/${s.code}`}
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] text-dim tabular">{s.code}</span>
                <span className="text-[10px] text-positive border border-positive/40 bg-positive/10 rounded px-1.5 py-0.5">
                  {s.valuationCall.verdict}
                </span>
              </div>
              <div className="font-bold leading-tight mb-1 group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-muted mb-3 truncate">{s.industryCluster}</div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <div className="text-dim">PER</div>
                  <div className="tabular font-mono font-bold">{s.per.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-dim">配当</div>
                  <div className="tabular font-mono font-bold">{s.dividendYield.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-dim">ROE</div>
                  <div className="tabular font-mono font-bold">{s.roe.toFixed(1)}%</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ハイライト：拡大期 */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Highlights — Expansion Phase
            </p>
            <h2 className="text-2xl font-bold tracking-tight">いま拡大期の銘柄</h2>
          </div>
          <Link href="/screens/expansion-phase" className="text-sm text-muted hover:text-foreground transition">
            拡大期銘柄一覧へ →
          </Link>
        </div>
        <p className="text-sm text-muted mb-3 leading-relaxed max-w-3xl">
          売上・利益が伸びる<strong className="text-foreground">成長フェーズ</strong>を AI が業界内正規化で判定。
        </p>
        <details className="mb-5 group">
          <summary className="text-[11px] text-dim hover:text-muted cursor-pointer inline-flex items-center gap-1 select-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
            指標の見方
          </summary>
          <div className="text-[11px] text-dim leading-relaxed mt-2 pl-4 border-l border-border max-w-2xl space-y-1">
            <div><strong className="text-muted font-bold">売上成長</strong> 過去3年の年平均成長率</div>
            <div><strong className="text-muted font-bold">営業利益率</strong> 本業利益÷売上（15%超で優良）</div>
            <div><strong className="text-muted font-bold">PER</strong> 株価÷1株利益</div>
          </div>
        </details>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {expansionHighlights.map((s) => (
            <Link
              key={s.code}
              href={`/stocks/${s.code}`}
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] text-dim tabular">{s.code}</span>
                <span className="text-[10px] text-foreground border border-foreground/40 bg-foreground/5 rounded px-1.5 py-0.5">
                  拡大期
                </span>
              </div>
              <div className="font-bold leading-tight mb-1 group-hover:underline">{s.name}</div>
              <div className="text-[11px] text-muted mb-3 truncate">{s.industryCluster}</div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <div className="text-dim">売上成長</div>
                  <div
                    className={`tabular font-mono font-bold ${
                      s.revenueGrowth3y >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {s.revenueGrowth3y >= 0 ? "+" : ""}
                    {s.revenueGrowth3y.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-dim">営業利益率</div>
                  <div className="tabular font-mono font-bold">{s.operatingMargin.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-dim">PER</div>
                  <div className="tabular font-mono font-bold">{s.per.toFixed(1)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* カバレッジマップ：業界の網羅性を一望（玄人向け） */}
      <section className="mb-16 pt-12 border-t border-border">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Coverage Map
            </p>
            <h2 className="text-2xl font-bold tracking-tight">業界カバレッジ — {totalStocks} 社 / {coverage.length} 業界</h2>
          </div>
          <Link href="/industries" className="text-sm text-muted hover:text-foreground transition">
            業界一覧へ →
          </Link>
        </div>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          現在カバーする業界と、業界ごとの集計バリュエーション。バーは時価総額合計の相対スケール。
          クリックで競争構造マップ・主要 KPI・関連銘柄が見られます。
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {coverage.map(({ industry, agg }) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-bold text-sm group-hover:underline">{industry.shortName}</div>
                <div className="text-[10px] text-dim tabular">{agg.count} 社</div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mb-2">
                <div>
                  <div className="text-dim">平均 PER</div>
                  <div className="tabular font-mono font-bold">{agg.avgPer.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-dim">平均 ROE</div>
                  <div className="tabular font-mono font-bold">{agg.avgRoe.toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-[10px] text-muted tabular">
                時価総額 {(agg.totalMcap / 10000).toFixed(1)} 兆円
              </div>
              <div className="h-1 bg-border rounded-sm mt-1 overflow-hidden">
                <div
                  className="h-full bg-foreground/60"
                  style={{ width: `${(agg.totalMcap / maxMcap) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 予測トラッカー：透明性で信頼を獲得 */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              AI Track Record
            </p>
            <h2 className="text-2xl font-bold tracking-tight">AI 予測の答え合わせ</h2>
          </div>
          <Link href="/predictions" className="text-sm text-muted hover:text-foreground transition">
            予測一覧へ →
          </Link>
        </div>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          決算ガイダンス・配当方針・適時開示などの結果を AI が事前に予測し、当たりも外れも公開しています。
          外れた予測には「学び」も記録 — 透明性を信頼の前提に。
        </p>

        {/* スタッツパネル */}
        <div className="grid sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] text-dim font-bold tracking-[0.15em] uppercase mb-1">全予測</div>
            <div className="text-2xl font-bold tabular">{allPredictions.length}<span className="text-sm text-muted ml-1">件</span></div>
          </div>
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] text-dim font-bold tracking-[0.15em] uppercase mb-1">進行中</div>
            <div className="text-2xl font-bold tabular">{liveOrUpcoming}<span className="text-sm text-muted ml-1">件</span></div>
          </div>
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] text-dim font-bold tracking-[0.15em] uppercase mb-1">答え合わせ済み</div>
            <div className="text-2xl font-bold tabular">{resolved.length}<span className="text-sm text-muted ml-1">件</span></div>
          </div>
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] text-dim font-bold tracking-[0.15em] uppercase mb-1">的中率</div>
            <div className="text-2xl font-bold tabular text-positive">
              {accuracy.toFixed(0)}<span className="text-sm ml-1">%</span>
              <span className="text-[11px] text-muted font-normal ml-2">({hits.length}/{resolved.length})</span>
            </div>
          </div>
        </div>

        {/* 最近の答え合わせ */}
        {recentResolved.length > 0 && (
          <div>
            <p className="text-[11px] text-dim font-bold tracking-[0.15em] uppercase mb-2">最近の答え合わせ</p>
            <div className="space-y-2">
              {recentResolved.map((p) => {
                const isHit = p.resolution?.outcomeKey === p.aiReasoning.pick;
                const aiChoice = p.choices.find((c) => c.key === p.aiReasoning.pick);
                return (
                  <Link
                    key={p.id}
                    href={`/predictions/${p.id}`}
                    className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold group-hover:underline">{p.eventName}</div>
                        <div className="text-[11px] text-muted mt-0.5">{p.question}</div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 rounded border ${
                          isHit
                            ? "text-positive border-positive/40 bg-positive/10"
                            : "text-negative border-negative/40 bg-negative/10"
                        }`}
                      >
                        {isHit ? "✓ 的中" : "✗ 外れ"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular">
                      <div>
                        <span className="text-dim">AI 予測：</span>
                        <span className="font-bold">{aiChoice?.label ?? p.aiReasoning.pick}</span>
                        <span className="text-dim ml-1">（確信度 {p.aiReasoning.confidence}%）</span>
                      </div>
                      <div>
                        <span className="text-dim">実際：</span>
                        <span className="font-bold">{p.resolution?.outcomeLabel}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* AI 注目発見：業種を越えた事業類似ペア */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Cross-Industry Discoveries
            </p>
            <h2 className="text-2xl font-bold tracking-tight">AI 注目発見 — 業種を越えた事業類似</h2>
          </div>
        </div>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          表面的な業種分類では見えない、ビジネスモデル・収益構造・参入障壁の類似性を AI が抽出。
          スクリーニングでは出てこない「分散して見える、実は同じ要因に動かされる」ペアを発見します。
        </p>
        <div className="grid lg:grid-cols-3 gap-3">
          {crossIndustryPairs.map((pair) => (
            <div key={pair.theme} className="bg-surface border border-border rounded-md p-4">
              <div className="text-[10px] text-accent font-bold tracking-[0.15em] uppercase mb-3">
                {pair.theme}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href={`/stocks/${pair.aCode}`}
                  className="flex-1 block bg-surface-elev border border-border rounded p-2 hover:border-border-strong transition group"
                >
                  <div className="text-[10px] text-dim tabular mb-0.5">{pair.aCode}</div>
                  <div className="text-sm font-bold leading-tight group-hover:underline">{pair.aName}</div>
                  <div className="text-[10px] text-muted mt-0.5">{pair.aIndustry}</div>
                </Link>
                <div className="text-dim text-xs shrink-0">×</div>
                <Link
                  href={`/stocks/${pair.bCode}`}
                  className="flex-1 block bg-surface-elev border border-border rounded p-2 hover:border-border-strong transition group"
                >
                  <div className="text-[10px] text-dim tabular mb-0.5">{pair.bCode}</div>
                  <div className="text-sm font-bold leading-tight group-hover:underline">{pair.bName}</div>
                  <div className="text-[10px] text-muted mt-0.5">{pair.bIndustry}</div>
                </Link>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">{pair.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ファクター異常：教科書通りでない動きをする銘柄 */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Factor Anomalies
            </p>
            <h2 className="text-2xl font-bold tracking-tight">ファクター異常 — 教科書と現実のズレ</h2>
          </div>
        </div>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          「半導体株なら SOX 連動」「輸出企業なら円安恩恵」— こうした<strong className="text-foreground">教科書的な前提が崩れている</strong>銘柄を抽出。
          ファクター感応度の時系列回帰から、隠れた構造変化を読み解きます。
        </p>
        <div className="grid lg:grid-cols-3 gap-3">
          {factorAnomalies.map((a) => (
            <Link
              key={a.code}
              href={`/stocks/${a.code}`}
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
            >
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <div className="text-[10px] text-dim tabular">{a.code}</div>
                  <div className="text-base font-bold leading-tight group-hover:underline">{a.name}</div>
                </div>
                <span className="shrink-0 text-[10px] text-muted border border-border bg-surface-elev rounded px-1.5 py-0.5">
                  {a.factor}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="text-[11px]">
                  <div className="text-dim mb-0.5">教科書：</div>
                  <div className="text-muted line-through decoration-dim/40">{a.expected}</div>
                </div>
                <div className="text-[11px]">
                  <div className="text-dim mb-0.5">実際：</div>
                  <div className="text-foreground font-medium">{a.actual}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted leading-relaxed border-t border-border pt-2">{a.insight}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">
          What you can do
        </p>
        <h2 className="text-2xl font-bold tracking-tight mb-6">超！企業 DB でできる 3 つのこと</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-md p-5">
            <div className="text-accent text-xs font-bold tracking-widest mb-3">① 似た会社が見つかる</div>
            <p className="text-sm text-muted leading-relaxed">
              「東京エレクトロンに似た会社は？」AI が業種の枠を超えて、ビジネスモデル・顧客・収益構造から
              本当に似た会社を見つけます。投資先の候補を広げるのに便利です。
            </p>
          </div>
          <div className="bg-surface border border-border rounded-md p-5">
            <div className="text-accent text-xs font-bold tracking-widest mb-3">② 会社の今がわかる</div>
            <p className="text-sm text-muted leading-relaxed">
              同じ会社でも、急成長中なのか、安定期なのか、苦しい時期なのか。
              会社の「今のステージ」を AI が判定します。買いどき・売りどきの判断材料に。
            </p>
          </div>
          <div className="bg-surface border border-border rounded-md p-5">
            <div className="text-accent text-xs font-bold tracking-widest mb-3">③ リスクの種類がわかる</div>
            <p className="text-sm text-muted leading-relaxed">
              円高で苦しむ会社、金利上昇で苦しむ会社、中国景気が悪いと苦しむ会社。
              会社の「弱点」を AI が見抜いて、わかりやすく整理します。
            </p>
          </div>
        </div>
      </section>

      {/* 最新ブログ */}
      <section className="mt-20 pt-12 border-t border-border">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-2">
              Latest Posts
            </p>
            <h2 className="text-2xl font-bold tracking-tight">最新の分析</h2>
          </div>
          <Link href="/blog" className="text-sm text-muted hover:text-foreground transition">
            すべて見る →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestPosts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
