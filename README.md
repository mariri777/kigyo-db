# 超!企業DB

> AIが掘る、日本株の発見。
> 東証上場 約3,800 社を対象に、AI が「ひとことで言うと何の会社か」「直近の動意」「業界の構図」「市場が見落とす論点」を先回りで整理して提示する、個人投資家向けの銘柄分析データベース。

公開サイト: <https://kigyo.cho-super.com>

## いまの状態

このリポジトリは戦略レイヤーから一段組み直している最中で、**`/v2` 配下が現行の公開ルート**になっています(`/v2` のヘッダーに `v2 prototype` バッジが出ます)。旧 `/stocks` `/industries` `/screens` `/themes` `/predictions` `/compare` 等のルートは一度削除済みで、今後 `/v2` を `/` に昇格させる順序で進めます。

実装済み(`/v2/...`):

- **ホーム** (`/v2`): 本日の市場サマリ(`market_indices` + AI Daily Brief)、本日のハイライト(`stock_snapshot` 由来の自動生成)、編集記事一覧、注目企業/業界、予測コーナーのプロトタイプ、半導体テーマ + 全銘柄DB入口
- **銘柄一覧** (`/v2/stocks`): コード/社名検索、JPX 33業種フィルタ、時価総額/前日比/PER/利回りの各種ソート、ページネーション
- **銘柄詳細** (`/v2/stocks/[code]`): companies / stock_snapshot / financials_annual / dividends / top_shareholders / company_ai_brief / story_decks 等を 1 枚に展開
- **記事一覧 / 記事詳細** (`/v2/articles`, `/v2/articles/[slug]`): 編集記事(angle = 決算解釈/業界俯瞰/テーマ深掘り/プライマー)
- **管理画面** (`/admin`): 記事 CRUD、Tiptap WYSIWYG、下書き保存、公開/非公開、関連銘柄/業界、ユーザー管理、パスワード変更
- **API** (`/api/search`): 銘柄横断検索(Workers Cache API でキャッシュ)
- **sitemap / robots / manifest / OG image / Twitter image**: app router の慣例どおり root に配置

戦略の意図は `docs/strategy.md` 参照(3 レイヤー設計: 薄い全銘柄DB × 全業種・予想解釈メディア × テーマ深掘りDB)。

## 技術スタック

- **Next.js 16**(App Router) + React 19.2
- **Tailwind CSS v4**(PostCSS 経由) / shadcn/ui / Radix UI / lucide-react
- **Tiptap v3**(管理画面の WYSIWYG)
- **Drizzle ORM 0.45** + **Cloudflare D1**(SQLite)
- **Cloudflare R2**(管理画面の画像アップロード保管。EDINET XBRL は保管せず in-memory で処理)
- **Cloudflare Workers** へデプロイ([`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) 経由)
- **Zod 4**(AI タスクの出力スキーマ)、**fast-xml-parser / fflate**(XBRL 解析)、**yahoo-finance2**、**better-sqlite3**(ローカル D1 直アクセス)
- **TypeScript 5** / Noto Sans JP + JetBrains Mono
- パッケージマネージャは **pnpm 10**、Node 22。lint は ESLint 9、git hook は lefthook

> **注意**: ここで使っている Next.js は最新版で、過去のバージョンと API/規約/ファイル構成が異なります。コードを書く前に `node_modules/next/dist/docs/` 内の該当ガイドを必ず参照してください(`AGENTS.md` 参照)。

## 開発手順

```bash
# 依存関係のインストール
pnpm install

# 開発サーバ (http://localhost:3000)
pnpm dev

# Cloudflare Workers 互換でローカルプレビュー (OpenNext でビルドして preview)
pnpm preview

# Cloudflare Workers にデプロイ
pnpm deploy

# 型チェック / Lint
pnpm typecheck
pnpm lint
```

`pnpm preview` / `pnpm deploy` は OpenNext で `.open-next/` 配下に成果物を生成してから wrangler を呼びます。D1 や R2 などのバインディングは `wrangler.toml` に宣言しています。

## データベース(Cloudflare D1)

スキーマは `src/server/db/schema.ts`、マイグレーションは `drizzle/` に生成されます。

```bash
# スキーマ変更からマイグレーション SQL を生成
pnpm exec drizzle-kit generate

# 本番 D1 に適用 (wrangler.toml の binding 名は DB)
pnpm exec wrangler d1 migrations apply cho-kigyo-db-database --remote

# ローカル D1 に適用
pnpm exec wrangler d1 migrations apply cho-kigyo-db-database --local
```

### ローカル D1 の初期化

```bash
# .wrangler/state/v3/d1 を破棄 → migrations apply → JPX から companies/stocks 投入
#                            → 管理者アカウントと記事カテゴリを seed
pnpm db:seed-local

# JPX を叩かずスキーマだけ作りたい場合 (CI 等)
pnpm db:seed-local -- --no-fetch

# 同じものを名前を変えただけのエイリアス
pnpm db:reset-local
```

`db:seed-local` で投入される初期管理者:

- メール: `admin@example.com`
- パスワード: `password0`

**本番に反映する前に必ず `/admin/account` でパスワードを変更してください。**

価格・財務・AI 生成パートはこのあと「データパイプライン」のとおりに後追いで埋めます。

## データパイプライン(`pnpm pipeline`)

データ取得・派生抽出・AI 生成・本番反映は、すべて単一のエントリ `pnpm pipeline` 配下に集約しています(`scripts/pipeline.ts`)。スケジュールは `scripts/lib/schedule.ts` の `SCHEDULE` 配列で宣言、各タスクは `scripts/tasks/<kind>/<task>.ts` に 1 ファイル 1 タスクで実装します。

### ローカル実行と GitHub Actions の分担

サブスクの Claude を使う AI 系タスクは GH Actions のランナーでは動かないため、**runner** という概念で 2 系統に分けて管理しています(`scripts/lib/schedule.ts` の各エントリに `runner: "local" | "gh" | "both"`)。

| runner | 中身 | 走る場所 |
|---|---|---|
| `gh` | JPX / Yahoo / EDINET / market-indices / derive-highlights | GitHub Actions (cron) |
| `local` | ai-stock-trend / ai-market-brief / ai-valuation / ai-positioning / ai-summary / ai-catalysts / ai-logo-color / ai-forecast | 開発者ローカル(`claude` CLI 経由でサブスク消費) |
| `both` | sync-remote | 両方の末尾。最後にローカル/本番 D1 に揃える |

#### GitHub Actions 側(自動、無料の Yahoo/JPX/EDINET を毎日取り続ける)

| workflow | cron (UTC) | JST | 内容 |
|---|---|---|---|
| `pipeline-indices-30min.yml` | `*/30 * * * *` | 30分ごと | 主要指数 5 本だけ更新 → sync (トップの最新値) |
| `pipeline-daily.yml` | `0 7 * * *` | 16:00 | JPX/Yahoo/EDINET/market-indices/highlights → sync |
| `pipeline-weekly.yml` | `0 21 * * 5` | 土 06:00 | EDINET 過去 8 日補修 → sync |

裏側のコマンドは `pnpm pipeline <freq> --runner=gh` だけ。新タスクを GH Actions で動かしたくなったら `schedule.ts` に 1 行 (`runner: "gh"`) 足すだけで反映されます。

必要な GitHub Actions secrets:

| secret | 用途 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | wrangler d1 execute --remote |
| `CLOUDFLARE_ACCOUNT_ID` | 同上 |
| `EDITNET_API_KEY` | EDINET 書類一覧/取得 API (typo は Cloudflare 側の secret 名と合わせている) |

#### ローカル側(あなたが叩くタイミングで AI を回す)

> ⚠️ **monthly は GH Actions の対象外**。`ai-valuation` / `ai-positioning` / `ai-summary` / `ai-catalysts` / `ai-logo-color` は全部 AI なので、月初に開発者が **手で `pnpm pipeline monthly` を叩く**必要があります。叩かないと月次データが更新されません。

```bash
# 全部入り (gh タスクも含む。ローカルで一気通貫したいとき)
pnpm pipeline daily
pnpm pipeline weekly
pnpm pipeline monthly      # ← 月初の必須運用
pnpm pipeline every-6h     # ← AI Daily Forecast を更新したいとき

# AI タスクだけを上乗せ的に走らせる (GH Actions が gh ぶんを既に流した後など)
pnpm pipeline daily --runner=local

# 1 タスクだけデバッグ実行
pnpm pipeline run fetch-jpx
pnpm pipeline run ai-stock-trend --limit 10 --auto
pnpm pipeline run ai-valuation --codes 7203,9984 --manual

# lake (local/ai-generated/*.json) を本番 D1 に UPSERT するだけ
pnpm pipeline sync

# AI 手動ループ: prepare 済み入力 → 外部 LLM → output.json で apply
pnpm pipeline ai-apply ai-valuation --file ./output.json
```

共通オプション:

- `--runner gh|local|both|all` SCHEDULE の runner フィルタ(default: `all`)
- `--limit N` 対象を先頭 N 件に限定
- `--codes 7203,9984` 銘柄コード明示
- `--date YYYY-MM-DD` 論理日付の上書き(default: 今日 JST)
- `--auto` / `--manual` AI タスクの実行モード(default: `--auto`)

### 実行モデル(なぜ「ローカル D1 → 本番 D1」の 2 段か)

- **fetch / derive 系**(JPX / Yahoo / EDINET / 派生抽出)は決定的に同じ値が返るので、ランナー内のローカル D1 にいったん書き、`sync-remote` で本番に UPSERT する
- **ai 系**(LLM 生成)は人間が品質を確認してから本番に出したいので、ローカル D1 と `local/ai-generated/<task>/<key>.json`(lake)に書き、`pnpm pipeline sync` で本番へ反映する
- `sync-remote` は lake を walk して、タスクごとに UPSERT SQL をテーブル単位でまとめ、`wrangler d1 execute --remote --file` で投入する
- 冪等性は全 SQL を `INSERT ... ON CONFLICT DO UPDATE` にすることで担保

`blog/admin` 系テーブル(`articles` / `categories` / `admin_users` / `admin_sessions` 等)はパイプラインのスコープ外です。

### EDINET XBRL パイプライン

`edinet-pipeline` タスクは 2 段で完結します:

1. **discover**: 書類一覧 API から前日提出書類の docID を `edinet_docs` に INSERT
2. **process**: discovered 行を 1 件ずつ DL → in-memory で unzip → XBRL を parse して `financials_annual` / `dividends` / `companies` に UPSERT

R2 や一時ファイルは使わず、同一ジョブ内のメモリで完結。会計基準別タグの対応表は `scripts/lib/edinet-tags.ts`。週次の `edinet-pipeline (backfill: 8)` で過去 8 日分の取りこぼしを回収します。

### AI 生成パイプライン

`scripts/tasks/ai/*.ts` 配下の各タスクが「入力組立 / プロンプト / 出力 Zod スキーマ / DB マッピング / SQL ジェネレータ」を 1 ファイルに閉じています。

| タスク | 反映先 | 頻度 | 役割 |
|---|---|---|---|
| `ai-stock-trend` | `stock_snapshot.trend_*` | 日次(動意) + 週次ローテ | 値動きや材料の一言解釈 |
| `ai-market-brief` | `market_brief` | 日次 | 市場全体のリード文 + 箇条書き + watch テーマ |
| `ai-valuation` | `company_ai_brief.valuation_*` | 月次ローテ 1/8 | 割安/割高判定と根拠 |
| `ai-positioning` | `company_ai_brief.positioning_*` | 月次ローテ 1/8 | 業界内ポジション |
| `ai-summary` | `company_ai_brief.summary` | 月次ローテ 1/8 | ひとこと要約 |
| `ai-catalysts` | `company_ai_brief.catalysts` | 月次ローテ 1/8 | 短期/中期カタリスト |
| `ai-logo-color` | `companies.logo_color` | 月次 | 未着色銘柄のブランド色 |

詳細は `docs/ai-pipeline.md`。出力 JSON はすべて `local/ai-generated/<task>/<key>.json` に保存され、`pnpm pipeline sync` で本番に投入されます。

### 1 銘柄分のリッチデータをまとめて埋める

`/v2/stocks/[code]` で出る情報(companies / stock_snapshot / financials_annual / dividends / top_shareholders / company_ai_brief / story_decks / story_slides / company_industries / industries)を 1 銘柄分まとめて作るには `.claude/skills/stock-fill/SKILL.md` の手順で `pnpm pipeline run ...` を順に流します(Wikipedia を一次ソースに使う Claude Code 用スキル)。

## ブログ / 記事管理画面

記事は D1 の `articles` テーブルに HTML として保存します。管理画面で Tiptap WYSIWYG による作成・編集・下書き保存・公開/非公開・angle(カテゴリ)・関連銘柄/業界の設定ができます。

- 管理トップ: <http://localhost:3000/admin>(本番: <https://kigyo.cho-super.com/admin>)
- ログイン: <http://localhost:3000/admin/login>

主な動線:

- `/admin` — 下書き / 公開済みの記事一覧
- `/admin/articles` — 記事一覧
- `/admin/articles/new` — 新規記事作成
- `/admin/articles/[id]` — 記事の編集・削除
- `/admin/account` — ログイン中ユーザーのパスワード変更
- `/admin/users` — 管理者ユーザー一覧 + 新規発行

## サイトのコンセプト(要約)

- **大手では出せない領域を取る**: 証券会社のコンプラ上、踏み込みにくい「割安・割高評価」「見落としリスク」「業界の見立て」を、根拠と数値を併記して提示する
- **信頼性の三層構造**:
  1. 定量データは EDINET XBRL から決定的に取得し、AI に数値を生成させない
  2. 類似度などは 0〜100 の整数スコア + 根拠一文。曖昧なラベリングをしない
  3. AI 生成パートは AI 生成と明示し、根拠未確認の出力は非表示
- **横断比較**: 東証の業種分類を超えた事業類似性で隣接銘柄を発見
- **AI 予測の透明性**: 事前にロック → 結果と学びをそのまま公開する(予測コーナーは現状プロトタイプ。バックエンドはまだ書いていない)

戦略の全体像は `docs/strategy.md`。

## 注意事項(ディスクレーマ)

本サービスの情報は不特定多数に対する一般的な投資情報提供であり、投資助言業に該当する個別助言ではありません。投資判断はユーザー自身の責任で行ってください。本サービスは投資勧誘や売買推奨を目的とするものではありません。

## ライセンス

このリポジトリは private です。
