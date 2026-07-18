"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const CARD_Z = 0.14;

// A compact QR-like grid of small tiles in the bottom-right corner.
const QR: [number, number][] = [];
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    if ((i + j) % 2 === 0 || (i === 0 && j === 3) || (i === 3 && j === 1)) {
      QR.push([i, j]);
    }
  }
}

/**
 * Business-card website — a single premium card standing at a slight angle:
 * an avatar disc, a couple of contact text lines and a QR block. The avatar is
 * the brand-green accent.
 */
export function BusinessCardScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.35} rotation={[0.06, -0.34, 0.04]} position={[0, 0.1, 0]}>
        {/* Card plate. */}
        <RoundedBox args={[4.4, 2.7, 0.16]} radius={0.16} smoothness={6}>
          <ChromeMaterial />
        </RoundedBox>

        {/* Accent avatar disc. */}
        <mesh position={[-1.4, 0.62, CARD_Z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.06, 40]} />
          <AccentMaterial />
        </mesh>

        {/* Name + role text lines. */}
        <mesh position={[0.35, 0.78, CARD_Z]}>
          <boxGeometry args={[2.0, 0.2, 0.05]} />
          <ChromeMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0.05, 0.46, CARD_Z]}>
          <boxGeometry args={[1.4, 0.14, 0.05]} />
          <ChromeMaterial color="#9aa2ad" roughness={0.35} />
        </mesh>

        {/* Contact lines. */}
        {[-0.35, -0.7].map((y, i) => (
          <mesh key={y} position={[-0.75 + i * 0.15, y, CARD_Z]}>
            <boxGeometry args={[2.4 - i * 0.6, 0.13, 0.05]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
        ))}

        {/* QR block, bottom-right. */}
        <group position={[1.35, -0.55, CARD_Z]}>
          {QR.map(([i, j]) => (
            <mesh key={`${i}-${j}`} position={[j * 0.19 - 0.28, i * 0.19 - 0.28, 0]}>
              <boxGeometry args={[0.16, 0.16, 0.05]} />
              <ChromeMaterial color="#cdd4dd" roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
