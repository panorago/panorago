import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Navy + gold PGO mark for Apple touch / home screen. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A192F",
          color: "#C29B62",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 999,
            border: "4px solid #C29B62",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              P
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1,
                marginLeft: -2,
                marginBottom: 10,
              }}
            >
              GO
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
