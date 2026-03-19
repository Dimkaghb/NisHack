"use client";

import { useEffect, useRef } from "react";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import type { Map as LeafletMap } from "leaflet";

export function useMapSync(mapRef: React.MutableRefObject<LeafletMap | null>) {
  const activeListingId = useLocationIQStore((s) => s.activeListingId);
  const listings = useLocationIQStore((s) => s.listings);
  const prevActiveRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || activeListingId === prevActiveRef.current) return;
    prevActiveRef.current = activeListingId;

    if (!activeListingId) return;
    const listing = listings.find((l) => l.id === activeListingId);
    if (!listing) return;

    const { lat, lng } = listing;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    )
      return;

    mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
  }, [activeListingId, listings, mapRef]);
}
