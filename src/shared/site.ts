/** サイト全体で参照する基本情報。sitemap・robots・OG タグ・JSON-LD はここを参照する。 */

export const SITE_URL = "https://kigyo.cho-super.com";
export const SITE_NAME = "超!企業DB";
export const SITE_NAME_EN = "Cho! Kigyo DB";
export const SITE_TAGLINE = "AI が掘る、日本株の発見";
export const SITE_DESCRIPTION =
  "日本の上場企業 3,800 社を対象に、AI が事業類似銘柄・見落とし論点・業界構造を掘り出す。先回りキュレーション型の銘柄分析サービス。";
export const SITE_LOCALE = "ja_JP";
export const SITE_LANG = "ja";
export const SITE_PUBLISHER = "超!企業DB 編集部";
export const SITE_THEME_COLOR = "#0a0a0a";
export const SITE_BACKGROUND_COLOR = "#0a0a0a";

/** Twitter / X ハンドル。公式アカウントが用意でき次第差し替える。 */
export const SITE_TWITTER = "@chokigyo_db";

/** site 全体の検索キーワード。SEO 用。 */
export const SITE_KEYWORDS = [
  "日本株",
  "上場企業",
  "銘柄分析",
  "業界マップ",
  "AI 銘柄分析",
  "競合分析",
  "類似銘柄",
  "PER",
  "PBR",
  "配当利回り",
  "高配当株",
  "東証プライム",
  "東証グロース",
  "投資",
  "スクリーニング",
  "予測",
];

/** 構造化データ用の SNS アカウント・公式リンク群。 */
export const SITE_SAME_AS: string[] = [
  // 公式 X アカウントが開設され次第追加する
];

/** 絶対 URL を組み立てる util。 */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
