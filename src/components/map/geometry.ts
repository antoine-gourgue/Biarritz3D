import {
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import type {
  CityBuilding,
  CityData,
  CityPolygon,
  CityRoad,
  Ring,
  RoadKind,
} from "@/lib/city-data";
import type { MapTheme } from "@/lib/theme";

/*
 * Constructeurs three.js purs (sans React). Chaque couche est fusionnée en UNE
 * BufferGeometry (un draw call) et porte un attribut `aInfo` (vec3) décrivant
 * chaque sommet ; `applyTheme` s'en sert pour écrire l'attribut `color` — la
 * bascule de thème recolore ~1 M de sommets en quelques ms, sans reconstruction.
 *
 * Convention : données en [x (est), z (sud)] ; three.js a y vers le haut. Une Shape
 * 2D est dessinée en (x, -z) puis tournée de -90° autour de X : ses points reviennent
 * en (x, y, z) monde et l'extrusion pointe vers +y.
 */

/** Altitudes des couches (mètres) : petits décalages pour éviter le z-fighting. */
export const LAYER_Y = {
  ocean: -0.6,
  land: 0,
  lake: 0.3,
  green: 0.4,
  beach: 0.5,
  road: 0.6,
  building: 0.1,
} as const;

export type CityGeometries = {
  readonly ground: BufferGeometry | null;
  readonly buildings: BufferGeometry | null;
  readonly edges: BufferGeometry | null;
  readonly roads: BufferGeometry | null;
};

type Info = readonly [number, number, number];

const GROUND_LAYER = { land: 0, lake: 1, green: 2, beach: 3 } as const;
const ROAD_INDEX: Record<RoadKind, number> = {
  major: 0,
  medium: 1,
  minor: 2,
  pedestrian: 3,
  path: 4,
};
const ROAD_WIDTH: Record<RoadKind, number> = {
  major: 7,
  medium: 4.5,
  minor: 3,
  pedestrian: 2.6,
  path: 1.1,
};

// ---- Helpers

/** Les anneaux GeoJSON répètent le premier point à la fin : on l'enlève quand il gêne. */
function stripClosing(ring: Ring): Ring {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return ring.length > 1 && first[0] === last[0] && first[1] === last[1]
    ? ring.slice(0, -1)
    : ring;
}

function ringToPath<T extends Path>(target: T, ring: Ring): T {
  ring.forEach(([x, z], i) => {
    if (i === 0) target.moveTo(x, -z);
    else target.lineTo(x, -z);
  });
  target.closePath();
  return target;
}

function toShape(polygon: CityPolygon): Shape {
  const shape = ringToPath(new Shape(), polygon.outer);
  polygon.holes?.forEach((hole) =>
    shape.holes.push(ringToPath(new Path(), hole)),
  );
  return shape;
}

/** Bruit déterministe dans [0, 1). */
function hash01(x: number, z: number): number {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

function ringCenter(ring: Ring): readonly [number, number] {
  let x = 0;
  let z = 0;
  for (const [px, pz] of ring) {
    x += px;
    z += pz;
  }
  return [x / ring.length, z / ring.length];
}

/** Ajoute `aInfo` (par sommet) et un attribut `color` vide, supprime `uv`. */
function withInfo(
  geometry: BufferGeometry,
  info: (index: number) => Info,
): BufferGeometry {
  const count = geometry.getAttribute("position").count;
  const infos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [a, b, c] = info(i);
    infos[i * 3] = a;
    infos[i * 3 + 1] = b;
    infos[i * 3 + 2] = c;
  }
  geometry.setAttribute("aInfo", new Float32BufferAttribute(infos, 3));
  geometry.setAttribute(
    "color",
    new Float32BufferAttribute(new Float32Array(count * 3), 3),
  );
  geometry.deleteAttribute("uv");
  return geometry;
}

function merge(parts: BufferGeometry[]): BufferGeometry | null {
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts, false) ?? null;
  parts.forEach((part) => part.dispose());
  return merged;
}

// ---- Couches

function flatPolygon(
  polygon: CityPolygon,
  y: number,
  layer: number,
): BufferGeometry {
  const geometry = new ShapeGeometry(toShape(polygon));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  return withInfo(geometry, () => [layer, 0, 0]);
}

/** Terre, lacs, espaces verts et plages, fusionnés. */
export function buildGround(data: CityData): BufferGeometry | null {
  return merge([
    ...data.land.map((outer) =>
      flatPolygon({ outer }, LAYER_Y.land, GROUND_LAYER.land),
    ),
    ...data.water.map((p) => flatPolygon(p, LAYER_Y.lake, GROUND_LAYER.lake)),
    ...data.green.map((p) => flatPolygon(p, LAYER_Y.green, GROUND_LAYER.green)),
    ...data.beach.map((p) => flatPolygon(p, LAYER_Y.beach, GROUND_LAYER.beach)),
  ]);
}

/** Bâtiments extrudés ; aInfo = [hauteur relative 0→1, toit ?, variation]. */
export function buildBuildings(
  buildings: readonly CityBuilding[],
): BufferGeometry | null {
  const parts = buildings.map((building) => {
    const geometry = new ExtrudeGeometry(toShape(building), {
      depth: building.height,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, LAYER_Y.building, 0);
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const [cx, cz] = ringCenter(building.outer);
    const variation = hash01(cx, cz);
    return withInfo(geometry, (i) => [
      Math.min(
        1,
        Math.max(0, (position.getY(i) - LAYER_Y.building) / building.height),
      ),
      normal.getY(i) > 0.5 ? 1 : 0,
      variation,
    ]);
  });
  return merge(parts);
}

/** Arêtes verticales et faîtages de tous les bâtiments (LineSegments). */
export function buildBuildingEdges(
  buildings: readonly CityBuilding[],
): BufferGeometry | null {
  const positions: number[] = [];
  const y0 = LAYER_Y.building;
  for (const building of buildings) {
    const y1 = y0 + building.height;
    for (const raw of [building.outer, ...(building.holes ?? [])]) {
      const ring = stripClosing(raw);
      for (let i = 0; i < ring.length; i++) {
        const [x, z] = ring[i];
        const [nx, nz] = ring[(i + 1) % ring.length];
        positions.push(x, y0, z, x, y1, z, x, y1, z, nx, y1, nz);
      }
    }
  }
  if (positions.length === 0) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}

/** Ruban plat le long d'une polyligne, normales vers +y. */
function ribbon(
  path: CityRoad["path"],
  width: number,
  y: number,
): BufferGeometry | null {
  const points = path.filter(
    (p, i) => i === 0 || p[0] !== path[i - 1][0] || p[1] !== path[i - 1][1],
  );
  if (points.length < 2) return null;

  const half = width / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const length = Math.hypot(dx, dz) || 1;
    dx /= length;
    dz /= length;
    const nx = -dz;
    const nz = dx;
    positions.push(
      x + nx * half,
      y,
      z + nz * half,
      x - nx * half,
      y,
      z - nz * half,
    );
    normals.push(0, 1, 0, 0, 1, 0);
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** Toutes les voies en rubans ; aInfo.x = type de voie. */
export function buildRoads(roads: readonly CityRoad[]): BufferGeometry | null {
  const parts: BufferGeometry[] = [];
  for (const road of roads) {
    const geometry = ribbon(road.path, ROAD_WIDTH[road.kind], LAYER_Y.road);
    if (geometry)
      parts.push(withInfo(geometry, () => [ROAD_INDEX[road.kind], 0, 0]));
  }
  return merge(parts);
}

export function buildCity(data: CityData): CityGeometries {
  return {
    ground: buildGround(data),
    buildings: buildBuildings(data.buildings),
    edges: buildBuildingEdges(data.buildings),
    roads: buildRoads(data.roads),
  };
}

export function disposeCity(geometries: CityGeometries): void {
  geometries.ground?.dispose();
  geometries.buildings?.dispose();
  geometries.edges?.dispose();
  geometries.roads?.dispose();
}

// ---- Thème → couleurs par sommet

function colorize(
  geometry: BufferGeometry,
  pick: (info: Info, out: Color) => void,
): void {
  const info = geometry.getAttribute("aInfo");
  const color = geometry.getAttribute("color");
  const out = new Color();
  for (let i = 0; i < info.count; i++) {
    pick([info.getX(i), info.getY(i), info.getZ(i)], out);
    color.setXYZ(i, out.r, out.g, out.b);
  }
  color.needsUpdate = true;
}

/** Écrit les couleurs du thème dans les géométries (rapide, sans reconstruction). */
export function applyTheme(geometries: CityGeometries, theme: MapTheme): void {
  const ground = [theme.land, theme.lake, theme.green, theme.beach].map(
    (hex) => new Color(hex),
  );
  if (geometries.ground) {
    colorize(geometries.ground, (info, out) =>
      out.copy(ground[Math.round(info[0])] ?? ground[0]),
    );
  }

  const bottom = new Color(theme.wallBottom);
  const top = new Color(theme.wallTop);
  const roof = new Color(theme.roof);
  if (geometries.buildings) {
    colorize(geometries.buildings, ([t, isRoof, variation], out) => {
      if (isRoof > 0.5) out.copy(roof);
      else out.copy(bottom).lerp(top, Math.pow(t, 0.55));
      out.multiplyScalar(0.9 + variation * 0.18);
    });
  }

  const roads = [
    theme.roadMajor,
    theme.roadMedium,
    theme.roadMinor,
    theme.roadPedestrian,
    theme.roadPath,
  ].map((hex) => new Color(hex));
  if (geometries.roads) {
    colorize(geometries.roads, (info, out) =>
      out.copy(roads[Math.round(info[0])] ?? roads[0]),
    );
  }
}
