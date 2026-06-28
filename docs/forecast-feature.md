# AI World Markets Daily Forecast 仕様

> v2 トップに常設する「AIが世界の翌営業日を毎日真面目に予想する」コーナー。6 時間ごとに更新される。実装は `scripts/tasks/ai/forecast.ts`、表示は `src/app/v2/page.tsx` の `Predictions` セクション。

## コンセプト

**「世界の翌営業日を、AIが毎日真面目に予想する朝刊」**

派手さではなく質と信頼性で習慣化する。Polymarket の UI 言語(確率%、bull/bear、シフト) を借りつつ、語り口は Bloomberg / Reuters の中立アナリスト。AI が過剰に煽らないことが、逆に毎日見たくなる信頼を作る。

### ミッション

- **エンタメ性**: 確率の動きと根拠を時系列で「物語」として読める
- **勉強になる**: マクロ / テクニカル / センチメントの 3 視点を必ず提示
- **毎日来たくなる**: 翌営業日の解決を確認するために朝来る習慣を作る
- **AI 分析が味噌**: ユーザー参加型ではなく「AI がどう考えたか」を観戦する

ユーザーは賭けない。AI が賭ける(=確率を出す)のを観戦する。

---

## MVP スコープ

### 含むもの

1. デイリー予測カードを v2 トップに常時 **2 枚** 表示
2. 6 時間ごとに確率と根拠を更新する自動パイプライン
3. AI の 3 点根拠(マクロ / テクニカル / センチメント) を各カードに添付
4. 直近 24 時間の確率シフトを折れ線で可視化
5. 解決判定は手動運用で開始(自動化は Phase 2)

### なぜ 2 本に絞るか

- **質に集中**: AI に深く考えさせる対象を絞ることで根拠の密度を上げる
- **読み切れる量**: トップに置いた時に視線が散らない、毎朝確認できるサイズ感
- **拡張余地を残す**: MVP で品質を担保してから Phase 2 で本数を増やす

### 含まないもの (Phase 2 以降)

- Track Record タブの自動集計と表示
- AI キャラ化 / 人格演出
- イベント駆動予測(FOMC / 決算前後)
- ウィークリー / マンスリー予測
- 解決判定の自動化
- ユーザー投票・取扱高表示(コアは AI 分析であり、ユーザー参加は当面入れない)

---

## 予測の対象 (MVP 2 本)

世界の基準と日本の主戦場を 1 本ずつ。米国 + 日本で地域を分散しつつ、両方とも株式指数に統一して比較しやすくする。

| # | 指数      | Yahoo Symbol | 解決時刻 (JST)          | 解決定義                  |
|---|-----------|--------------|-------------------------|---------------------------|
| 1 | S&P 500   | `^GSPC`      | 翌日 05:00 (NY 大引け)  | 終値が前日終値より上 / 下 |
| 2 | 日経平均  | `^N225`      | 当日 15:00 (東証大引け) | 同上 (既に取得済)        |

→ 既存の市場指数 4 本に `^GSPC` を追加するだけ。日経は既に毎日取得済み。Phase 2 候補は Nasdaq 100 / Hang Seng / USD/JPY / Bitcoin / DAX / Gold。

---

## UI 仕様

### カード構造

```
┌─────────────────────────────────────┐
│ S&P 500 | 米国指数 | 解決 06/29 05:00 │
├─────────────────────────────────────┤
│ 翌営業日終値は前日比プラスか?         │
│                                     │
│   YES 58%  ████████░░░░░  NO 42%   │
│            ↑ +2pt (6h 前から)       │
│                                     │
│ 📈 マクロ                            │
│   FOMC ハト派的シグナル、利下げ期待   │
│   再燃で株式買い優勢                  │
│ 📊 テクニカル                          │
│   50日線サポート、RSI 54 で中立寄り強気│
│ 💬 センチメント                        │
│   VIX 13 台で楽観、半導体 ETF +1.8%   │
│                                     │
│ ─ 確率シフト ─                       │
│   18時 54% → 0時 56% → 6時 58% ↗   │
└─────────────────────────────────────┘
```

### 配置

- v2 トップの既存 `Predictions()` セクション (`src/app/v2/page.tsx:1076-1100`) を置き換え
- 2 枚を 2 列 (PC) / 1 列 (mobile) で配置
- セクション見出しは「AI Daily Forecast - 世界の翌営業日」(暫定)

### 確率シフトの表示

- 直近 4 ティック(24 時間ぶん) をスパークライン状の折れ線で
- 矢印で +/- の方向と差分を表示("↑ +2pt (6h 前から)")
- 大きく動いた時(±5pt 超)は色を強調

### Bloomberg トーン適用ルール

- カラーは中立寄り(YES が極端な緑 / NO が極端な赤、ではなく落ち着いた色)
- 「絶対」「暴落」「爆上げ」等の煽り語を使わない
- 確率は基本 25-75% レンジに収まる(極端値は重大な根拠がある時のみ)

---

## データ・スキーマ

### 既存テーブルを流用

`schema.ts:530-565` で定義済みの `predictions` と `prediction_shifts` をそのまま使う。新規マイグレーション不要。

#### `predictions` テーブルの使い方

| カラム         | 値                                       |
|----------------|------------------------------------------|
| `id`           | autoincrement                            |
| `code`         | NULL (市場全体の予測なので銘柄ひもづけなし) |
| `category`     | `'global-index'` 固定                    |
| `question`     | "翌営業日の S&P 500 終値は前日比プラスか?" |
| `pickLabel`    | "プラス"                                 |
| `noLabel`      | "マイナス"                               |
| `probability`  | 0-100 整数(YES 側の確率)                 |
| `rationale`    | JSON 文字列 `{macro, technical, sentiment}` |
| `resolveAt`    | ISO 8601 (例 `2026-06-29T05:00:00+09:00`)   |
| `status`       | `'live'` / `'resolved'`                  |
| `outcome`      | 解決後 `'yes'` / `'no'`                  |
| `outcomeAt`    | 解決時刻                                 |
| `volume`       | 未使用 (MVP では空) → Phase 2            |
| `voters`       | 未使用 (MVP では 0)                      |

→ `rationale` を JSON 文字列で持つのは既存スキーマを壊さないため。型は `text` だが中身は `{macro: string, technical: string, sentiment: string}`。

#### 予測の同一性キー

同じ指数の同じ resolveAt は 1 行に upsert する(複製しない)。識別子は `(category, code, resolveAt, symbol_in_rationale)` の組み合わせだが、symbol を別カラムに持たないので、当面は `question` 文字列を完全一致でユニーク化する。

→ Phase 2 で `symbol` カラム追加を検討(マイグレーション必要)。

#### `prediction_shifts` テーブルの使い方

| カラム          | 値                                  |
|-----------------|-------------------------------------|
| `id`            | autoincrement                       |
| `predictionId`  | `predictions.id` への FK            |
| `at`            | ISO 8601 (6h バッチの実行時刻)      |
| `probability`   | その時刻の確率値                    |

→ 6h ごとに 1 行追加。表示時は直近 4 行を取れば 24 時間ぶんの折れ線が描ける。

---

## 実装計画

### Week 1: データ層

#### 1-A. 市場指数の取得対象拡張

ファイル: `scripts/tasks/fetch/market-indices.ts:42-47`

```ts
const INDEX_DEFS = [
  { symbol: "^N225", name: "日経平均", displayOrder: 1 },
  { symbol: "^TOPX", name: "TOPIX", displayOrder: 2 },
  { symbol: "JPY=X", name: "USD/JPY", displayOrder: 3 },
  { symbol: "^SOX", name: "SOX 指数", displayOrder: 4 },
  // ↓ 追加 (forecast 用)
  { symbol: "^GSPC", name: "S&P 500", displayOrder: 5 },
];
```

→ 既存の Yahoo Finance パイプがそのまま使える。動作確認は `pnpm tsx scripts/pipeline.ts fetch-market-indices` で。

#### 1-B. AI 予測タスクのプロトタイプ

ファイル: `scripts/tasks/ai/forecast.ts` (新規)

##### 入力

- 直近 5 営業日ぶんの S&P 500 / 日経平均の `market_indices`(価格と前日比)
- 直近 1 件の `market_brief`(マクロサマリ)
- 既存の `predictions` で未解決のもの(前回確率と比較するため)

##### Claude プロンプト方針

```
あなたは Bloomberg / Reuters 水準の中立的なマクロアナリストです。

以下のデータから、2 本の翌営業日終値の方向性予測を出してください。

【対象】
1. S&P 500 (米国大型株)
2. 日経平均 (日本)

【入力データ】
- 各指数の直近 5 日価格
- 直近の market_brief
- 前回 (6h 前) の予測確率

【禁止】
- 「絶対」「確実」「暴落」「爆上げ」等の煽り語
- 確率の極端値 (25% 未満 / 75% 超) は重大な根拠がある場合のみ
- 数値・データの捏造
- 投資助言と読める文言 ("買い時です" 等)

【出力スキーマ】
{
  predictions: [
    {
      symbol: "^GSPC",
      probability: 58,  // YES 側の確率 (0-100)
      rationale: {
        macro: "60-100 字",
        technical: "60-100 字",
        sentiment: "60-100 字"
      },
      confidence_note: "任意。自信の高低を一言"
    },
    ...
  ]
}

前回の確率と大きく違う値を出す場合は、変化の理由が rationale に
反映されるよう書いてください。
```

##### 出力後の処理

1. 各 prediction について、`(symbol, resolveAt)` で既存行を探す
2. あれば `probability` / `rationale` を update、なければ insert
3. `prediction_shifts` に新行を追加(`predictionId`, 現在時刻, 新確率)
4. 解決時刻を過ぎたものは `status = 'resolved'` に変更(MVP では outcome は手動)

##### モデル選択

- 既存の AI Runner (`scripts/lib/ai-runner.ts`) を流用
- モデルは Claude Opus 4.7 (品質優先、6h に 1 回しか叩かないのでコストは低い)
- 失敗時は前回値を残す(`market-brief` と同じ振る舞い)

### Week 2: 表示層と本番化

#### 2-A. v2 ページの差し替え

ファイル: `src/app/v2/page.tsx`

- `PREDICTIONS` 配列 (186-265 行) のハードコードを削除
- `Predictions()` (1076-1100 行) を async server component 化
- D1 から `predictions` + `prediction_shifts` を読み出す
- `PredictionCard` (1133-1210 行) を新スキーマに合わせて改修:
  - `rationale` JSON を 3 ブロック (macro/technical/sentiment) で表示
  - `prediction_shifts` 直近 4 行から折れ線とシフト矢印を生成
  - `volume` / `voters` の表示は MVP では非表示

#### 2-B. スケジュール組み込み

ファイル: `scripts/lib/schedule.ts`

```ts
{ task: "ai-forecast", frequency: "every-6h" },
```

ファイル: `.github/workflows/pipeline-6h.yml` (新規)

```yaml
on:
  schedule:
    - cron: "0 */6 * * *"  # UTC 0/6/12/18 = JST 9/15/21/3
  workflow_dispatch:
```

→ 主要市場のクローズ前後と噛み合うように:
- JST 09 時(東証寄り付き直前)
- JST 15 時(東証大引け直後)
- JST 21 時(欧州前場)
- JST 03 時(NY 終了間際)

#### 2-C. Dry run と本番化

1. ローカルで `pnpm tsx scripts/pipeline.ts ai-forecast` を 3 回手動実行し、出力の品質を確認
2. プロンプトを微調整(根拠の文体・確率の振れ方)
3. GitHub Actions を有効化し、3 日間 dry run(本番 D1 への書き込みあり、表示は staging)
4. 品質に問題なければ v2 トップを切り替え

---

## 品質の見方

毎日チェックする観点(運用開始後):

| 観点                | 何を見るか                                            |
|---------------------|-------------------------------------------------------|
| 根拠の事実性        | 数値が捏造でない、市場ニュースと整合する              |
| 確率の妥当性        | 極端な値が頻発していない、根拠と数値が噛み合っている  |
| トーン              | 煽り語・投資助言と読める言い回しが出ていない          |
| シフトの自然さ      | 6h で大きく動く時に必ず根拠の変化が rationale にある  |
| 解決精度            | 翌日の実績と AI の方向性が大きくずれていない          |

→ Phase 2 で track record タブを作る時は、この観点を自動集計する。

---

## Phase 2 以降の検討事項

優先順位順:

1. **解決判定の自動化**: 6h cron の冒頭で resolveAt を過ぎた行を市場データと突合
2. **Track Record タブ**: カテゴリ別 / 時間軸別の AI 的中率ダッシュボード
3. **イベント駆動予測**: FOMC / 日銀 / 主要決算の前後に動的に追加する予測カード
4. **指数の拡張**: DAX / FTSE / Gold / WTI / ETH を追加
5. **AI キャラ化**: 予測ごとに一言コメント、シフト時の物語化
6. **`symbol` カラムを `predictions` に追加**: 同一性キーを文字列マッチから symbol マッチへ
7. **ユーザー投票**: 「自分はどう思うか」の参加要素(コアの AI 分析は維持)
