"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

// Glossy near-black glass for the display.
const GLASS = {
  color: "#06080d",
  metalness: 0.72,
  roughness: 0.07,
  envMapIntensity: 1.7,
} as const;

const BODY_W = 5.4;
const BODY_H = 3.6;
const GLASS_Y = 0.14; // display shifted up → leaves an aluminium "chin" below
const UI_Z = 0.24; // on-screen UI sits on the glass
const GX = 4.4; // usable content width on the glass

/**
 * Websites — a realistic all-in-one computer (iMac-style): aluminium body on a
 * neck + foot stand, glossy display with a chin, showing a live website layout
 * (browser bar with traffic-light dots, accent CTA, hero block, text lines).
 */
export function WebsitesScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      {/* Whole assembly nudged up so the monitor+stand reads centred. */}
      <group scale={1.25} rotation={[0.05, -0.26, 0]} position={[0, 0.55, 0]}>
        {/* Aluminium body. */}
        <RoundedBox args={[BODY_W, BODY_H, 0.34]} radius={0.18} smoothness={6}>
          <ChromeMaterial color="#c2c9d3" />
        </RoundedBox>

        {/* Glossy display glass (shifted up for the bottom chin). */}
        <RoundedBox
          args={[BODY_W - 0.3, BODY_H - 0.6, 0.05]}
          radius={0.1}
          smoothness={5}
          position={[0, GLASS_Y, 0.16]}
        >
          <meshStandardMaterial {...GLASS} />
        </RoundedBox>

        {/* Chin logo. */}
        <mesh position={[0, -1.5, 0.19]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 32]} />
          <ChromeMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>

        {/* ---- On-screen website ---- */}
        {/* Browser top bar. */}
        <mesh position={[0, GLASS_Y + 1.05, UI_Z]}>
          <boxGeometry args={[GX, 0.42, 0.05]} />
          <ChromeMaterial color="#8b939f" roughness={0.34} />
        </mesh>
        {[0, 1, 2].map((d) => (
          <mesh
            key={d}
            position={[-GX / 2 + 0.32 + d * 0.3, GLASS_Y + 1.05, UI_Z + 0.04]}
          >
            <sphereGeometry args={[0.08, 20, 20]} />
            <ChromeMaterial color="#e2e8f0" roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[GX / 2 - 0.62, GLASS_Y + 1.05, UI_Z + 0.04]}>
          <boxGeometry args={[0.85, 0.22, 0.05]} />
          <AccentMaterial />
        </mesh>

        {/* Hero block. */}
        <RoundedBox
          args={[GX - 0.2, 1.0, 0.05]}
          radius={0.1}
          smoothness={4}
          position={[0, GLASS_Y + 0.2, UI_Z]}
        >
          <ChromeMaterial color="#e2e8f0" roughness={0.28} />
        </RoundedBox>
        {/* Text lines. */}
        <mesh position={[-0.75, GLASS_Y - 0.62, UI_Z]}>
          <boxGeometry args={[2.6, 0.16, 0.04]} />
          <ChromeMaterial color="#9aa2ad" roughness={0.35} />
        </mesh>
        <mesh position={[-1.1, GLASS_Y - 0.92, UI_Z]}>
          <boxGeometry args={[1.9, 0.16, 0.04]} />
          <ChromeMaterial color="#9aa2ad" roughness={0.35} />
        </mesh>

        {/* ---- Stand ---- */}
        {/* Neck. */}
        <mesh position={[0, -2.32, -0.05]}>
          <boxGeometry args={[0.6, 1.0, 0.4]} />
          <ChromeMaterial color="#b7bfca" />
        </mesh>
        {/* Foot. */}
        <RoundedBox
          args={[2.5, 0.18, 1.1]}
          radius={0.09}
          smoothness={5}
          position={[0, -2.9, 0.1]}
        >
          <ChromeMaterial color="#b7bfca" />
        </RoundedBox>
      </group>
    </group>
  );
}
