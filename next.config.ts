import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

// next dev (Node.js ランタイム) でも getCloudflareContext() から D1 等にアクセスできるよう初期化する。
// next build / OpenNext 経由のビルドには影響しない(no-op になる)。
initOpenNextCloudflareForDev();

export default nextConfig;
