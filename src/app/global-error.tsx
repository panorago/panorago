"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#0A192F",
          color: "#F5F7FA",
          fontFamily: "Georgia, serif",
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.18em", fontSize: 12, color: "#D4AF37" }}>
            PANORA GO
          </p>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 500, marginTop: 16 }}>
            Something interrupted the journey.
          </h1>
          <p style={{ maxWidth: 420, margin: "16px auto 0", lineHeight: 1.6 }}>
            The page could not be shown. Try again, or return home.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "12px 20px",
                background: "#D4AF37",
                color: "#0A192F",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: 999,
                padding: "12px 20px",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#F5F7FA",
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
