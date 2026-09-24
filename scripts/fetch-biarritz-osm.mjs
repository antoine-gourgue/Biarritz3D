/**
 * Récupère les données OpenStreetMap de Biarritz via l'API Overpass (à lancer une
 * fois, en local), les projette en mètres autour du centre-ville et écrit un JSON
 * compact dans public/data/biarritz.json. Aucune API n'est appelée au runtime.
 *
 * Usage : npm run data:fetch
 * Données © contributeurs OpenStreetMap, licence ODbL.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import osmtogeojson from "osmtogeojson";

/** Centre de projection : Grande Plage / Casino (aligné avec src/lib/biarritz.ts). */
const CENTER = { lat: 43.4845, lon: -1.5595 };
/** Emprise (sud, ouest, nord, est) : centre-ville, Phare, Côte des Basques, lacs. */
const BBOX = { s: 43.462, w: -1.59, n: 43.502, e: -1.535 };
const OUTPUT = new URL("../public/data/biarritz.json", import.meta.url);
/** Cache du brut Overpass (gitignoré) : les ajustements de transformation ne re-téléchargent pas. */
const CACHE = new URL("./.cache/biarritz-osm.json", import.meta.url);
const REFRESH = process.argv.includes("--refresh");
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const bbox = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
const QUERY = `
[out:json][timeout:180];
(
  way["building"](${bbox});
  relation["building"](${bbox});
  way["highway"](${bbox});
  way["natural"="coastline"](${bbox});
  way["natural"="water"](${bbox});
  relation["natural"="water"](${bbox});
  way["natural"="beach"](${bbox});
  way["natural"~"^(wood|scrub|heath)$"](${bbox});
  way["leisure"~"^(park|garden|golf_course|pitch)$"](${bbox});
  way["landuse"~"^(grass|forest|recreation_ground|cemetery|village_green)$"](${bbox});
);
out body;
>;
out skel qt;
`;

// ---- Projection locale : plan tangent équirectangulaire (précis au décimètre à l'échelle d'une ville)
const R = 6378137;
const DEG = Math.PI / 180;
const cosLat0 = Math.cos(CENTER.lat * DEG);
const round1 = (v) => Math.round(v * 10) / 10;
/** [lon, lat] → [x (est), z (sud)] en mètres. Nord vers -z (convention three.js, y vers le haut). */
const project = ([lon, lat]) => [
  round1((lon - CENTER.lon) * DEG * R * cosLat0),
  round1(-(lat - CENTER.lat) * DEG * R),
];
const projectRing = (ring) => ring.map(project);

// ---- Hauteurs de bâtiments (mètres) quand OSM ne donne ni height ni building:levels
const DEFAULT_HEIGHT = {
  house: 6.5, detached: 6.5, semidetached_house: 6.5, terrace: 7, bungalow: 4,
  residential: 10, apartments: 15, hotel: 18, dormitory: 12,
  church: 22, chapel: 12, cathedral: 28,
  commercial: 12, office: 14, retail: 6, supermarket: 7, industrial: 8, warehouse: 8,
  school: 10, university: 12, hospital: 14, public: 12, civic: 12, government: 12,
  garage: 3, garages: 3, shed: 3, roof: 3.5, carport: 3, hut: 3, cabin: 3.5,
  static_caravan: 3, greenhouse: 3.5,
  yes: 8,
};
const parseMeters = (value) => {
  if (value == null) return null;
  const match = String(value).match(/[\d.]+/);
  if (!match) return null;
  const n = Number.parseFloat(match[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};
/** Types dont la hauteur par défaut est fiable en soi (le reste est estimé sur l'empreinte). */
const TYPED_KINDS = new Set([
  "church", "chapel", "cathedral", "garage", "garages", "shed", "roof", "carport", "hut",
  "cabin", "static_caravan", "greenhouse", "industrial", "warehouse", "hotel", "school",
  "hospital", "university", "supermarket",
]);
/** Aire d'un anneau (m², formule du lacet). */
function ringArea(ring) {
  let area = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, z1] = ring[i];
    const [x2, z2] = ring[(i + 1) % n];
    area += x1 * z2 - x2 * z1;
  }
  return Math.abs(area) / 2;
}
function ringCenter(ring) {
  let x = 0;
  let z = 0;
  for (const p of ring) { x += p[0]; z += p[1]; }
  return [x / ring.length, z / ring.length];
}
/** Bruit déterministe dans [0, 1) : la silhouette varie sans changer d'un run à l'autre. */
function hash01(x, z) {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return h - Math.floor(h);
}
/**
 * Hauteur estimée quand OSM ne dit rien. La surface de l'empreinte et la distance au
 * centre (hypercentre Belle Époque = 4 à 6 étages, périphérie = villas) donnent une
 * silhouette bien plus fidèle qu'une hauteur uniforme.
 */
function estimateHeight(outer) {
  const area = ringArea(outer);
  const [cx, cz] = ringCenter(outer);
  const distance = Math.hypot(cx, cz);
  let levels;
  if (area < 40) levels = 1;          // abri, annexe
  else if (area < 110) levels = 2;    // petite maison
  else if (area < 250) levels = 2.5;  // villa
  else if (area < 600) levels = 3.5;  // petit immeuble
  else if (area < 1500) levels = 4.5; // immeuble
  else levels = 3;                    // très grande emprise : plutôt bas (commerce, équipement)
  const central = Math.max(0, 1 - distance / 900); // dégressif jusqu'à ~900 m du Casino
  if (area >= 110) levels += central * 2.5;
  const jitter = 0.85 + hash01(cx, cz) * 0.3; // ±15 %
  return round1(Math.max(3, levels * 3.1 * jitter + 1.2));
}
function buildingHeight(tags, outer) {
  const explicit = parseMeters(tags.height) ?? parseMeters(tags["building:height"]);
  if (explicit) return Math.min(explicit, 120);
  const levels = Number.parseFloat(tags["building:levels"]);
  if (Number.isFinite(levels) && levels > 0) return round1(levels * 3.1 + 1.5);
  if (TYPED_KINDS.has(tags.building)) return DEFAULT_HEIGHT[tags.building];
  return estimateHeight(outer);
}

// ---- Classification des voies
const ROAD_KIND = {
  motorway: "major", trunk: "major", primary: "major", secondary: "major",
  tertiary: "medium", residential: "medium", unclassified: "medium",
  living_street: "minor", service: "minor",
  pedestrian: "pedestrian",
  footway: "path", path: "path", steps: "path", cycleway: "path", track: "path",
};

// ---- Helpers GeoJSON → géométries projetées
/** Polygon | MultiPolygon → [{ outer, holes? }]. */
function polygons(geometry) {
  const polys =
    geometry.type === "Polygon" ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates
    : [];
  return polys
    .filter((rings) => rings[0]?.length >= 4)
    .map(([outer, ...holes]) => ({
      outer: projectRing(outer),
      ...(holes.length ? { holes: holes.map(projectRing) } : {}),
    }));
}
/** LineString | MultiLineString → [[[x,z], ...]]. */
function lines(geometry) {
  const ls =
    geometry.type === "LineString" ? [geometry.coordinates]
    : geometry.type === "MultiLineString" ? geometry.coordinates
    : [];
  return ls.filter((l) => l.length >= 2).map(projectRing);
}

// ---- Trait de côte → polygones de terre
const key = (p) => `${p[0]},${p[1]}`;
const pushTo = (map, k, i) => {
  const list = map.get(k);
  if (list) list.push(i);
  else map.set(k, [i]);
};
/** Raccorde les tronçons de côte bout à bout (les nœuds partagés ont des coordonnées identiques). */
function stitch(segments) {
  const byStart = new Map();
  const byEnd = new Map();
  segments.forEach((s, i) => {
    pushTo(byStart, key(s[0]), i);
    pushTo(byEnd, key(s.at(-1)), i);
  });
  const used = new Set();
  const chains = [];
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    let chain = segments[i].slice();
    for (let guard = 0; guard < 100000; guard++) {
      const j = (byStart.get(key(chain.at(-1))) ?? []).find((idx) => !used.has(idx));
      if (j === undefined) break;
      used.add(j);
      chain = chain.concat(segments[j].slice(1));
    }
    for (let guard = 0; guard < 100000; guard++) {
      const j = (byEnd.get(key(chain[0])) ?? []).find((idx) => !used.has(idx));
      if (j === undefined) break;
      used.add(j);
      chain = segments[j].slice(0, -1).concat(chain);
    }
    chains.push(chain);
  }
  return chains;
}
/**
 * Transforme les chaînes de côte en polygones de terre. Sur la côte basque, la
 * terre est à l'est de l'océan : une chaîne ouverte est refermée loin vers +x (est).
 * Les anneaux déjà fermés (îlots, rochers) sont gardés tels quels.
 */
function landPolygons(coastSegments) {
  const FAR_EAST = 8000;
  const out = [];
  for (const chain of stitch(coastSegments)) {
    if (chain.length < 3) continue;
    if (key(chain[0]) === key(chain.at(-1))) {
      out.push(chain.slice(0, -1));
    } else {
      out.push([...chain, [FAR_EAST, chain.at(-1)[1]], [FAR_EAST, chain[0][1]]]);
    }
  }
  return out;
}

// ---- Téléchargement (avec repli sur un miroir)
async function fetchOverpass() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const endpoint of ENDPOINTS) {
      try {
        console.log(`→ Overpass ${endpoint} (essai ${attempt})`);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent":
              "Biarritz3D/0.1 (script de données local, exécuté une fois ; github.com/antoine-gourgue/Biarritz3D)",
          },
          body: new URLSearchParams({ data: QUERY }),
          signal: AbortSignal.timeout(200_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return await res.json();
      } catch (error) {
        lastError = error;
        console.warn(`  ✗ ${error.message}`);
      }
    }
    await sleep(6000 * attempt);
  }
  throw lastError;
}

async function loadOsm() {
  if (!REFRESH) {
    try {
      const raw = await readFile(CACHE, "utf8");
      console.log(`→ cache ${CACHE.pathname} (--refresh pour re-télécharger)`);
      return JSON.parse(raw);
    } catch {
      /* pas de cache : on télécharge */
    }
  }
  const osm = await fetchOverpass();
  await mkdir(new URL("./.cache/", import.meta.url), { recursive: true });
  await writeFile(CACHE, JSON.stringify(osm));
  return osm;
}

// ---- Main
const osm = await loadOsm();
console.log(`  ✓ ${osm.elements.length} éléments OSM`);
const geo = osmtogeojson(osm);

const data = {
  meta: {
    source: "© OpenStreetMap contributors (ODbL)",
    generatedAt: new Date().toISOString(),
    center: CENTER,
    bbox: BBOX,
    units: "mètres ; x = est, z = sud (nord vers -z), y vers le haut",
  },
  land: [],
  water: [],
  beach: [],
  green: [],
  buildings: [],
  roads: [],
};
const coastSegments = [];

for (const feature of geo.features) {
  const props = feature.properties ?? {};
  const tags = props.tags ?? props;
  const { geometry } = feature;
  if (!geometry) continue;

  if (tags.building && tags.building !== "no") {
    for (const poly of polygons(geometry)) {
      data.buildings.push({
        ...poly,
        height: buildingHeight(tags, poly.outer),
        kind: tags.building,
        ...(tags.name ? { name: tags.name } : {}),
      });
    }
  } else if (tags.natural === "coastline") {
    coastSegments.push(...lines(geometry));
  } else if (tags.natural === "water" || tags.water) {
    data.water.push(...polygons(geometry));
  } else if (tags.natural === "beach") {
    data.beach.push(...polygons(geometry));
  } else if (tags.leisure || tags.landuse || ["wood", "scrub", "heath"].includes(tags.natural)) {
    data.green.push(...polygons(geometry));
  } else if (tags.highway) {
    const kind = ROAD_KIND[tags.highway];
    if (!kind) continue;
    for (const path of lines(geometry)) {
      data.roads.push({ path, kind, ...(tags.name ? { name: tags.name } : {}) });
    }
  }
}
data.land = landPolygons(coastSegments);

const json = JSON.stringify(data);
await writeFile(OUTPUT, json);
console.log(`✓ écrit ${OUTPUT.pathname}`);
console.table({
  land: data.land.length,
  water: data.water.length,
  beach: data.beach.length,
  green: data.green.length,
  buildings: data.buildings.length,
  roads: data.roads.length,
  coastSegments: coastSegments.length,
  sizeKB: Math.round(Buffer.byteLength(json) / 1024),
});
