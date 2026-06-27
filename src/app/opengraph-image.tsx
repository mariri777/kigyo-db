import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/shared/site";

export const alt = "超!企業DB — AI が掘る、日本株の発見";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          color: "#f5f5f5",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginTop: 56 }}>
          <div
            style={{
              fontSize: 110,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#f5f5f5",
              marginTop: 28,
              lineHeight: 1.25,
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            gap: 12,
            fontSize: 22,
            color: "#a3a3a3",
          }}
        >
          <Chip>3,800 社カバー</Chip>
          <Chip>業界マップ</Chip>
          <Chip>類似銘柄</Chip>
          <Chip>見落とし論点</Chip>
          <Chip>予測カード</Chip>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 18px",
        border: "1px solid #404040",
        borderRadius: 999,
        color: "#e5e5e5",
      }}
    >
      {children}
    </div>
  );
}
