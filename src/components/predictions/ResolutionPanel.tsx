import type { Resolution } from "@/content/predictions";

/**
 * 答え合わせ済みの予測カードに表示する「教訓」セクション。
 */
export function ResolutionPanel({ resolution }: { resolution: Resolution }) {
  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 mb-2">
        🎓 答え合わせと学び
      </div>

      <div className="bg-muted border border-border rounded-sm p-4 space-y-4">
        <Block heading="▼ なぜそうなったか" items={resolution.why} />
        {resolution.surprises.length > 0 && (
          <Block heading="▼ 想定外の要因" items={resolution.surprises} />
        )}
        {resolution.lessons.length > 0 && (
          <Block heading="▼ 見落とされやすかったポイント" items={resolution.lessons} />
        )}
      </div>
    </div>
  );
}

function Block({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div>
      <div className="text-[12px] font-bold mb-1.5">{heading}</div>
      <ul className="text-[12px] text-muted-foreground space-y-1 list-disc list-inside">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
