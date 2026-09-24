"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BIARRITZ_CENTER, projectToLocal } from "@/lib/biarritz";
import type { PoiCategory } from "@/lib/pois";
import { THEMES, type MapTheme, type ThemeId } from "@/lib/theme";

export type FlyToRequest = {
  readonly x: number;
  readonly z: number;
  readonly distance: number;
  /** Incrémenté à chaque demande pour déclencher l'animation même vers la même cible. */
  readonly nonce: number;
};

export type MapState = {
  readonly theme: MapTheme;
  readonly themeId: ThemeId;
  readonly selectedPoiId: string | null;
  readonly category: PoiCategory | null;
  readonly flyTo: FlyToRequest;
  setTheme(id: ThemeId): void;
  toggleTheme(): void;
  selectPoi(id: string | null): void;
  setCategory(category: PoiCategory | null): void;
  flyToLocal(x: number, z: number, distance: number): void;
  recenter(): void;
};

export const MapStateContext = createContext<MapState | null>(null);

const [centerX, centerZ] = projectToLocal(BIARRITZ_CENTER);
const OVERVIEW_DISTANCE = 1500;
const INITIAL_FLY: FlyToRequest = {
  x: centerX,
  z: centerZ,
  distance: OVERVIEW_DISTANCE,
  nonce: 1,
};

export function MapStateProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("dark");
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [category, setCategory] = useState<PoiCategory | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToRequest>(INITIAL_FLY);

  const flyToLocal = useCallback((x: number, z: number, distance: number) => {
    setFlyTo((prev) => ({ x, z, distance, nonce: prev.nonce + 1 }));
  }, []);
  const recenter = useCallback(() => {
    setSelectedPoiId(null);
    flyToLocal(centerX, centerZ, OVERVIEW_DISTANCE);
  }, [flyToLocal]);
  const toggleTheme = useCallback(() => {
    setThemeId((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<MapState>(
    () => ({
      theme: THEMES[themeId],
      themeId,
      selectedPoiId,
      category,
      flyTo,
      setTheme: setThemeId,
      toggleTheme,
      selectPoi: setSelectedPoiId,
      setCategory,
      flyToLocal,
      recenter,
    }),
    [
      themeId,
      selectedPoiId,
      category,
      flyTo,
      toggleTheme,
      flyToLocal,
      recenter,
    ],
  );

  return (
    <MapStateContext.Provider value={value}>
      {children}
    </MapStateContext.Provider>
  );
}

export function useMapState(): MapState {
  const state = useContext(MapStateContext);
  if (!state)
    throw new Error("useMapState doit être utilisé sous <MapStateProvider>.");
  return state;
}
