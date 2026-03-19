import type { FeatureCollection, Polygon } from "geojson";

export interface DistrictProperties {
  name: string;
  footfall_score: number;
}

// Approximate bounding polygons for Almaty's 8 districts.
// Coordinates are [longitude, latitude] per GeoJSON spec.
export const ALMATY_DISTRICTS: FeatureCollection<
  Polygon,
  DistrictProperties
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Алмалы", footfall_score: 95 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.910, 43.245],
            [76.975, 43.245],
            [76.975, 43.270],
            [76.910, 43.270],
            [76.910, 43.245],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Медеу", footfall_score: 80 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.955, 43.200],
            [77.010, 43.200],
            [77.010, 43.245],
            [76.955, 43.245],
            [76.955, 43.200],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Бостандык", footfall_score: 75 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.855, 43.230],
            [76.915, 43.230],
            [76.915, 43.270],
            [76.855, 43.270],
            [76.855, 43.230],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Алатау", footfall_score: 60 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.825, 43.305],
            [76.900, 43.305],
            [76.900, 43.355],
            [76.825, 43.355],
            [76.825, 43.305],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Ауэзов", footfall_score: 55 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.790, 43.250],
            [76.855, 43.250],
            [76.855, 43.295],
            [76.790, 43.295],
            [76.790, 43.250],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Жетысу", footfall_score: 50 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.985, 43.270],
            [77.055, 43.270],
            [77.055, 43.315],
            [76.985, 43.315],
            [76.985, 43.270],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Турксиб", footfall_score: 45 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.965, 43.320],
            [77.040, 43.320],
            [77.040, 43.375],
            [76.965, 43.375],
            [76.965, 43.320],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Наурызбай", footfall_score: 40 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.745, 43.210],
            [76.815, 43.210],
            [76.815, 43.255],
            [76.745, 43.255],
            [76.745, 43.210],
          ],
        ],
      },
    },
  ],
};
