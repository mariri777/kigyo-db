// D1 から読み取って表示するテストページ
// 既存の /stocks/7203 は変更せず、こちらは「D1 経由」の動作確認用

import { getDb } from "@/db/client";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";

// このページは「動的レンダリング」にする
// （SSG ではなく、リクエストごとに DB を見に行く）
export const dynamic = "force-dynamic";

export default async function DbTestPage() {
  // ─────────────────────────────────────────────
  // D1 にアクセスする部分
  // ─────────────────────────────────────────────
  const db = getDb();

  // SQL に翻訳すると：SELECT * FROM stocks WHERE code = '7203'
  const result = await db.select().from(stocks).where(eq(stocks.code, "7203"));
  const toyota = result[0];

  // ─────────────────────────────────────────────
  // 表示部分（普通の Next.js のページと同じ）
  // ─────────────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <header className="border-b border-border pb-6 mb-8">
        <p className="text-xs text-dim tracking-wider uppercase mb-2">
          D1 Database Test
        </p>
        <h1 className="text-4xl font-bold">D1 からデータを取得</h1>
        <p className="text-muted mt-2 text-sm">
          このページは <code className="text-xs bg-surface px-1.5 py-0.5 rounded">src/lib/data.ts</code> ではなく、
          Cloudflare D1（実体は手元の SQLite）からデータを読み取って表示しています。
        </p>
      </header>

      {toyota ? (
        <article className="bg-surface border border-border rounded-md p-6">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-sm text-dim">{toyota.code}</span>
            <h2 className="text-2xl font-bold">{toyota.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border border border-border rounded mb-6 overflow-hidden">
            <div className="bg-background p-4">
              <div className="text-[10px] text-dim tracking-wider mb-1">株価</div>
              <div className="font-bold text-xl tabular">
                ¥{toyota.priceJpy.toLocaleString()}
              </div>
            </div>
            <div className="bg-background p-4">
              <div className="text-[10px] text-dim tracking-wider mb-1">時価総額</div>
              <div className="font-bold text-xl tabular">
                {toyota.marketCapOku.toLocaleString()} 億円
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted">
            {toyota.description}
          </p>

          <div className="mt-6 pt-4 border-t border-border text-[11px] text-dim">
            ✅ このデータは D1 から取得されました（ハードコードではありません）
          </div>
        </article>
      ) : (
        <p className="text-muted">データが見つかりませんでした</p>
      )}
    </main>
  );
}
