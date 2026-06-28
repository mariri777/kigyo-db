# AI 推論パイプライン 設計

> `docs/data-design.md` で「AI 生成層」(`company_ai_brief` / `market_brief`) と定めたカラム群を、現実に運用可能な形で半自動投入するパイプラインの設計仕様。実装は `scripts/ai-brief-prepare.ts` / `scripts/ai-brief-apply.ts` / `scripts/lib/ai-tasks/`。

## 背景

データ層(JPX / Yahoo / EDINET) と違い、AI 生成カラムは「外部 API を叩いて決まった値が返る」のではなく「LLM がプロンプトに応じて自由文を返す」もの。そのため次の制約がある:

1. 出力フォーマットが厳密でないと UI が壊れる
2. プロンプトと出力スキーマを並べて管理しないと、列追加時にどこを直すか分からなくなる
3. コストとレートの制約からモデルを切り替えたくなる(Haiku / Sonnet / Opus)
4. 失敗時は「前回値を残す」がデフォルト(空文字が UI に出ない)
5. 全社 3,572 銘柄を毎日呼ぶのは現実的でなく、列ごとに更新頻度を変える必要がある

これを踏まえ、本パイプラインは次の 3 原則で設計する。

---

## 設計の3原則

1. **タスク単位で 1 ファイル** — 入力組立 / プロンプト / 出力スキーマ / DB マッピングを 1 タスク 1 ファイルに閉じる(`scripts/lib/ai-tasks/<task>.ts`)
2. **prepare ↔ apply の分離** — LLM 呼び出しはスクリプトの外。prepare が入力 JSON を吐き、apply は完成した出力 JSON を検証して D1 に書く
3. **冪等な未生成抽出** — `selectTargets` は「未生成 or 古い銘柄」だけを返す。何度叩いても二重に同じ銘柄が出ない

---

## 実行環境とライフサイクル(超重要)

**このパイプラインの prepare / apply はローカル D1 専用**。本番 Cloudflare D1 には書かない。

理由:
- LLM 生成は手作業ループ(人が品質を確認しながら回す)が前提で、本番に直接書き戻すと事故が起きる
- 入力データ(price/financials/peers) もローカル D1 から引いている。本番と差がある状態で生成して本番に書くと整合が壊れる
- ローカル D1 は `seed-local` / `refresh-d1`(将来) / `edinet:daily`(将来) で常に最新化される設計

### ライフサイクル

```
        ┌────────────────────────────────────────┐
        │ 1. ローカル D1 を最新化                  │
        │    pnpm db:seed-local                  │
        │    pnpm edinet:daily(将来)             │
        │    pnpm refresh-d1(価格更新、将来)     │
        └─────────────────┬──────────────────────┘
                          │
                          ▼
        ┌────────────────────────────────────────┐
        │ 2. AI 生成(prepare / apply、本ドキュメント) │
        │    ローカル D1 の company_ai_brief 等を埋める │
        │    1 タスク × 10〜50 銘柄ずつ手作業ループ   │
        └─────────────────┬──────────────────────┘
                          │
                          ▼
        ┌────────────────────────────────────────┐
        │ 3. ローカル D1 → 本番 D1 反映           │
        │    ローカルで作った company_ai_brief 行を │
        │    まとめて本番に SQL 投入(後述)        │
        └────────────────────────────────────────┘
```

### ローカル D1 から本番 D1 への反映方法

現状、AI 生成カラム(`company_ai_brief` / `market_brief.*`)を本番へ反映する自動同期は未実装。手段は 3 つあり、運用安定までは **(A) を手動で**、安定したら **(C) を自動化** が現実解。

| 案 | 方法 | 適している局面 |
|---|---|---|
| **A. ダンプして wrangler で流す** | `sqlite3 <local.sqlite> ".dump company_ai_brief" > tmp/brief.sql` で SQL ダンプ → 不要 DROP/CREATE を消す → `wrangler d1 execute cho-kigyo-db-database --remote --file=tmp/brief.sql` | PoC 段階、生成内容を目視確認してから本番に反映したいとき |
| **B. ローカルから直接 INSERT 文を生成** | apply 時に「D1 INSERT 文を tmp/ に書き出すモード」を追加し、ローカル UPSERT と本番反映用 SQL を同時生成 | apply が安定して、本番反映を毎回バッチで流したいとき |
| **C. AI 生成専用の sync-remote パイプライン** | `scripts/sync-ai-remote.ts` を新規追加。ローカル D1 から `company_ai_brief` / `market_brief` を SELECT → 本番 D1 と差分比較 → UPSERT(`refresh-d1.ts` と同じ思想) | 本番更新が日次化されたとき |

(A) の具体例:

```bash
# 1. ローカルで生成済みの行を SQL ダンプ
LOCAL_SQLITE=$(ls .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite | head -1)
sqlite3 "$LOCAL_SQLITE" ".dump company_ai_brief" > tmp/brief.sql

# 2. ダンプから "CREATE TABLE" 行を除去(本番には既にテーブルがある)
grep -v "^CREATE TABLE" tmp/brief.sql | grep -v "^CREATE INDEX" > tmp/brief-insert-only.sql

# 3. 本番 D1 に流す
pnpm exec wrangler d1 execute cho-kigyo-db-database --remote --file=tmp/brief-insert-only.sql
```

本番側に既存行があると `INSERT` が PK 重複で失敗するため、必要に応じて `DELETE FROM company_ai_brief WHERE company_id IN (...)` を先頭に挿入する。

### なぜ「ローカル D1 → 本番」の手順を分けるか

- **品質確認できる**: ローカルで `pnpm dev` を起動して銘柄ページを開けば、本番に反映する前に生成内容を UI で見られる
- **本番事故の防止**: prepare/apply は無認証で動くので、誤って本番 D1 を壊さない
- **コストとレートの分離**: LLM コストはローカル運用者持ち、本番更新ジョブは確定データのみで完結する

---

## 全体図

```
┌──────────────────────────────────────────────────────────┐
│ ① prepare                                                  │
│                                                            │
│   pnpm db:ai-brief:prepare <task> [--limit N]              │
│     └─ ローカル D1 から未生成 N 件を SELECT                │
│     └─ 必要な前提データ(price/financials/peers...)を集約  │
│     └─ tmp/ai-brief/<task>-YYYYMMDD-HHmm.input.json を出力 │
│                                                            │
│   出力 JSON の中身:                                         │
│     - prompt          : LLM へのシステム指示               │
│     - outputJsonSchema: zod から生成した JSON Schema       │
│     - targets         : [{ key, input }] N 件              │
│     - outputTemplate  : 結果のひな形(キーだけ並ぶ)       │
└────────────────┬───────────────────────────────────────────┘
                 │ (ファイルを Claude Code / Haiku 等に渡す)
                 ▼
┌──────────────────────────────────────────────────────────┐
│ ② LLM 推論(スクリプト外)                                 │
│                                                            │
│   ユーザーが prompt + targets を LLM に投げ、              │
│   { results: [...] } 形式の JSON を受け取って              │
│   tmp/ai-brief/<task>-YYYYMMDD-HHmm.output.json に保存      │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ ③ apply                                                    │
│                                                            │
│   pnpm db:ai-brief:apply <task> --file <output.json>       │
│     └─ results 各要素を zod で検証                         │
│     └─ 検証 OK → applyOne(db, key, output) で UPSERT       │
│     └─ NG → skip(他の銘柄は適用)、失敗ログを出す          │
│                                                            │
│   冪等: 同じ output.json を 2 回流しても破壊的変更なし     │
│   再実行: 失敗銘柄は次回 prepare で再び targets に入る    │
└──────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構成

```
scripts/
├── ai-brief-prepare.ts          # ① 入力 JSON 書き出し(タスク共通)
├── ai-brief-apply.ts            # ③ 出力 JSON 検証 + DB UPSERT(タスク共通)
└── lib/ai-tasks/
    ├── index.ts                 # Task インターフェース + レジストリ
    ├── stock-trend.ts           # 日次:価格動向 + 主因 + テクニカル一言
    ├── valuation.ts             # 四半期:バリュエーション判定 + 根拠
    ├── positioning.ts           # 四半期:業界内ポジショニング
    └── market-brief.ts          # 日次:トップ画面の市況サマリ 1 行
```

タスクを 1 つ追加 = `scripts/lib/ai-tasks/<name>.ts` を 1 ファイル新規作成して `index.ts` の `TASKS` に追加するだけ。prepare/apply には触らない。

---

## Task インターフェース

```ts
export type Task<TInput, TOutput> = {
  name: string;                  // "stock-trend"(CLI 引数)
  description: string;           // 1 行説明
  outputSchema: ZodTypeAny;      // results[] 各要素のスキーマ
  outputSchemaName: string;      // "stock-trend-output"(プロンプト中で参照)
  promptTemplate: string;        // LLM へのシステム指示
  outputTemplate: TOutput;       // ひな形(キーだけ並ぶ)

  // 未生成 or 古い対象 N 件を返す
  selectTargets(db, limit): Promise<Array<{ key: string; input: TInput }>>;

  // 検証済み output 1 件を D1 に書く。throw すればその銘柄だけ skip
  applyOne(db, key, output): Promise<void>;
};
```

純粋オブジェクトの集合なので、unit test しやすく差し替えやすい。

---

## タスクの一覧と書き込み先

| タスク | 更新頻度 | スコープ | 書き込み先 |
|---|---|---|---|
| `stock-trend` | 日次 | トップ N 銘柄 | `company_ai_brief.stock_trend_analysis` / `stock_trend_factors_json` / `technical_comment` |
| `valuation` | 四半期トリガー | 該当銘柄 | `company_ai_brief.valuation_rationale` + `stock_snapshot.valuation_verdict` / `valuation_score` |
| `positioning` | 四半期トリガー | 該当銘柄 | `company_ai_brief.positioning_headline` / `positioning_analysis` / `positioning_strengths_json` / `positioning_challenges_json` |
| `market-brief` | 日次 | 当日 1 行 | `market_brief.lede` / `bullets_json` / `watch_themes_json` / `indices_json` |

未生成判定は `companyAiBrief.<column>` が NULL または `generated_at` が最も古いものを優先。

---

## 使い方(手動オペレーション、ローカル D1 のみ)

前提: `.wrangler/state/v3/d1/...` のローカル D1 が存在し、`seed-local` 等で投入済みであること。

```bash
# 1) 入力 JSON を吐く(ローカル D1 から未生成 10 社を選定)
pnpm db:ai-brief:prepare stock-trend --limit 10
#   → tmp/ai-brief/stock-trend-20260628-1214.input.json

# 2) このファイルを Claude Code / Haiku 等に渡し、results 配列を返してもらう
#    プロンプトと outputJsonSchema が同梱されているので、そのまま渡せばよい
#    結果を tmp/ai-brief/stock-trend-20260628-1214.output.json として保存

# 3) ローカル D1 に反映
pnpm db:ai-brief:apply stock-trend --file tmp/ai-brief/stock-trend-20260628-1214.output.json
#   → results 各要素を zod 検証 → UPSERT → "10 件成功 / 0 件失敗" 等のレポート

# 4) 続きの 10 社を処理したい
pnpm db:ai-brief:prepare stock-trend --limit 10
#   → さきほど書き込んだ 10 社は除外され、次の 10 社が targets になる(冪等)

# 5) UI で確認(ローカル開発サーバ)
pnpm dev
#   → http://localhost:3000/stocks/1301 等で生成テキストが反映されているか確認

# 6) 納得したら本番 D1 へ反映
#   上記「実行環境とライフサイクル」の "ローカル D1 → 本番 D1" 節を参照
```

---

## 入出力 JSON の例(stock-trend)

### `.input.json`

```json
{
  "task": "stock-trend",
  "generatedAt": "2026-06-28T03:14:16.000Z",
  "prompt": "あなたは日本株のエクイティアナリストです。提供される 1 銘柄の価格・テクニカル指標から…",
  "outputSchemaName": "stock-trend-output",
  "outputJsonSchema": { "type": "object", "properties": { "results": { "type": "array", "items": {…} } } },
  "targets": [
    {
      "key": "1301",
      "input": {
        "code": "1301",
        "name": "極洋",
        "sectorTse": "水産・農林業",
        "snapshot": { "priceJpy": 4500, "change1mPct": -2.3, "ma25": 4620, "rsi14": 42.1, … },
        "recentPrices": [{ "date": "2026-05-29", "close": 4520, "volume": 12345 }, …]
      }
    },
    …(N 件)
  ],
  "outputTemplate": { "results": [{ "code": "0000", "stockTrendAnalysis": "", … }] }
}
```

### `.output.json`(LLM が返す形)

```json
{
  "results": [
    {
      "code": "1301",
      "stockTrendAnalysis": "25 日線 4,620 を 2.3% 下回って推移、RSI14 は 42 で過熱なし。…(120-180 字)",
      "stockTrendFactors": [
        { "label": "需給", "value": "信用倍率 3.2x", "note": "個人買い残が積み上がり戻り売り重い" },
        …(4 件)
      ],
      "technicalComment": "MA25 下抜けで短期弱含み、RSI に過熱感はなし。"
    },
    …
  ]
}
```

---

## 失敗時の挙動

| 失敗の種類 | 挙動 |
|---|---|
| LLM の出力が JSON でない | apply 起動時にパース失敗 → `exit 1`(D1 に何も書かない) |
| `results` の 1 要素が zod 不合格 | その要素だけ skip。他の要素は適用。最後にレポート |
| `applyOne` で対応する `companies` 行が無い | その要素だけ skip |
| `prepare` 出力時にデータ不足 | 入力 JSON に NULL のまま入る。プロンプト側で「NULL の指標に触れない」と指示済み |
| 失敗銘柄の救済 | 次回 `prepare` で `companyAiBrief.<列>` が NULL のままなので自動的に再対象 |

---

## モデル選定の指針

タスク × モデルのおすすめ初期値(`docs/strategy.md` のコスト試算を参照):

| タスク | モデル(初期) | 理由 |
|---|---|---|
| `stock-trend` / `market-brief` / `technical_comment` | **Haiku 4.5** | 数値 + テンプレで作れる短文。回数も多い |
| `analyst_summary`(将来追加) | Haiku 4.5 | 外部記事の要約は Haiku の得意領域 |
| `valuation` / `positioning` / `summary`(サービスの顔) | **Sonnet 4.x** | 説得力とインサイトに直結。四半期トリガーで回数少なめ |
| Opus | **使わない** | コスト/品質のリターンが見合わない |

切り替えは現状「ユーザーが LLM 側で選ぶ」運用。将来 API 直叩きを足すなら `scripts/ai-brief-auto.ts` を新規作成し、`task.recommendedModel` を見て分岐する。

---

## 拡張(API 直叩き or 自動化)

現状の半自動を全自動化したくなったら、抽象を壊さず次の追加で済む:

```
scripts/ai-brief-auto.ts            # 新規: prepare → Anthropic API → apply を 1 コマンドに
scripts/lib/llm-providers/
    anthropic.ts                    # @anthropic-ai/sdk ラッパ
    claude-code-stdio.ts            # 既存の半自動(将来後方互換用)
```

`scripts/lib/ai-tasks/<task>.ts` は一切変更不要(入力組立 / プロンプト / 出力スキーマ / DB マッピングはモデル選定と直交)。

API キーは `ANTHROPIC_API_KEY` を `.dev.vars`(ローカル)と GitHub Secrets(CI)で受ける。

---

## GitHub Actions に乗せる場合

`.github/workflows/ai-refresh-daily.yml`(将来):

```yaml
name: ai-refresh-daily
on:
  schedule:
    - cron: "0 20 * * *"   # JST 05:00、refresh-d1 (04:00) の後
  workflow_dispatch:
jobs:
  refresh:
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:ai-brief:auto stock-trend --limit 50      # トップ 50 銘柄
      - run: pnpm db:ai-brief:auto market-brief                # 当日 1 行
```

四半期トリガー系(`valuation` / `positioning`)は EDINET の決算検知パイプラインからキックされる別ジョブで処理する。

---

## 設計上の意思決定ログ

- **CSV を経由しない**: JSON ファイルが LLM とスクリプトの境界。CSV だと配列・ネスト・null の表現が貧弱で zod 検証と相性が悪い。
- **prepare/apply を分けて中間ファイルを残す**: 失敗時のリプレイ / プロンプト改善のための再利用 / 監査ログ。実質コストはディスクの数 MB のみ。
- **zod スキーマを JSON Schema に出力**: LLM に "tool calling 用のスキーマ" として渡せ、出力 fidelity が上がる。`z.toJSONSchema()`(zod 4 標準)。
- **outputTemplate を同梱**: 「キーだけ並んだひな形」を渡すと、LLM がキー欠落しにくい。
- **冪等性は selectTargets で担保**: `apply` 側で「処理済みフラグ」を立てるのではなく、`companyAiBrief.<列>` が NULL かどうかで判定。これでクリーンアップ・再生成のオペレーションが単純化。
- **失敗銘柄は前回値を keep**: applyOne が throw すれば該当銘柄だけ skip。サービスは常に「何かしらの分析」を表示できる。
- **タスクに updated 列管理を持たせない**: スキーマの `generatedAt` は「最後に何かを書いた時刻」だけ。列単位の `_updated_at` を持つとスキーマが膨らみすぎる。再生成判定は「NULL or generatedAt が古い」の 2 段で十分。

---

## 関連ドキュメント

- `docs/data-design.md` — DB スキーマと AI 生成カラムの一覧
- `docs/data-pipeline.md` — EDINET 由来の確定データの取得パイプライン
- `docs/strategy.md` — サービス全体の戦略と AI 品質ポリシー
