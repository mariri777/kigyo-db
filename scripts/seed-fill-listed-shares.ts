#!/usr/bin/env tsx
/**
 * 全銘柄分の最新有報 XBRL を EDINET から取得し、
 * stocks.listed_shares (発行済株式総数) を埋めるバックフィルスクリプト。
 *
 *   pnpm tsx scripts/seed-fill-listed-shares.ts                          # 過去 400 日を discover → process
 *   pnpm tsx scripts/seed-fill-listed-shares.ts --days 800
 *   pnpm tsx scripts/seed-fill-listed-shares.ts --process-only            # discover はせず既 discovered のみ process
 *   pnpm tsx scripts/seed-fill-listed-shares.ts --prime-latest-only       # プライム銘柄 × 最新有報 1 件だけ process (主要銘柄を短時間で)
 *
 * 目的:
 *   Yahoo Finance US API の marketCap が一部銘柄 (株式分割をサイレント未反映なデータ)
 *   で約 4 倍水増しされる問題への対策。発行済株式数を 1 次資料 (EDINET 有報) から取得し、
 *   market_cap_oku は fetch-yahoo-snapshot 側で listed_shares × price で再計算する。
 *
 * 設計:
 *   - 過去 N 日の EDINET 書類一覧 API を順に叩き、有報/四半期/半期 (120/140/160) を
 *     edinet_docs に discovered として INSERT (既存 discoverDate を流用)
 *   - その後 processDiscovered で 1 件ずつ DL → parse → financials_annual / dividends /
 *     companies / stocks(listed_shares) を UPSERT
 *   - EDINET 利用ガイドライン: 5 req/sec を順守するため discover に 220ms sleep
 *
 * 注意 (memory: yahoo-rate-limit-pitfall):
 *   全件埋まらなくても OK。listed_shares が NULL の銘柄は fetch-yahoo 側で Yahoo の
 *   marketCap をフォールバックする。
 */
import { sql } from "drizzle-orm";

import { discoverDate } from "./edinet/discover.js";
import { processDiscovered } from "./edinet/process.js";
import { getLocalDb } from "./lib/d1-local.js";
import { sleep } from "./lib/edinet-api.js";

type Args = {
  days: number;
  processOnly: boolean;
  primeLatestOnly: boolean;
};

function parseArgs(argv: string[]): Args {
  const a = argv.slice(2);
  const out: Args = { days: 400, processOnly: false, primeLatestOnly: false };
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x === "--days") out.days = Number(a[++i]);
    else if (x.startsWith("--days=")) out.days = Number(x.slice("--days=".length));
    else if (x === "--process-only") out.processOnly = true;
    else if (x === "--prime-latest-only") out.primeLatestOnly = true;
    else if (x === "--help" || x === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`未知の引数: ${x}`);
      printHelp();
      process.exit(1);
    }
  }
  if (!Number.isFinite(out.days) || out.days <= 0 || out.days > 1500) {
    throw new Error(`--days は 1..1500 の範囲で指定`);
  }
  return out;
}

function printHelp(): void {
  console.log(`pnpm tsx scripts/seed-fill-listed-shares.ts [options]

stocks.listed_shares を EDINET 有報 XBRL から埋めるバックフィル。

options:
  --days N                  過去 N 日分の書類一覧を discover (default: 400)
  --process-only            discover は skip、既 discovered だけ process
  --prime-latest-only       process 対象を「プライム銘柄 × 最新有報 (doc_type=120) 1 件」に絞る
                            (主要銘柄の marketCap 修正を 1 時間以内に終わらせたい用)
`);
}

function expandDates(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const startedAt = Date.now();

  if (!args.processOnly) {
    const dates = expandDates(args.days);
    console.log(`==> discover ${dates.length} 日分の EDINET 書類一覧`);
    let totalCandidates = 0;
    let totalInserted = 0;
    let dayDone = 0;
    for (const date of dates) {
      try {
        const r = await discoverDate(date);
        totalCandidates += r.candidates;
        totalInserted += r.newlyInserted;
      } catch (e) {
        console.warn(`  ! ${date}: ${(e as Error).message}`);
      }
      dayDone++;
      if (dayDone % 30 === 0) {
        console.log(
          `  ... ${dayDone}/${dates.length} 日処理 (candidates=${totalCandidates}, inserted=${totalInserted})`,
        );
      }
      // EDINET 利用規約 5 req/sec
      await sleep(220);
    }
    console.log(`  ✓ discover 完了: candidates=${totalCandidates}, newly inserted=${totalInserted}`);
  }

  console.log(`\n==> process: discovered な書類を 1 件ずつ DL → parse → UPSERT`);
  if (args.primeLatestOnly) {
    console.log(`    フィルタ: プライム銘柄 × 最新有報 (doc_type=120) 1 件のみ`);
  }
  const beforeFilled = countListedSharesFilled();
  const p = await processDiscovered(
    args.primeLatestOnly
      ? { primeOnly: true, docTypeCodes: ["120"], latestPerSecCode: true }
      : {},
  );
  const afterFilled = countListedSharesFilled();

  console.log(
    `  ✓ process 完了: attempted=${p.attempted}, succeeded=${p.succeeded}, failed=${p.failed}, skipped=${p.skippedNoCompany}`,
  );
  console.log(`\n  📈 listed_shares: ${beforeFilled} → ${afterFilled} (+${afterFilled - beforeFilled})`);

  const elapsedMin = Math.round((Date.now() - startedAt) / 1000 / 60);
  console.log(`\n  所要時間: ${elapsedMin} 分`);
  console.log(`\n  次のステップ:`);
  console.log(`    pnpm pipeline run fetch-yahoo-snapshot     # listed_shares × price で market_cap 再計算`);
  console.log(`    pnpm db:snapshot stock_snapshot            # snapshot 更新`);
  console.log(`    pnpm tsx scripts/dump-tables-to-remote.ts stocks stock_snapshot  # 本番反映`);
}

function countListedSharesFilled(): number {
  const db = getLocalDb();
  const rows = db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM stocks WHERE listed_shares IS NOT NULL`,
  ) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
