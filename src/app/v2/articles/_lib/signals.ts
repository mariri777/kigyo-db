// ─────────────────────────────────────────────────────────
// シグナル (DB の更新から自動生成される 1 行通知)
//
// 「記事」とは別物。読み物ではなく通知。
// 表示場所は次の3つを想定:
//   - トップの市場サマリの右脇
//   - 銘柄詳細ページの「最近のシグナル」
//   - 検索結果やテーマページの補助情報
// 記事一覧 (/v2/articles) には出さない。読み物ではないため。
// ─────────────────────────────────────────────────────────

import type { LucideIcon } from "lucide-react";
import { Newspaper, Activity, Zap } from "lucide-react";
import type { Subject } from "./posts";

export type SignalKind = "earnings_brief" | "price_anomaly" | "indicator_shift";

export const SIGNAL_META: Record<SignalKind, { label: string; icon: LucideIcon }> = {
  earnings_brief: { label: "決算速報", icon: Newspaper },
  price_anomaly: { label: "株価異常検知", icon: Activity },
  indicator_shift: { label: "指標シフト", icon: Zap },
};

export type Signal = {
  id: string;
  kind: SignalKind;
  subject: Subject;
  oneLiner: string;
  keyMetric: { label: string; value: string; positive?: boolean };
  source: string; // どのDBから生成したか (透明性)
  publishedAt: string;
  publishedAtIso: string;
  /** 編集記事との紐付け (生成後に編集が解釈を書いたら) */
  relatedPostSlug?: string;
};

export const signals: Signal[] = [
  {
    id: "sig-9984-q4",
    kind: "earnings_brief",
    subject: { kind: "company", code: "9984", name: "ソフトバンクグループ" },
    oneLiner:
      "通期純利益5.7兆円で過去最高。営業CFは+2%。Arm評価益2.8兆円・OpenAI評価益1.8兆円が利益の8割。",
    keyMetric: { label: "純利益", value: "¥5.7T", positive: true },
    source: "決算短信 + 売上分解DB / 17:02 JST",
    publishedAt: "17:02",
    publishedAtIso: "2026-06-28T17:02:00+09:00",
    relatedPostSlug: "softbank-ai-quality",
  },
  {
    id: "sig-tel-volume",
    kind: "price_anomaly",
    subject: { kind: "company", code: "8035", name: "東京エレクトロン" },
    oneLiner: "前場で出来高が20日平均の3.2倍。SOX指数+2.18%と連動。",
    keyMetric: { label: "出来高/平均", value: "×3.2", positive: true },
    source: "価格DB / 13:45 JST",
    publishedAt: "13:46",
    publishedAtIso: "2026-06-28T13:46:00+09:00",
  },
  {
    id: "sig-7203-tech",
    kind: "indicator_shift",
    subject: { kind: "company", code: "7203", name: "トヨタ自動車" },
    oneLiner: "終値が200日MA(¥2,840)を上抜け。RSI(14)は62で過熱感はまだ薄い。",
    keyMetric: { label: "対200日MA", value: "+1.4%", positive: true },
    source: "テクニカル指標DB",
    publishedAt: "15:01",
    publishedAtIso: "2026-06-28T15:01:00+09:00",
  },
  {
    id: "sig-9983-eps",
    kind: "earnings_brief",
    subject: { kind: "company", code: "9983", name: "ファーストリテイリング" },
    oneLiner: "EPSが¥1,420でコンセンサス¥1,464を下振れ。為替ヘッジで粗利率頭打ち。",
    keyMetric: { label: "EPS差分", value: "-3.0%", positive: false },
    source: "決算短信 / 16:15 JST",
    publishedAt: "16:17",
    publishedAtIso: "2026-06-28T16:17:00+09:00",
  },
  {
    id: "sig-9501-yield",
    kind: "indicator_shift",
    subject: { kind: "company", code: "9501", name: "東京電力HD" },
    oneLiner:
      "配当復活方針を受けて利回り3.1%へ。電力業界中央値2.8%を上回るのは2011年以来初。",
    keyMetric: { label: "配当利回り", value: "3.1%", positive: true },
    source: "配当DB日次更新",
    publishedAt: "09:15",
    publishedAtIso: "2026-06-28T09:15:00+09:00",
  },
];

export function signalsSorted(): Signal[] {
  return [...signals].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso)
  );
}
