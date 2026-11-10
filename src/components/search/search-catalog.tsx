"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SearchPlace } from "@/lib/search/search-document";

const SearchCatalogContext = createContext<SearchPlace[]>([]);

export function SearchCatalogProvider({
  places,
  children,
}: {
  places: SearchPlace[];
  children: ReactNode;
}) {
  return (
    <SearchCatalogContext.Provider value={places}>
      {children}
    </SearchCatalogContext.Provider>
  );
}

export function useSearchCatalog(): SearchPlace[] {
  return useContext(SearchCatalogContext);
}
