"use client";

import { useMemo } from "react";
import { AccentMaterial, ChromeMaterial, Connector, useIdleAnimation } from "../shared";

type Vec3 = [number, number, number];

const NODES: Vec3[] = [
  [0, 0, 0], // 0 — central accent node
  [1.95, 1.2, 0.5],
  [-2.05, 1.0, -0.4],
  [2.1, -1.15, -0.3],
  [-1.8, -1.35, 0.55],
  [0.35, 2.25, -0.6],
  [-0.45, -2.25, 0.4],
  [1.25, 0.15, -1.35],
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [1, 5],
  [2, 5],
  [3, 7],
  [4, 6],
  [1, 3],
];

/**
 * AI — a neural mesh: nodes wired into a small network, with the central node
 * pulsing brand-green as the "core" while the rest stay chrome.
 */
export function AiScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const nodeR = useMemo(() => NODES.map((_, i) => (i === 0 ? 0.42 : 0.26)), []);

  return (
    <group ref={groupRef}>
      <group scale={1.1} rotation={[0.1, -0.3, 0]}>
        {EDGES.map(([a, b], i) => (
          <Connector key={`e${i}`} from={NODES[a]} to={NODES[b]} radius={0.035} />
        ))}

        {NODES.map((pos, i) => (
          <mesh key={`n${i}`} position={pos}>
            <sphereGeometry args={[nodeR[i], 36, 36]} />
            {i === 0 ? <AccentMaterial /> : <ChromeMaterial />}
          </mesh>
        ))}
      </group>
    </group>
  );
}
