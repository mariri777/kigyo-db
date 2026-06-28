import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description: "お探しのページは見つかりませんでした。",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex-1 max-w-2xl mx-auto px-6 py-20 text-center leading-relaxed">
      <p className="text-neutral-500 text-sm tracking-widest mb-4">404</p>
      <h1 className="text-3xl font-bold mb-3">ページが見つかりません</h1>
      <p className="text-neutral-600 mb-10">
        お探しのページは存在しないか、URL が変更されている可能性があります。
      </p>
      <Link
        href="/v2"
        className="text-neutral-900 hover:text-neutral-600 transition font-bold"
      >
        トップへ →
      </Link>
    </main>
  );
}
