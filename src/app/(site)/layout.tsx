import { SiteShell } from "@/components/layout/site-shell";
import { WishlistCatalogProvider } from "@/components/place/saved-places-client";
import { SearchCatalogProvider } from "@/components/search/search-catalog";
import { getPublishedPlaces } from "@/lib/data/places";
import { toPlaceCardModel } from "@/lib/places/card";
import { toSearchPlace } from "@/lib/search/search-document";
import type { ReactNode } from "react";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const places = await getPublishedPlaces();
  return (
    <SearchCatalogProvider places={places.map(toSearchPlace)}>
      <WishlistCatalogProvider places={places.map(toPlaceCardModel)}>
        <SiteShell>{children}</SiteShell>
      </WishlistCatalogProvider>
    </SearchCatalogProvider>
  );
}
