"use client";

import { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { DoubleSide } from "three";

import { loadCityData, type CityData } from "@/lib/city-data";

import {
  applyTheme,
  buildCity,
  disposeCity,
  type CityGeometries,
} from "./geometry";
import { useMapState } from "./store";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CityData };

/** La ville : sol, voies, bâtiments et leurs arêtes, reconstruits depuis OSM. */
export default function City() {
  const { theme } = useMapState();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadCityData()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = state.status === "ready" ? state.data : null;
  const geometries = useMemo<CityGeometries | null>(
    () => (data ? buildCity(data) : null),
    [data],
  );

  // Le thème ne recolore que les attributs : instantané, pas de reconstruction.
  useEffect(() => {
    if (geometries) applyTheme(geometries, theme);
  }, [geometries, theme]);

  useEffect(
    () => () => {
      if (geometries) disposeCity(geometries);
    },
    [geometries],
  );

  if (state.status === "loading") {
    return (
      <Html center zIndexRange={[15, 5]}>
        <div className="flex items-center gap-3 rounded-full bg-black/60 px-5 py-3 text-base text-white backdrop-blur">
          <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Construction de Biarritz…
        </div>
      </Html>
    );
  }

  if (state.status === "error") {
    return (
      <Html center zIndexRange={[15, 5]}>
        <div className="max-w-sm rounded-2xl bg-red-950/85 px-5 py-4 text-base text-red-100 backdrop-blur">
          Impossible de charger la ville : {state.message}
        </div>
      </Html>
    );
  }

  const dark = theme.id === "dark";

  return (
    <group>
      {geometries?.ground && (
        <mesh geometry={geometries.ground} receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
        </mesh>
      )}
      {geometries?.roads && (
        <mesh geometry={geometries.roads}>
          <meshBasicMaterial
            vertexColors
            side={DoubleSide}
            toneMapped={!theme.roadsGlow}
          />
        </mesh>
      )}
      {geometries?.buildings && (
        <mesh geometry={geometries.buildings} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            roughness={dark ? 0.55 : 0.85}
            metalness={dark ? 0.15 : 0}
          />
        </mesh>
      )}
      {geometries?.edges && (
        <lineSegments geometry={geometries.edges}>
          <lineBasicMaterial
            color={theme.edge}
            transparent
            opacity={theme.edgeOpacity}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
