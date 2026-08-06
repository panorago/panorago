import { getPlaceBySlug } from "@/lib/data/places";
import { EnquireFab } from "@/components/place/enquire-fab";
import type { ReactNode } from "react";

export default async function PlaceSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug).catch(() => null);

  return (
    <>
      {children}
      <EnquireFab placeName={place?.name} />
    </>
  );
}
