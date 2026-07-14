"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, Connector, useIdleAnimation } from "../shared";

type Vec3 = [number, number, number];

const BLOCKS: { pos: Vec3; size: number; accent?: boolean }[] = [
  { pos: [-2.5, -1.5, -0.3], size: 0.95 },
  { pos: [-1.25, -0.6, 0.05], size: 0.95 },
  { pos: [0, 0.25, 0.2], size: 1.15, accent: true },
  { pos: [1.25, 1.1, 0.05], size: 0.95 },
  { pos: [2.5, 1.95, -0.3], size: 0.95 },
];

/**
 * Blockchain — a chain of linked blocks climbing in an arc, wired end to end.
 * The central (current) block is larger and brand-green.
 */
export function BlockchainScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.1} rotation={[0.14, -0.24, 0]}>
        {BLOCKS.slice(0, -1).map((b, i) => (
          <Connector key={`l${i}`} from={b.pos} to={BLOCKS[i + 1].pos} radius={0.07} />
        ))}

        {BLOCKS.map((b, i) => (
          <RoundedBox
            key={`b${i}`}
            args={[b.size, b.size, b.size]}
            radius={0.14}
            smoothness={5}
            position={b.pos}
          >
            {b.accent ? <AccentMaterial /> : <ChromeMaterial />}
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}
