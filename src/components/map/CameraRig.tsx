"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

import { useMapState } from "./store";

/** Le strict nécessaire des MapControls (évite d'importer three-stdlib). */
type ControlsLike = { readonly target: Vector3; update(): void };

type Flight = {
  readonly fromTarget: Vector3;
  readonly fromPosition: Vector3;
  readonly toTarget: Vector3;
  readonly toPosition: Vector3;
  readonly start: number;
  readonly duration: number;
  readonly nonce: number;
};

const PITCH = MathUtils.degToRad(52);
const DEFAULT_DIRECTION = new Vector3(-0.55, 0, 0.45).normalize();

/** Vols de caméra fluides vers une cible (POI, recentrage), en gardant l'orientation courante. */
export default function CameraRig() {
  const { flyTo } = useMapState();
  const controls = useThree(
    (state) => state.controls,
  ) as unknown as ControlsLike | null;
  const camera = useThree((state) => state.camera);
  const flight = useRef<Flight | null>(null);
  const lastNonce = useRef(0);

  useEffect(() => {
    if (!controls || lastNonce.current === flyTo.nonce) return;
    lastNonce.current = flyTo.nonce;

    const toTarget = new Vector3(flyTo.x, 0, flyTo.z);
    const heading = camera.position.clone().sub(controls.target).setY(0);
    if (heading.lengthSq() < 1) heading.copy(DEFAULT_DIRECTION);
    heading.normalize();
    const offset = heading
      .multiplyScalar(Math.cos(PITCH) * flyTo.distance)
      .setY(Math.sin(PITCH) * flyTo.distance);

    flight.current = {
      fromTarget: controls.target.clone(),
      fromPosition: camera.position.clone(),
      toTarget,
      toPosition: toTarget.clone().add(offset),
      start: performance.now(),
      duration: flyTo.nonce === 1 ? 2600 : 1400,
      nonce: flyTo.nonce,
    };
  }, [flyTo, controls, camera]);

  useFrame(() => {
    const current = flight.current;
    if (!current || !controls) return;
    const t = Math.min(
      1,
      (performance.now() - current.start) / current.duration,
    );
    const eased = 1 - Math.pow(1 - t, 3);
    controls.target.lerpVectors(current.fromTarget, current.toTarget, eased);
    camera.position.lerpVectors(
      current.fromPosition,
      current.toPosition,
      eased,
    );
    controls.update();
    if (t >= 1) flight.current = null;
  });

  return null;
}
