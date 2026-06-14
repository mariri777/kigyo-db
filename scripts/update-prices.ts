#!/usr/bin/env tsx
// 株価の週次更新スクリプト(data.ts 直接書き換え)
//
// 注意:
//   本プロジェクトは現在 D1 への移行中。新しい seed/price 更新パイプラインは
//   scripts/seed-stocks.ts と Workers Cron(将来追加)に移る予定。
//   このスクリプトは data.ts に株価を直書きする旧運用で、移行が完了するまでの暫定。
//
// 使い方:
//   npm run prices:template
//     → data/prices.csv を現在の株価で生成(これを編集する)
//
//   npm run prices:apply -- --date 2026-06-12
//     → CSV の株価を src/lib/data.ts に反映する。
//       時価総額・PER・PBR・配当利回り・前回比は自動で再計算。
//       前回比 ±20% を超える銘柄は入力ミスの可能性があるため
//       警告して止まる(本当に正しければ --force で適用)。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_TS = join(ROOT, "src/lib/data.ts");
const CSV_PATH = join(ROOT, "data/prices.csv");

type StockBlock = {
  code: string;
  start: number;
  end: number;
};

type CsvRow = {
  code: string;
  name: string;
  price: number;
};

// ---------- data.ts のパース ----------

function loadStockBlocks(): { src: string; blocks: StockBlock[] } {
  const src = readFileSync(DATA_TS, "utf8");
  const re = /^\s+code: "(\d{4}[A-Z]?)",$/gm;
  const marks: { code: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) marks.push({ code: m[1], start: m.index });
  const blocks: StockBlock[] = marks.map((mark, i) => ({
    code: mark.code,
    start: mark.start,
    end: i + 1 < marks.length ? marks[i + 1].start : src.length,
  }));
  return { src, blocks };
}

function fieldNum(segment: string, name: string): number {
  const m = segment.match(new RegExp(`${name}: (-?[\\d.]+),`));
  if (!m) throw new Error(`フィールド ${name} が見つかりません`);
  return parseFloat(m[1]);
}

function fieldStr(segment: string, name: string): string {
  const m = segment.match(new RegExp(`${name}: "([^"]*)"`));
  if (!m) throw new Error(`フィールド ${name} が見つかりません`);
  return m[1];
}

// ---------- template: CSV の生成 ----------

function cmdTemplate(): void {
  const { src, blocks } = loadStockBlocks();
  const rows = blocks.map(({ code, start, end }) => {
    const seg = src.slice(start, end);
    return `${code},${fieldStr(seg, "name")},${fieldNum(seg, "priceJpy")}`;
  });
  mkdirSync(dirname(CSV_PATH), { recursive: true });
  const header = [
    "# 超!企業DB 株価更新シート",
    "# price 列を最新の終値(円)に書き換えて、以下を実行:",
    "#   npm run prices:apply -- --date YYYY-MM-DD",
    "code,name,price",
  ].join("\n");
  writeFileSync(CSV_PATH, header + "\n" + rows.join("\n") + "\n");
  console.log(`✅ ${CSV_PATH} を生成(${rows.length} 銘柄、現在値入り)`);
}

// ---------- apply: CSV → data.ts 反映 ----------

function parseCsv(): CsvRow[] {
  if (!existsSync(CSV_PATH)) {
    console.error("❌ data/prices.csv がありません。先に template を実行してください。");
    process.exit(1);
  }
  const rows: CsvRow[] = [];
  for (const line of readFileSync(CSV_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("code,")) continue;
    const [code, name, priceRaw] = t.split(",").map((s) => s.trim());
    const price = Number(priceRaw);
    if (!code || !Number.isFinite(price) || price <= 0) {
      console.error(`❌ CSV の行が不正です: "${line}"`);
      process.exit(1);
    }
    rows.push({ code, name, price });
  }
  return rows;
}

function replaceOnce(
  segment: string,
  regex: RegExp,
  replacement: string,
  label: string,
  code: string,
): string {
  const matches = segment.match(new RegExp(regex.source, regex.flags + "g"));
  if (!matches || matches.length !== 1) {
    throw new Error(
      `${code}: ${label} の置換位置が一意に特定できません(${matches?.length ?? 0} 件)`,
    );
  }
  return segment.replace(regex, replacement);
}

type Change = CsvRow & { oldPrice: number; pct: number };

function cmdApply(args: string[]): void {
  const dateIdx = args.indexOf("--date");
  const date = dateIdx >= 0 ? args[dateIdx + 1] : null;
  const force = args.includes("--force");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("❌ --date YYYY-MM-DD(株価の基準日)を指定してください。");
    process.exit(1);
  }

  const rows = parseCsv();
  const loaded = loadStockBlocks();
  let src = loaded.src;
  const blocks = loaded.blocks;
  const byCode = new Map(blocks.map((b) => [b.code, b]));

  // 事前チェック:CSV に知らない銘柄コードがないか
  const unknown = rows.filter((r) => !byCode.has(r.code));
  if (unknown.length) {
    console.error(`❌ data.ts に存在しないコード: ${unknown.map((r) => r.code).join(", ")}`);
    process.exit(1);
  }

  // 事前チェック:変動率の異常検知(入力ミス防止)
  const changes: Change[] = rows.map((r) => {
    const b = byCode.get(r.code)!;
    const seg = src.slice(b.start, b.end);
    const oldPrice = fieldNum(seg, "priceJpy");
    const pct = ((r.price - oldPrice) / oldPrice) * 100;
    return { ...r, oldPrice, pct };
  });
  const suspicious = changes.filter((c) => Math.abs(c.pct) > 20);
  if (suspicious.length && !force) {
    console.error("⚠️  前回比 ±20% を超える銘柄があります(入力ミスでないか確認を):");
    for (const s of suspicious) {
      console.error(
        `   ${s.code} ${s.name}: ${s.oldPrice} → ${s.price} (${s.pct.toFixed(1)}%)`,
      );
    }
    console.error("   正しい場合は --force を付けて再実行してください。");
    process.exit(1);
  }

  // 反映(後ろのブロックから書き換えて位置ズレを防ぐ)
  const sorted = [...changes].sort(
    (a, b) => byCode.get(b.code)!.start - byCode.get(a.code)!.start,
  );
  for (const c of sorted) {
    const b = byCode.get(c.code)!;
    let seg = src.slice(b.start, b.end);
    const r = c.price / c.oldPrice;
    const per = fieldNum(seg, "per");
    const pbr = fieldNum(seg, "pbr");
    const yld = fieldNum(seg, "dividendYield");
    const mcap = fieldNum(seg, "marketCapOku");

    seg = replaceOnce(seg, /priceJpy: -?[\d.]+,/, `priceJpy: ${c.price},`, "priceJpy", c.code);
    seg = replaceOnce(seg, /priceDate: "[^"]*",/, `priceDate: "${date}",`, "priceDate", c.code);
    seg = replaceOnce(seg, /changePct: -?[\d.]+,/, `changePct: ${c.pct.toFixed(2)},`, "changePct", c.code);
    seg = replaceOnce(
      seg,
      /marketCapOku: -?[\d.]+,/,
      `marketCapOku: ${Math.round(mcap * r)},`,
      "marketCapOku",
      c.code,
    );
    seg = replaceOnce(seg, /\bper: -?[\d.]+,/, `per: ${(per * r).toFixed(1)},`, "per", c.code);
    seg = replaceOnce(seg, /\bpbr: -?[\d.]+,/, `pbr: ${(pbr * r).toFixed(2)},`, "pbr", c.code);
    seg = replaceOnce(
      seg,
      /dividendYield: -?[\d.]+,/,
      `dividendYield: ${(yld / r).toFixed(2)},`,
      "dividendYield",
      c.code,
    );

    src = src.slice(0, b.start) + seg + src.slice(b.end);
  }

  writeFileSync(DATA_TS, src);

  // サマリー表示
  const updated = changes.filter((c) => c.price !== c.oldPrice);
  const flat = changes.length - updated.length;
  const missing = blocks.filter((b) => !rows.some((r) => r.code === b.code));
  console.log(
    `✅ ${changes.length} 銘柄を ${date} 付で反映(価格変更 ${updated.length}・変わらず ${flat})`,
  );
  for (const c of updated) {
    const arrow = c.pct >= 0 ? "↑" : "↓";
    console.log(
      `   ${c.code} ${c.name}: ${c.oldPrice.toLocaleString()} → ${c.price.toLocaleString()} 円 (${arrow}${Math.abs(c.pct).toFixed(2)}%)`,
    );
  }
  if (missing.length) {
    console.log(`⚠️  CSV に無く未更新のまま: ${missing.map((b) => b.code).join(", ")}`);
  }
  console.log("次の一手: npm run build で確認 → npm run deploy で公開");
}

// ---------- エントリポイント ----------

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "template") cmdTemplate();
else if (cmd === "apply") cmdApply(rest);
else {
  console.log("使い方: tsx scripts/update-prices.ts template | apply --date YYYY-MM-DD [--force]");
  process.exit(1);
}
