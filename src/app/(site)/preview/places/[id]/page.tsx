import { PlacePublishBar } from "@/components/admin/place-publish-bar";
import { PlaceListing } from "@/components/place/place-listing";
import { getAdminPlace } from "@/lib/admin/actions";
import { getPublishedPlaces, getStoriesForPlace } from "@/lib/data/places";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Listing preview",
  robots: { index: false, follow: false },
};

export default async function PlacePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getAdminPlace(id);
  if (!place) notFound();

  const [stories, published] = await Promise.all([
    getStoriesForPlace(place.id),
    getPublishedPlaces(),
  ]);
  const recommendations = published
    .filter((item) => item.id !== place.id)
    .slice(0, 4);

  return (
    <div className="pb-28">
      <PlaceListing
        place={place}
        stories={stories}
        recommendations={recommendations}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--background)] p-3">
        <div className="container-panora">
          <PlacePublishBar
            id={place.id}
            slug={place.slug}
            published={place.published}
            placeName={place.name}
          />
        </div>
      </div>
    </div>
  );
}
