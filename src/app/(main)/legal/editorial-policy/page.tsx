import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/LegalDoc";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const metadata: Metadata = pageMetadata({
  title: "編集方針 — どう書き、どう判断しているか",
  description:
    "規範的判断(割安・割高)の出し方、見落とし論点の抽出方法、AI と編集部の責任分担、品質階層、訂正ポリシーまでを公開。透明性そのものをプロダクトに織り込みます。",
  path: ROUTES.legal.editorial,
});

export default function EditorialPolicyPage() {
  return (
    <LegalDoc
      eyebrow="Editorial Policy"
      title="編集方針"
      effectiveDate="2026年5月31日"
      intro="どんな基準で書き、どこまで規範的判断を出し、どこから先は出さないのか。本サービスの編集方針を公開します。透明性そのものがプロダクトの一部です。"
    >
      <LegalSection title="なぜ規範的判断を出すのか">
        <p>
          「割安」「割高」のような規範的判断は、本来、投資情報サービスの中核的な価値です。
          しかし大手証券会社は社内のコンプライアンス上、自社の利益相反を避けるため、こうした判断を出しにくい構造を持っています。
          一方で個人投資家は、数字の羅列を見せられても、自分でその意味を解釈する負担が大きい。
        </p>
        <p>
          本サービスは独立系として、法律の範囲内（不特定多数への一般情報提供）で、根拠と数値を併記した規範的判断を出します。
          これは <Link href={ROUTES.home} className="underline">超！企業DB</Link> が他のサービスと差別化する核心です。
        </p>
      </LegalSection>

      <LegalSection title="どこまで出し、どこから出さないか">
        <p>
          <strong>出す範囲：</strong>
          特定銘柄の指標（PER、PBR、配当利回り等）と同業他社・過去水準との比較に基づく
          「割安／ほぼ妥当／やや割高／割高」という 4 段階の規範的判断。
          根拠と参照数値を必ず併記します。
        </p>
        <p>
          <strong>出さない範囲：</strong>
          ユーザー個人のポートフォリオに対する個別アドバイス（「あなたが買うべき」「売るべき」）。
          これは投資助言業（金融商品取引法第 28 条第 3 項）の射程に入るため、
          本サービスでは一切提供しません。
        </p>
      </LegalSection>

      <LegalSection title="「割安・割高」判定の方法">
        <p>各銘柄の規範的判断は、次の 3 段階で組み立てます。</p>

        <h3 className="text-base font-bold mt-6 mb-2">第 1 段階：相対比較</h3>
        <p>
          PER・PBR・ROE・配当利回りを、同業他社平均・過去 5 年平均・業界全体平均と比較します。
          単一の指標ではなく、複数の角度から評価します。
        </p>

        <h3 className="text-base font-bold mt-6 mb-2">第 2 段階：成長フェーズの調整</h3>
        <p>
          売上成長率・利益率の安定性・設備投資/減価償却比率を組み合わせた成長フェーズスコアで、
          単純な指標比較の解釈を補正します。拡大期の銘柄に高 PER は許容され、
          成熟期の銘柄には厳しめに見ます。
        </p>

        <h3 className="text-base font-bold mt-6 mb-2">第 3 段階：根拠の明示</h3>
        <p>
          判断のラベルだけでなく、必ず数値と比較対象を併記します。
          「PER 22.8 倍は WFE 平均 24 倍と概ね同水準」のように、
          ユーザーが追検証できる形にします。
        </p>
      </LegalSection>

      <LegalSection title="見落とし論点の抽出方法">
        <p>
          「あなたが見落としているかもしれない論点」セクションでは、
          多段プロンプトによる構造的フィルタを採用しています。
        </p>
        <ul className="list-decimal pl-6 space-y-2">
          <li>
            <strong>第 1 段階（差分抽出）：</strong>
            この会社固有の事業特徴・顧客構造・収益構造のうち、同業他社と異なる点を列挙
          </li>
          <li>
            <strong>第 2 段階（影響要素フィルタ）：</strong>
            列挙された差分のうち、業績に影響しうるものを抽出
          </li>
          <li>
            <strong>第 3 段階（非自明性フィルタ）：</strong>
            抽出された影響要素のうち、過去 1 年の IR・決算説明会で言及されていない、
            または議論が浅いものを優先
          </li>
        </ul>
        <p>
          これにより「為替リスク」「人口減少」のような汎用論点と、
          既に市場で広く議論されている既知論点は機械的に排除されます。
        </p>
        <p>
          すべての論点には根拠となる文書・ページ・該当箇所を引用形式で添付しています。
          引用できない情報は出力しません。出力後に「引用箇所が実際に存在するか」を別パイプラインで検証し、
          検証失敗は再生成または非表示にします。
        </p>
      </LegalSection>

      <LegalSection title="品質階層（Tier 1/2/3）">
        <p>
          全銘柄を同じ品質で提供するのは現実的でないため、品質を階層化しています。
          ユーザーには階層を明示しませんが、開発者レビューの対象や使用モデルに差があります。
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Tier 1（重点クラスタ）：</strong>
            開発者が週次でレビュー。修正は AI への指示書（プロンプト）に反映し、他の Tier へも伝播。
            現在は半導体クラスタ、医薬品クラスタが対象。
          </li>
          <li>
            <strong>Tier 2（Prime / Standard 主力）：</strong>
            自動運用。安価モデル中心で広くカバー。
          </li>
          <li>
            <strong>Tier 3（Growth・低流動）：</strong>
            自動運用。後追いで品質を改善。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="AI 生成コンテンツの取扱い">
        <p>
          AI が生成したセクションには <span className="text-foreground border border-foreground/40 bg-foreground/5 rounded px-1 text-[11px]">✦ AI 生成</span> のラベルを明示します。
          すべてのAI生成コンテンツには、根拠となる引用元（決算説明会資料、有価証券報告書、統合報告書等）を併記します。
        </p>
        <p>
          AI による分析は、投資判断の補助材料です。本サービスは投資判断の根拠としてご利用前に、
          必ず引用元の一次情報をご確認いただくことをお願いしています。
        </p>
      </LegalSection>

      <LegalSection title="訂正・修正ポリシー">
        <p>
          公開後に事実誤認、数値の誤り、論点の的外れが判明した場合、速やかに該当箇所を修正し、
          ページ末尾に修正の事実と日付を明示します。重大な誤りについては別途お知らせします。
        </p>
        <p>
          ユーザーからのフィードバックは編集の改善に活用します。
          特定銘柄や記事についてご意見がある場合は、お問い合わせ窓口（準備中）または X 経由でお寄せください。
        </p>
      </LegalSection>

      <LegalSection title="編集の独立性">
        <p>
          本サービスは特定の証券会社・金融機関・上場企業とは独立した立場で運営しています。
          掲載する規範的判断・分析・論点抽出は、開発者の編集判断に基づくものであり、
          外部からの依頼や報酬による影響を受けません。
        </p>
        <p>
          将来的に有料サブスクリプションを導入する場合も、無料・有料の境界は明示し、
          編集の独立性は維持します。
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
