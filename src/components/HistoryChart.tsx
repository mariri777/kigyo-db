import type { Stock } from "@/domain/types";
import { getStockHistory } from "@/domain/history";

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 24, right: 50, bottom: 36, left: 60 };

/**
 * 業績推移チャート。売上を棒グラフ、営業利益率を折れ線で重ね表示。
 * 外部ライブラリなしの純 SVG。
 */
export function HistoryChart({ stock }: { stock: Stock }) {
  const history = getStockHistory(stock);
  if (!history) {
    return (
      <div className="bg-surface border border-border border-dashed rounded-md p-5 text-sm text-dim">
        この銘柄の業績推移はまだ生成されていません(財務時系列の seed 待ち)。
      </div>
    );
  }
  const {
    years,
    revenueGrowthPct,
    marginChangePp,
    startRevenue,
    endRevenue,
    startMargin,
    endMargin,
  } = history;

  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const maxRev = Math.max(...years.map((y) => y.revenueOku));
  const margins = years.map((y) => y.operatingMargin);
  const rawMaxM = Math.max(...margins);
  const rawMinM = Math.min(...margins);
  // マージン軸の上下にバッファを取る
  const marginRange = Math.max(5, rawMaxM - rawMinM);
  const maxM = rawMaxM + marginRange * 0.15;
  const minM = Math.min(0, rawMinM - marginRange * 0.15);

  const xStep = innerW / (years.length - 1);
  const barW = (innerW / years.length) * 0.55;

  const xFor = (i: number) => PADDING.left + i * xStep;
  const yRev = (rev: number) => PADDING.top + innerH - (rev / maxRev) * innerH;
  const yMargin = (m: number) => PADDING.top + innerH - ((m - minM) / (maxM - minM)) * innerH;
  const barBaseY = PADDING.top + innerH;

  const linePath = years
    .map((y, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yMargin(y.operatingMargin).toFixed(1)}`)
    .join(" ");

  return (
    <div className="bg-surface border border-border rounded-md p-4">
      {/* 5 年トレンドサマリー */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <div className="text-[10px] text-dim tracking-wider mb-1">売上 5 年推移</div>
          <div className="flex items-baseline gap-2">
            <span className="tabular font-mono text-sm">{startRevenue.toLocaleString()}</span>
            <span className="text-dim">→</span>
            <span className="tabular font-mono text-base font-bold">{endRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-muted">億円</span>
          </div>
          <div
            className={`text-[11px] font-bold tabular mt-1 ${
              revenueGrowthPct >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {revenueGrowthPct >= 0 ? "+" : ""}
            {revenueGrowthPct.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-dim tracking-wider mb-1">営業利益率 5 年推移</div>
          <div className="flex items-baseline gap-2">
            <span className="tabular font-mono text-sm">{startMargin.toFixed(1)}%</span>
            <span className="text-dim">→</span>
            <span className="tabular font-mono text-base font-bold">{endMargin.toFixed(1)}%</span>
          </div>
          <div
            className={`text-[11px] font-bold tabular mt-1 ${
              marginChangePp >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {marginChangePp >= 0 ? "+" : ""}
            {marginChangePp.toFixed(1)}pt
          </div>
        </div>
      </div>

      {/* チャート */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ overflow: "visible" }}>
        {/* Y 軸（売上）目盛り */}
        {[0, 0.5, 1].map((t) => {
          const y = PADDING.top + innerH * (1 - t);
          const val = Math.round(maxRev * t);
          return (
            <g key={t}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + innerW}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray={t === 0 ? "0" : "2,2"}
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="var(--color-dim)"
                className="tabular"
              >
                {val.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Y 軸右（営業利益率）目盛り */}
        {[minM, (minM + maxM) / 2, maxM].map((m, idx) => {
          const y = yMargin(m);
          return (
            <text
              key={idx}
              x={PADDING.left + innerW + 6}
              y={y + 3}
              textAnchor="start"
              fontSize="9"
              fill="var(--color-positive)"
              className="tabular"
            >
              {m.toFixed(0)}%
            </text>
          );
        })}

        {/* 売上 棒グラフ */}
        {years.map((y, i) => {
          const cx = xFor(i);
          const barH = (y.revenueOku / maxRev) * innerH;
          const barY = barBaseY - barH;
          return (
            <g key={y.period}>
              <rect
                x={cx - barW / 2}
                y={barY}
                width={barW}
                height={barH}
                fill="var(--color-foreground)"
                opacity={i === years.length - 1 ? 1 : 0.7}
              />
              <text
                x={cx}
                y={barBaseY + 18}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-muted)"
              >
                {y.period.replace("/3", "")}
              </text>
            </g>
          );
        })}

        {/* 営業利益率 折れ線 */}
        <path d={linePath} stroke="var(--color-positive)" strokeWidth="1.5" fill="none" />
        {years.map((y, i) => (
          <circle
            key={y.period}
            cx={xFor(i)}
            cy={yMargin(y.operatingMargin)}
            r="3"
            fill="var(--color-positive)"
            stroke="var(--color-background)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center gap-5 mt-3 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-foreground" />
          売上（億円・左軸）
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-positive" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-positive -ml-2" />
          営業利益率（%・右軸）
        </div>
      </div>

      {/* 詳細データテーブル */}
      <details className="mt-4 group/disclose">
        <summary className="cursor-pointer text-xs text-muted hover:text-foreground inline-flex items-center gap-1.5 list-none">
          <span className="text-foreground/70">▸</span>
          <span className="underline decoration-dotted underline-offset-2 group-open/disclose:hidden">
            年度別の数値を見る
          </span>
          <span className="hidden underline decoration-dotted underline-offset-2 group-open/disclose:inline">
            折りたたむ
          </span>
        </summary>
        <div className="mt-3 bg-surface-elev border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] text-[11px] text-dim border-b border-border px-3 py-2">
            <div>期</div>
            <div className="text-right">売上（億円）</div>
            <div className="text-right">営業利益（億円）</div>
            <div className="text-right">営業利益率</div>
          </div>
          {years.map((y) => (
            <div
              key={y.period}
              className="grid grid-cols-[1fr_1fr_1fr_1fr] px-3 py-2 border-b border-border last:border-b-0 text-sm"
            >
              <div className="tabular text-xs">{y.period}</div>
              <div className="text-right tabular font-mono">{y.revenueOku.toLocaleString()}</div>
              <div className="text-right tabular font-mono">{y.operatingProfitOku.toLocaleString()}</div>
              <div className="text-right tabular font-mono">{y.operatingMargin.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-dim leading-relaxed">
          ※ 本データは現状値と 3 年 CAGR からの推計値です。本番では EDINET XBRL から実データを取得します。
        </p>
      </details>
    </div>
  );
}
