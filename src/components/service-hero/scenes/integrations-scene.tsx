"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ChromeMaterial, gearShape, useIdleAnimation } from "../shared";

const GEAR_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.04,
  bevelSegments: 2,
  curveSegments: 8,
};

function useGearGeometry(teeth: number, root: number, tooth: number, bore: number) {
  return useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(gearShape(teeth, root, tooth, bore), GEAR_EXTRUDE);
    geo.translate(0, 0, -GEAR_EXTRUDE.depth! / 2);
    return geo;
  }, [teeth, root, tooth, bore]);
}

/**
 * Integrations — two interlocking gears (systems stitched together) turning in
 * opposite directions at their tooth ratio.
 */
export function IntegrationsScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const bigRef = useRef<THREE.Group>(null);
  const smallRef = useRef<THREE.Group>(null);

  const bigGeo = useGearGeometry(12, 1.15, 0.3, 0.42);
  const smallGeo = useGearGeometry(9, 0.82, 0.28, 0.3);

  useEffect(() => {
    return () => {
      bigGeo.dispose();
      smallGeo.dispose();
    };
  }, [bigGeo, smallGeo]);

  useFrame((_, delta) => {
    if (!animate) return;
    const d = Math.min(delta, 0.05);
    if (bigRef.current) bigRef.current.rotation.z += d * 0.35;
    // Counter-rotate at the gear ratio (teeth 12 : 9) for a believable mesh.
    if (smallRef.current) smallRef.current.rotation.z -= d * 0.35 * (12 / 9);
  });

  return (
    <group ref={groupRef}>
      <group scale={1.4} rotation={[0.16, -0.12, 0]}>
        <group ref={bigRef} position={[-0.95, 0.35, 0]}>
          <mesh geometry={bigGeo}>
            <ChromeMaterial />
          </mesh>
        </group>

        <group ref={smallRef} position={[1.05, -0.65, 0.15]} rotation={[0, 0, Math.PI / 9]}>
          <mesh geometry={smallGeo}>
            <ChromeMaterial color="#b7bfca" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
