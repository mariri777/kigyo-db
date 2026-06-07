export function ScoreBar({ score, max = 100, tone = "accent" }: { score: number; max?: number; tone?: "accent" | "ai" }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const color = tone === "ai" ? "var(--ai)" : "var(--accent)";
  return (
    <div className="score-bar">
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
