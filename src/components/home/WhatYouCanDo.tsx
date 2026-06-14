export function WhatYouCanDo() {
  return (
    <section className="mb-12">
      <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase mb-3">
        What you can do
      </p>
      <h2 className="text-2xl font-bold tracking-tight mb-6">超！企業 DB でできる 3 つのこと</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-md p-5">
          <div className="text-accent text-xs font-bold tracking-widest mb-3">① 似た会社が見つかる</div>
          <p className="text-sm text-muted leading-relaxed">
            「東京エレクトロンに似た会社は？」AI が業種の枠を超えて、ビジネスモデル・顧客・収益構造から
            本当に似た会社を見つけます。投資先の候補を広げるのに便利です。
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-5">
          <div className="text-accent text-xs font-bold tracking-widest mb-3">② 会社の今がわかる</div>
          <p className="text-sm text-muted leading-relaxed">
            同じ会社でも、急成長中なのか、安定期なのか、苦しい時期なのか。
            会社の「今のステージ」を AI が判定します。買いどき・売りどきの判断材料に。
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-5">
          <div className="text-accent text-xs font-bold tracking-widest mb-3">③ リスクの種類がわかる</div>
          <p className="text-sm text-muted leading-relaxed">
            円高で苦しむ会社、金利上昇で苦しむ会社、中国景気が悪いと苦しむ会社。
            会社の「弱点」を AI が見抜いて、わかりやすく整理します。
          </p>
        </div>
      </div>
    </section>
  );
}
