---
name: stock-fill
description: 銘柄コード(例: 7203)を引数に取り、Wikipedia 日本語版を一次ソースとして、ローカル D1 の companies / stock_snapshot / financials_annual / dividends / top_shareholders / company_ai_brief / story_decks / story_slides / company_industries / industries を全部埋めるスキル。/v2/stocks/[code] のリッチ詳細ページに必要な実データを 1 銘柄ぶん丸ごと用意する。引数: 4 桁証券コード。
---

# stock-fill — 1 銘柄ぶんの D1 を Wikipedia から実データで埋める

## 使い方

```
/stock-fill 7203
/stock-fill 6758
```

## ゴール

`/v2/stocks/<code>` を開いたとき、その銘柄のページが「Wikipedia から取れる範囲の実データ」で表示されることを保証する。

具体的には以下のテーブル/カラムを 1 銘柄ぶん埋める:

| 領域 | テーブル | 主な内容 |
|---|---|---|
| 会社マスタ | `companies` | nameEn / founded / listed / headquarters / ceoName / website / employeesConsolidated / logoColor / description / oneLiner |
| 価格スナップ | `stock_snapshot` | priceJpy / per / pbr / dividendYield / ma25/75/200 / rsi14 / 52w 高安 / change1d/1m/1y / marketCapOku 等(Yahoo 経由) |
| 業績履歴 | `financials_annual` | 過去 10 期の売上 / 営業利益 / 営業利益率 / 純利益 / EPS |
| 配当 | `dividends` | 過去 10 期の配当履歴 + 直近のスケジュール |
| 株主 | `top_shareholders` | 大株主 TOP10 |
| AI Brief | `company_ai_brief` | summary / valuation_rationale / positioning_* / stock_trend_analysis / technical_comment / analyst_summary / owner_activism_json |
| バリュエーション判定 | `stock_snapshot.valuation_verdict/score` | 割安/ほぼ妥当/やや割高/割高 + 0-100 |
| 業界 | `industries` / `company_industries` | slug / 名称 / その企業の所属 |
| 触媒・リスク | `events` | kind=catalyst x4, kind=risk x4 |
| 沿革紙芝居 | `story_decks` / `story_slides` | era 分けして **20〜30 枚**(沿革中心) |

## データソース方針

1. **Wikipedia 日本語版**を一次ソース(`https://ja.wikipedia.org/wiki/<会社名>`)
2. Wikipedia から取れないもの(株価指標)は **Yahoo パイプライン**経由(既に snapshot がある場合はそれを使う)
3. 数値や金額は **Wikipedia 記載の数値を引用、捏造しない**。取れなければ `NULL` で残す
4. 文章生成(summary, valuation_rationale, positioning, catalysts, story slides 本文)は **Wikipedia の事実に基づき Claude が要約**。具体的な数字は Wikipedia から引用する

## 手順(必ず順番に実行)

### Step 0. 前提確認

```bash
# code が D1 にあるか
DB=$(find /Users/taiga/workspace/kigyo-db/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" -not -name "metadata*" | head -1)
sqlite3 "$DB" "SELECT s.code, c.id AS company_id, c.name FROM stocks s JOIN companies c ON c.id = s.company_id WHERE s.code = '<CODE>'"
```

無ければ「`pnpm pipeline run fetch-jpx` を先に流してください」と user に伝えて exit。

### Step 1. Wikipedia 取得

会社名は Step 0 の `c.name`。WebFetch で:
```
https://ja.wikipedia.org/wiki/<URL エンコードした会社名>
```

`Read` ではなく **WebFetch** で取得し、要約させない(prompt: "本文と表を構造化して返してください")。

ページ末尾の「外部リンク」「脚注」は無視してよい。沿革セクション、概要セクション、業績の項、株主の表、配当の項、関連会社 を重点的に読む。

複数の同名会社が引っかかったら disambiguation を経由して、上場企業のものを選ぶ(`docs/data-design.md` に企業情報を当てる前提)。

### Step 2. companies UPDATE

Wikipedia から取れた以下を companies テーブルに UPDATE:

| カラム | Wikipedia 出典の典型箇所 |
|---|---|
| `nameEn` | infobox の英語名(例 "Toyota Motor Corporation") |
| `founded` | 「設立」"1937年8月28日" |
| `listed` | 「上場」"1949年5月" — 取れなければ NULL |
| `headquarters` | 「本社所在地」"愛知県豊田市トヨタ町1番地" |
| `ceoName` | 「代表者」最新の社長名 |
| `website` | 公式 URL |
| `employeesConsolidated` | 「従業員数」連結数値(**人単位の生の整数**、1万単位に丸めない。renderer が表示時に万/千/人へ自動で寄せる) |
| `logoColor` | ブランドカラー hex 推定(例 トヨタ → `#e60012`)。Wikipedia ロゴ画像があれば参考に、なければ業界やブランドから常識的に推定 |
| `description` | 200-260 字、何の会社かを Wikipedia 概要から要約 |
| `oneLiner` | description の最初の一文(80 字以内) |
| `updatedAt` | now |

SQL 例(direct sqlite3 経由、`wrangler d1 execute --local` は WAL/state 乖離するので使わない):

```bash
DB=$(find /Users/taiga/workspace/kigyo-db/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" -not -name "metadata*" | head -1)

# 長文を含むので Write tool で SQL ファイルを作って投入
cat > /tmp/stock-fill-<CODE>-companies.sql <<'SQL'
UPDATE companies SET
  name_en = '...',
  founded = '...',
  ...
WHERE id = <COMPANY_ID>;
SQL
sqlite3 "$DB" < /tmp/stock-fill-<CODE>-companies.sql
```

**文字列内のシングルクオートは '' でエスケープ**(SQLite 標準)。**全 SQL 投入は direct sqlite3 で統一**(理由: [[d1-local-write-pitfall]] の通り `wrangler d1 execute --local` で書いた内容と direct sqlite3 で読んだ内容が乖離する事象が再現する)。

### Step 3. financials_annual UPSERT(過去 10 期)

Wikipedia の「業績」「主な業績」セクションから 10 期ぶんの売上 / 営業利益 / (取れれば営業利益率, 純利益, EPS) を抽出。億円単位の整数で。

```bash
DB=$(find /Users/taiga/workspace/kigyo-db/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" -not -name "metadata*" | head -1)

# 既存削除 + 10 期 INSERT を 1 ファイルにまとめて投入
sqlite3 "$DB" < /tmp/stock-fill-<CODE>-financials.sql
```

数値が無い場合は `NULL` のまま。

### Step 4. dividends UPSERT(過去 10 期)

Wikipedia または企業 IR 配当履歴から。`amount` は 1 株あたり円。スケジュール(`ex_date` / `record_date` / `pay_date`)は最新期のみ入れる。

### Step 5. top_shareholders INSERT(TOP10)

Wikipedia の「株主構成」表があれば TOP10 を INSERT。`holder_type` は推定("信託口"/"法人(グループ)"/"法人(生保)"/"外国機関"/"個人")。

### Step 6. stock_snapshot 補完

すでに Yahoo 経由でほぼ埋まっているはずだが、以下は Wikipedia/IR からの補完が必要:
- `dividend_annual`(年間配当 ¥)
- `dividend_payout_ratio`(配当性向 %)
- `total_return_yield`(総還元利回り %)
- `foreign_ownership` / `individual_ownership` / `stable_ownership`(株主構成比率 %)
- `target_consensus` / `target_high` / `target_low` / `analyst_buy/hold/sell` ← **下記注意**
- `latest_revenue_oku` / `latest_op_profit_oku` / `latest_op_margin`(最新期スナップ、financials_annual から SELECT して入れる)
- `market_cap_tier`("メガ" / "大型" / "中型" / "小型"、marketCapOku から判定: >100,000=メガ / >10,000=大型 / >1,000=中型 / else 小型)
- `valuation_verdict` + `valuation_score`(後述 Step 7 の AI 評価で決定)

#### アナリスト目標株価セット(必須でゼロ or 全部)

`target_consensus` / `target_high` / `target_low` / `analyst_buy` / `analyst_hold` / `analyst_sell` の 6 カラムは **all-or-nothing** で扱う:

- **WebFetch で取れた場合**: 6 つ全部入れる(target_high と target_low が同値だと renderer が divide-by-zero になるので、必ず high > low を確認。差が 0 なら ±10% を機械的に当てる)
- **取れなかった場合**: 6 つ全部 NULL のまま放置(renderer 側でセクションを縮約して「アナリストカバレッジは未公表」+ AI サマリだけ表示する)
- **中途半端は禁止**: 例えば consensus だけ入れて buy/hold/sell を 0 にしない。totalRatings=0 で divide-by-zero が起きる

ソース候補(優先順):
1. Yahoo Finance (`https://finance.yahoo.co.jp/quote/<CODE>.T/analyst`)
2. みんかぶ / kabutan(403 のことが多いので fallback 用)
3. WebFetch で取れなければ 6 つ NULL のまま

### Step 7. company_ai_brief を AI 生成 + UPSERT

Wikipedia の事実をベースに、Claude が以下のテキストを生成して INSERT/UPSERT する:

- **summary** (200 字): この会社をひとことで。事業の本質と独自性
- **valuation_rationale** (200-260 字): PER/PBR/ROE/配当利回りを引用しつつ、業界平均との比較と両面性。同時に verdict ("割安"/"ほぼ妥当"/"やや割高"/"割高") と score (0-100) も決定 → `stock_snapshot.valuation_verdict/score` に書く
- **stock_trend_analysis** (120-180 字): 直近の値動き解説。MA/RSI/52週レンジから
- **stock_trend_factors_json**: `[{label, value, note}] x4`
- **technical_comment** (60 字以内): テクニカル一言
- **positioning_headline** (28 字以内): 業界内ポジ 1 行
- **positioning_analysis** (250-320 字): ライバル比較を 1-2 件含む
- **positioning_strengths_json**: `[{title, detail}] x4`
- **positioning_challenges_json**: `[{title, detail}] x3`
- **analyst_summary**: 強気派/弱気派の対立構造を 100-150 字
- **owner_activism_json**: `[{title, note}] x3`(株主構成や還元方針の動き)

**プロンプト方針**:
- Wikipedia に書いてある数字・固有名詞のみ使用。捏造禁止
- 「業界トップ」「世界一」等は Wikipedia に書いてあれば使ってよい
- 抽象表現より具体数値("売上 X 兆円")

### Step 8. events INSERT(catalysts x4 + risks x4)

Wikipedia の「沿革」「現状の課題」「業界動向」セクションを参考に、これから 1-2 年で株価を動かしそうな材料を 4 件 + リスクを 4 件生成。

```sql
INSERT INTO events (kind, scope, scope_ref, title, body, occurs_at, impact, direction, created_at) VALUES
  ('catalyst', 'company', '<COMPANY_ID>', '<title>', '<note>', '<2026 Q3 等>', '強|中|弱', 'up', '<now>'),
  ...
```

既存の catalyst/risk events を先に DELETE してから INSERT(冪等)。

### Step 9. industries + company_industries

会社の所属業界(JPX 33業種より具体的な業界 slug)を `industries` に UPSERT し、`company_industries` で関連付ける。

業界 slug は kebab-case 英数字(例: `automobile` / `internet-services` / `semiconductors`)。`name` (日本語フル名) と `short_name` (3-5 字) と `description` (300 字以内) を Wikipedia から抽出 or 推定。

`hero_image_id` は v2 詳細ページの hero 背景に使う Unsplash 写真 ID。業界の "象徴" として **下記のプリセットから 1 つ選ぶ**(自社のロゴ色やテーマで上書きはしない):

| 業界カテゴリ | photo ID | 雰囲気 |
|---|---|---|
| 自動車・輸送機器 | `photo-1503376780353-7e6692767b70` | 現代の自動車 |
| 半導体・電子部品 | `photo-1518770660439-4636190af475` | 基板 |
| SaaS・IT・ソフトウェア | `photo-1559136555-9303baea8ebd` | データセンター |
| 通信・インターネット | `photo-1551434678-e076c223a692` | チーム |
| 金融・銀行 | `photo-1556761175-5973dc0f32e7` | ビジネスデスク |
| 商社・物流 | `photo-1496664444929-8c75efb9546f` | 都市・ビル |
| 機械・産業機器 | `photo-1568667256531-3379a4076b1e` | 工業機械 |
| 製薬・医療 | `photo-1551836022-d5d88e9218df` | ラボ |
| 食品・小売 | `photo-1542362567-b07e54358753` | 店舗 |
| エネルギー・素材 | `photo-1492321936769-b49830bc1d1e` | 工業夜景 |

業界に当てはまるものが無ければ、最も近い雰囲気のものを選ぶ。**判定は LLM 側で**(コードで自動推測はしない)。

### Step 10. story_decks + story_slides(20〜30 枚、沿革中心)

Wikipedia の「沿革」セクションを章立てし、**20〜30 枚** のスライドを作成。トヨタの既存 30 枚スライド(/Users/taiga/workspace/kigyo-db/src/app/v2/stocks/7203/_data.ts:312 以降)が**フォーマットの参考**になる。

スキーマ:
```
story_decks: { id (autoinc), companyId, title, subtitle, sourceNote, publishedAt }
story_slides: { deckId, n (1..N), era, year, title, lead, body, image (Unsplash photo id), highlight }
```

#### era の決め方(会社ごとに変える)

トヨタは "創業前夜 / 創業期 / 成長期 / グローバル巨人化 / 次世代モビリティ" だが、会社によって違う(例: ソフトバンクGなら "通信黎明期 / IT 巨人化 / Vision Fund 期 / AI 投資期")。

業界・歴史・転機をベースに era 名を 3-6 個決める。各 era で 4-8 枚。

#### 各スライドの設計

- `n`: 1 から始まる連番
- `era`: 上で決めた era 名
- `year`: "1937" or "1990s" 等。柔軟
- `title`: スライドの見出し(20 字以内)
- `lead`: その出来事の魅力ワン文(40-60 字)
- `body`: 200-280 字の本文(Wikipedia からの要約)
- `image`: Unsplash photo ID(例: `photo-1503376780353-7e6692767b70`)。トヨタの slide で使われているものから業界的に適切なものを選ぶか、汎用ビジネス系を使う。詳細は **下記の Unsplash ID リスト** を参照
- `highlight`: バッジ的な短い強調(15 字以内、null も可)

#### Unsplash photo ID リスト(再利用しやすいもの)

| ID | 雰囲気 | 適する era |
|---|---|---|
| `photo-1485827404703-89b55fcc595e` | 古い工業機械 | 創業前夜・初期工業 |
| `photo-1502672023488-70e25813eb80` | 古い機械装置 | 初期発明 |
| `photo-1487754180451-c456f719a1fc` | 古工場内部 | 初期生産 |
| `photo-1568667256531-3379a4076b1e` | 工業機械接写 | 製造業全般 |
| `photo-1542362567-b07e54358753` | クラシックカー | 創業期の製品 |
| `photo-1532974297617-c0f05fe48bff` | 1930-40s 車 | 初期製品 |
| `photo-1503376780353-7e6692767b70` | 現代の自動車 | 現代モビリティ |
| `photo-1556761175-5973dc0f32e7` | オフィス・ビジネス | コーポレート系 |
| `photo-1496664444929-8c75efb9546f` | 都市・ビル | 本社・グローバル展開 |
| `photo-1492321936769-b49830bc1d1e` | 工業夜景 | 工場・生産 |
| `photo-1518770660439-4636190af475` | エレクトロニクス基板 | 半導体・電子 |
| `photo-1559136555-9303baea8ebd` | データセンター | IT・通信 |
| `photo-1551434678-e076c223a692` | チームミーティング | 経営・組織 |
| `photo-1551836022-d5d88e9218df` | 研究所 | R&D |
| `photo-1485827404703-89b55fcc595e` | 古工場 | 沿革初期 |

業界に応じて 5-8 種類を使い回せばよい(同じ画像が 2-3 回登場しても問題なし)。

#### story_decks 投入

長文なので `--file` で投入する SQL ファイルを作る:

```bash
cat > /tmp/stock-fill-<CODE>-story.sql <<'SQL'
DELETE FROM story_decks WHERE company_id = <COMPANY_ID>;
INSERT INTO story_decks (company_id, title, subtitle, source_note, published_at)
  VALUES (<COMPANY_ID>, '<会社名> — N年の物語', '<キャッチ>', '参考文献: Wikipedia「<会社名>」(<取得日>)', '<YYYY-MM-DD>');
-- スライド N 枚(deck_id は subquery で取る)
INSERT INTO story_slides (deck_id, n, era, year, title, lead, body, image, highlight)
SELECT id, 1, '...', '...', '...', '...', '...', '...', NULL FROM story_decks WHERE company_id = <COMPANY_ID>;
...
SQL
DB=$(find /Users/taiga/workspace/kigyo-db/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" -not -name "metadata*" | head -1)
sqlite3 "$DB" < /tmp/stock-fill-<CODE>-story.sql
```

SQL 文字列のシングルクオートは `''` でエスケープすること(SQLite 標準)。

### Step 11. 検証 + ブラウザ確認

ローカル D1 への書き込みは必ず **direct sqlite3** で行うため、検証も sqlite3 経由で(`wrangler d1 execute --local` は better-sqlite3 で書いた内容と state が乖離することがあるため):

```bash
DB=$(find /Users/taiga/workspace/kigyo-db/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" -not -name "metadata*" | head -1)

sqlite3 "$DB" "
SELECT 'companies' AS t, COUNT(*) c FROM companies WHERE id = <COMPANY_ID>
UNION ALL SELECT 'snapshot', COUNT(*) FROM stock_snapshot WHERE code = '<CODE>'
UNION ALL SELECT 'financials', COUNT(*) FROM financials_annual WHERE company_id = <COMPANY_ID>
UNION ALL SELECT 'dividends', COUNT(*) FROM dividends WHERE company_id = <COMPANY_ID>
UNION ALL SELECT 'shareholders', COUNT(*) FROM top_shareholders WHERE company_id = <COMPANY_ID>
UNION ALL SELECT 'ai_brief', COUNT(*) FROM company_ai_brief WHERE company_id = <COMPANY_ID>
UNION ALL SELECT 'events_catalyst', COUNT(*) FROM events WHERE scope='company' AND scope_ref='<COMPANY_ID>' AND kind='catalyst'
UNION ALL SELECT 'events_risk', COUNT(*) FROM events WHERE scope='company' AND scope_ref='<COMPANY_ID>' AND kind='risk'
UNION ALL SELECT 'industries', COUNT(*) FROM company_industries WHERE company_id = <COMPANY_ID>
UNION ALL SELECT 'industry_hero', (SELECT COUNT(*) FROM industries WHERE slug IN (SELECT industry_slug FROM company_industries WHERE company_id = <COMPANY_ID>) AND hero_image_id IS NOT NULL)
UNION ALL SELECT 'story_slides', COUNT(*) FROM story_slides WHERE deck_id IN (SELECT id FROM story_decks WHERE company_id = <COMPANY_ID>)
"
```

期待:
- companies = 1
- snapshot = 1
- financials >= 5(理想 10)
- dividends >= 5(理想 10)
- shareholders >= 1(中村のような創業者のみでも OK)
- ai_brief = 1
- events_catalyst = 4
- events_risk = 4
- industries >= 1
- industry_hero >= 1 ← industries.hero_image_id が設定済みか
- story_slides = 20〜30

#### Renderer 側の zero-data ガードに依存する箇所

renderer は以下のフィールドが NULL/0/空の時に「セクション縮約」or「— 表示」する。skill 側はこれを前提に**ゼロ捏造しない**:

| フィールド | 空のときの挙動 | 厳禁 |
|---|---|---|
| `analyst_buy/hold/sell` の合計 = 0 | アナリスト目標株価セクションは「カバレッジ未公表」+ サマリだけ表示 | 0/0/0 と入れて consensus だけ書く |
| `latestEarnings.highlights` 空配列 | 「ハイライト」ボックスを隠す | 適当な要約を一文だけ入れる |
| `top_shareholders.share_pct` が NULL | renderer が "—" 表示 | 中途半端に 0 を入れる |
| `industries.hero_image_id` NULL | 汎用画像にフォールバック | 業界に合わない画像を入れる |
| `employees_consolidated` 数値 | renderer が万/千/人へ自動で寄せる | 1万単位の浮動小数を入れる |

最後にユーザーに「**dev サーバーを再起動**してから `http://localhost:3000/v2/stocks/<CODE>` を開いて確認してください」と伝える(workerd が D1 state をメモリにキャッシュするため)。

## 厳守事項

1. **数値捏造禁止**: Wikipedia/Yahoo にある値のみ使う。無ければ NULL
2. **冪等性**: 同じ /stock-fill <code> を 2 回叩いても同じ最終状態(各テーブル DELETE → INSERT または UPSERT)
3. **SQL シングルクオート**: 必ず `''` でエスケープ
4. **長文は --file 経由**: コマンドライン引数では shell のクオート問題を起こすので `--file <path>` を使う
5. **進捗報告**: 各 Step ごとに「Step N: ✅ <件数>」を 1 行で報告する
6. **ロールバック**: 途中で失敗したら user に「<Step N> で失敗しました」と報告して停止(他 Step は触らない)

## 失敗パターンと対処

| 症状 | 対処 |
|---|---|
| Wikipedia ページが見つからない | 会社の正式名で再検索 → 公式サイト URL で検索 → user に確認を求める |
| Wikipedia に業績が無い | financials_annual はスキップ(NULL のまま)、他は埋める |
| 株主構成が無い | top_shareholders はスキップ |
| ロゴカラー不明 | 業界の代表色から推定(自動車=#cc0000系、IT=#1a73e8系、金融=#003366系) |
| 沿革が薄い | 20 枚以下でも OK、最低 10 枚は確保 |

## 完了報告フォーマット

```
✅ /stock-fill <code> 完了

| 項目 | 件数 |
|---|---|
| companies meta 更新 | nameEn/founded/headquarters/ceo/website/employees ✓ |
| financials_annual | N 期 |
| dividends | N 期 |
| top_shareholders | 10 件 |
| company_ai_brief | 全カラム埋め |
| events | catalyst 4 / risk 4 |
| industries | <slug> |
| story_slides | N 枚 (era: A / B / C / D) |

http://localhost:3000/v2/stocks/<code> で確認してください。
```
