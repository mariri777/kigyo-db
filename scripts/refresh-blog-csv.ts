#!/usr/bin/env tsx
// ブログ・管理ユーザー系の CSV を再生成する。
//
// src/content/posts.ts(既存のサンプル記事 Block 形式)から
//   - scripts/seed/posts.csv
//   - scripts/seed/tags.csv
//   - scripts/seed/post_tags.csv
//   - scripts/seed/admin_users.csv
// を生成する。オフライン実行で完結。
//
// 使い方:
//   npm run db:refresh-csv:blog

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCsv } from "./lib/csv.js";
import { blocksToHtml } from "./lib/blogHtml.js";
import { posts as samplePosts } from "./lib/legacyPosts.js";
import { pbkdf2HashSyncForSeed } from "./lib/passwordSeed.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(ROOT, "scripts/seed");

const SEED_ADMIN_EMAIL = "admin@example.com";
const SEED_ADMIN_PASSWORD = "password0";
const SEED_ADMIN_NAME = "編集部";

function main() {
  mkdirSync(SEED_DIR, { recursive: true });

  const createdAt = "2026-01-01T00:00:00.000Z";

  // ─── admin_users.csv ───────────────────────────────
  // seed の決定論性を保つため、固定 salt + 固定 iter で hash を埋め込む。
  // 同じ実装(pbkdf2Hash)を runtime 側 (src/server/auth/password.ts) からも使う。
  const adminHash = pbkdf2HashSyncForSeed(SEED_ADMIN_PASSWORD);
  writeFileSync(
    join(SEED_DIR, "admin_users.csv"),
    buildCsv(
      [
        "id",
        "email",
        "name",
        "password_hash",
        "password_salt",
        "password_iterations",
        "created_at",
        "updated_at",
      ],
      [
        [
          1,
          SEED_ADMIN_EMAIL,
          SEED_ADMIN_NAME,
          adminHash.hashB64,
          adminHash.saltB64,
          adminHash.iterations,
          createdAt,
          createdAt,
        ],
      ],
    ),
  );

  // ─── tags.csv / post_tags.csv ──────────────────────
  // tag = (関連業界 slug + カテゴリラベル) の和集合。
  const tagSlugToId = new Map<string, number>();
  const tagRows: Array<[number, string, string, string]> = [];
  let tagSeq = 0;
  function ensureTag(slug: string, name: string): number {
    let id = tagSlugToId.get(slug);
    if (id != null) return id;
    tagSeq += 1;
    id = tagSeq;
    tagSlugToId.set(slug, id);
    tagRows.push([id, slug, name, createdAt]);
    return id;
  }

  // ─── posts.csv ─────────────────────────────────────
  type PostRow = [
    number, // id
    string, // slug
    string, // title
    string, // lede
    string, // body_html
    string, // category
    string, // status
    string, // author
    number, // read_time_min
    string | null, // fiscal_period
    string, // related_stocks_json
    string, // related_industries_json
    string | null, // published_at
    number | null, // author_user_id
    string, // created_at
    string, // updated_at
  ];

  const postTagRows: Array<[number, number]> = [];
  const postRows: PostRow[] = [];

  // sort: 既存 listPosts と同じ publishedAt 降順 → 古いものから採番されすぎないように
  const sorted = [...samplePosts].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  );

  sorted.forEach((p, idx) => {
    const id = idx + 1;
    const html = blocksToHtml(p.body);
    postRows.push([
      id,
      p.slug,
      p.title,
      p.lede,
      html,
      p.category,
      "published",
      p.author,
      p.readTimeMin,
      p.fiscalPeriod ?? null,
      JSON.stringify(p.relatedStocks),
      JSON.stringify(p.relatedIndustries),
      p.publishedAt,
      1, // 初期管理者
      `${p.publishedAt}T00:00:00.000Z`,
      `${p.publishedAt}T00:00:00.000Z`,
    ]);

    const tagSlugs = new Set<string>();
    // 業界 slug をそのままタグに
    for (const ind of p.relatedIndustries) {
      tagSlugs.add(ind);
    }
    for (const slug of tagSlugs) {
      const tagId = ensureTag(slug, slug);
      postTagRows.push([id, tagId]);
    }
  });

  writeFileSync(
    join(SEED_DIR, "tags.csv"),
    buildCsv(["id", "slug", "name", "created_at"], tagRows),
  );

  writeFileSync(
    join(SEED_DIR, "posts.csv"),
    buildCsv(
      [
        "id",
        "slug",
        "title",
        "lede",
        "body_html",
        "category",
        "status",
        "author",
        "read_time_min",
        "fiscal_period",
        "related_stocks_json",
        "related_industries_json",
        "published_at",
        "author_user_id",
        "created_at",
        "updated_at",
      ],
      postRows,
    ),
  );

  writeFileSync(
    join(SEED_DIR, "post_tags.csv"),
    buildCsv(["post_id", "tag_id"], postTagRows),
  );

  console.log(`✅ ブログ系 CSV 生成完了`);
  console.log(`   admin_users : 1`);
  console.log(`   posts       : ${postRows.length}`);
  console.log(`   tags        : ${tagRows.length}`);
  console.log(`   post_tags   : ${postTagRows.length}`);
}

main();
