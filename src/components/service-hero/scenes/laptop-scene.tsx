"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const GLASS = {
  color: "#06080d",
  metalness: 0.72,
  roughness: 0.07,
  envMapIntensity: 1.7,
} as const;

const SW = 5.4;
const SH = 3.5;
const UI_Z = 0.11;
const GX = 4.4;

/**
 * Turnkey website — an open laptop (MacBook-style): a tilted display on a
 * horizontal deck, showing a live site (browser bar, hero, text lines, accent
 * CTA). A different device silhouette from the iMac/monitor scenes.
 */
export function LaptopScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.15} rotation={[0.08, -0.3, 0]} position={[0, 0.2, 0]}>
        {/* ---- Screen (slight backward tilt) ---- */}
        <group position={[0, 0.95, -1.1]} rotation={[-0.12, 0, 0]}>
          <RoundedBox args={[SW, SH, 0.16]} radius={0.1} smoothness={5}>
            <ChromeMaterial color="#c2c9d3" />
          </RoundedBox>
          <RoundedBox args={[SW - 0.28, SH - 0.28, 0.05]} radius={0.07} smoothness={4} position={[0, 0, 0.08]}>
            <meshStandardMaterial {...GLASS} />
          </RoundedBox>

          {/* Browser bar + traffic lights + accent CTA. */}
          <mesh position={[0, SH / 2 - 0.42, UI_Z]}>
            <boxGeometry args={[GX, 0.34, 0.05]} />
            <ChromeMaterial color="#8b939f" roughness={0.34} />
          </mesh>
          {[0, 1, 2].map((d) => (
            <mesh key={d} position={[-GX / 2 + 0.28 + d * 0.26, SH / 2 - 0.42, UI_Z + 0.04]}>
              <sphereGeometry args={[0.07, 18, 18]} />
              <ChromeMaterial color="#e2e8f0" roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[GX / 2 - 0.55, SH / 2 - 0.42, UI_Z + 0.04]}>
            <boxGeometry args={[0.8, 0.2, 0.05]} />
            <AccentMaterial />
          </mesh>

          {/* Hero block. */}
          <RoundedBox args={[GX - 0.2, 0.9, 0.05]} radius={0.08} smoothness={4} position={[0, 0.2, UI_Z]}>
            <ChromeMaterial color="#e2e8f0" roughness={0.28} />
          </RoundedBox>
          {/* Text lines. */}
          <mesh position={[-0.7, -0.7, UI_Z]}>
            <boxGeometry args={[2.6, 0.14, 0.04]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
          <mesh position={[-1.05, -0.98, UI_Z]}>
            <boxGeometry args={[1.9, 0.14, 0.04]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
        </group>

        {/* ---- Deck (keyboard base), laid flat ---- */}
        <group position={[0, -1.05, 0.5]} rotation={[-Math.PI / 2 + 0.16, 0, 0]}>
          <RoundedBox args={[SW + 0.1, 3.4, 0.16]} radius={0.12} smoothness={5}>
            <ChromeMaterial color="#b7bfca" />
          </RoundedBox>
          {/* Trackpad hint. */}
          <RoundedBox args={[1.6, 1.0, 0.03]} radius={0.06} smoothness={4} position={[0, -0.85, 0.1]}>
            <ChromeMaterial color="#aab2bd" roughness={0.4} />
          </RoundedBox>
        </group>
      </group>
    </group>
  );
}
