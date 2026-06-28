# 超!企業DB v2 データ層 設計仕様

> このドキュメントは `/v2` 配下の新トップページ・新企業詳細ページを支えるデータ層 (D1 スキーマ + 更新頻度) のゼロベース再設計の決定打。`src/server/db/schema.ts` を新スキーマで書き直す際、本ドキュメントを唯一の参照点とする。
>
> **関連**: 財務データの収集パイプラインは [`docs/data-pipeline.md`](./data-pipeline.md) を参照。

---

## 背景

`/v2` のプロトタイプ (トップページと企業詳細ページ) を通じて、現状の D1 スキーマと `src/content/*.ts` のハードコードでは新画面が要求するデータ要素 — 大株主TOP10・アナリスト目標株価・配当履歴・自社株買い・カタリスト/リスク・株主動向・テクニカル指標・市場サマリ・沿革紙芝居 — の多くを表現できていないことが分かった。一方で既存スキーマには現在ほぼ使われていない要素 (`company_factor_betas` の9次元、`business_tags` の6次元タグ、`company_phase_scores` のライフサイクル4段階、`company_segments` の `share`/`operating_margin`、insight_sources などの引用元 join) も多い。

新画面の現実的な運用 (日次cron 1本+四半期決算トリガー+編集起こし) を前提に、3つの軸でスキーマと更新頻度をゼロベースで再設計する:

1. **読み出し効率を最優先したフラット集約モデル**
2. **事象は 1 本の汎用 events テーブル**
3. **予測だけは shifts 履歴のために独立**

既存 `src/content/*.ts` ハードコードはすべて廃止し DB に移すことを前提とする。

---

## 設計の3原則

1. **読み出しを軽く** — 1ページ1〜3クエリで完結する集約モデル。**stock_snapshot** に画面で見せる派生値を全部詰める。複雑な join を回避する。
2. **書き込みは更新頻度ごとに別系統** — 日次cron / 四半期決算トリガー / 編集 / イベント駆動の4系統をテーブル単位で分離。バックフィルや再計算の責務を明確化。
3. **イベントは1本に集約** — カタリスト・リスク・市場サマリ・適時開示・テーマ動向は `events` に kind ディスクリミネータで集約。predictions だけは投票履歴の都合で独立。

---

## ドメイン分割

### A. 企業マスタ層 (1回きり / 経営交代等で随時)
**companies (拡張)**, **stocks** の2つ。stocks は銘柄属性のみ。価格・派生指標は **stock_snapshot** に分離。

### B. 価格時系列層 (日次cron)
**stock_prices_daily** (現状維持・31日窓)。チャート用集計は stock_snapshot に焼き込む。

### C. 銘柄スナップショット層 (日次cron + 四半期トリガー)
**stock_snapshot** に**画面で見せる派生値をすべて詰める**。1銘柄1行のシングルトン。読み出し最速。

### D. 決算層 (四半期決算トリガー)
**financials_annual**, **financials_quarterly**, **dividends** の3つ。10年履歴を引ける形で。

### E. AI生成層 (日次 + 四半期トリガー)
**company_ai_brief** (詳細ページ用の AI 解析束、四半期トリガーで再生成 + 日次でカタリストだけ追記)
**market_brief** (トップ用の AI 日次サマリ)

### F. 業界層 (年次見直し)
**industries** (簡素化), **company_industries** (FK、クラスタは削除)

### G. ブログ層 (随時)
**posts**, **tags**, **post_tags**, **admin_users**, **admin_sessions** (現状維持)

### H. イベント層 (随時)
**events** (kind: catalyst/risk/disclosure/market_summary/theme_signal …) で汎用化。

### I. 予測層 (独立)
**predictions**, **prediction_shifts** (確率の時間変動履歴)

### J. ストーリー層 (随時 / 編集起こし)
**story_decks**, **story_slides** (沿革紙芝居。当面は数十社のみ)

### K. 株主構成層 (四半期トリガー)
**top_shareholders** (大株主TOP10、10件固定)

---

## スキーマ案

凡例: `PK` 主キー / `FK` 外部キー / `IX` インデックス / `UQ` ユニーク制約 / `JSON` JSON 文字列 / `Trig` 更新トリガー

### A. 企業マスタ層

#### companies
| カラム | 型 | 備考 | 更新頻度 |
|---|---|---|---|
| id | integer PK | 自動採番 | — |
| name | text | 和名 | 1回きり |
| name_en | text | 英名 | 1回きり |
| edinet_code | text | XBRL連携用 | 1回きり |
| description | text | 1段落 説明 | 編集 |
| one_liner | text | 一言要約 | 編集 |
| founded | text | 設立日 "1937-08-28" | 1回きり |
| listed | text | 上場日 "1949-05" | 1回きり |
| headquarters | text | 本社住所 | 経営判断時 |
| ceo_name | text | 代表者名 | 経営交代時 |
| website | text | 公式URL | 経営判断時 |
| employees_consolidated | integer | 連結従業員数 | 四半期Trig |
| logo_color | text | "#e60012" 風 | 編集 |
| created_at, updated_at | text | | |

#### stocks
| カラム | 型 | 備考 | 更新頻度 |
|---|---|---|---|
| code | text PK | "7203" | — |
| company_id | integer FK | | — |
| exchange | text | プライム/スタンダード/グロース | 1回きり (市場変更時) |
| sector_tse | text | JPX33業種 | 1回きり |
| index_membership | text | "TOPIX,JPX400,N225" CSV | 月次 |
| listed_shares | integer | 発行済株式数 (千株) | 自社株買い時 |
| created_at, updated_at | text | | |

**削除**: 価格・PER・PBR・配当利回り → `stock_snapshot` に移管。

### B. 価格時系列層

#### stock_prices_daily
| カラム | 型 | 備考 | 更新頻度 |
|---|---|---|---|
| code | text FK | | — |
| date | text | YYYY-MM-DD | — |
| open, high, low, close | real | 分割調整済み | 日次cron |
| volume | integer | | 日次cron |
| PK: (code, date) | | | |
| IX: date | | | |

保持期間: **31日**。チャート用の長期集計は `stock_snapshot.price_history_json` に焼く。

### C. 銘柄スナップショット層

#### stock_snapshot — 1銘柄1行で**画面の派生値全部入り**
| カラム | 型 | 備考 | 更新頻度 |
|---|---|---|---|
| code | text PK FK | | — |
| **価格** | | | |
| price_jpy | real | 現値 | 日次cron |
| price_date | text | YYYY-MM-DD | 日次cron |
| change_1d_pct | real | 1日変動率 | 日次cron |
| change_1m_pct | real | 1ヶ月 | 日次cron |
| change_1y_pct | real | 1年 | 日次cron |
| **時価総額・バリュエーション** | | | |
| market_cap_oku | integer | 時価総額 (億円) | 日次cron |
| market_cap_tier | text | "メガ/大型/中型/小型" (時価総額帯) | 日次cron |
| per | real | 実績 | 日次cron |
| per_forecast | real | 予想 | 日次cron |
| pbr | real | | 日次cron |
| psr | real | | 日次cron |
| ev_ebitda | real | | 四半期Trig |
| peg | real | | 四半期Trig |
| roe | real | | 四半期Trig |
| **配当 (現在値)** | | | |
| dividend_yield | real | | 日次cron |
| dividend_annual | real | 年間 ¥/株 | 四半期Trig |
| dividend_payout_ratio | real | 配当性向 | 四半期Trig |
| total_return_yield | real | 総還元利回り | 四半期Trig |
| **テクニカル** | | | |
| ma_25 | real | 25日移動平均 | 日次cron |
| ma_75 | real | 75日 | 日次cron |
| ma_200 | real | 200日 | 日次cron |
| high_52w | real | 52週高値 | 日次cron |
| low_52w | real | 52週安値 | 日次cron |
| rsi_14 | real | | 日次cron |
| avg_volume_3m | text | "28.6M" 表示用 | 日次cron |
| credit_buy | text | 信用買残 | 週次cron |
| credit_sell | text | 信用売残 | 週次cron |
| credit_ratio | real | 貸借倍率 | 週次cron |
| **チャート用集計** | | | |
| price_history_json | text JSON | 90日 OHLC ダウンサンプル | 日次cron |
| **株主構成サマリ** | | | |
| foreign_ownership | real | 外国人持株比率 % | 四半期Trig |
| individual_ownership | real | 個人持株 % | 四半期Trig |
| stable_ownership | real | 安定株主 % | 四半期Trig |
| **業績スナップ (最新期)** | | | |
| latest_revenue_oku | integer | 直近期 売上高 | 四半期Trig |
| latest_op_profit_oku | integer | 営業利益 | 四半期Trig |
| latest_op_margin | real | | 四半期Trig |
| **アナリスト目標** | | | |
| target_consensus | integer | コンセンサス目標 | 週次cron |
| target_high | integer | | 週次cron |
| target_low | integer | | 週次cron |
| analyst_buy | integer | 買い数 | 週次cron |
| analyst_hold | integer | 中立数 | 週次cron |
| analyst_sell | integer | 売り数 | 週次cron |
| **AI評価 (バリュエーション)** | | | |
| valuation_verdict | text | "割安/ほぼ妥当/やや割高/割高" | 四半期Trig |
| valuation_score | integer | 0-100 | 四半期Trig |
| updated_at | text | | |

**設計意図**: 詳細ページのヒーロー〜投資判断〜テクニカルまでを**1クエリで全部引ける**。

### D. 決算層

#### financials_annual — 年次10年履歴
| カラム | 型 | 備考 |
|---|---|---|
| company_id | FK | |
| fy | text | "2025/3" |
| revenue_oku | integer | |
| operating_profit_oku | integer | |
| operating_margin | real | |
| net_profit_oku | integer | |
| eps | real | |
| PK: (company_id, fy) | | |

**更新**: 四半期決算トリガー (実質 年1回)。

#### financials_quarterly — 直近8期の四半期
| カラム | 型 | 備考 |
|---|---|---|
| company_id | FK | |
| period | text | "2025Q3" |
| revenue_oku, op_profit_oku, op_margin, net_profit_oku | real/integer | |
| highlights_json | text JSON | 配列(4項目) |
| PK: (company_id, period) | | |

#### dividends — 10年配当履歴
| カラム | 型 | 備考 |
|---|---|---|
| company_id | FK | |
| fy | text | |
| amount | real | ¥/株 |
| ex_date | text | 権利付き最終日 |
| record_date | text | |
| pay_date | text | |
| PK: (company_id, fy) | | |

**自社株買い**は別カラム不要 (規模・予定は events kind="buyback" で表現、サマリは snapshot.total_return_yield)。

### E. AI生成層

#### company_ai_brief — 詳細ページの AI 解析束 (1社1行)
| カラム | 型 | 備考 | 更新頻度 |
|---|---|---|---|
| company_id | PK FK | | |
| summary | text | "この会社をひとことで" (200字) | 四半期Trig + 編集 |
| valuation_rationale | text | バリュエーション判定の根拠 | 四半期Trig |
| stock_trend_analysis | text | 株価トレンドAI分析 | 日次cron |
| stock_trend_factors_json | text JSON | 主要ファクター4個 (label/value/note) | 日次cron |
| analyst_summary | text | アナリストコメント要約 | 週次cron |
| technical_comment | text | テクニカル一言 | 日次cron |
| positioning_headline | text | 業界ポジショニング 1行 | 四半期Trig |
| positioning_analysis | text | 業界ポジショニング 300字 | 四半期Trig |
| positioning_strengths_json | text JSON | 強み4項目 | 四半期Trig |
| positioning_challenges_json | text JSON | 課題3項目 | 四半期Trig |
| owner_activism_json | text JSON | 「注目の動き」3項目 | 月次 |
| generated_at | text | | |

**設計意図**: AI 生成テキストは「いつ再生成するか」をカラム単位で持つので、cron がカラム別 UPDATE で済む。再生成コストは決算トリガーで集中させる。

#### market_brief — トップ用 日次AIサマリ (日次1行)
| カラム | 型 | 備考 |
|---|---|---|
| date | text PK | YYYY-MM-DD |
| lede | text | 「半導体に火が戻った1日…」 |
| bullets_json | text JSON | 3-5本の箇条書き |
| watch_themes_json | text JSON | テーマ3件 (name/change_pct) |
| indices_json | text JSON | 主要指数5本 (name/value/change_pct) |
| generated_at | text | |

**設計意図**: トップは date でこの1行を引くだけで完結。

### F. 業界層 (大幅簡素化)

#### industries
| カラム | 型 | 備考 |
|---|---|---|
| slug | text PK | "automobile" |
| name | text | "自動車・輸送用機器" |
| short_name | text | "自動車" |
| description | text | 300字 |
| insights_json | text JSON | 業界のキーポイント箇条書き |

**削除**: theme_2025_json, market_scale_*, chain_columns_json, competitive_structure_json, key_kpis_json — JSON が重く再利用性低い。必要なら `insights_json` に集約。

#### company_industries
| カラム | 型 |
|---|---|
| company_id | FK |
| industry_slug | FK |
| PK: (company_id, industry_slug) |  |

**削除**: industry_clusters / company_industry_clusters (2層構造はオーバーキル)。

### G. ブログ層 (現状維持)

`posts`, `tags`, `post_tags`, `admin_users`, `admin_sessions` はそのまま。

### H. イベント層

#### events — 汎用イベント
| カラム | 型 | 備考 |
|---|---|---|
| id | integer PK | |
| kind | text | "catalyst" / "risk" / "disclosure" / "theme_signal" / "buyback" / "earnings_event" / "guidance_revision" |
| scope | text | "company" / "industry" / "market" |
| scope_ref | text | scope に応じて company_id / industry_slug / "JP" |
| title | text | "4.3兆円自社株買い完了" |
| body | text | 内容 (150字) |
| occurs_at | text | 発生予定日 "2026年Q2" or YYYY-MM-DD |
| impact | text | "強/中/弱" (catalyst/risk のみ) |
| direction | text | "up/down" (catalyst=up, risk=down) |
| source_url | text | 適時開示URL等 |
| created_at | text | |
| IX: (scope, scope_ref, kind), IX: (occurs_at) | | |

**設計意図**: 詳細ページの「上がりそうな材料」「下がりそうなリスク」、トップの「Watch Themes」、市場サマリの根拠、適時開示一覧などを**1テーブルから kind と scope で引ける**。

### I. 予測層

#### predictions
| カラム | 型 | 備考 |
|---|---|---|
| id | integer PK | |
| code | text FK nullable | 銘柄予測なら入れる |
| category | text | "決算/指数/個別株/政策" |
| question | text | "明日のソフトバンクG決算、予想以上か?" |
| pick_label | text | "予想以上" |
| no_label | text | "予想以下" |
| probability | integer | 0-100 |
| rationale | text | 100字 |
| resolve_at | text | "2026-08-08" |
| status | text | "live/soon/resolved" |
| outcome | text nullable | "yes/no" |
| outcome_at | text nullable | 判定日 |
| volume | text | "¥1.2M" (表示用) |
| voters | integer | |
| created_at | text | |
| IX: (status), IX: (code), IX: (resolve_at) | | |

#### prediction_shifts
| カラム | 型 | 備考 |
|---|---|---|
| prediction_id | FK | |
| at | text | YYYY-MM-DDTHH:MM |
| probability | integer | |
| reason | text | |
| PK: (prediction_id, at) | | |

トラックレコード (累積的中率) は predictions を集計するだけ、専用テーブル不要。

### J. ストーリー層

#### story_decks
| カラム | 型 | 備考 |
|---|---|---|
| id | integer PK | |
| company_id | FK | |
| title | text | |
| subtitle | text | |
| source_note | text | "参考文献: Wikipedia ..." |
| published_at | text | |

#### story_slides
| カラム | 型 | 備考 |
|---|---|---|
| deck_id | FK | |
| n | integer | 1-30 |
| era | text | |
| year | text | |
| title | text | |
| lead | text | |
| body | text | |
| image | text | Unsplash photo ID |
| highlight | text nullable | |
| PK: (deck_id, n) | | |

### K. 株主構成

#### top_shareholders
| カラム | 型 | 備考 |
|---|---|---|
| company_id | FK | |
| rank | integer | 1-10 |
| name | text | |
| share_pct | real | |
| holder_type | text | "信託口/法人(グループ)/法人(生保)/外国機関" |
| as_of | text | 計算基準日 "2025-03-31" |
| PK: (company_id, rank) | | |

**更新**: 四半期Trig。10件固定。

---

## 削減した既存スキーマ要素

| 既存テーブル / カラム | 理由 |
|---|---|
| `company_factor_betas` (9次元 β) | 画面では4ファクターを編集テキストで出すだけ、9次元の精緻な β は overkill。 stock_trend_factors_json に集約 |
| `business_tags` (6次元) | 銘柄の事業内容は description + sector_tse + industries で足りる。6次元のタグは深掘りニーズ低 |
| `company_phase_scores` (4段階ライフサイクル) | 画面に出てない。テーマ別ランキングも overlay の単純絞り込みで代替可 |
| `company_segments.share` / `.operating_margin` | セグメント別利益率は出していない。期間別売上だけで十分 |
| `industries.theme_2025_json`, `market_scale_*`, `chain_columns_json`, `competitive_structure_json`, `key_kpis_json` | 大半が業界1ページの装飾用 JSON。新画面では `industries.insights_json` 一本に集約 |
| `industry_clusters`, `company_industry_clusters` | バリューチェーンクラスタは詳細業界画面でしか効かない。MVP では `company_industries` の単純 join で十分 |
| `insight_sources`, `valuation_sources`, `sources` | 出典 join は表示しない。引用が必要になったら body に inline URL で十分。**sources テーブル自体を削除** |
| `company_insights` (旧) | `company_ai_brief` に内包 (1社1行に集約) |
| `company_valuation_calls` (旧) | `stock_snapshot.valuation_verdict / valuation_score` + `company_ai_brief.valuation_rationale` に集約 |

---

## 追加した要素 (新画面の要請)

| 新テーブル / カラム | 用途 |
|---|---|
| `stock_snapshot` (1社1行集約) | 詳細ページ全パネルを1クエリで引く |
| `stock_snapshot.market_cap_tier`, `index_membership` | 「メガ/大型/中型/小型」「TOPIX/JPX400/N225 組入」フィルタ用 |
| `stock_snapshot.target_*`, `analyst_*` | アナリスト目標株価+レーティング分布 |
| `stock_snapshot.ma_*`, `high_52w`, `low_52w`, `rsi_14`, `credit_*` | テクニカル指標 |
| `stock_snapshot.foreign_ownership`, `individual_ownership`, `stable_ownership` | 株主構成サマリ |
| `stock_snapshot.price_history_json` | 90日チャートの読み出し1発化 |
| `company_ai_brief` | AI 生成テキストの束 (再生成タイミングを列単位で管理) |
| `market_brief` | トップの日次 AI サマリ |
| `dividends` | 10年配当履歴 |
| `top_shareholders` | 大株主 TOP10 |
| `events` | カタリスト・リスク・適時開示・テーマ動向を全部1本に |
| `prediction_shifts` | Polymarket 風 確率の時間変動 |
| `story_decks` / `story_slides` | 沿革紙芝居 |
| `companies` 拡張: `founded`, `listed`, `headquarters`, `ceo_name`, `website`, `employees_consolidated`, `logo_color` | 詳細ページのヒーロー Info ブロックに必須 |

---

## 更新頻度マトリクス

更新主体ごとにテーブルとカラムを整理。

### 日次 cron (毎営業日 04:00 JST)
- `stock_prices_daily` 全件追加 (31日窓)
- `stock_snapshot`: `price_jpy` / `change_*pct` / `market_cap_oku` / `market_cap_tier` / `per` / `per_forecast` / `pbr` / `psr` / `dividend_yield` / `ma_*` / `high_52w` / `low_52w` / `rsi_14` / `avg_volume_3m` / `price_history_json`
- `company_ai_brief`: `stock_trend_analysis` / `stock_trend_factors_json` / `technical_comment` (LLM 呼び出し、トップ50銘柄程度に限定可)
- `market_brief` (当日分1行 INSERT)
- `events` のうち kind="disclosure" を TDnet から取り込み

### 週次 cron (土曜)
- `stock_snapshot`: `credit_buy` / `credit_sell` / `credit_ratio`
- `stock_snapshot`: `target_consensus` / `target_high` / `target_low` / `analyst_buy` / `analyst_hold` / `analyst_sell`
- `company_ai_brief.analyst_summary` (LLM)

### 月次 cron (月初)
- `stocks.index_membership` (TOPIX/JPX400 入替反映)
- `company_ai_brief.owner_activism_json`
- `events` で kind="theme_signal" を月初再評価

### 四半期決算トリガー (TDnet 決算短信を検知 → 当該銘柄のみ走らせる)
- `companies.employees_consolidated`
- `financials_annual` 該当期 INSERT / UPDATE
- `financials_quarterly` 該当四半期 INSERT
- `dividends` 該当期 INSERT
- `stock_snapshot`: `latest_revenue_oku` / `latest_op_profit_oku` / `latest_op_margin` / `dividend_annual` / `dividend_payout_ratio` / `total_return_yield` / `roe` / `peg` / `ev_ebitda` / `valuation_verdict` / `valuation_score`
- `company_ai_brief`: `summary` / `valuation_rationale` / `positioning_*` (LLM再生成)
- `top_shareholders` (有報トリガー = 通常年1-2回)

### 編集判断 (管理画面 / Git PR)
- `companies.description` / `one_liner` / `logo_color`
- `industries.*`
- `story_decks` / `story_slides` (一部企業のみ)
- `posts` / `tags` / `post_tags`
- `events` のうち kind="catalyst" / "risk" (AI で草稿生成→人間が approve)

### 1回きり (初期投入)
- `companies.founded` / `listed` / `headquarters` / `name_en` / `edinet_code`
- `stocks.exchange` / `sector_tse`
- 過去10年の `financials_annual` バックフィル
- 過去10年の `dividends` バックフィル

### イベント駆動 (適時開示の都度)
- `events` kind="buyback" / "guidance_revision" / "earnings_event"
- `predictions.outcome` 判定時

---

## 廃止する `src/content/*.ts`

| ファイル | 廃止後の置き場 |
|---|---|
| `data.ts` (68社モック + AI生成データ) | `companies` / `stocks` / `stock_snapshot` / `company_ai_brief` に分解 |
| `industries.ts` (型定義 + JSON) | `industries` テーブル |
| `themes.ts` (5テーマのキュレーション) | `events` kind="theme_signal" + ピック銘柄は専用 `theme_picks` (将来追加) |
| `predictions.ts` (予想カード) | `predictions` / `prediction_shifts` |
| `posts.ts` (ブログ seed) | `posts` テーブル (既存) |
| `homeHighlights.ts` (トップカードの編集ロジック) | `market_brief.bullets_json` + `events` から動的生成 |

---

## マイグレーション戦略 (実装フェーズ向けメモ)

1. 既存スキーマを全削除して新スキーマでマイグレーション再生成 (旧マイグレーション 0000-0003 は破棄、新 0000 を切る)
2. `scripts/seed-local.ts` を新スキーマ用に書き直す
3. `scripts/refresh-d1.ts` を 「日次 cron」スコープに絞り直す (週次・月次・四半期は別 cron に分割)
4. `src/server/repo/` も新スキーマ用に書き直す
5. `src/server/usecase/listHomeHighlights.ts` 等は `market_brief` 1本と `stock_snapshot` の組み合わせに簡素化
6. `src/app/v2/` のページは型を新スキーマに合わせる

これは本ドキュメントのスコープ外 (別タスク)。
</content>
</invoke>