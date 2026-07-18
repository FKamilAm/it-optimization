"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

/**
 * B2B website — a chrome briefcase (the business/partner metaphor) with a top
 * handle and a brand-green latch. Reads clearly as "for business" and stays
 * distinct from the consumer-facing website scenes.
 */
export function B2bScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.2} rotation={[0.12, -0.32, 0]} position={[0, 0.1, 0]}>
        {/* Case body. */}
        <RoundedBox args={[4.0, 2.9, 1.1]} radius={0.2} smoothness={6}>
          <ChromeMaterial />
        </RoundedBox>
        {/* Lid seam. */}
        <mesh position={[0, 0.55, 0.56]}>
          <boxGeometry args={[4.0, 0.06, 0.04]} />
          <ChromeMaterial color="#8b939f" roughness={0.4} />
        </mesh>

        {/* Handle (upper half-torus arching over the top). */}
        <mesh position={[0, 1.42, 0]}>
          <torusGeometry args={[0.62, 0.11, 20, 48, Math.PI]} />
          <ChromeMaterial color="#c8ced6" roughness={0.28} />
        </mesh>

        {/* Two latches — the left one is the accent. */}
        {[-0.9, 0.9].map((x, i) => (
          <RoundedBox
            key={x}
            args={[0.5, 0.34, 0.12]}
            radius={0.05}
            smoothness={4}
            position={[x, 0.55, 0.6]}
          >
            {i === 0 ? <AccentMaterial /> : <ChromeMaterial color="#b7bfca" roughness={0.3} />}
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}
