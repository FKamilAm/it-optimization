"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const GLASS = {
  color: "#06080d",
  metalness: 0.72,
  roughness: 0.07,
  envMapIntensity: 1.7,
} as const;

const W = 6.4;
const H = 3.7;
const UI_Z = 0.19;
const GX = 5.6;

/**
 * Corporate website — a widescreen desktop monitor on a central pillar stand,
 * showing a multi-section corporate site (nav bar, hero block, a row of three
 * cards). The accent is the primary CTA in the nav.
 */
export function CorporateScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.05, -0.24, 0]} position={[0, 0.5, 0]}>
        {/* Monitor body. */}
        <RoundedBox args={[W, H, 0.26]} radius={0.14} smoothness={6}>
          <ChromeMaterial color="#c2c9d3" />
        </RoundedBox>
        {/* Glossy display. */}
        <RoundedBox args={[W - 0.34, H - 0.34, 0.05]} radius={0.08} smoothness={5} position={[0, 0, 0.13]}>
          <meshStandardMaterial {...GLASS} />
        </RoundedBox>

        {/* Nav bar. */}
        <mesh position={[0, H / 2 - 0.62, UI_Z]}>
          <boxGeometry args={[GX, 0.34, 0.05]} />
          <ChromeMaterial color="#8b939f" roughness={0.34} />
        </mesh>
        <mesh position={[-GX / 2 + 0.35, H / 2 - 0.62, UI_Z + 0.04]}>
          <sphereGeometry args={[0.1, 20, 20]} />
          <ChromeMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[GX / 2 - 0.6, H / 2 - 0.62, UI_Z + 0.04]}>
          <boxGeometry args={[0.9, 0.2, 0.05]} />
          <AccentMaterial />
        </mesh>

        {/* Hero block. */}
        <RoundedBox args={[GX, 1.1, 0.05]} radius={0.08} smoothness={4} position={[0, 0.42, UI_Z]}>
          <ChromeMaterial color="#e2e8f0" roughness={0.28} />
        </RoundedBox>

        {/* Row of three cards. */}
        {[-1, 0, 1].map((c) => (
          <RoundedBox
            key={c}
            args={[1.7, 0.95, 0.05]}
            radius={0.08}
            smoothness={4}
            position={[c * 1.9, -0.85, UI_Z]}
          >
            <ChromeMaterial color="#9aa2ad" roughness={0.34} />
          </RoundedBox>
        ))}

        {/* Central pillar stand + base. */}
        <mesh position={[0, -2.35, -0.05]}>
          <boxGeometry args={[0.5, 0.9, 0.35]} />
          <ChromeMaterial color="#b7bfca" />
        </mesh>
        <RoundedBox args={[2.6, 0.16, 1.1]} radius={0.08} smoothness={5} position={[0, -2.85, 0.1]}>
          <ChromeMaterial color="#b7bfca" />
        </RoundedBox>
      </group>
    </group>
  );
}
