import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // 本番: Cloudflare R2 のカスタムドメイン
      { protocol: "https", hostname: "kigyo-assets.cho-super.com" },
      // 開発: ローカル MinIO
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
};

// next dev (Node.js ランタイム) でも getCloudflareContext() から D1 等にアクセスできるよう初期化する。
// next build / OpenNext 経由のビルドには影響しない(no-op になる)。
initOpenNextCloudflareForDev();

export default nextConfig;
