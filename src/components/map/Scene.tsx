"use client";

import { Suspense, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { MathUtils } from "three";

import CameraRig from "./CameraRig";
import City from "./City";
import Pois from "./Pois";
import SkyDome from "./SkyDome";
import { MapStateContext, useMapState } from "./store";
import Water from "./Water";

export default function Scene() {
  // Le Canvas R3F a son propre arbre React : on re-fournit le même état à l'intérieur.
  const state = useMapState();

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      // Départ en hauteur ; CameraRig descend en vol vers la vue 3/4 du centre au montage.
      camera={{ position: [-1900, 1700, 1500], fov: 42, near: 2, far: 40000 }}
      gl={{
        antialias: true,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
      onPointerMissed={() => state.selectPoi(null)}
    >
      <MapStateContext.Provider value={state}>
        <SceneContent />
      </MapStateContext.Provider>
    </Canvas>
  );
}

function SceneContent() {
  const { theme } = useMapState();

  return (
    <>
      <color attach="background" args={[theme.horizon]} />
      <fog attach="fog" args={[theme.horizon, theme.fog.near, theme.fog.far]} />
      <SkyDome />

      <hemisphereLight
        args={[theme.skyLight, theme.groundLight, theme.hemiIntensity]}
      />
      {/* Soleil */}
      <directionalLight
        position={theme.sunPosition}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow={theme.shadows}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-2200}
        shadow-camera-right={2200}
        shadow-camera-top={2200}
        shadow-camera-bottom={-2200}
        shadow-camera-near={500}
        shadow-camera-far={9000}
        shadow-bias={-0.0003}
        shadow-normalBias={0.5}
      />
      {/* Appoint opposé : modèle les façades à l'ombre */}
      <directionalLight
        position={[2000, 1200, -1800]}
        intensity={theme.fillIntensity}
        color={theme.fillColor}
      />

      <Water />
      <Suspense fallback={null}>
        <City />
        <Pois />
      </Suspense>
      <CameraRig />

      <MapControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={80}
        maxDistance={9000}
        minPolarAngle={MathUtils.degToRad(12)}
        maxPolarAngle={MathUtils.degToRad(80)}
        screenSpacePanning={false}
      />

      {theme.bloom && (
        <AfterFirstFrames>
          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.85}
              luminanceSmoothing={0.3}
              intensity={0.45}
              mipmapBlur
            />
          </EffectComposer>
        </AfterFirstFrames>
      )}
    </>
  );
}

/**
 * L'EffectComposer rend noir s'il est monté avant les premières frames du canvas
 * (taille pas encore établie) : on attend deux frames rendues avant de l'insérer.
 */
function AfterFirstFrames({ children }: { children: ReactNode }) {
  const [frames, setFrames] = useState(0);
  useFrame(() => {
    if (frames < 2) setFrames((count) => count + 1);
  });
  return frames >= 2 ? <>{children}</> : null;
}
