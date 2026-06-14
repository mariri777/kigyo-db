/**
 * DB の posts.body_html をそのまま埋め込むレンダラ。
 * 0003 マイグレーションで Block[] から HTML 文字列ベースに移行した。
 *
 * セキュリティ:
 *   admin 画面で受け付ける HTML は src/server/blog/sanitize.ts で
 *   `<script>` 等を除去してから保存している。ここでは <article> で囲んで
 *   既存ページレイアウトとの整合を取る。
 */
export function PostContent({ html }: { html: string }) {
  return (
    <article
      className="max-w-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
