-- 管理画面 (ログイン) + ブログ機能の追加マイグレーション。
-- 既存テーブル(companies, stocks, ...)には影響しない。
-- seed (npm run db:seed) で admin_users + posts + tags + post_tags が
-- まとめて投入される。

-- ─── admin_users ────────────────────────────────────────

CREATE TABLE `admin_users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `name` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `password_iterations` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX `uq_admin_users_email` ON `admin_users` (`email`);

-- ─── admin_sessions ─────────────────────────────────────

CREATE TABLE `admin_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` integer NOT NULL,
  `created_at` text NOT NULL,
  `expires_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_admin_sessions_expires` ON `admin_sessions` (`expires_at`);
CREATE INDEX `idx_admin_sessions_user_id` ON `admin_sessions` (`user_id`);

-- ─── posts (ブログ記事) ─────────────────────────────────

CREATE TABLE `posts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `lede` text NOT NULL,
  `body_html` text NOT NULL,
  `category` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `author` text NOT NULL DEFAULT 'editor',
  `read_time_min` integer NOT NULL DEFAULT 3,
  `fiscal_period` text,
  `related_stocks_json` text NOT NULL DEFAULT '[]',
  `related_industries_json` text NOT NULL DEFAULT '[]',
  `published_at` text,
  `author_user_id` integer,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`author_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `uq_posts_slug` ON `posts` (`slug`);
CREATE INDEX `idx_posts_status_published_at` ON `posts` (`status`, `published_at`);
CREATE INDEX `idx_posts_category` ON `posts` (`category`);

-- ─── tags + post_tags ──────────────────────────────────

CREATE TABLE `tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE UNIQUE INDEX `uq_tags_slug` ON `tags` (`slug`);

CREATE TABLE `post_tags` (
  `post_id` integer NOT NULL,
  `tag_id` integer NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_post_tags_tag_id` ON `post_tags` (`tag_id`);
