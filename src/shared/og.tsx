import { SITE_NAME } from "@/shared/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PALETTE = {
  bg: "#0a0a0a",
  surface: "#161616",
  border: "#404040",
  fg: "#f5f5f5",
  muted: "#a3a3a3",
  accent: "#fafafa",
};

/**
 * 共通 OG カードのレイアウト。
 * - 上部に「サイト名 EN · sectionLabel」
 * - 中央に大見出し(title)とサブ(subtitle)
 * - 下部に chips(任意)と sitename
 *
 * Satori は flex のみ。display: flex を明示。
 */
export function OgCard({
  sectionLabel,
  title,
  subtitle,
  chips,
  badge,
}: {
  sectionLabel: string;
  title: string;
  subtitle?: string;
  chips?: string[];
  badge?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PALETTE.bg,
        color: PALETTE.fg,
        padding: "64px 76px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 22,
          color: PALETTE.muted,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: PALETTE.accent, fontWeight: 700 }}>{sectionLabel}</span>
        {badge && (
          <span
            style={{
              display: "flex",
              marginLeft: "auto",
              padding: "6px 14px",
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 999,
              color: PALETTE.accent,
              fontSize: 18,
              letterSpacing: "0.1em",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 40,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: title.length > 26 ? 72 : 96,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: PALETTE.muted,
              marginTop: 28,
              lineHeight: 1.4,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 20,
          color: PALETTE.muted,
        }}
      >
        {chips && chips.length > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {chips.slice(0, 5).map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  border: `1px solid ${PALETTE.border}`,
                  borderRadius: 999,
                  color: PALETTE.fg,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ display: "flex" }} />
        )}
        <div style={{ display: "flex", color: PALETTE.accent, fontWeight: 700 }}>{SITE_NAME}</div>
      </div>
    </div>
  );
}
