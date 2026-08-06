import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Panora Go — Unforgettable Places in Zimbabwe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background:
            "linear-gradient(145deg, #0d1b34 0%, #050505 55%, #1a140c 100%)",
          color: "#f8f8f8",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#c8a46a",
            marginBottom: 18,
          }}
        >
          Panora Go
        </div>
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.05,
            maxWidth: 900,
            fontWeight: 600,
          }}
        >
          Unforgettable places in Zimbabwe
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: "rgba(248,248,248,0.72)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Curated weekends · Insider notes · Enquire with confidence
        </div>
      </div>
    ),
    { ...size },
  );
}
