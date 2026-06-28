/**
 * XBRL → 構造化値の軽量抽出。
 *
 * 戦略:
 *  1. fast-xml-parser で XML をパース
 *  2. <xbrli:context> を ID → 属性 (period.startDate / endDate / instant, scenario の typedMember) のマップに
 *  3. 指標タグごとに、参照 contextRef を見て (当期 / 前期 / N年前) + (連結 / 個別) を判別
 *  4. 数値・年度のセットを返す
 */
import { XMLParser } from "fast-xml-parser";
import {
  COVER_META_TAGS,
  DEI_TAGS,
  INSTANT_METRICS,
  PL_METRICS,
  SUMMARY_METRICS,
  parseAccountingStandard,
  tagsFor,
  type AccountingStandard,
  type FinancialMetricSpec,
} from "./edinet-tags";

export type ContextInfo = {
  id: string;
  periodStart?: string; // YYYY-MM-DD
  periodEnd?: string; // YYYY-MM-DD
  instant?: string; // YYYY-MM-DD
  /** "consolidated" / "nonconsolidated" / undefined (どちらか不明) */
  consolidated?: "consolidated" | "nonconsolidated";
  /** SummaryOfBusinessResults の年度差分 (例: 0=当期, -1=前期, -4=4期前) */
  prior?: number;
  /** scenario の typedMember の生 (デバッグ用) */
  rawMembers: string[];
};

export type ExtractedFinancials = {
  /** 提出企業情報 */
  filerName?: string;
  edinetCode?: string;
  secCode?: string;
  fyStart?: string;
  fyEnd?: string;
  accountingStandard: AccountingStandard;
  /** 年度別の指標値 (Summary) */
  summaryByFy: SummaryByFy[];
  /** 当期の P/L 指標 (consolidated 優先) */
  currentPl: PlValues;
  /** 期末時点の発行済株式総数 (当期末)。取れなければ undefined。 */
  issuedShares?: number;
};

export type SummaryByFy = {
  fyEnd: string; // YYYY-MM-DD (期末日)
  fyLabel: string; // "2025/3" 風 (期末月から推定)
  prior: number; // 0=当期, -1=前期 …
  revenue?: number;
  ordinaryIncome?: number;
  netProfit?: number;
  eps?: number;
  dividendPerShare?: number;
  employees?: number;
};

export type PlValues = {
  fyEnd?: string;
  operatingProfit?: number;
};

/**
 * 表紙 (Cover Page) と 沿革 から抽出する会社メタ情報。
 * すべて optional — タグが無い・パースに失敗した項目は undefined。
 */
export type CoverMeta = {
  /** 日本語社名 (例: "トヨタ自動車株式会社") */
  companyNameJa?: string;
  /** 設立年月日 (例: "1937-08-28" もしくは "1937-08")。
   * 専用タグが空の場合、沿革 HTML の最初の年月行から推定する。 */
  founded?: string;
  /** 上場日 (例: "1949-05")。専用タグが無く沿革から推定できない場合は undefined。 */
  listed?: string;
  /** 本社所在地 (例: "愛知県豊田市トヨタ町１番地") */
  headquarters?: string;
  /** 代表者氏名・肩書き (例: "取締役副社長  宮崎 洋一") */
  ceoName?: string;
  /** 会社 URL (例: "https://global.toyota/jp/"). 取れないことがほとんど。 */
  website?: string;
};

/**
 * 配当スケジュール (権利付き最終日 / 確定日 / 支払開始日)。
 * EDINET の有報 XBRL は基本これらの情報を構造化タグで持たない (決算短信 XBRL 側)。
 * 取れた場合のみ非 undefined。fy は "2026/3" 等。
 */
export type DividendSchedule = {
  fy: string;
  exDate?: string;
  recordDate?: string;
  payDate?: string;
};

/**
 * XBRL XML 文字列をパースして主要数値を抽出。
 */
export function extractFromXbrl(xml: string): ExtractedFinancials {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false, // 値は文字列のまま (後で number に変換)
    parseAttributeValue: false,
    trimValues: true,
  });
  const root = parser.parse(xml);

  // ルート要素は xbrl 名前空間付き <xbrl> または <xbrli:xbrl>
  const xbrl = root.xbrl ?? root["xbrli:xbrl"];
  if (!xbrl) {
    throw new Error("XBRL ルート要素が見つかりません");
  }

  // ── 1. context を集める ──
  const contextRaw = arrayify(xbrl["xbrli:context"]);
  const contexts = new Map<string, ContextInfo>();
  for (const c of contextRaw) {
    const id: string = c["@id"];
    const period = c["xbrli:period"] ?? {};
    const scenario = c["xbrli:scenario"];
    const info: ContextInfo = {
      id,
      periodStart: text(period["xbrli:startDate"]),
      periodEnd: text(period["xbrli:endDate"]),
      instant: text(period["xbrli:instant"]),
      rawMembers: [],
    };
    // context id 自体に "Prior2Year" / "CurrentYear" が入っていることが多いので推定に使う
    const priorIdMatch = id.match(/Prior(\d+)Year/);
    if (priorIdMatch) info.prior = -Number(priorIdMatch[1]);
    else if (/CurrentYear/.test(id)) info.prior = 0;
    if (scenario) {
      const members = arrayify(scenario["xbrldi:explicitMember"]);
      for (const m of members) {
        const dimension: string = m["@dimension"] ?? "";
        const val: string = text(m) ?? "";
        info.rawMembers.push(`${dimension}=${val}`);

        // ConsolidatedOrNonConsolidatedAxis を解釈
        if (dimension.endsWith("ConsolidatedOrNonConsolidatedAxis")) {
          if (val.endsWith("ConsolidatedMember")) info.consolidated = "consolidated";
          else if (val.endsWith("NonConsolidatedMember")) info.consolidated = "nonconsolidated";
        }
        // PriorXYearMember (XBRL Summary の prior 期判定) — 例: Prior1YearMember = 前期
        const priorMatch = val.match(/Prior(\d+)YearMember/);
        if (priorMatch) info.prior = -Number(priorMatch[1]);
        if (val.endsWith("CurrentYearMember")) info.prior = 0;
      }
    }
    contexts.set(id, info);
  }

  // ── 2. DEI を引く ──
  const dei = {
    filerName: firstStr(xbrl, DEI_TAGS.filerName),
    edinetCode: firstStr(xbrl, DEI_TAGS.edinetCode),
    secCode: firstStr(xbrl, DEI_TAGS.secCode),
    fyStart: firstStr(xbrl, DEI_TAGS.fyStart),
    fyEnd: firstStr(xbrl, DEI_TAGS.fyEnd),
  };
  const accountingStandard = parseAccountingStandard(firstStr(xbrl, DEI_TAGS.accountingStandards));

  // ── 3. Summary 系を context 別に取り出す ──
  // 戦略: Summary タグは「PriorXYearDuration」のような会計年度別 context を持つ。
  // consolidated / nonconsolidated は scenario メンバーに出るが、企業ごとに出方が異なる:
  //   - 一部企業: 連結ベースで提出 → ctx.consolidated は undefined (scenario なし)
  //   - 一部企業 (Toyota 等): 個別ベースの Summary を NonConsolidatedMember で提出
  //   - 一部企業: 連結/個別の両方を 別 ctx で出す
  // ここでは「会計年度 (prior) × consolidated フラグ」を key にして、
  //   優先順位: consolidated > undefined > nonconsolidated
  // で 1 期 1 行に束ねる。
  const PRIORITY = (c: ContextInfo["consolidated"]): number =>
    c === "consolidated" ? 2 : c === undefined ? 1 : 0;
  type Tmp = SummaryByFy & { _priority: number };
  const summaryByPrior = new Map<number, Tmp>();

  for (const spec of SUMMARY_METRICS) {
    const tagCandidates = tagsFor(spec, accountingStandard);
    for (const tag of tagCandidates) {
      const elements = arrayify(xbrl[tag]);
      for (const el of elements) {
        const ctxRef: string = el["@contextRef"];
        const ctx = contexts.get(ctxRef);
        if (!ctx) continue;
        const fyEnd = ctx.periodEnd ?? ctx.instant;
        if (!fyEnd) continue;
        const prior = ctx.prior ?? 0;
        const num = parseNumber(text(el));
        if (num == null) continue;

        const priority = PRIORITY(ctx.consolidated);
        const existing = summaryByPrior.get(prior);

        // 同じ期に複数 context あり、より優先度の高いものが現れたら差し替え (このとき他指標もリセット)
        if (!existing || existing._priority < priority) {
          const fresh: Tmp = {
            fyEnd,
            fyLabel: toFyLabel(fyEnd),
            prior,
            _priority: priority,
          };
          (fresh as Record<string, unknown>)[spec.key] = num;
          summaryByPrior.set(prior, fresh);
        } else if (existing._priority === priority) {
          // 同じ優先度なら既存に乗せる
          (existing as Record<string, unknown>)[spec.key] = num;
        }
        // 優先度が低ければ無視
      }
    }
  }

  const summaryByFy = Array.from(summaryByPrior.values()).map((r) => {
    const { _priority, ...rest } = r;
    void _priority;
    return rest;
  });

  // ── 4. P/L 本表 (営業利益) を当期の連結から取る ──
  const currentPl: PlValues = { fyEnd: dei.fyEnd };
  for (const spec of PL_METRICS) {
    const tagCandidates = tagsFor(spec, accountingStandard);
    for (const tag of tagCandidates) {
      const elements = arrayify(xbrl[tag]);
      // 当期 (fyEnd) かつ連結 を優先
      let best: { ctx: ContextInfo; value: number } | null = null;
      for (const el of elements) {
        const ctxRef: string = el["@contextRef"];
        const ctx = contexts.get(ctxRef);
        if (!ctx) continue;
        if (ctx.consolidated === "nonconsolidated") continue;
        if (ctx.periodEnd !== dei.fyEnd) continue;
        const num = parseNumber(text(el));
        if (num == null) continue;
        if (!best) best = { ctx, value: num };
      }
      if (best) {
        (currentPl as Record<string, number | string | undefined>)[spec.key] = best.value;
        break;
      }
    }
  }

  // ── 5. Instant 系 (発行済株式数等) を当期末 (prior=0) から取る ──
  // Summary 系の TotalNumberOfIssuedSharesSummaryOfBusinessResults は
  // 5 期分の値を持つので、prior=0 (当期) を優先。
  // 自己株式を差し引かず純粋な発行済総数。
  let issuedShares: number | undefined;
  for (const spec of INSTANT_METRICS) {
    const tagCandidates = tagsFor(spec, accountingStandard);
    for (const tag of tagCandidates) {
      const elements = arrayify(xbrl[tag]);
      let bestPrior = -Infinity;
      let bestValue: number | undefined;
      for (const el of elements) {
        const ctxRef: string = el["@contextRef"];
        const ctx = contexts.get(ctxRef);
        if (!ctx) continue;
        const num = parseNumber(text(el));
        if (num == null) continue;
        // prior=0 (当期末) が最優先、Prior1 > Prior2 ... と古いほど低優先
        const prior = ctx.prior ?? 0;
        if (prior > bestPrior) {
          bestPrior = prior;
          bestValue = num;
        }
      }
      if (bestValue != null) {
        if (spec.key === "issuedShares") issuedShares = bestValue;
        break;
      }
    }
  }

  return {
    ...dei,
    accountingStandard,
    summaryByFy: summaryByFy.sort((a, b) => b.prior - a.prior),
    currentPl,
    issuedShares,
  };
}

// ─────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────

function arrayify<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** XML 要素から文字列値を取り出す ({"#text": "value"} 形式と "value" 形式の両方を扱う) */
function text(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const t = obj["#text"];
    if (typeof t === "string") return t;
  }
  return undefined;
}

function firstStr(xbrl: Record<string, unknown>, tag: string): string | undefined {
  const v = xbrl[tag];
  if (v == null) return undefined;
  const arr = Array.isArray(v) ? v : [v];
  for (const item of arr) {
    const s = text(item);
    if (s) return s;
  }
  return undefined;
}

function parseNumber(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.replace(/[, ]/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * "2026-03-31" → "2026/3"
 */
function toFyLabel(yyyymmdd: string): string {
  const m = yyyymmdd.match(/^(\d{4})-(\d{2})-/);
  if (!m) return yyyymmdd;
  const month = Number(m[2]);
  return `${m[1]}/${month}`;
}

// ─────────────────────────────────────────
// 会社メタ (表紙 / 沿革)
// ─────────────────────────────────────────

/**
 * 表紙 (Cover Page) と 沿革 (CompanyHistoryTextBlock) を読んで会社メタを抽出。
 *
 * 失敗時は全フィールド undefined のオブジェクトを返す (throw しない)。
 * 個別フィールドは存在しない場合 undefined のまま残す。
 *
 * Cover Page の専用タグ (DateOfEstablishment / DateOfListing / Website) は
 * 現行 EDINET タクソノミにほぼ存在しないため、沿革本文 (HTML) の最初の
 * 「YYYY年M月(日)」行から founded を推定するフォールバックを内蔵している。
 */
export function extractCoverMeta(xml: string): CoverMeta {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@",
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
    });
    const root = parser.parse(xml);
    const xbrl = root.xbrl ?? root["xbrli:xbrl"];
    if (!xbrl) return {};

    const meta: CoverMeta = {};

    const pickFirst = (tags: readonly string[]): string | undefined => {
      for (const tag of tags) {
        const v = firstStr(xbrl as Record<string, unknown>, tag);
        if (v && v.trim().length > 0) return v.trim();
      }
      return undefined;
    };

    meta.companyNameJa = pickFirst(COVER_META_TAGS.companyNameJa);
    meta.ceoName = pickFirst(COVER_META_TAGS.ceoName);
    meta.headquarters = pickFirst(COVER_META_TAGS.headquarters);

    // 設立日 — 専用タグ (DateOfEstablishmentCoverPage) のみ。
    // 沿革 HTML から正規表現で拾うフォールバックは試みたが、
    //   - 1 行目は前身企業 (例: 豊田自動織機) の設立日が来ることが多く
    //   - 「(社名 トヨタ自動車工業㈱)」のような社名分離が会社ごとにバラバラ
    // で誤抽出が頻発するため、専用タグが無ければ undefined のままにする。
    const foundedRaw = pickFirst(COVER_META_TAGS.founded);
    if (foundedRaw) meta.founded = normalizeJpDate(foundedRaw) ?? foundedRaw;

    // 上場日 — 専用タグのみ
    const listedRaw = pickFirst(COVER_META_TAGS.listed);
    if (listedRaw) meta.listed = normalizeJpDate(listedRaw) ?? listedRaw;

    // URL — 専用タグのみ
    const url = pickFirst(COVER_META_TAGS.website);
    if (url) meta.website = url;

    return meta;
  } catch {
    return {};
  }
}

/**
 * 配当スケジュール (権利付き最終日 / 確定日 / 支払開始日) を抽出。
 *
 * EDINET 有報 XBRL は基本これらをタグ化しておらず、決算短信側にのみ存在する。
 * 現状は空配列を返す。タグ候補が判明したら本関数を拡張する。
 */
export function extractDividendSchedules(_xml: string): DividendSchedule[] {
  try {
    // 将来: jpcrp_cor:DividendRecordDate*, DividendPaymentStartDate* 等が見つかれば実装
    return [];
  } catch {
    return [];
  }
}

/**
 * "1937年8月28日" / "1937年8月" → "1937-08-28" / "1937-08"
 * パースできなければ undefined。XBRL の専用日付タグは xsd:date 形式の
 * "1937-08-28" を返すこともあるので ISO 形式もそのまま通す。
 */
function normalizeJpDate(s: string): string | undefined {
  // 全角数字 → 半角
  const half = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  // 西暦 (YYYY年M月D日 / YYYY年M月)
  const m = half.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})?\s*日?/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, "0");
    if (m[3]) return `${y}-${mo}-${m[3].padStart(2, "0")}`;
    return `${y}-${mo}`;
  }
  // ISO 風 (XBRL の DateOfEstablishment は xsd:date を返すことがある)
  const iso = half.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (iso) {
    return iso[3] ? `${iso[1]}-${iso[2]}-${iso[3]}` : `${iso[1]}-${iso[2]}`;
  }
  return undefined;
}
