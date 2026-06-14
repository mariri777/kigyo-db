import Link from "next/link";
import { FACTOR_ANOMALIES } from "@/lib/homeHighlights";

export function FactorAnomaliesSection() {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Factor Anomalies
          </p>
          <h2 className="text-2xl font-bold tracking-tight">ファクター異常 — 教科書と現実のズレ</h2>
        </div>
      </div>
      <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
        「半導体株なら SOX 連動」「輸出企業なら円安恩恵」— こうした<strong className="text-foreground">教科書的な前提が崩れている</strong>銘柄を抽出。
        ファクター感応度の時系列回帰から、隠れた構造変化を読み解きます。
      </p>
      <div className="grid lg:grid-cols-3 gap-3">
        {FACTOR_ANOMALIES.map((a) => (
          <Link
            key={a.code}
            href={`/stocks/${a.code}`}
            className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong hover:bg-surface-elev transition group"
          >
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-[10px] text-dim tabular">{a.code}</div>
                <div className="text-base font-bold leading-tight group-hover:underline">{a.name}</div>
              </div>
              <span className="shrink-0 text-[10px] text-muted border border-border bg-surface-elev rounded px-1.5 py-0.5">
                {a.factor}
              </span>
            </div>
            <div className="space-y-2 mb-3">
              <div className="text-[11px]">
                <div className="text-dim mb-0.5">教科書：</div>
                <div className="text-muted line-through decoration-dim/40">{a.expected}</div>
              </div>
              <div className="text-[11px]">
                <div className="text-dim mb-0.5">実際：</div>
                <div className="text-foreground font-medium">{a.actual}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted leading-relaxed border-t border-border pt-2">{a.insight}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
