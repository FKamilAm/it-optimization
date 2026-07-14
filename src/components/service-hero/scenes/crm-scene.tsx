"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, Connector, useIdleAnimation } from "../shared";

type Node = { pos: [number, number, number]; r: number; accent?: boolean };

/**
 * CRM / platforms — a central hub node with satellite nodes (clients, deals,
 * roles…) wired to it, reading as a single connected system. One satellite is
 * the brand-green accent.
 */
export function CrmScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const nodes = useMemo<Node[]>(
    () => [
      { pos: [2.25, 1.05, 0.4], r: 0.44 },
      { pos: [-2.35, 0.95, -0.5], r: 0.4 },
      { pos: [1.7, -1.75, 0.55], r: 0.42 },
      { pos: [-1.85, -1.55, 0.25], r: 0.38 },
      { pos: [0.15, 2.3, -0.55], r: 0.46, accent: true },
    ],
    [],
  );

  return (
    <group ref={groupRef}>
      <group scale={1.1} rotation={[0.12, -0.32, 0]}>
        {nodes.map((n, i) => (
          <Connector key={`c${i}`} from={[0, 0, 0]} to={n.pos} radius={0.055} />
        ))}

        <RoundedBox args={[1.35, 1.35, 1.35]} radius={0.2} smoothness={5}>
          <ChromeMaterial />
        </RoundedBox>

        {nodes.map((n, i) => (
          <mesh key={`n${i}`} position={n.pos}>
            <sphereGeometry args={[n.r, 40, 40]} />
            {n.accent ? <AccentMaterial /> : <ChromeMaterial />}
          </mesh>
        ))}
      </group>
    </group>
  );
}
