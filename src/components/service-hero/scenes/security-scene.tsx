"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

/**
 * Security audit — a chrome padlock: a rounded body under a half-torus shackle,
 * with the keyhole picked out in brand green.
 *
 * Deliberately not a shield: the IT-support scene already uses one, and two
 * services sharing a silhouette in the same series would read as a mistake.
 * A padlock is unmistakably about access, which is what the audit is about.
 */
export function SecurityScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.06, -0.3, 0]} position={[0, -0.15, 0]}>
        {/* Shackle: half ring + two straight legs sunk into the body. */}
        <mesh position={[0, 1.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.17, 20, 40, Math.PI]} />
          <ChromeMaterial />
        </mesh>
        {[-0.78, 0.78].map((x) => (
          <mesh key={x} position={[x, 0.95, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.72, 20]} />
            <ChromeMaterial />
          </mesh>
        ))}

        {/* Lock body. */}
        <RoundedBox args={[2.7, 2.1, 0.9]} radius={0.22} smoothness={5}>
          <ChromeMaterial />
        </RoundedBox>

        {/* Keyhole — the single accent: a disc with a tapered slot below it. */}
        <mesh position={[0, 0.12, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 24]} />
          <AccentMaterial />
        </mesh>
        <mesh position={[0, -0.36, 0.46]}>
          <boxGeometry args={[0.24, 0.62, 0.12]} />
          <AccentMaterial />
        </mesh>
      </group>
    </group>
  );
}
