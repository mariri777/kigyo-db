import type { Metadata } from "next";
import Link from "next/link";
import { Disclose } from "@/components/Disclose";
import { Term } from "@/components/Term";

const guideTitle = "初めての方へ — 投資の基本指標と超!企業DBの歩き方";
const guideDescription =
  "PER / PBR / 配当利回り / ROE といった投資の基本指標を、図解とミニ事例でやさしく解説。あわせて『超!企業DB』の使い方も紹介します。これから投資を始める方向けの入口ページ。";

export const metadata: Metadata = {
  title: guideTitle,
  description: guideDescription,
  keywords: ["投資入門", "PER", "PBR", "ROE", "配当利回り", "用語解説"],
  alternates: { canonical: "/guide" },
  openGraph: { title: guideTitle, description: guideDescription, url: "/guide", type: "article" },
  twitter: { card: "summary_large_image", title: guideTitle, description: guideDescription },
};

export default function GuidePage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="pb-8 border-b border-border mb-10">
        <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">Guide</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter mb-5">
          投資を始めた
          <br />
          ばかりの方へ。
        </h1>
        <p className="text-muted text-base leading-relaxed">
          「超！企業DB」は、上場企業の数字を AI が先回りで整理し、
          「ひとことで何の会社か」「どの会社と似ているか」「市場が見落としていそうな論点は何か」を提示するサイトです。
          このページは、<strong className="text-foreground">投資が初めて</strong>の方、
          または <strong className="text-foreground">このサイトをどう使えばいいか分からない</strong> 方向けの最初の入口です。
        </p>
      </header>

      <div className="space-y-14">
        {/* セクション1：できる4つのこと */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-2">5 分で分かる：このサイトでできる 4 つのこと</h2>
          <p className="text-sm text-muted mb-6">
            このサイトは「銘柄を並べる」だけのデータベースではなく、AI が解釈レイヤーを足したサービスです。
          </p>

          <div className="space-y-4">
            <Capability
              num="01"
              title="銘柄ごとに「何の会社か」を 1 行で把握"
              body={
                <>
                  各銘柄ページの先頭に「ひとことで言うと」ボックスがあります。
                  たとえば <Link href="/stocks/8035" className="underline">東京エレクトロン</Link> なら：
                  <em className="block bg-surface-elev border-l-2 border-foreground rounded-r p-3 mt-2 not-italic text-foreground/90">
                    半導体を作る『装置』を作っている世界トップ企業の一つ。AI 半導体・スマホ・自動車向け半導体すべての製造工場に装置を納めており、業績は半導体投資のサイクルで大きく上下する。
                  </em>
                </>
              }
            />
            <Capability
              num="02"
              title="似たビジネスをやっている会社を一覧で見つける"
              body={
                <>
                  各銘柄ページの「と似た会社」セクションで、業種分類より細かい粒度で隣接銘柄を発見できます。
                  「東京エレクトロン と似た会社」では、SCREEN ホールディングスやレーザーテックが上位に並びます。
                </>
              }
            />
            <Capability
              num="03"
              title="「割安・割高」を、根拠付きで読む"
              body={
                <>
                  「超！企業DB の評価」セクションで、<Term>PER</Term>・<Term>PBR</Term>・成長率を勘案した
                  「割安／ほぼ妥当／やや割高／割高」の 4 段階判定が出ます。
                  大手証券会社では <Link href="/legal/editorial-policy" className="underline">コンプライアンス上出しにくい</Link> 領域です。
                </>
              }
            />
            <Capability
              num="04"
              title="市場が見落としていそうな論点を AI が抽出"
              body={
                <>
                  「見落とし論点」セクションで、IR 資料を深読みした論点が出てきます。
                  「為替リスク」「人口減少」のような汎用論点は機械的に排除されています。
                  すべての論点に引用元の資料が紐付いており、自分で追検証できます。
                </>
              }
            />
          </div>
        </section>

        {/* セクション2：基本指標 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-2">投資の基本：覚えておきたい 4 つの指標</h2>
          <p className="text-sm text-muted mb-6">
            このサイトで頻繁に出てくる用語を、やさしく噛み砕いて解説します。
            各銘柄ページの「指標の見方 ▸」を開けば、要点をまとめた解説も同時に確認できます。
          </p>

          <div className="space-y-3">
            <Metric label="PER（株価収益率）">
              株価が 1 年あたりの利益の何倍かを示す指標。例えば「PER 22.8 倍」なら、
              その会社が毎年同じ利益を上げ続けた場合、22.8 年で投資元本を回収できる計算。
              <Disclose label="もっと詳しく" className="mt-3">
                <ul className="list-disc pl-5 space-y-1">
                  <li>低い = 割安に見える（ただし成長が鈍化している可能性も）</li>
                  <li>高い = 期待先行（成長率が高いと許容される）</li>
                  <li>日本の市場平均：<strong>約 15 倍</strong></li>
                  <li>業界によって妥当な水準が異なる（成長業界は高め、成熟業界は低め）</li>
                </ul>
              </Disclose>
            </Metric>

            <Metric label="ROE（自己資本利益率）">
              株主のお金 100 円で年何円稼げているかを示す指標。
              <Disclose label="もっと詳しく" className="mt-3">
                <ul className="list-disc pl-5 space-y-1">
                  <li>10% 超なら優秀</li>
                  <li>20% 超なら極めて高水準</li>
                  <li>分子（純利益）の質が重要。一時要因による嵩上げに注意</li>
                  <li>借入を増やして自己資本を圧縮しても ROE は上がるため、財務健全性とセットで見る</li>
                </ul>
              </Disclose>
            </Metric>

            <Metric label="配当利回り">
              1 年あたりの配当 ÷ 株価。100 万円分株を買うと年いくら配当でもらえるかの目安。
              <Disclose label="もっと詳しく" className="mt-3">
                <ul className="list-disc pl-5 space-y-1">
                  <li>3% 超で高配当の目安</li>
                  <li>配当の継続性は事業の安定度に依存</li>
                  <li>成熟期の会社で配当利回りが高い傾向</li>
                  <li>業績悪化で減配・無配になるリスクもあるため、ROE と利益率の安定性とセットで確認</li>
                </ul>
              </Disclose>
            </Metric>

            <Metric label="営業利益率">
              売上に対する本業の利益の割合。
              <Disclose label="もっと詳しく" className="mt-3">
                <ul className="list-disc pl-5 space-y-1">
                  <li>15% 以上で優良</li>
                  <li>30% 以上は卓越した水準</li>
                  <li>高い利益率は価格決定力・コスト構造・差別化のいずれかの強み</li>
                  <li>競争環境の変化で利益率は変動するため、3 年トレンドで見る</li>
                </ul>
              </Disclose>
            </Metric>
          </div>
        </section>

        {/* セクション3：サイトの歩き方 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-2">このサイトの歩き方：スタイル別ルート</h2>
          <p className="text-sm text-muted mb-6">
            投資スタイルによって、効率的な探し方が違います。あなたに近いスタイルから読み始めてみてください。
          </p>

          <div className="space-y-3">
            <Route
              label="割安な会社を探したい"
              steps={[
                { label: "1. 割安銘柄一覧へ", href: "/screens/undervalued", desc: "AI が「割安」と判定した銘柄を確認します。" },
                { label: "2. 気になった銘柄を選ぶ", desc: "「ひとことで言うと」を読んで、会社の輪郭をつかみます。" },
                { label: "3. 「評価」で根拠を読む", desc: "なぜ割安なのか、納得できる説明かを確認します。" },
                { label: "4. 「見落とし論点」でリスクを確認", desc: "安いには理由があるかもしれません。必ず読みましょう。" },
              ]}
            />
            <Route
              labelNode={<>配当で稼ぎたい（<Term>インカム</Term>狙い）</>}
              steps={[
                { label: "1. 高配当銘柄一覧へ", href: "/screens/high-dividend", desc: "配当利回り 3% 以上の銘柄を確認します。" },
                { label: "2. 成長フェーズを確認", desc: "「成熟期」寄りの会社のほうが、配当が継続しやすい傾向にあります。" },
                { label: "3. 評価と利益率の安定性を確認", desc: "減配リスクの低い銘柄を選びます。" },
              ]}
            />
            <Route
              label="成長株を探したい"
              steps={[
                { label: "1. 高成長 or 拡大期銘柄へ", href: "/screens/high-growth", descNode: <>売上の 3 年 <Term>CAGR</Term>（年平均成長率）が 10% 以上の銘柄を確認します。</> },
                { label: "2. PER の高さを許容する", desc: "成長期待が株価に織り込まれているため、市場平均より高くなりがちです。" },
                { label: "3. 「見落とし論点」でリスクを確認", desc: "成長前提が崩れるシナリオがないかを確認します。" },
              ]}
            />
            <Route
              label="特定の業界を学びたい"
              steps={[
                { label: "1. 業界マップへ", href: "/industries", desc: "現在 10 業界に対応、順次拡大中です。" },
                { label: "2. 業界マップ・競争構造・主要 KPI を読む", desc: "業界全体の構造を把握します。" },
                { label: "3. 個別銘柄ページで深掘り", desc: "気になった会社を一つずつ確認します。" },
              ]}
            />
          </div>
        </section>

        {/* セクション4：大事な注意事項 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-2">大事な 3 つの注意事項</h2>

          <div className="space-y-3 mt-6">
            <Warning
              num="01"
              title="「割安」 = 「買い」 ではありません"
              body="安いには理由があることも多くあります。「見落とし論点」を必ず読み、なぜ市場が低く評価しているのか、その評価が妥当かを自分で考えるプロセスが重要です。"
            />
            <Warning
              num="02"
              title="過去の業績は将来を保証しません"
              body="売上成長率や利益率が高くても、来年も同じとは限りません。事業環境・競争状況の変化を考慮する必要があります。「見落とし論点」と業界マップで、何が起きうるかを把握してください。"
            />
            <Warning
              num="03"
              title="投資判断は自己責任で"
              body="本サービスは不特定多数への一般情報提供であり、特定の投資判断を推奨するものではありません。最終的な判断は、必ずご自身の責任で行ってください。"
            />
          </div>

          <p className="mt-6 text-[12px] text-dim leading-relaxed">
            詳細は <Link href="/legal/disclaimer" className="underline">免責事項</Link> をご確認ください。
            また、本サイトの編集方針（AI 評価の出し方など）は <Link href="/legal/editorial-policy" className="underline">編集方針</Link> に公開しています。
          </p>
        </section>

        {/* セクション5：一次情報の確認 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-2">一次情報を必ず確認</h2>
          <p className="text-muted leading-relaxed mb-4">
            「超！企業DB」は AI による解釈レイヤーで、生の情報は公的な開示資料にあります。重要な判断の前には、必ず該当する一次情報をご確認ください。
          </p>
          <div className="bg-surface border border-border rounded-md p-4 space-y-3 text-sm">
            <div>
              <strong><Term>EDINET</Term></strong>
              <span className="text-muted ml-2">金融庁の電子開示システム。有価証券報告書・四半期報告書・大量保有報告書を取得</span>
            </div>
            <div>
              <strong>TDnet</strong>
              <span className="text-muted ml-2">東京証券取引所の適時開示情報伝達システム。決算短信・適時開示資料を取得</span>
            </div>
            <div>
              <strong>各社 IR ページ</strong>
              <span className="text-muted ml-2">決算説明会資料・統合報告書・中期経営計画を確認</span>
            </div>
          </div>
        </section>

        {/* 次に読むもの */}
        <section className="border-t border-border pt-10">
          <h2 className="text-2xl font-bold tracking-tight mb-4">次に読むなら</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/blog?primer"
              className="block bg-surface-elev border border-foreground/30 rounded-md p-4 hover:border-foreground transition group"
            >
              <div className="text-[10px] text-foreground tracking-widest mb-1">PRIMER SERIES</div>
              <div className="font-bold group-hover:underline">3 分でわかる業界用語 →</div>
              <div className="text-[12px] text-muted mt-1">ADC・Hi-NA・パテントクリフ・Rule of 40 など</div>
            </Link>
            <Link
              href="/stocks/8035"
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong transition group"
            >
              <div className="text-[10px] text-dim tracking-widest mb-1">具体的な銘柄ページの例</div>
              <div className="font-bold group-hover:underline">東京エレクトロン（8035）→</div>
              <div className="text-[12px] text-muted mt-1">半導体製造装置の世界トップ企業</div>
            </Link>
            <Link
              href="/industries/semiconductor"
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong transition group"
            >
              <div className="text-[10px] text-dim tracking-widest mb-1">業界マップの例</div>
              <div className="font-bold group-hover:underline">半導体業界マップ →</div>
              <div className="text-[12px] text-muted mt-1">バリューチェーン・競争構造・KPI を一望</div>
            </Link>
            <Link
              href="/screens"
              className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong transition group"
            >
              <div className="text-[10px] text-dim tracking-widest mb-1">切り口で探す</div>
              <div className="font-bold group-hover:underline">スクリーン一覧 →</div>
              <div className="text-[12px] text-muted mt-1">割安・高配当・拡大期など 7 つの切り口</div>
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}

function Capability({ num, title, body }: { num: string; title: string; body: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4 grid grid-cols-[40px_1fr] gap-4">
      <div className="text-foreground/60 font-mono text-sm">{num}</div>
      <div>
        <h3 className="font-bold mb-2">{title}</h3>
        <div className="text-sm text-muted leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <h3 className="font-bold text-base mb-2">{label}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Route({
  label,
  labelNode,
  steps,
}: {
  label?: string;
  labelNode?: React.ReactNode;
  steps: { label: string; href?: string; desc?: string; descNode?: React.ReactNode }[];
}) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <h3 className="font-bold mb-3">{labelNode ?? label}</h3>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="grid grid-cols-[140px_1fr] gap-3 items-baseline">
            {step.href ? (
              <Link
                href={step.href}
                className="text-sm font-medium underline decoration-dotted underline-offset-2 hover:text-foreground/70"
              >
                {step.label}
              </Link>
            ) : (
              <span className="text-sm font-medium">{step.label}</span>
            )}
            <span className="text-[12px] text-muted leading-relaxed">{step.descNode ?? step.desc}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Warning({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="bg-surface-elev border-l-2 border-foreground rounded-r-md p-4 grid grid-cols-[40px_1fr] gap-3">
      <div className="text-foreground/60 font-mono text-sm">{num}</div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
