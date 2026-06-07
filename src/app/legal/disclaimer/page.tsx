import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "免責事項",
  description:
    "本サービスは投資助言業に該当する個別助言ではありません。投資判断はご自身の責任で行ってください。",
};

export default function DisclaimerPage() {
  return (
    <LegalDoc
      eyebrow="Disclaimer"
      title="免責事項"
      effectiveDate="2026年5月31日"
      intro="本サービスをご利用いただく前に、必ずお読みください。"
    >
      <LegalSection title="1. 投資助言業に該当しない旨">
        <p>
          本サービスの情報は、<strong>不特定多数に対する一般的な投資情報の提供</strong>であり、
          金融商品取引法第 28 条第 3 項に定める投資助言業に該当する個別助言ではありません。
          特定の利用者の財産状況・投資経験・投資目的等を踏まえた個別のアドバイスを行うものではありません。
        </p>
        <p>
          本サービスに掲載された「割安」「割高」等の規範的判断は、
          公開情報に基づく一般的な評価であり、特定の銘柄の売買を推奨するものではありません。
        </p>
      </LegalSection>

      <LegalSection title="2. 投資判断の自己責任">
        <p>
          投資にあたっての最終判断は、利用者ご自身の責任で行ってください。
          本サービスは投資勧誘や売買推奨を目的とするものではありません。
        </p>
        <p>
          本サービスの情報を利用したことによって生じた損害について、運営者は一切の責任を負いません。
          投資には元本割れのリスクがあり、過去の業績や評価は将来の成果を保証するものではありません。
        </p>
      </LegalSection>

      <LegalSection title="3. 情報の正確性について">
        <p>
          本サービスでは、次の情報源から取得した公開情報を構造化して提供しています：
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>EDINET（金融庁電子開示システム）— 有価証券報告書、四半期報告書、大量保有報告書等</li>
          <li>TDnet（東京証券取引所適時開示情報伝達システム）— 決算短信、適時開示資料</li>
          <li>J-Quants（日本取引所グループ）— 株価データ</li>
          <li>各社 IR ページ — 決算説明会資料、統合報告書、中期経営計画</li>
        </ul>
        <p>
          情報の正確性については最大限の注意を払っていますが、内容の完全性・正確性・最新性について保証するものではありません。
          特に決算開示直後のリアルタイム反映時は、データの整合性確認が完了する前の段階で表示される場合があります。
          重要な投資判断の前には、必ず一次情報をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="4. AI 生成コンテンツについて">
        <p>
          本サービスには、生成 AI による分析コンテンツが含まれます。AI 生成セクションには
          <span className="mx-1 inline-flex items-center text-[10px] font-medium uppercase tracking-wider text-foreground border border-foreground/40 bg-foreground/5 rounded px-1.5 py-0.5">
            ✦ AI 生成
          </span>
          のラベルを明示しています。
        </p>
        <p>
          AI 生成コンテンツは、最新の LLM 技術を用いて公開情報を構造化・解釈したものですが、
          以下の限界があります：
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>事実誤認（ハルシネーション）の可能性がゼロではありません</li>
          <li>解釈の妥当性は時点によって変化する可能性があります</li>
          <li>AI が言及していない論点が重要である可能性があります</li>
        </ul>
        <p>
          本サービスは、引用元の明示と引用検証パイプラインで AI 出力の品質を担保していますが、
          投資判断の根拠としては必ず一次情報をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="5. 規範的判断について">
        <p>
          本サービスは「割安／ほぼ妥当／やや割高／割高」の 4 段階で銘柄の規範的判断を提供します。
          詳細な判断基準は <Link href="/legal/editorial-policy" className="underline">編集方針</Link>
          をご確認ください。
        </p>
        <p>
          これらの判断は、公開情報に基づく一般的評価であり、
          以下の点に留意してご利用ください：
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>「割安」は買いを推奨するものではありません</li>
          <li>「割高」は売りを推奨するものではありません</li>
          <li>個別の投資判断には、利用者ご自身の投資方針・リスク許容度・時間軸を勘案する必要があります</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 引用情報の取扱い">
        <p>
          本サービスでは、EDINET 等の公開情報、各社 IR 資料からの引用を行っています。
          引用は著作権法第 32 条に基づく適法な引用の範囲で行い、出典を明示しています。
          引用元の著作権はそれぞれの権利者に帰属します。
        </p>
      </LegalSection>

      <LegalSection title="7. リンク先について">
        <p>
          本サービスから外部サイトへのリンクが含まれる場合、リンク先サイトの内容については一切責任を負いません。
        </p>
      </LegalSection>

      <LegalSection title="8. 損害賠償の責任範囲">
        <p>
          本サービスの利用または利用不能から生じた直接的・間接的・偶発的・派生的損害について、
          運営者は一切の責任を負いません。
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
