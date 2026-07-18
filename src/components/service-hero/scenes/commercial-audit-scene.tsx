"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import {
  AccentMaterial,
  ChromeMaterial,
  strokeShape,
  useIdleAnimation,
} from "../shared";

const BOARD_Z = 0.16;

const CHECK_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.12,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.025,
  bevelSegments: 2,
  curveSegments: 4,
};

/**
 * Commercial audit — a clipboard with a checked item and a rising bar chart
 * (conversion growth). The tallest bar and the checkmark are the brand accent.
 */
export function CommercialAuditScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const checkGeo = useMemo(() => {
    const shape = strokeShape(
      [
        [-0.24, 0.0],
        [-0.06, -0.2],
        [0.28, 0.28],
      ],
      0.12,
    );
    return new THREE.ExtrudeGeometry(shape, CHECK_EXTRUDE);
  }, []);

  useEffect(() => () => checkGeo.dispose(), [checkGeo]);

  return (
    <group ref={groupRef}>
      <group scale={1.12} rotation={[0.08, -0.28, 0]} position={[0, 0.1, 0]}>
        {/* Clipboard board. */}
        <RoundedBox args={[3.5, 4.5, 0.18]} radius={0.14} smoothness={5}>
          <ChromeMaterial />
        </RoundedBox>
        {/* Clip at the top. */}
        <RoundedBox args={[1.1, 0.5, 0.24]} radius={0.08} smoothness={4} position={[0, 2.35, 0.05]}>
          <ChromeMaterial color="#b7bfca" roughness={0.3} />
        </RoundedBox>

        {/* Checked line: accent check + text row. */}
        <mesh geometry={checkGeo} position={[-1.15, 1.35, BOARD_Z]}>
          <AccentMaterial />
        </mesh>
        <mesh position={[0.15, 1.35, BOARD_Z]}>
          <boxGeometry args={[2.0, 0.16, 0.05]} />
          <ChromeMaterial color="#9aa2ad" roughness={0.35} />
        </mesh>
        {[0.85, 0.5].map((y) => (
          <mesh key={y} position={[-0.1, y, BOARD_Z]}>
            <boxGeometry args={[2.4, 0.13, 0.04]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
        ))}

        {/* Rising bar chart — tallest bar is the accent. */}
        {[0.6, 1.0, 1.5].map((h, i) => (
          <mesh key={i} position={[-0.85 + i * 0.7, -1.35 + h / 2, BOARD_Z]}>
            <boxGeometry args={[0.46, h, 0.08]} />
            {i === 2 ? <AccentMaterial /> : <ChromeMaterial color="#aab2bd" roughness={0.34} />}
          </mesh>
        ))}
      </group>
    </group>
  );
}
