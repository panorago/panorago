import { SEED_PLACES } from "@/data/seed-places";
import { getPublishedPlaces } from "@/lib/data/places";
import { absoluteUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const places = await getPublishedPlaces().catch(() =>
    SEED_PLACES.filter((p) => p.published),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/discover"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/the-panora-way"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/saved"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];

  const placeRoutes: MetadataRoute.Sitemap = places.map((place) => ({
    url: absoluteUrl(`/panoras/${place.slug}`),
    lastModified: new Date(place.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...placeRoutes];
}
