export type GeoPoint = {
  readonly lat: number;
  readonly lon: number;
};

/**
 * Centre de la scène et de la projection : Grande Plage / Casino.
 * Doit rester aligné avec `CENTER` dans scripts/fetch-biarritz-osm.mjs.
 */
export const BIARRITZ_CENTER: GeoPoint = { lat: 43.4845, lon: -1.5595 };

const EARTH_RADIUS = 6378137;
const DEG = Math.PI / 180;
const cosLat0 = Math.cos(BIARRITZ_CENTER.lat * DEG);

/**
 * Projette un point géographique en coordonnées locales de la scène (mètres) :
 * x vers l'est, z vers le sud (le nord est vers -z), y vers le haut.
 * Même plan tangent équirectangulaire que le script de données.
 */
export function projectToLocal({
  lat,
  lon,
}: GeoPoint): readonly [x: number, z: number] {
  return [
    (lon - BIARRITZ_CENTER.lon) * DEG * EARTH_RADIUS * cosLat0,
    -(lat - BIARRITZ_CENTER.lat) * DEG * EARTH_RADIUS,
  ];
}
