import { SEED_PLACES } from "@/data/seed-places";
import { getPlaceBySlug } from "@/lib/data/places";
import { atmospheresForPlace } from "@/lib/panora/atmospheres";
import { ImageResponse } from "next/og";

export const alt = "Panora Go destination";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

async function loadHero(url: string | null | undefined) {
  if (!url?.startsWith("http")) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function SmartShareOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place =
    (await getPlaceBySlug(slug).catch(() => null)) ??
    SEED_PLACES.find((p) => p.slug === slug) ??
    null;

  if (!place) {
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
            }}
          >
            Panora Go
          </div>
          <div style={{ fontSize: 56, marginTop: 16 }}>Discover Zimbabwe</div>
        </div>
      ),
      { ...size },
    );
  }

  const atmospheres = atmospheresForPlace(place, 3)
    .map((a) => a.label)
    .join("  ·  ");
  const heroData = await loadHero(place.heroImage);
  const storyBite = place.story.slice(0, 110).trim();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          background: "#0a192f",
          color: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        {heroData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroData}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(10,25,47,0.92) 0%, rgba(10,25,47,0.72) 45%, rgba(10,25,47,0.55) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "2px solid rgba(194,155,98,0.55)",
            borderRadius: 8,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 72,
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: "#c29b62",
              marginBottom: 14,
            }}
          >
            Panora Go
          </div>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1.05,
              maxWidth: 860,
              fontWeight: 600,
            }}
          >
            {place.name}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 24,
              color: "rgba(248,248,248,0.78)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {place.location}, {place.city}
          </div>
          {atmospheres ? (
            <div
              style={{
                marginTop: 14,
                fontSize: 20,
                color: "#c29b62",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {atmospheres}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 22,
              fontSize: 22,
              maxWidth: 820,
              color: "rgba(248,248,248,0.68)",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.35,
            }}
          >
            {storyBite}
            {place.story.length > 110 ? "…" : ""}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 18,
              letterSpacing: 2,
              color: "rgba(194,155,98,0.85)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Discover. Connect. Belong.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
