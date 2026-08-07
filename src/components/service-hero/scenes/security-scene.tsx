"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

/**
 * Security audit — a chrome padlock: a rounded body under a round shackle, with
 * the keyhole picked out in brand green.
 *
 * The shackle is a half-torus and must stay in the XY plane, which is where a
 * torus lies by default. Rotating it by π/2 lays the arc flat into XZ, and from
 * the scene camera that reads as a flat bent bar — a briefcase handle rather
 * than a lock. Two short cylinders continue the arc down into the body so the
 * shackle looks seated instead of floating.
 *
 * Deliberately not a shield: the IT-support scene already uses one, and two
 * services sharing a silhouette in the same series would read as a mistake.
 */
export function SecurityScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const SHACKLE_R = 0.82;
  const SHACKLE_TUBE = 0.19;

  return (
    <group ref={groupRef}>
      <group scale={1.42} rotation={[0.05, -0.26, 0]} position={[0, -0.2, 0]}>
        {/* Shackle: upper half ring, left in the XY plane. */}
        <mesh position={[0, 1.12, 0]}>
          <torusGeometry args={[SHACKLE_R, SHACKLE_TUBE, 24, 48, Math.PI]} />
          <ChromeMaterial />
        </mesh>
        {/* Straight legs from the ring ends down into the body. */}
        {[-SHACKLE_R, SHACKLE_R].map((x) => (
          <mesh key={x} position={[x, 0.83, 0]}>
            <cylinderGeometry args={[SHACKLE_TUBE, SHACKLE_TUBE, 0.62, 24]} />
            <ChromeMaterial />
          </mesh>
        ))}

        {/* Lock body. */}
        <RoundedBox args={[2.5, 1.95, 0.85]} radius={0.2} smoothness={5}>
          <ChromeMaterial />
        </RoundedBox>

        {/* Keyhole — the single accent: a disc with a tapered slot below it. */}
        <mesh position={[0, 0.14, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.1, 24]} />
          <AccentMaterial />
        </mesh>
        <mesh position={[0, -0.32, 0.44]}>
          <boxGeometry args={[0.22, 0.58, 0.1]} />
          <AccentMaterial />
        </mesh>
      </group>
    </group>
  );
}
