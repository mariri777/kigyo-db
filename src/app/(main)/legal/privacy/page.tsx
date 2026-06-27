import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/LegalDoc";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const metadata: Metadata = pageMetadata({
  title: "プライバシーポリシー",
  description:
    "超!企業DB における個人情報の取扱方針。取得情報、利用目的、Cookie、第三者提供、開示請求の手続きを記載します。",
  path: ROUTES.legal.privacy,
});

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Privacy Policy"
      title="プライバシーポリシー"
      effectiveDate="2026年5月31日"
      intro="超！企業DB（以下「本サービス」）における個人情報の取扱方針を定めるものです。"
    >
      <LegalSection title="1. 基本方針">
        <p>
          本サービスは、利用者の個人情報の重要性を認識し、個人情報の保護に関する法律および関連法令を遵守し、
          適切に取り扱います。
        </p>
      </LegalSection>

      <LegalSection title="2. 現状の取扱い">
        <p>
          本サービスは現時点で会員登録機能・問い合わせフォーム等を提供しておらず、
          利用者から個人情報（氏名、メールアドレス、住所、電話番号等）を直接取得していません。
        </p>
        <p>
          将来的に会員機能等を導入する場合は、本ポリシーを改定し、取得情報・利用目的を明示します。
        </p>
      </LegalSection>

      <LegalSection title="3. アクセス情報の取扱い">
        <p>
          本サービスでは、サイト改善のために以下のアクセス情報を取得・利用する場合があります：
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>IP アドレス、ブラウザ種別、参照元 URL、アクセス日時等</li>
          <li>Cookie 等を用いた行動分析（Google Analytics 等を導入する場合）</li>
        </ul>
        <p>
          これらは個人を特定する目的では使用せず、統計的に集計したうえでサービス改善のために利用します。
        </p>
      </LegalSection>

      <LegalSection title="4. Cookie の利用">
        <p>
          本サービスでは、利用者の利便性向上およびサービス改善のために Cookie を使用する場合があります。
          利用者はブラウザの設定により Cookie の受け入れを拒否することができますが、
          一部機能が利用できなくなる場合があります。
        </p>
      </LegalSection>

      <LegalSection title="5. 第三者提供">
        <p>
          本サービスは、利用者の同意なく、取得した情報を第三者に提供しません。
          ただし、以下の場合はこの限りではありません：
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要がある場合</li>
          <li>運営に必要な業務委託先に提供する場合（守秘義務を課した上で）</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 開示・訂正・削除請求">
        <p>
          利用者は、本サービスが保有する自己の個人情報について、開示・訂正・削除を求めることができます。
          請求の窓口は別途お知らせします。
        </p>
      </LegalSection>

      <LegalSection title="7. ポリシーの変更">
        <p>
          本ポリシーは、必要に応じて変更されることがあります。
          変更があった場合は、本サービス上に変更後の内容を表示します。
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
