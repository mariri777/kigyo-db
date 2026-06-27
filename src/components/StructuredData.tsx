/**
 * JSON-LD を `<script type="application/ld+json">` として埋め込むコンポーネント。
 * `dangerouslySetInnerHTML` の冗長な記述を毎ページで書かないためのラッパ。
 */
export function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
