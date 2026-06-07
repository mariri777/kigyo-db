import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "利用規約",
  description: "超！企業DB の利用にあたっての規約です。ご利用前にお読みください。",
};

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Terms of Service"
      title="利用規約"
      effectiveDate="2026年5月31日"
      intro="超！企業DB（以下「本サービス」）をご利用いただくにあたっての規約です。ご利用前にお読みください。"
    >
      <LegalSection title="第 1 条（適用）">
        <p>
          本規約は、本サービスの提供条件及び本サービスの運営者（以下「運営者」）と利用者との間の権利義務関係を定めることを目的とし、
          利用者と運営者との間の本サービスの利用に関わる一切の関係に適用されます。
        </p>
      </LegalSection>

      <LegalSection title="第 2 条（サービスの内容）">
        <p>
          本サービスは、日本の上場企業に関する公開情報（有価証券報告書、決算説明会資料、株価データ等）を構造化し、
          類似銘柄分析、見落とし論点抽出、規範的判断、業界分析を提供する情報サービスです。
        </p>
        <p>
          本サービスは投資情報の提供を目的とし、投資勧誘や売買推奨を目的とするものではありません。
          詳しくは <Link href="/legal/disclaimer" className="underline">免責事項</Link> をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="第 3 条（利用条件）">
        <p>本サービスは、以下の条件を承諾いただいた上でご利用ください：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>本規約、免責事項、編集方針、プライバシーポリシーに同意していること</li>
          <li>本サービスの情報を投資判断の唯一の根拠としないこと</li>
          <li>本サービスの情報を、無断で営利目的に再配布しないこと</li>
        </ul>
      </LegalSection>

      <LegalSection title="第 4 条（禁止事項）">
        <p>利用者は、本サービスの利用にあたって、以下の行為を行ってはなりません：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>法令または公序良俗に反する行為</li>
          <li>運営者または第三者の知的財産権、プライバシー権、その他の権利を侵害する行為</li>
          <li>本サービスの運営を妨害する行為（過度なクローリング、サーバー負荷攻撃等）</li>
          <li>本サービスの情報を改変・捏造して再配布する行為</li>
          <li>本サービスに表示された情報を、不公正取引（風説の流布、相場操縦等）に利用する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </LegalSection>

      <LegalSection title="第 5 条（知的財産権）">
        <p>
          本サービスに掲載されている情報のうち、運営者が独自に作成したコンテンツ
          （規範的判断、見落とし論点抽出、業界分析、ブログ記事、デザイン等）の著作権は運営者に帰属します。
        </p>
        <p>
          本サービスからの引用は、著作権法第 32 条に基づく適法な引用の範囲で行ってください。
          出典として「超！企業DB」を明示し、該当ページへのリンクを併記いただくようお願いします。
        </p>
        <p>
          本サービスが引用する第三者の著作物（IR 資料、各社決算説明会資料等）の著作権は、それぞれの権利者に帰属します。
        </p>
      </LegalSection>

      <LegalSection title="第 6 条（免責事項）">
        <p>
          本サービスの利用に関する免責事項は別途
          <Link href="/legal/disclaimer" className="underline mx-1">免責事項</Link>
          に定めるとおりです。本サービスを利用される前に必ずご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="第 7 条（サービス内容の変更・中断）">
        <p>
          運営者は、利用者に事前通知することなく、本サービスの内容の変更、追加、中断、終了を行う場合があります。
          これらに起因して利用者に損害が生じた場合でも、運営者は責任を負いません。
        </p>
      </LegalSection>

      <LegalSection title="第 8 条（規約の変更）">
        <p>
          運営者は、必要と判断した場合には、利用者に通知することなく本規約を変更できるものとします。
          変更後の本規約は、本サービス上で表示された時点から効力を生じるものとします。
        </p>
      </LegalSection>

      <LegalSection title="第 9 条（準拠法・管轄）">
        <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
        <p>本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。</p>
      </LegalSection>
    </LegalDoc>
  );
}
