import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Panora Go - Discover Connect Belong";
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
            "linear-gradient(145deg, #0a192f 0%, #071222 55%, #1a140c 100%)",
          color: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#c29b62",
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
          Discover Connect Belong
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: "rgba(248,248,248,0.72)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Zimbabwe tourism · Curated places · Insider notes
        </div>
      </div>
    ),
    { ...size },
  );
}
