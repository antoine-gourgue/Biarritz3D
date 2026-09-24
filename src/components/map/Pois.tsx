"use client";

import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

import { projectToLocal } from "@/lib/biarritz";
import { POIS, poiMatches, type Poi } from "@/lib/pois";
import { cn } from "@/lib/utils";

import { useMapState } from "./store";

/**
 * Balises 3D tactiles des lieux. Sans filtre : seuls les lieux phares (évite la bouillie
 * d'étiquettes en vue d'ensemble) ; avec un filtre : tous les lieux de la catégorie.
 */
export default function Pois() {
  const { category, selectedPoiId } = useMapState();
  const visible = POIS.filter((poi) =>
    category === null
      ? poi.featured || poi.id === selectedPoiId
      : poiMatches(poi, category),
  );
  return (
    <>
      {visible.map((poi) => (
        <Beacon key={poi.id} poi={poi} selected={poi.id === selectedPoiId} />
      ))}
    </>
  );
}

function Beacon({ poi, selected }: { poi: Poi; selected: boolean }) {
  const { theme, selectPoi, flyToLocal } = useMapState();
  const [x, z] = projectToLocal(poi.point);
  const halo = useRef<Mesh>(null);
  const glow = theme.id === "dark";

  useFrame(({ clock }) => {
    const mesh = halo.current;
    if (!mesh) return;
    const pulse = (Math.sin(clock.elapsedTime * 2) + 1) / 2;
    mesh.scale.setScalar(1 + pulse * (selected ? 0.5 : 0.2));
  });

  const open = () => {
    selectPoi(poi.id);
    flyToLocal(x, z, poi.flyDistance);
  };

  return (
    <group position={[x, 0, z]}>
      {/* point au sol + halo pulsant : discret, lisible, pas de « mât néon » */}
      <mesh position-y={1} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial
          color={theme.accent}
          toneMapped={!glow}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={halo} position-y={0.9} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[7, 9, 48]} />
        <meshBasicMaterial
          color={theme.accent}
          transparent
          opacity={selected ? 0.8 : 0.35}
          toneMapped={!glow}
          depthWrite={false}
        />
      </mesh>
      <Html
        position={[0, 18, 0]}
        center
        zIndexRange={[15, 5]}
        style={{ pointerEvents: "none" }}
      >
        <button
          type="button"
          onClick={open}
          className={cn(
            "pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap shadow-md backdrop-blur-md transition-transform active:scale-95",
            selected ? theme.ui.labelActive : theme.ui.label,
          )}
        >
          <span
            className="size-2 rounded-full"
            style={{
              backgroundColor: selected ? "currentColor" : theme.accent,
            }}
          />
          {poi.name}
        </button>
      </Html>
    </group>
  );
}
