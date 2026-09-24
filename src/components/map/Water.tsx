"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, ShaderMaterial } from "three";

import type { MapTheme } from "@/lib/theme";

import { LAYER_Y } from "./geometry";
import { useMapState } from "./store";

const VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uHighlight;
  uniform vec3 uHorizon;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;

  // Somme d'ondes dans des directions variées (≈ 18, 16, 45 et 61 m) : interférences
  // naturelles, sans produit sin·sin qui dessinerait une grille.
  float ripple(vec2 p, float t) {
    float a = sin(dot(p, vec2(0.30, 0.18)) + t * 1.5);
    float b = sin(dot(p, vec2(-0.21, 0.33)) - t * 1.2);
    float c = sin(dot(p, vec2(0.12, -0.07)) + t * 0.8);
    float d = sin(dot(p, vec2(0.05, 0.09)) + t * 0.45);
    return a * 0.3 + b * 0.3 + c * 0.25 + d * 0.15;
  }

  void main() {
    float dist = distance(cameraPosition, vWorld);
    // Le détail s'efface au loin : mer calme et propre à l'horizon, pas de scintillement.
    float detail = 1.0 - smoothstep(300.0, 1400.0, dist);
    float r = ripple(vWorld.xz, uTime) * detail;
    vec3 color = mix(uDeep, uShallow, 0.35 + r * 0.22);
    float glint = pow(max(0.0, r), 6.0) * 0.16;
    color = mix(color, uHighlight, glint);
    // cameraPosition est fourni par three.js ; brume vers l'horizon comme le reste de la scène.
    float fog = smoothstep(uFogNear, uFogFar, dist);
    color = mix(color, uHorizon, fog);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Le matériau est instancié ici (et non décrit en JSX) pour que ses uniforms soient
 * partagés par référence : les mises à jour de thème et de temps l'atteignent à coup sûr.
 */
function createWaterMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new Color() },
      uShallow: { value: new Color() },
      uHighlight: { value: new Color() },
      uHorizon: { value: new Color() },
      uFogNear: { value: 1 },
      uFogFar: { value: 2 },
    },
  });
}

function applyWaterTheme(material: ShaderMaterial, theme: MapTheme): void {
  const u = material.uniforms;
  (u.uDeep.value as Color).set(theme.oceanDeep);
  (u.uShallow.value as Color).set(theme.oceanShallow);
  (u.uHighlight.value as Color).set(theme.oceanHighlight);
  (u.uHorizon.value as Color).set(theme.horizon);
  u.uFogNear.value = theme.fog.near;
  u.uFogFar.value = theme.fog.far;
}

function tickWater(material: ShaderMaterial, delta: number): void {
  material.uniforms.uTime.value =
    (material.uniforms.uTime.value as number) + delta;
}

/** Océan : plan animé par un shader léger, teinté par le thème, fondu vers l'horizon. */
export default function Water() {
  const { theme } = useMapState();
  const material = useMemo(() => createWaterMaterial(), []);

  useEffect(() => applyWaterTheme(material, theme), [material, theme]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, delta) => tickWater(material, delta));

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={LAYER_Y.ocean}
      material={material}
    >
      <planeGeometry args={[30000, 30000]} />
    </mesh>
  );
}
