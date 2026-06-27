import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/shared/links";

export const metadata: Metadata = pageMetadata({
  title: "超!企業DBとは — 設計思想と提供価値",
  description:
    "個人投資家のための AI ネイティブな銘柄分析サービス。類似銘柄エンジン・見落とし論点抽出・業界マップ動的生成という 3 つのコア機能と、信頼性を担保する設計思想を解説します。",
  path: ROUTES.about,
  ogType: "website",
});

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">超！企業DBとは</h1>
      <p className="text-muted-foreground mb-10">
        個人投資家のための、AI ネイティブな銘柄分析サービス。
      </p>

      <h2 className="text-xl font-bold mt-12 mb-3">提供価値</h2>
      <p className="text-muted-foreground mb-4">
        東証 3,800 社を対象に、有報・決算説明会・統合報告書から AI が事業構造を整理・タグ化。
        事業類似度・成長フェーズ・リスクプロファイルの 3 軸で、東証の業種分類より細かい粒度で銘柄を関連付けます。
      </p>
      <p className="text-muted-foreground mb-4">
        コア機能は <strong className="text-foreground">類似銘柄エンジン</strong>、<strong className="text-foreground">見落とし論点抽出</strong>、<strong className="text-foreground">業界マップ動的生成</strong>の 3 つ。
        ありきたりな論点（為替・人口減少）や既知の論点は、複数の AI ステップで機械的に除外します。
      </p>

      <h2 className="text-xl font-bold mt-12 mb-3">大手では出せない領域を取る</h2>
      <ul className="text-muted-foreground space-y-2 list-disc pl-5">
        <li>独立性：証券会社の利益相反から距離を取り、忖度なく評価。</li>
        <li>AI 評価：割安・割高評価を、根拠と数値を併記して提示。</li>
        <li>横断比較：業種分類を超えた事業類似性で隣接銘柄を発見。</li>
        <li>否定的評価：投資家が見落としているリスク論点を構造的に抽出。</li>
      </ul>

      <h2 className="text-xl font-bold mt-12 mb-3">信頼性の三層構造</h2>
      <ol className="text-muted-foreground space-y-3 list-decimal pl-5">
        <li>
          <strong className="text-foreground">定量データ</strong>：EDINET XBRL から決定的に取得。AI に数値を生成させません。すべての数値に出典と日付を記録。
        </li>
        <li>
          <strong className="text-foreground">構造化解釈</strong>：類似度スコアは 0〜100 の整数。曖昧なラベリングをせず、類似根拠を一文で添えます。
        </li>
        <li>
          <strong className="text-foreground">AI 生成パート</strong>：論点抽出・AI 評価は AI 生成であることを明示し、根拠付き引用を強制。引用検証で根拠未確認の出力は非表示。
        </li>
      </ol>

      <h2 className="text-xl font-bold mt-12 mb-3">品質の磨き込み</h2>
      <p className="text-muted-foreground mb-4">
        業界ごとに「磨き込みの主戦場」を設定し、編集チームによる定期レビューを実施。
        レビュー結果は AI へのサンプル学習に反映され、他業界の品質にも伝播していきます。
      </p>

      <h2 className="text-xl font-bold mt-12 mb-3">注意事項</h2>
      <p className="text-muted-foreground text-sm">
        本サービスの情報は、不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。
        投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。
      </p>
    </article>
  );
}
