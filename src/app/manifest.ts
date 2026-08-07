import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panora Go",
    short_name: "Panora Go",
    description:
      "Discover Connect Belong — Zimbabwe tourism and lifestyle discovery with Panora Go.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a192f",
    theme_color: "#0a192f",
    lang: "en-ZW",
    categories: ["travel", "lifestyle"],
    icons: [
      {
        src: "/logos/pgo-homescreen-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/pgo-homescreen.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/pgo-homescreen-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logos/pgo-homescreen.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
