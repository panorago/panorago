/**
 * Optional: resolve Google Places photos for known Chinhoyi venues.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (or GOOGLE_MAPS_API_KEY) with
 * Places API (New) or Places API + Place Photos enabled.
 *
 * Does NOT scrape Maps tiles. Uses official Photo Media endpoints and prints
 * attribution strings that must be shown in the product UI per Google ToS.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fetch-google-place-photos.mjs
 *   # or set the key in the environment first
 *
 * Output: scripts/out/google-place-photos.json + optional downloads under
 * public/images/places/google/ (only if --download is passed).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const VENUES = [
  {
    slug: "sleeping-pool-lookout",
    query: "Chinhoyi Caves Recreation Park Zimbabwe",
  },
  {
    slug: "caves-edge-lodge",
    query: "Caves Edge Lodge Chinhoyi Zimbabwe",
  },
  {
    slug: "copper-bean-coffee",
    query: "Copper Bean Coffee Chinhoyi Zimbabwe",
  },
  {
    slug: "mandara-kitchen",
    query: "Mandara Kitchen Chinhoyi Zimbabwe",
  },
  {
    slug: "mlichi-farm-stay",
    query: "Mlichi Farm Stay Chinhoyi Zimbabwe",
  },
  {
    slug: "baobab-braai-garden",
    query: "Baobab Braai Garden Chinhoyi Zimbabwe",
  },
  {
    slug: "kariba-houseboat-serenity",
    query: "Lake Kariba houseboat Zimbabwe",
  },
  {
    slug: "victoria-falls-river-lodge",
    query: "Victoria Falls River Lodge Zimbabwe",
  },
];

async function loadKeyFromEnvFile() {
  try {
    const env = await readFile(path.join(root, ".env.local"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(
        /^(?:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY|GOOGLE_MAPS_API_KEY)=(.*)$/,
      );
      if (m) {
        const v = m[1].trim().replace(/^["']|["']$/g, "");
        if (v) return v;
      }
    }
  } catch {
    /* no .env.local */
  }
  return "";
}

function photoUrl(photoReference, key, maxWidth = 1600) {
  // Legacy Places Photo endpoint — requires showing html_attributions.
  return (
    "https://maps.googleapis.com/maps/api/place/photo" +
    `?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}` +
    `&key=${encodeURIComponent(key)}`
  );
}

async function textSearch(query, key) {
  const url =
    "https://maps.googleapis.com/maps/api/place/textsearch/json" +
    `?query=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Text Search ${data.status}: ${data.error_message || ""}`);
  }
  return data.results?.[0] || null;
}

async function placeDetails(placeId, key) {
  const url =
    "https://maps.googleapis.com/maps/api/place/details/json" +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=name,photos,url,formatted_address` +
    `&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") {
    throw new Error(`Details ${data.status}: ${data.error_message || ""}`);
  }
  return data.result;
}

async function main() {
  const download = process.argv.includes("--download");
  const key =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (await loadKeyFromEnvFile());

  if (!key) {
    console.error(
      "No Google Maps/Places API key found. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY.",
    );
    process.exit(1);
  }

  console.log("Using Places Text Search + Place Photos (official APIs).");
  console.log(
    "Reminder: display html_attributions next to any Google photo in the UI.",
  );

  const out = [];
  for (const venue of VENUES) {
    process.stdout.write(`${venue.slug}: `);
    try {
      const hit = await textSearch(venue.query, key);
      if (!hit) {
        console.log("no Text result");
        out.push({ ...venue, status: "not_found" });
        continue;
      }
      const details = await placeDetails(hit.place_id, key);
      const photos = (details.photos || []).slice(0, 4).map((p) => ({
        photoReference: p.photo_reference,
        width: p.width,
        height: p.height,
        htmlAttributions: p.html_attributions || [],
        // Hotlinking this URL is allowed only with a valid key + attribution.
        // Prefer downloading via --download for permanence; key must stay server-side.
        apiPhotoUrl: photoUrl(p.photo_reference, "YOUR_SERVER_KEY"),
      }));
      console.log(`${details.name} — ${photos.length} photo(s)`);
      out.push({
        ...venue,
        status: "ok",
        placeId: hit.place_id,
        name: details.name,
        address: details.formatted_address,
        mapsUrl: details.url,
        photos,
      });

      if (download && photos.length) {
        const dir = path.join(
          root,
          "public",
          "images",
          "places",
          "google",
          venue.slug,
        );
        await mkdir(dir, { recursive: true });
        const attr = [
          `# Google Places photos — ${venue.slug}`,
          "",
          `Place: ${details.name}`,
          `Place ID: ${hit.place_id}`,
          `Maps: ${details.url || ""}`,
          "",
          "You must show Google / photographer attribution in the product UI.",
          "",
        ];
        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          const dest = path.join(dir, `${i + 1}.jpg`);
          const res = await fetch(photoUrl(p.photoReference, key));
          if (!res.ok) {
            attr.push(`- ${i + 1}.jpg FAILED (${res.status})`);
            continue;
          }
          await writeFile(dest, Buffer.from(await res.arrayBuffer()));
          attr.push(`## ${i + 1}.jpg`);
          for (const a of p.htmlAttributions) attr.push(`- ${a}`);
          attr.push("");
        }
        await writeFile(path.join(dir, "ATTRIBUTION.md"), attr.join("\n"));
      }
    } catch (err) {
      console.log(`error — ${err.message}`);
      out.push({ ...venue, status: "error", error: String(err.message) });
    }
  }

  const outDir = path.join(__dirname, "out");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "google-place-photos.json");
  await writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(
    "Next: review attributions, then update place hero_image/gallery in admin or seed.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
