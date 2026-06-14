import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontSize: 110,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          fontFamily: "sans-serif",
        }}
      >
        超
      </div>
    ),
    { ...size },
  );
}
