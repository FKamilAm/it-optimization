"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const GLASS = {
  color: "#0a0e16",
  metalness: 0.4,
  roughness: 0.05,
  transparent: true,
  opacity: 0.55,
  envMapIntensity: 1.6,
} as const;

const PAGE_Z = 0.13;

/**
 * Content analysis — a page of text with a small bar chart, examined through a
 * chrome magnifier. The accent is the rising bar under the lens (growth/insight).
 */
export function ContentAnalysisScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.08, -0.26, 0]} position={[0, 0.45, 0]}>
        {/* Page. */}
        <RoundedBox args={[3.6, 4.4, 0.16]} radius={0.12} smoothness={5} rotation={[0, 0.12, 0]}>
          <ChromeMaterial color="#cdd4dd" />
        </RoundedBox>

        {/* Text lines. */}
        {[1.55, 1.2, 0.85, 0.5].map((y, i) => (
          <mesh key={y} position={[-0.2, y, PAGE_Z]} rotation={[0, 0.12, 0]}>
            <boxGeometry args={[2.6 - (i % 2) * 0.7, 0.16, 0.04]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
        ))}

        {/* Mini bar chart on the page. */}
        {[0.5, 0.85, 1.25].map((h, i) => (
          <mesh key={i} position={[-0.9 + i * 0.55, -1.1 + h / 2, PAGE_Z]} rotation={[0, 0.12, 0]}>
            <boxGeometry args={[0.36, h, 0.06]} />
            {i === 2 ? <AccentMaterial /> : <ChromeMaterial color="#aab2bd" roughness={0.34} />}
          </mesh>
        ))}

        {/* ---- Magnifier ---- */}
        <group position={[1.05, 0.1, 0.9]} rotation={[0, 0, -0.5]}>
          {/* Rim. */}
          <mesh>
            <torusGeometry args={[1.0, 0.13, 24, 64]} />
            <ChromeMaterial />
          </mesh>
          {/* Glass. */}
          <mesh>
            <circleGeometry args={[0.97, 48]} />
            <meshStandardMaterial {...GLASS} />
          </mesh>
          {/* Handle. */}
          <mesh position={[0, -1.6, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 1.25, 24]} />
            <ChromeMaterial color="#b7bfca" />
          </mesh>
          <mesh position={[0, -2.32, 0]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <ChromeMaterial color="#b7bfca" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
