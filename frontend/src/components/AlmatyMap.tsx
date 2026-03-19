"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { ALMATY_DISTRICTS } from "@/lib/almaty-districts";
import { scoreToColor } from "@/lib/score-utils";
import type { Map as LeafletMap, Layer, GeoJSONOptions } from "leaflet";
import { useMapSync } from "@/hooks/useMapSync";
import "leaflet/dist/leaflet.css";

const ALMATY_CENTER: [number, number] = [43.238, 76.945];

function footfallToOpacity(score: number): number {
  const min = 40;
  const max = 95;
  return 0.08 + ((score - min) / (max - min)) * 0.35;
}

function MapController({
  mapRef,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  useMapSync(mapRef);
  return null;
}

function ListingMarkers() {
  const listings = useLocationIQStore((s) => s.listings);
  const activeListingId = useLocationIQStore((s) => s.activeListingId);
  const setActiveListingId = useLocationIQStore((s) => s.setActiveListingId);
  const setExpandedListingId = useLocationIQStore((s) => s.setExpandedListingId);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const markers: Layer[] = [];

    listings.forEach((listing, index) => {
      const { lat, lng } = listing;
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        isNaN(lat) ||
        isNaN(lng)
      )
        return;

      const rank = index + 1;
      const color = scoreToColor(listing.total_score);
      const isActive = listing.id === activeListingId;

      const html = `
        <div class="liq-marker ${isActive ? "liq-marker--active" : ""}" 
             style="--marker-color: ${color}">
          <span>${rank}</span>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon });

      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:160px">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px">${listing.address}</p>
          <p style="font-size:12px;color:#666;margin:0">Оценка: <strong style="color:${color}">${listing.total_score}</strong></p>
        </div>`,
        { closeButton: false, offset: [0, -18] }
      );

      marker.on("click", () => {
        setActiveListingId(listing.id);
        setExpandedListingId(listing.id);
        setAppState("detail");

        const el = document.getElementById(`card-${listing.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());

      marker.addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => map.removeLayer(m));
    };
  }, [listings, activeListingId, map, setActiveListingId, setExpandedListingId, setAppState]);

  return null;
}

interface StaleBannerProps {
  onRefresh: () => void;
}

function StaleBanner({ onRefresh }: StaleBannerProps) {
  return (
    <div
      className="absolute top-2 left-1/2 z-[1000] flex items-center gap-2 rounded-xl px-4 py-2 shadow-md"
      style={{
        transform: "translateX(-50%)",
        backgroundColor: "rgba(255,255,255,0.95)",
        border: "1.5px solid var(--stroke)",
        backdropFilter: "blur(8px)",
        fontSize: 13,
        color: "var(--neutral-20)",
        whiteSpace: "nowrap",
      }}
    >
      <span>Параметры изменены — запустите новый поиск</span>
      <button
        type="button"
        onClick={onRefresh}
        className="font-semibold rounded-lg px-2 py-0.5 transition-colors"
        style={{
          fontSize: 12,
          color: "var(--accent-blue)",
          backgroundColor: "var(--blue-10)",
          border: "none",
          cursor: "pointer",
        }}
      >
        Обновить
      </button>
    </div>
  );
}

interface AlmatyMapProps {
  isStale: boolean;
  onRefresh: () => void;
}

export function AlmatyMap({ isStale, onRefresh }: AlmatyMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const appState = useLocationIQStore((s) => s.appState);

  const showDistricts = appState === "idle" || appState === "loading";
  const showListings =
    appState === "results" || appState === "detail" || appState === "contact";

  const districtStyle: GeoJSONOptions["style"] = (feature) => {
    const score = (feature?.properties as { footfall_score: number })
      .footfall_score;
    return {
      fillColor: "#0d9488",
      fillOpacity: footfallToOpacity(score),
      color: "#0f766e",
      weight: 1.5,
      opacity: 0.6,
    };
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={ALMATY_CENTER}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {showDistricts && (
          <GeoJSON
            key="districts"
            data={ALMATY_DISTRICTS}
            style={districtStyle}
            onEachFeature={(feature, layer) => {
              const name = (feature.properties as { name: string }).name;
              const score = (
                feature.properties as { footfall_score: number }
              ).footfall_score;
              layer.bindTooltip(
                `<div style="font-family:sans-serif;font-size:12px;font-weight:600">${name}</div>
                 <div style="font-size:11px;color:#666">Трафик: ${score}</div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {showListings && <ListingMarkers />}

        <MapController mapRef={mapRef} />
      </MapContainer>

      {/* District traffic legend */}
      {showDistricts && (
        <div
          className="absolute bottom-6 left-3 z-[1000] rounded-xl px-3 py-2 flex flex-col"
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(6px)",
            gap: 6,
            fontSize: 11,
            color: "var(--neutral-20)",
            border: "1px solid var(--stroke)",
          }}
        >
          <span className="font-semibold" style={{ fontSize: 11 }}>
            Коммерческий трафик района
          </span>
          <div
            className="rounded-sm"
            style={{
              width: 100,
              height: 8,
              background: "linear-gradient(to right, rgba(13,148,136,0.1), rgba(13,148,136,0.45))",
              border: "1px solid rgba(13,148,136,0.2)",
            }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: "var(--neutral-10)" }}>
            <span>Низкий</span>
            <span>Высокий</span>
          </div>
        </div>
      )}

      {/* Stale banner */}
      {isStale && showListings && <StaleBanner onRefresh={onRefresh} />}
    </div>
  );
}
