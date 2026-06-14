export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-ai border border-ai/40 bg-ai/5 rounded px-1.5 py-0.5">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" />
      </svg>
      AI 生成
    </span>
  );
}

export function AiDisclaimer() {
  return (
    <p className="text-[11px] text-foreground/60 leading-relaxed mt-3">
      ※ この内容は生成 AI による分析です。すべての引用は別パイプラインで検証済み（未検証の出力は非表示）。
      投資判断の根拠としてはご利用前に必ず一次情報をご確認ください。
      抽出方法の詳細は <a href="/legal/editorial-policy" className="underline hover:text-muted-foreground">編集方針</a> をご確認ください。
    </p>
  );
}
