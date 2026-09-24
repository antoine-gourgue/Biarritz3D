import { z } from "zod";

/** Point en coordonnées locales de la scène : [x (est), z (sud)] en mètres. */
const point = z.tuple([z.number(), z.number()]);
const ring = z.array(point).min(3);
const polygon = z.object({
  outer: ring,
  holes: z.array(ring).optional(),
});

export const roadKinds = [
  "major",
  "medium",
  "minor",
  "pedestrian",
  "path",
] as const;

/** Schéma de public/data/biarritz.json, produit par scripts/fetch-biarritz-osm.mjs. */
export const cityDataSchema = z.object({
  meta: z.object({
    source: z.string(),
    generatedAt: z.string(),
    center: z.object({ lat: z.number(), lon: z.number() }),
    units: z.string(),
  }),
  /** Polygones de terre (continent refermé côté est + îlots), sans trous. */
  land: z.array(ring),
  water: z.array(polygon),
  beach: z.array(polygon),
  green: z.array(polygon),
  buildings: z.array(
    polygon.extend({
      height: z.number().positive(),
      kind: z.string(),
      name: z.string().optional(),
    }),
  ),
  roads: z.array(
    z.object({
      path: z.array(point).min(2),
      kind: z.enum(roadKinds),
      name: z.string().optional(),
    }),
  ),
});

export type CityData = z.infer<typeof cityDataSchema>;
export type CityPolygon = z.infer<typeof polygon>;
export type CityBuilding = CityData["buildings"][number];
export type CityRoad = CityData["roads"][number];
export type Ring = z.infer<typeof ring>;
export type RoadKind = (typeof roadKinds)[number];

export async function loadCityData(
  url = "/data/biarritz.json",
): Promise<CityData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de charger ${url} (HTTP ${res.status})`);
  }
  return cityDataSchema.parse(await res.json());
}
