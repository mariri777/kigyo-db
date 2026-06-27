import type { CompetitiveBlock } from "@/content/industries";
import { Disclose } from "@/components/Disclose";

/**
 * 業界の競争構造ブロック群。各サブクラスタのサマリ + 詳細/シェア比較の disclose。
 */
export function CompetitiveStructure({ blocks }: { blocks: CompetitiveBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((cs, i) => (
        <div
          key={`${cs.sub}-${i}`}
          className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-8 pb-6 border-b border-border last:border-b-0 last:pb-0"
        >
          <h3 className="font-bold text-base">{cs.sub}</h3>
          <div>
            <p className="text-sm leading-relaxed">{cs.summary}</p>

            <Disclose label="詳しい分析を見る">
              <p className="text-muted-foreground leading-relaxed">{cs.detail}</p>
            </Disclose>

            {cs.shares && (
              <Disclose label="シェア比較を見る">
                <div className="text-[11px] text-foreground/60 mb-2">{cs.shares.metric}</div>
                <ul className="space-y-1.5">
                  {cs.shares.entries.map((e, j) => (
                    <li
                      key={j}
                      className="grid grid-cols-[32px_1fr_120px] sm:grid-cols-[32px_1fr_140px_1fr] items-baseline gap-2 py-1.5 border-b border-border last:border-b-0"
                    >
                      <span className="text-foreground/60 tabular text-xs">
                        {e.rank ? `${e.rank}.` : "・"}
                      </span>
                      <span className="font-medium text-sm">{e.name}</span>
                      <span className="tabular font-mono text-sm text-right sm:text-left">
                        {e.value}
                      </span>
                      {e.note && (
                        <span className="text-[11px] text-muted-foreground col-span-3 sm:col-span-1 sm:text-right">
                          {e.note}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {cs.shares.note && (
                  <p className="text-[11px] text-foreground/60 mt-3 leading-relaxed">
                    ※ {cs.shares.note}
                  </p>
                )}
              </Disclose>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
