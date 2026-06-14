# 超！企業DB（cho-kigyo-db）

> AI が掘る、日本株の発見。
> 東証上場企業を対象に、事業類似銘柄・成長フェーズ・ファクター感応度・見落とし論点を AI が先回りで整理して提示する、個人投資家向けの銘柄分析サービス。

公開サイト: <https://kigyo.cho-super.com>

## プロダクト概要

「超！企業DB」は、有報・決算説明会資料・適時開示を AI が解析し、銘柄ごとに「ひとことで言うと何の会社か」「似たビジネスをやっている会社」「市場が見落としていそうな論点」を一枚にまとめて表示します。

サイトで読める主なものは次のとおり。

- **銘柄ページ** (`/stocks/[code]`): ひとこと要約、AI 評価（割安・割高判定）、類似銘柄、見落とし論点、ファクター感応度、業績推移
- **業界マップ** (`/industries`, `/industries/[slug]`): 業界カバレッジと業界内の競争構造・主要 KPI
- **スクリーン** (`/screens`, `/screens/[slug]`): 「割安」「拡大期」「高配当」などの切り口で銘柄を抽出
- **特集テーマ** (`/themes`, `/themes/[slug]`): 編集キュレーションによる横断テーマ
- **AI 予測トラッカー** (`/predictions`, `/predictions/[id]`, `/predictions/track-record`): 決算ガイダンス・配当方針などを AI が事前予測し、当たりも外れも公開
- **比較ビュー** (`/compare`): 任意銘柄の指標を並べて比較
- **マイ予測** (`/profile`): ユーザーの予測投票履歴
- **ガイド / 超！企業DBとは** (`/guide`, `/about`): サービスの設計思想と使い方
- **ブログ** (`/blog`, `/blog/[slug]`): 編集記事
- **法務文書** (`/legal/terms`, `/legal/privacy`, `/legal/disclaimer`, `/legal/editorial-policy`): 利用規約・プライバシー・免責・編集方針

## 技術スタック

- **Next.js 16**（App Router）+ React 19
- **Tailwind CSS v4**（PostCSS 経由）
- **Drizzle ORM** + **Cloudflare D1**（SQLite ベース）
- **Cloudflare Workers** にデプロイ（[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) 経由）
- **Cloudflare Web Analytics**（cookie レス・本番ビルドのみ）
- TypeScript / Noto Sans JP + JetBrains Mono

> **注意**: このリポジトリの Next.js は本記事執筆時点の最新版で、過去のバージョンと API・規約・ファイル構成が異なる場合があります。コードを書く前に `node_modules/next/dist/docs/` 内の該当ガイドを必ず参照してください（[AGENTS.md](./AGENTS.md) 参照）。

## ディレクトリ構成

```
src/
  app/                   # App Router のページ・レイアウト・sitemap/robots
    layout.tsx           # 全画面共通のヘッダー・フッター・メタデータ
    page.tsx             # トップページ（ハイライト・カバレッジ・予測など）
    stocks/[code]/       # 銘柄詳細
    industries/[slug]/   # 業界マップ
    screens/[slug]/      # スクリーン結果
    themes/[slug]/       # 特集テーマ
    predictions/         # AI 予測トラッカー
    compare/             # 比較ビュー
    blog/[slug]/         # 編集記事
    about/, guide/       # サービス紹介・ガイド
    legal/               # 利用規約・プライバシー・免責・編集方針
    profile/             # マイ予測
  components/            # 画面横断の UI コンポーネント
  lib/                   # ドメインロジックとサンプルデータ
    data.ts              # 銘柄マスタ（株価は週次更新スクリプトで反映）
    industries.ts        # 業界定義と集計
    posts.ts             # ブログ
    predictions.ts       # AI 予測
    screens.ts           # スクリーン定義
    similarity.ts        # 類似度計算
    themes.ts            # 特集テーマ
    voteStore.ts         # 予測投票
    site.ts              # SITE_URL / SITE_NAME（全体で参照）
  db/
    schema.ts            # Drizzle スキーマ（D1）
    client.ts            # D1 + Drizzle クライアント

drizzle/                 # Drizzle Kit が出力するマイグレーション
data/prices.csv          # 株価更新スクリプトの入出力 CSV
scripts/
  update-prices.mjs      # 株価の週次更新スクリプト
  seed.sql               # 初期投入 SQL

wrangler.toml            # Cloudflare Workers / D1 の設定
open-next.config.ts      # OpenNext の設定
drizzle.config.ts        # Drizzle Kit の設定
next.config.ts           # Next.js 設定
```

## 開発手順

```bash
# 依存関係のインストール
npm install

# 開発サーバ（http://localhost:3000）
npm run dev

# プロダクションビルド
npm run build

# Cloudflare Workers 互換でローカルプレビュー（OpenNext でビルドして preview）
npm run preview

# Cloudflare Workers にデプロイ
npm run deploy
```

`npm run preview` / `npm run deploy` は、OpenNext で `.open-next/` 配下に成果物を生成してから wrangler を呼びます。Cloudflare のリソース（D1 など）は `wrangler.toml` で定義されています。

### 株価データの更新

サンプル銘柄マスタ（`src/lib/data.ts`）の株価を、週次で CSV 経由で更新する仕組みです。

```bash
# 1) 現在の株価を CSV テンプレートとして書き出す
npm run prices:template
#   → data/prices.csv が生成される。ここに最新の終値を上書きする。

# 2) CSV の株価を data.ts に反映する
npm run prices:apply -- --date 2026-06-12
#   → 時価総額・PER・PBR・配当利回り・前回比を自動再計算。
#     前回比 ±20% を超える銘柄があると入力ミスの可能性として停止する。
#     本当に正しければ末尾に --force を付ける。
```

### データベース（Cloudflare D1）

スキーマは `src/db/schema.ts`、マイグレーションは `drizzle/` に生成されます。

```bash
# スキーマ変更からマイグレーション SQL を生成
npx drizzle-kit generate

# 本番 D1 に適用（wrangler.toml の binding 名は DB）
npx wrangler d1 migrations apply cho-kigyo-db-database --remote

# ローカル D1 に適用
npx wrangler d1 migrations apply cho-kigyo-db-database --local
```

> 現状の銘柄データはサンプルとして `src/lib/data.ts` に直書きされています。D1 は今後の本番データ移行に向けた基盤として用意されています（EDINET / TDnet / J-Quants からの取得を前提とした構造）。

## サイトのコンセプト（要約）

- **大手では出せない領域を取る**: 証券会社のコンプラ上踏み込みにくい「割安・割高評価」「見落としリスク」を、根拠と数値を併記して提示。
- **信頼性の三層構造**:
  1. 定量データは EDINET XBRL から決定的に取得し、AI に数値を生成させない。
  2. 類似度などは 0〜100 の整数スコア+根拠一文。曖昧なラベリングをしない。
  3. AI 生成パートは AI 生成と明示し、引用検証で根拠未確認の出力は非表示。
- **横断比較**: 東証の業種分類を超えた事業類似性で隣接銘柄を発見。
- **透明性**: AI 予測は事前にロックし、結果と学びをそのまま公開する。

詳細は `/about`・`/guide`・`/legal/editorial-policy` の各ページに記載しています。

## 注意事項（ディスクレーマ）

本サービスの情報は、不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。

## ライセンス

このリポジトリは private です。
