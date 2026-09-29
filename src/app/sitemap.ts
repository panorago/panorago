import { SEED_PLACES } from "@/data/seed-places";
import { getPublishedPlaces } from "@/lib/data/places";
import { absoluteUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const places = await getPublishedPlaces().catch(() =>
    SEED_PLACES.filter((p) => p.published),
  );

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/discover"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/the-panora-way"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/enquiry"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: absoluteUrl("/add-your-place"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: absoluteUrl("/saved"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.35,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const smartShareRoutes: MetadataRoute.Sitemap = places.map((place) => ({
    url: absoluteUrl(`/p/${place.slug}`),
    lastModified: new Date(place.updatedAt),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const placeRoutes: MetadataRoute.Sitemap = places.map((place) => ({
    url: absoluteUrl(`/panoras/${place.slug}`),
    lastModified: new Date(place.updatedAt),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...smartShareRoutes, ...placeRoutes];
}
