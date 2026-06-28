type Props = {
  className?: string;
  /** 貫通線のアクセント色 */
  accent?: string;
};

/**
 * 超!企業DB のブランドマーク。
 *
 * 「Q」の幾何変奏。
 * - 太いリングの円 = 企業DBの枠
 * - 中心のドット = ターゲット
 * - 右上に向かって円を貫通する太い対角線 = それを超える発見
 *
 * Polymarket 的に、ストロークの太さ・キャップの形・余白の比率を統一して
 * フリー素材っぽさを避ける。円と貫通線は同じストローク幅+丸キャップで揃える。
 */
export function BrandMark({ className, accent = "#10b981" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
    >
      {/* DBの円 (リング) */}
      <circle
        cx="11"
        cy="13"
        r="7.5"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* 円の内側を埋める小さな塗り (DBの「中身」感) */}
      <circle cx="11" cy="13" r="2.4" fill="currentColor" />

      {/* 円を中心から右上に貫通する太い対角線 */}
      <line
        x1="11"
        y1="13"
        x2="21"
        y2="3"
        stroke={accent}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* 突き抜けた先端のドット */}
      <circle cx="21" cy="3" r="1.6" fill={accent} />
    </svg>
  );
}
