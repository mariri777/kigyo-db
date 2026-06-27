#!/usr/bin/env tsx
// scripts/seed/*.csv を最新化するスナップショットスクリプト(手動実行)。
//
// 本番更新(refresh-d1.ts)は CSV を経由しないので、これは「ローカル開発で
// pnpm db:seed-local したときに入る初期データ」をリフレッシュしたいときだけ叩く。
// JPX + Yahoo を取得するためオンライン必須。CI からは呼ばれない。
//
// 使い方:
//   pnpm db:snapshot

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAllRows,
  emptyIdSeed,
  fetchExternal,
  overlayCodes,
  summarize,
} from "./lib/buildRows.js";
import { buildCsv } from "./lib/csv.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");

async function main() {
  mkdirSync(SEED_DIR, { recursive: true });

  const chartCodes = await overlayCodes();
  const external = await fetchExternal({ chartCodes });
  const rows = await buildAllRows(external, emptyIdSeed());
  console.log(`✅ 行組み立て完了:\n   ${summarize(rows)}`);

  // 各テーブルを CSV に書き出す。カラム順は schema と DB 上の見やすさに合わせる。
  type CsvCell = string | number | boolean | null | undefined;
  const writes: Array<[string, string[], CsvCell[][]]> = [
    [
      "companies.csv",
      ["id", "name", "name_en", "description", "one_liner", "edinet_code", "created_at", "updated_at"],
      rows.companies.map((c) => [
        c.id,
        c.name,
        c.name_en,
        c.description,
        c.one_liner,
        c.edinet_code,
        c.created_at,
        c.updated_at,
      ]),
    ],
    [
      "stocks.csv",
      [
        "code",
        "company_id",
        "exchange",
        "sector_tse",
        "price_jpy",
        "price_date",
        "change_pct",
        "market_cap_oku",
        "per",
        "pbr",
        "dividend_yield",
        "updated_at",
      ],
      rows.stocks.map((s) => [
        s.code,
        s.company_id,
        s.exchange,
        s.sector_tse,
        s.price_jpy,
        s.price_date,
        s.change_pct,
        s.market_cap_oku,
        s.per,
        s.pbr,
        s.dividend_yield,
        s.updated_at,
      ]),
    ],
    [
      "stock_prices_daily.csv",
      ["code", "date", "open", "high", "low", "close", "volume", "adj_close"],
      rows.stock_prices_daily.map((p) => [
        p.code,
        p.date,
        p.open,
        p.high,
        p.low,
        p.close,
        p.volume,
        p.adj_close,
      ]),
    ],
    [
      "sources.csv",
      ["id", "doc", "page", "period", "url"],
      rows.sources.map((s) => [s.id, s.doc, s.page, s.period, s.url]),
    ],
    [
      "industries.csv",
      [
        "slug",
        "name",
        "short_name",
        "description",
        "theme_2025_json",
        "market_scale_headline",
        "market_scale_growth",
        "market_scale_breakdown",
        "chain_columns_json",
        "competitive_structure_json",
        "key_kpis_json",
        "industry_insights_json",
      ],
      rows.industries.map((i) => [
        i.slug,
        i.name,
        i.short_name,
        i.description,
        i.theme_2025_json,
        i.market_scale_headline,
        i.market_scale_growth,
        i.market_scale_breakdown,
        i.chain_columns_json,
        i.competitive_structure_json,
        i.key_kpis_json,
        i.industry_insights_json,
      ]),
    ],
    [
      "industry_clusters.csv",
      ["id", "industry_slug", "key", "name", "role", "position"],
      rows.industry_clusters.map((c) => [c.id, c.industry_slug, c.key, c.name, c.role, c.position]),
    ],
    [
      "company_industry_clusters.csv",
      ["company_id", "industry_cluster_id"],
      rows.company_industry_clusters.map((r) => [r.company_id, r.industry_cluster_id]),
    ],
    [
      "business_tags.csv",
      ["company_id", "dimension", "value", "source_id"],
      rows.business_tags.map((b) => [b.company_id, b.dimension, b.value, b.source_id]),
    ],
    [
      "company_segments.csv",
      ["company_id", "period", "name", "revenue_oku", "share", "operating_margin", "source_id"],
      rows.company_segments.map((s) => [
        s.company_id,
        s.period,
        s.name,
        s.revenue_oku,
        s.share,
        s.operating_margin,
        s.source_id,
      ]),
    ],
    [
      "company_insights.csv",
      ["id", "company_id", "title", "lede", "body", "generated_at"],
      rows.company_insights.map((i) => [
        i.id,
        i.company_id,
        i.title,
        i.lede,
        i.body,
        i.generated_at,
      ]),
    ],
    [
      "insight_sources.csv",
      ["insight_id", "source_id"],
      rows.insight_sources.map((r) => [r.insight_id, r.source_id]),
    ],
    [
      "company_phase_scores.csv",
      ["company_id", "launch", "expansion", "mature", "decline", "rationale", "updated_at"],
      rows.company_phase_scores.map((p) => [
        p.company_id,
        p.launch,
        p.expansion,
        p.mature,
        p.decline,
        p.rationale,
        p.updated_at,
      ]),
    ],
    [
      "company_factor_betas.csv",
      [
        "company_id",
        "usdjpy",
        "us10y",
        "oil",
        "sox",
        "china",
        "market",
        "size",
        "value",
        "momentum",
        "period",
      ],
      rows.company_factor_betas.map((f) => [
        f.company_id,
        f.usdjpy,
        f.us10y,
        f.oil,
        f.sox,
        f.china,
        f.market,
        f.size,
        f.value,
        f.momentum,
        f.period,
      ]),
    ],
    [
      "company_valuation_calls.csv",
      ["company_id", "verdict", "score", "rationale", "updated_at"],
      rows.company_valuation_calls.map((v) => [
        v.company_id,
        v.verdict,
        v.score,
        v.rationale,
        v.updated_at,
      ]),
    ],
    [
      "valuation_sources.csv",
      ["company_id", "source_id"],
      rows.valuation_sources.map((v) => [v.company_id, v.source_id]),
    ],
  ];

  for (const [name, header, values] of writes) {
    writeFileSync(join(SEED_DIR, name), buildCsv(header, values));
  }
  console.log(`✅ scripts/seed/ に ${writes.length} ファイルを書き出しました`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
