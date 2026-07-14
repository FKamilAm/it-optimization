"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AccentMaterial,
  ChromeMaterial,
  shieldShape,
  strokeShape,
  useIdleAnimation,
} from "../shared";

const SHIELD_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.55,
  bevelEnabled: true,
  bevelThickness: 0.09,
  bevelSize: 0.08,
  bevelSegments: 4,
  curveSegments: 24,
};

const CHECK_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.03,
  bevelSegments: 2,
  curveSegments: 4,
};

/**
 * IT support — a chrome shield (stability / protection) ringed by an open cycle
 * arc (continuous 24/7 upkeep), with a brand-green check on its face.
 */
export function SupportScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const shieldGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shieldShape(2.6, 3.4), SHIELD_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  // Single-piece checkmark — one mitered stroke, so the corner is flush.
  const checkGeo = useMemo(() => {
    const shape = strokeShape(
      [
        [-0.62, 0.02],
        [-0.16, -0.5],
        [0.72, 0.72],
      ],
      0.3,
    );
    return new THREE.ExtrudeGeometry(shape, CHECK_EXTRUDE);
  }, []);

  useEffect(() => {
    return () => {
      shieldGeo.dispose();
      checkGeo.dispose();
    };
  }, [shieldGeo, checkGeo]);

  const faceZ = 0.55 / 2 + SHIELD_EXTRUDE.bevelThickness! + 0.02;

  return (
    <group ref={groupRef}>
      <group scale={1.2} rotation={[0.1, -0.28, 0]}>
        {/* Continuous cycle ring wrapping the shield (full closed loop). */}
        <mesh rotation={[0.5, -0.35, 0.3]} position={[0, 0, -0.35]}>
          <torusGeometry args={[2.2, 0.11, 24, 96]} />
          <ChromeMaterial color="#b7bfca" />
        </mesh>

        <mesh geometry={shieldGeo}>
          <ChromeMaterial />
        </mesh>

        {/* Accent check mark on the shield face. */}
        <mesh geometry={checkGeo} position={[0, 0.05, faceZ]}>
          <AccentMaterial />
        </mesh>
      </group>
    </group>
  );
}
