# コードレベル詳細 findings(Web Interface Guidelines 準拠レビュー)

> `docs/design-review-2026-07.md` の追補。改善フェーズのチケット分解用。
> 対象: `src/app/(main)/` 配下全 .tsx、`globals.css`、`src/components/ui/`、root `layout.tsx`。
> 実行: 2026-07-02(サブエージェントによる全ファイル精査 + grep 事実確認済み)

## 構造的パターン(重要度順)

### 1. [HIGH] prefers-reduced-motion が全面的に無視
`animate-pulse` が公開側 7 箇所(`page.tsx:843`、`_Header.tsx:58,124`、`stocks/7203/_renderer.tsx:131`、`forecasts/page.tsx:230`、`forecasts/[id]/page.tsx:216`)で無ガード。`_StorySlider` の `scrollTo({behavior:"smooth"})`、多数の `hover:scale-105` / `transition-transform duration-500` も同様。`motion-safe:` を付けているのは `articles/_lib/atoms.tsx` の 2 箇所のみ。`globals.css` に `@media (prefers-reduced-motion: reduce)` の一括無効化も無し。→ **globals.css に 1 ルール追加で大半カバー可能。**

### 2. [HIGH] タッチ/モバイル最適化プロパティが皆無
`touch-action: manipulation` / `-webkit-tap-highlight-color` / `overscroll-behavior: contain` がリポジトリ全体で 0 件。特に `_Header.tsx` のモバイルメニュー(`fixed inset-0` + `overflow-y-auto`)、`_StorySlider.tsx` の横スクロール、`dialog.tsx` のモーダルで `overscroll-behavior: contain` 欠落 → スクロールチェーンが背面に抜ける。

### 3. [HIGH] Safe area(ノッチ)対応なし
`env(safe-area-inset-*)` が 0 件。`_Header.tsx` の `sticky top-0` ヘッダーと `fixed inset-0` 全画面メニューが iOS ノッチ/ホームインジケータ非考慮。root `layout.tsx:92` の viewport に `viewportFit: "cover"` も無し。

### 4. [HIGH] スキップリンクなし
`(main)/layout.tsx:10` の `<main className="flex-1">` に id も無く、「本文へスキップ」リンクが存在しない。全ページ共通。→ 1 本追加で解消。

### 5. 未定義 --font-serif を全記事の見出し・数値が参照
`articles/[slug]/page.tsx:273`(記事 H1)、`contentRenderer.tsx:170`(statGrid 数値)が `var(--font-serif, ui-serif, Georgia, serif)` を使うが、`--font-serif` はどこにも定義なし。→ 常にフォールバック(欧文 Georgia + 日本語システム明朝)になり、デバイス差が大きい。

### 6. スライダー/記事フィルタの状態が URL 非同期(deep-link 不可)
`_StorySlider.tsx`(active スライド)、`articles/_ArticlesView.tsx:52-78`(query・カテゴリ・業界フィルタを useState 保持)が URL 未反映。`stocks/page.tsx` が searchParams で正しく URL 反映しているのと対照的。

### 7. CDN への preconnect なし
LCP 画像(トップ/記事/銘柄の各 Hero)が全て外部ホスト `images.unsplash.com` / `kigyo-assets.cho-super.com` 由来なのに `<link rel="preconnect">` が 0 件。`priority` 画像の接続確立が遅れ LCP 悪化。

### 8. ダミー `href="#"` リンク
`_Footer.tsx:37-44`(ホットテーマ 8 個すべて)、`_ArticlesView.tsx:302`(テーマチップ)。押すとページ先頭にジャンプする非機能ナビ。

### 9. 本文画像に width/height 無し(CLS)
`contentRenderer.tsx:219-226` の記事本文 `figure` が素の `<img className="w-full h-auto">`(寸法属性なし・`loading="lazy"` なし)。※ページ Hero 等は Next/Image `fill`+`sizes` で担保済み。

### 10. hover 専用の情報開示でキーボード/タッチ到達不能
`stocks/7203/_renderer.tsx:601` の配当バー金額が `opacity-0 group-hover:opacity-100` でホバー時のみ表示。キーボード/タッチで金額が読めない。

## ファイル別 findings(file:line)

### layout
- `(main)/layout.tsx:10` [HIGH] skip link 無し・`<main>` に id 無し
- `app/layout.tsx:92` viewport に `viewportFit:"cover"` 無し(§3 と対)

### _Header.tsx
- `:80-131` [HIGH] 自前 `div[role=dialog]` モバイルメニューにフォーカストラップ無し(Tab が背面に抜ける)、`overscroll-behavior` 無し
- `:67-76` メニュー開閉ボタンに `focus-visible` リング無し
- `:58,124` [HIGH] `animate-pulse` reduced-motion 非対応(§1)
- `:38,45,88` ヘッダーの `<Link>` 群に `focus-visible:ring-*` 無し

### _SearchBox.tsx
- `:113-131` [HIGH] combobox input に `focus:outline-none`、代替リングは親 `focus-within` のみ
- `:113-131` input 側に `aria-activedescendant` 無し(SR に選択中 option が伝わらない)
- `:123` placeholder が `…` で終わらず例示パターン無し

### _Footer.tsx
- `:37-44` [§8] ホットテーマ 8 個すべて `href="#"`

### page.tsx(トップ)
- `:459-464` bookmark/共有ボタンが `onClick` 無し=無反応の飾りボタン
- `:421` サブ指数カードが `cursor-pointer hover:bg-white/10` だが `<div>` でリンク/ハンドラ無し
- `:495` 注目テーマ `<li>` も同様に `cursor-pointer` だがリンク無し
- `:843` `animate-pulse` reduced-motion 非対応(§1)
- `:271,1270` 銘柄検索 `<input name="q">` に `autoComplete` 指定なし

### articles/_ArticlesView.tsx
- `:52-78` [§6] query/カテゴリ/業界フィルタが URL 非同期
- `:214-221` `<input type="search">` に `focus:outline-none`、placeholder `…` 無し
- `:302` テーマチップ `href="#"`(§8)

### articles/[slug]/page.tsx & contentRenderer.tsx
- `page.tsx:44` **[CRITICAL] 全記事(公開済み含む)が `robots:{index:false,follow:false}` で noindex** — コンテンツ SEO を根幹から無効化。status での分岐が必要
- `page.tsx:273` [§5] 記事 H1 が未定義 `--font-serif` 参照
- `contentRenderer.tsx:170` [§5] statGrid 数値が未定義 `--font-serif` 参照
- `contentRenderer.tsx:219-226` [§9] 本文 img に width/height・lazy 無し
- ※外部リンクは `rel="noopener noreferrer"` 付きで適切

### articles/[slug]/_Toc.tsx
- `:40-56` TOC の `<a>` にフォーカスリング無し

### stocks/page.tsx
- `:304-329` ネイティブ `<select>` に `background-color`/`color` 明示なし(Windows ダークモード対策)
- `:292-299` 検索 input に `autoComplete` 無し、`focus:outline-none`
- 良い点: ソート/フィルタ/ページングが全て URL 反映、`aria-sort` 実装済み(`:392`)— Navigation & State の模範例

### stocks/7203/_renderer.tsx
- `:131` `animate-pulse`(LIVE ドット)reduced-motion 非対応(§1)
- `:601-604` [§10] 配当金額 hover のみ表示

### stocks/7203/_StorySlider.tsx
- `:121-125` [HIGH] 横スクロールに `overscroll-behavior:contain` 無し
- `:62,66-71` 矢印キー移動を `window` keydown で実装 → フォーカスが無くてもページ全域で ←→ を奪う(誤作動源)
- `:216-225` サムネイル(ドット)ボタンに `focus-visible` リング無し
- `:62` `scrollTo({behavior:"smooth"})` reduced-motion 非対応(§1)

### forecasts/page.tsx & [id]/page.tsx
- `page.tsx:230` / `[id]/page.tsx:216` `animate-pulse` reduced-motion 非対応(§1)
- 良い点: 状態は Server Component + URL 遷移ベースで健全。背景グリッド SVG は `aria-hidden` 付き

### components/ui(公開側でも利用)
- `dialog.tsx:64` [HIGH] `DialogContent` に `overscroll-behavior:contain` 無し
- `dialog.tsx:42,64` `data-[state=open]:animate-in` 等が reduced-motion 明示ガード無し
- `confirm-dialog.tsx:114-126` `autoComplete="off"`+`spellCheck={false}`+`autoFocus` 揃い模範的(良い点)
- `sonner.tsx:13-38` `useTheme()` 参照する一方 html は light 固定 → ダークトースト時に地色不整合の可能性(軽微)

### globals.css
- `:5` `@custom-variant dark` 定義+UI コンポーネントに `dark:` クラス多数だが、html light 固定・ダークトークン未定義 → 「中途半端に配線されて無効」状態
- `:130-132` `word-break:auto-phrase` / `text-wrap:pretty` は良い配慮(良い点)
- 全体: `@media (prefers-reduced-motion: reduce)` 一括ルール無し(§1 の根本対策)

## 問題なしと確認済みの項目(誤検知回避)
- 数値表示は全ページ `font-mono tabular`(tabular-nums)徹底
- `formatNumber`/`formatPrice` は `toLocaleString("en-US")` 使用で Intl 準拠
- アイコンオンリーボタンは概ね `aria-label` 付き、装飾 SVG は `aria-hidden` 概ね徹底

## 修正の投資対効果順
1. §1: globals.css に reduced-motion 一括ルール 1 本
2. §4: skip link 1 本
3. noindex 解除(articles/[slug]/page.tsx:44 の status 分岐)
4. §2/§3: モバイルメニュー・スライダー・ダイアログへ touch-action / overscroll / safe-area
5. §5: `--font-serif` 定義 or 参照削除
