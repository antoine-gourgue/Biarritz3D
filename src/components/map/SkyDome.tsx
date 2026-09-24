"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial, type Mesh } from "three";

import type { MapTheme } from "@/lib/theme";

import { useMapState } from "./store";

const VERTEX = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  varying vec3 vDirection;
  void main() {
    // Halo à l'horizon, ciel qui s'assombrit vers le zénith.
    float h = smoothstep(-0.02, 0.55, vDirection.y);
    gl_FragColor = vec4(mix(uHorizon, uTop, h), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Instancié ici pour partager les uniforms par référence (voir Water.tsx). */
function createSkyMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTop: { value: new Color() },
      uHorizon: { value: new Color() },
    },
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
}

function applySkyTheme(material: ShaderMaterial, theme: MapTheme): void {
  (material.uniforms.uTop.value as Color).set(theme.skyTop);
  (material.uniforms.uHorizon.value as Color).set(theme.horizon);
}

/** Dôme de ciel en dégradé, centré sur la caméra : donne un horizon et de la profondeur. */
export default function SkyDome() {
  const { theme } = useMapState();
  const material = useMemo(() => createSkyMaterial(), []);
  const dome = useRef<Mesh>(null);

  useEffect(() => applySkyTheme(material, theme), [material, theme]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ camera }) => {
    dome.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={dome} renderOrder={-1} frustumCulled={false} material={material}>
      <sphereGeometry args={[20000, 32, 16]} />
    </mesh>
  );
}
