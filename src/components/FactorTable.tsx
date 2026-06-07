import type { FactorBetas } from "@/lib/types";

const FACTORS: { key: keyof FactorBetas; label: string; desc: string }[] = [
  { key: "usdjpy", label: "ドル円", desc: "円安 +1σ で株価がどれだけ反応するか" },
  { key: "us10y", label: "米 10 年金利", desc: "金利上昇 +1σ への反応" },
  { key: "sox", label: "SOX", desc: "フィラデルフィア半導体指数への連動" },
  { key: "china", label: "中国経済", desc: "中国経済指標サプライズへの反応" },
  { key: "oil", label: "原油", desc: "WTI +1σ への反応" },
  { key: "market", label: "市場ベータ", desc: "TOPIX に対する全体感応度" },
  { key: "size", label: "サイズ", desc: "小型 − 大型（SMB）" },
  { key: "value", label: "バリュー", desc: "高 PBR − 低 PBR（HML）" },
  { key: "momentum", label: "モメンタム", desc: "高モメンタム − 低モメンタム" },
];

function BetaBar({ value }: { value: number }) {
  // -2.0 〜 +2.0 を 0〜100% にマッピング、中央 50%
  const clamped = Math.max(-2, Math.min(2, value));
  const center = 50;
  const offset = (clamped / 2) * 50;
  const left = clamped >= 0 ? center : center + offset;
  const width = Math.abs(offset);
  const color = clamped >= 0 ? "var(--positive)" : "var(--negative)";
  return (
    <div className="relative h-2 bg-border rounded overflow-hidden">
      <span className="absolute top-0 bottom-0 w-px bg-border-strong" style={{ left: "50%" }} />
      <span
        className="absolute top-0 bottom-0"
        style={{ left: `${left}%`, width: `${width}%`, background: color }}
      />
    </div>
  );
}

export function FactorTable({ betas, period }: { betas: FactorBetas; period: string }) {
  return (
    <div>
      <div className="text-[11px] text-dim mb-3">期間：{period}</div>
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="hidden sm:grid grid-cols-[140px_1fr_70px] text-[11px] text-dim border-b border-border bg-surface-elev px-4 py-2">
          <div>ファクター</div>
          <div>感応度ベータ</div>
          <div className="text-right">値</div>
        </div>
        {FACTORS.map((f) => (
          <div
            key={f.key}
            className="grid grid-cols-[140px_1fr_70px] items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 text-sm"
          >
            <div>
              <div className="font-medium">{f.label}</div>
              <div className="text-[10px] text-dim leading-tight">{f.desc}</div>
            </div>
            <BetaBar value={betas[f.key]} />
            <div className="text-right tabular font-mono text-sm">{betas[f.key].toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
