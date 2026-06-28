# EDINET XBRL データ収集パイプライン 設計

> 本ドキュメントは、`docs/data-design.md` で1次ソースに定めた **EDINET XBRL** を、現実に運用可能な形で日次収集 → R2 保存 → D1 反映するパイプラインの設計仕様。実装の唯一の参照点。

## 背景

「3,800 社 × 日次 fetch」は EDINET 運用と整合しない:
- EDINET は提出があった日にしか書類が登録されない
- 3,800 社が同日に決算を出すことはない (四半期ごとに分散提出)
- 書類取得 API は 1 件 ZIP 2MB 前後 = 3,800社×日次 = 7GB/日 で破綻

PoC (`scripts/poc/edinet-test.ts`) で実証された事実:
1. 書類一覧 API は 1 日 1 リクエストで全社全書類が返る (date 単位、小さい JSON)
2. 書類取得 API は docID 単位、ZIP で 2MB 前後 (例: トヨタ第122期 有報)
3. ZIP 内のメイン XBRL は 8.5MB、`jppfs_cor:NetSales` 等で売上高・営業利益が機械的に取れる
4. ただし context (前期/当期/連結個別) を見ないと値の意味が混ざる
5. EPS 等の一部タグは「なし」になる — 名前空間 (jppfs / jpcrp / jpigp(IFRS)) を会計基準別に切り替える必要

---

## 設計の3原則

1. **イベント駆動** — 「全社を毎日 fetch」ではなく **「その日に提出された書類だけ fetch」**
2. **2段スループ** — fetch (生 XBRL を R2 に置く) と parse (XBRL → D1) を分離。parse 失敗時に再パースできる
3. **増分 + 安全弁** — 日次は前日分だけ。取りこぼしは「週次補修ジョブ」と「初回バックフィル」で補う

---

## 全体図

```
┌──────────────────────────────────────────────────────────┐
│ GitHub Actions cron (JST 06:00) — 日次パイプライン        │
│                                                              │
│  Step 1. discover    書類一覧 API で前日提出書類を fetch     │
│           └─ 新規 docID を edinet_docs へ INSERT (D1)        │
│  Step 2. download    各 docID の ZIP を書類取得 API で取得   │
│           └─ R2 (raw/<year>/<edinet>/<docID>.zip) へ put    │
│  Step 3. extract     ZIP 展開 → メイン XBRL を R2 へ put     │
│           └─ R2 (xbrl/<year>/<edinet>/<docID>.xbrl)         │
│  Step 4. parse       XBRL を軽量マッパーで主要数値抽出        │
│           └─ D1 financials_annual / quarterly / dividends   │
│           └─ D1 stock_snapshot.latest_* 等 UPDATE          │
│  Step 5. derive      AI 評価 / バリュエーション 再生成       │
│           └─ company_ai_brief.valuation_* 等 UPDATE (LLM)   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GitHub Actions cron (土曜) — 補修ジョブ                    │
│  過去 8 日分を再 discover、漏れた docID を回収              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 1 回きり — 初期バックフィル (workflow_dispatch)             │
│  直近 365 日分の書類一覧をスキャン → 対象 docID 全部回収     │
└──────────────────────────────────────────────────────────┘
```

---

## ストレージ設計

### Cloudflare R2 (生データ)

**バケット**: `cho-kigyo-db-edinet-raw`

**ディレクトリ構成**:
```
raw/
  <yyyy>/                  ← 提出年
    <edinetCode>/          ← E02144 (トヨタ)
      <docID>.zip          ← 2MB 前後
xbrl/
  <yyyy>/
    <edinetCode>/
      <docID>.xbrl         ← 8MB 前後、メインのみ (Audit は捨てる)
```

**MVP 初期保存期間**: 直近 1 年分。それ以上は後から R2 lifecycle で拡張。

**サイズ見積もり**:
- 有報: 約3,000社 × 2MB = 6GB
- 四半期報告: 約3,000社 × 3本 × 1.5MB = 14GB
- 合計: 約20GB
- R2 コスト: $0.015/GB × 20GB ≈ $0.30/月

### Cloudflare D1 (構造化データ)

`docs/data-design.md` の `financials_annual` / `financials_quarterly` / `dividends` / `top_shareholders` / `stock_snapshot` に書き込む。これに加えてパイプライン管理用テーブル 1 本:

#### edinet_docs — fetch 状態管理
| カラム | 型 | 備考 |
|---|---|---|
| doc_id | text PK | "S100Y8NY" |
| edinet_code | text | "E02144" |
| sec_code | text nullable | "72030" (上場銘柄のみ) |
| doc_type_code | text | "120"=有報 / "140"=四半期 / "160"=半期 |
| period_start | text | YYYY-MM-DD |
| period_end | text | YYYY-MM-DD |
| submit_date | text | YYYY-MM-DD |
| fetch_status | text | "discovered" / "downloaded" / "parsed" / "failed" |
| failed_reason | text nullable | parse 失敗時の理由 |
| r2_zip_key | text nullable | "raw/2026/E02144/S100Y8NY.zip" |
| r2_xbrl_key | text nullable | "xbrl/2026/E02144/S100Y8NY.xbrl" |
| discovered_at | text | |
| updated_at | text | |

**インデックス**: `(fetch_status)`, `(sec_code, doc_type_code)`

**冪等性**: doc_id を PK にして同じ docID を二重 fetch しない。再 discover は `ON CONFLICT DO NOTHING`。

---

## パイプライン詳細 (5 ステップ)

### Step 1. discover (書類一覧 API)

**入力**: 日付 (前日)
**出力**: 新規 docID を `edinet_docs` に INSERT

```ts
const date = yesterday(); // YYYY-MM-DD
const url = `https://api.edinet-fsa.go.jp/api/v2/documents.json?date=${date}&type=2&Subscription-Key=${EDINET_API_KEY}`;
const { results } = await fetch(url).then((r) => r.json());

for (const doc of results) {
  if (!["120", "140", "160"].includes(doc.docTypeCode)) continue;
  if (doc.xbrlFlag !== "1") continue;
  if (doc.secCode == null) continue; // 上場銘柄のみ

  await db.insert(edinetDocs).values({...}).onConflictDoNothing();
}
```

**レート**: 1 日 1 リクエストで完結 (全社全書類のメタが1JSONで返る)。

### Step 2. download (書類取得 API)

**入力**: `edinet_docs WHERE fetch_status='discovered'`
**出力**: ZIP を R2 に put + `fetch_status='downloaded'`

```ts
for (const doc of pending) {
  const zipUrl = `https://api.edinet-fsa.go.jp/api/v2/documents/${doc.docId}?type=1&Subscription-Key=${EDINET_API_KEY}`;
  const zipBuf = await fetch(zipUrl).then((r) => r.arrayBuffer());
  const r2Key = `raw/${doc.submitDate.slice(0,4)}/${doc.edinetCode}/${doc.docId}.zip`;
  await r2Put(r2Key, zipBuf);
  await db.update(edinetDocs).set({fetchStatus: "downloaded", r2ZipKey: r2Key}).where(...)
  await sleep(200); // throttle
}
```

**1日のボリューム**: 平均 10〜30 件、ピーク日 (5/8/11/2 月) 約200件。

### Step 3. extract (ZIP → XBRL)

**入力**: `edinet_docs WHERE fetch_status='downloaded'`
**出力**: メイン XBRL を R2 に put

メイン XBRL = `PublicDoc/jpcrp030000-asr-*.xbrl` (有報) / `jpcrp040300-q*-*.xbrl` (四半期)。Audit XBRL は捨てる。

### Step 4. parse (XBRL → D1)

**入力**: `edinet_docs WHERE r2_xbrl_key IS NOT NULL`
**出力**: `financials_annual` / `dividends` / `stock_snapshot` に UPSERT + `fetch_status='parsed'`

**XBRL 軽量パーサ**:
1. `fast-xml-parser` で XBRL XML をパース
2. `<xbrli:context>` 配下の period/scenario を ID→属性のマップに
3. 関心タグを引き、context を見て (当期/前期/連結/個別/予想) を判別
4. `financials_annual` 等にマッピング

**会計基準別タグマッピング** (一部):

| 画面で見せる値 | 日本基準 | IFRS |
|---|---|---|
| 売上高 | `jppfs_cor:NetSales` | `jpigp_cor:RevenueIFRS` |
| 営業利益 | `jppfs_cor:OperatingIncome` | `jpigp_cor:OperatingProfitLossIFRS` |
| 経常利益 | `jppfs_cor:OrdinaryIncome` | (該当なし) |
| 当期純利益 | `jppfs_cor:ProfitLossAttributableToOwnersOfParent` | `jpigp_cor:ProfitLossAttributableToOwnersOfParentIFRS` |
| EPS (有報のみ) | `jpcrp_cor:BasicEarningsLossPerShareSummaryOfBusinessResults` | `jpcrp_cor:BasicEarningsLossPerShareIFRSSummaryOfBusinessResults` |
| 年間配当 (有報のみ) | `jpcrp_cor:DividendPaidPerShareSummaryOfBusinessResults` | 同左 |
| 従業員数 (有報のみ) | `jpcrp_cor:NumberOfEmployees` | 同左 |

完全な表は `scripts/lib/edinet-tags.ts` に表として持つ (実装時)。

**IFRS 判定**: `<jpdei_cor:AccountingStandardsDEI>` で "Japan GAAP" / "IFRS" / "US GAAP" を判別。

**初期実装の対象**:
- `financials_annual` (1 有報で過去 5 期の SummaryOfBusinessResults が同梱されているので一気に埋まる)
- `dividends` (同上)
- `companies.employees_consolidated` UPDATE
- `stock_snapshot.latest_*` UPDATE
- `financials_quarterly` / `top_shareholders` は次フェーズ

### Step 5. derive (LLM 再生成)

**入力**: parse で新規データが入った company_id のリスト
**出力**: `company_ai_brief.summary` / `valuation_rationale` / `positioning_*` の再生成

ローカル試走では skip 可 (--no-derive オプション)。

---

## 補修ジョブ (週次 cron)

- 過去 8 日分の `documents.json` を再 discover (`ON CONFLICT DO NOTHING`)
- `fetch_status='failed'` または `discovered で 24h 経過` の docID を Step 2-4 で再処理
- 1 週間以上 `failed` が残る docID は手動調査対象として通知

---

## 初回バックフィル (1 回きり、workflow_dispatch)

- 366 日分の `documents.json` をスキャン (366 リクエスト)
- 対象 docID を `edinet_docs` に INSERT (約 3,000〜6,000 件)
- Step 2-4 をバッチ実行 (約 6,000 ZIP = 12GB, 所要 6,000 × 0.5秒 = 約 1 時間)
- GitHub Actions の 6 時間制限内に余裕で収まる

---

## 失敗モード対応

| 失敗 | 対応 |
|---|---|
| EDINET API 5xx | リトライ (3回)、それでも失敗なら `failed` 記録 → 補修ジョブ |
| ZIP に PublicDoc XBRL がない | `failed_reason='no PublicDoc xbrl'` 記録 |
| 未知の会計基準 (米国基準等) | `failed_reason='unknown accounting standard'`。マッピング表追加で再 parse |
| XBRL タグ変更 | parse はゼロ値で通過、決算後に sanity check |
| R2 put 失敗 | リトライ + 補修ジョブ |
| API キー失効 | discover で 401 → 即停止 → 通知 |

---

## 既存 cron との関係

- `refresh-d1.yml` (JST 04:00) — 価格・指数 (Yahoo) ※既存維持
- `edinet-daily.yml` (JST 06:00) — EDINET 書類 fetch (前日分) ※新規
- `edinet-weekly.yml` (土曜) — 補修 ※新規
- `edinet-backfill.yml` (workflow_dispatch) — 初回 ※新規

依存関係: `edinet-daily` は `companies` テーブルが存在する前提 (refresh-d1 が先に走るか、独立して既に投入済み)。

---

## 実装ファイル構成

```
scripts/
  edinet/
    discover.ts     ← Step 1
    download.ts     ← Step 2
    extract.ts      ← Step 3
    parse.ts        ← Step 4
    derive.ts       ← Step 5
    daily.ts        ← 5 ステップ順に呼ぶエントリ
    backfill.ts     ← 初回バックフィル
    repair.ts       ← 週次補修
  lib/
    edinet-api.ts   ← API クライアント (fetch + retry + throttle)
    edinet-tags.ts  ← タグマッピング表 (会計基準別)
    edinet-parser.ts← XBRL → 値の抽出ロジック
    r2.ts           ← R2 put/get (ローカルは tmp/edinet-raw/ で代替)
.github/workflows/
  edinet-daily.yml
  edinet-weekly.yml
  edinet-backfill.yml
```

---

## 環境変数

```
EDINET_API_KEY=...                      ← .env.local に設定 (現在 typo: EDITNET_API_KEY)
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=cho-kigyo-db-edinet-raw
CLOUDFLARE_API_TOKEN=...                ← 既存
CLOUDFLARE_ACCOUNT_ID=...               ← 既存
```

---

## 規模感 (PoC ベース)

| 指標 | 値 |
|---|---|
| 日次 fetch 対象 (平均) | 10〜30 件 |
| 日次 fetch 対象 (決算ピーク) | 約 200 件 |
| 1 ジョブ所要 (ピーク日) | 約 2-3 分 |
| R2 月間 PUT 数 | 12,000 ($0.054/月) |
| R2 ストレージ (1年) | 約 20GB ($0.30/月) |
| 初回バックフィル所要 | 約 1 時間 |
| GitHub Actions 月間消費 | 約 270 分 (無料枠内) |

**結論**: 月 100 円以内で 3,800 社の EDINET XBRL を継続的に取り込める。3,800社「日次」は意味がなく、**提出ベース日次**が正しい設計。

---

## ローカル試走計画

GitHub Actions に乗せる前にローカル試走。

```bash
# 1. ローカル D1 リセット
pnpm db:reset-local

# 2. EDINET 1 日分試走
pnpm tsx scripts/edinet/daily.ts --date 2026-06-25 --target local --no-derive

# 3. /v2 でレンダ確認
pnpm dev
# → http://localhost:3000/v2/stocks/<試走で取れた銘柄コード>
```

ローカル試走時の R2 代替: `tmp/edinet-raw/` をファイルシステム上の擬似 R2 として扱う (R2 抽象でローカル/リモートを切り替え)。

詳細手順は別途 `tmp/edinet-poc-report.md` に試走後ログを残す。

---

## 関連ドキュメント

- [`docs/data-design.md`](./data-design.md) — D1 スキーマと更新頻度の設計仕様
