"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import {
  AccentMaterial,
  ChromeMaterial,
  gearShape,
  strokeShape,
  useIdleAnimation,
} from "../shared";

const PAGE_Z = 0.14;

const TAG_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.14,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.025,
  bevelSegments: 2,
  curveSegments: 4,
};

const GEAR_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.4,
  bevelEnabled: true,
  bevelThickness: 0.06,
  bevelSize: 0.05,
  bevelSegments: 3,
  curveSegments: 16,
};

/**
 * Technical content — a structured document (metatags / headings as text rows)
 * carrying an accent code tag "</>", with a chrome gear behind it signalling the
 * technical / under-the-hood side (markup, indexing, structure).
 */
export function TechContentScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const gearGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(gearShape(12, 0.95, 0.32, 0.42), GEAR_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  // "</>" built from three mitered strokes.
  const tagGeos = useMemo(() => {
    const left = strokeShape(
      [
        [0.28, 0.4],
        [-0.28, 0],
        [0.28, -0.4],
      ],
      0.14,
    );
    const slash = strokeShape(
      [
        [-0.22, -0.5],
        [0.22, 0.5],
      ],
      0.14,
    );
    const right = strokeShape(
      [
        [-0.28, 0.4],
        [0.28, 0],
        [-0.28, -0.4],
      ],
      0.14,
    );
    return [left, slash, right].map((s) => new THREE.ExtrudeGeometry(s, TAG_EXTRUDE));
  }, []);

  useEffect(() => {
    return () => {
      gearGeo.dispose();
      tagGeos.forEach((g) => g.dispose());
    };
  }, [gearGeo, tagGeos]);

  return (
    <group ref={groupRef}>
      <group scale={1.1} rotation={[0.08, -0.28, 0]} position={[0, 0.1, 0]}>
        {/* Chrome gear behind the document. */}
        <mesh geometry={gearGeo} position={[1.5, 1.45, -0.6]}>
          <ChromeMaterial color="#b7bfca" />
        </mesh>

        {/* Document. */}
        <RoundedBox args={[3.4, 4.4, 0.16]} radius={0.12} smoothness={5}>
          <ChromeMaterial />
        </RoundedBox>

        {/* Heading + text rows. */}
        <mesh position={[-0.35, 1.5, PAGE_Z]}>
          <boxGeometry args={[2.0, 0.24, 0.05]} />
          <ChromeMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        {[1.05, 0.72, 0.39].map((y, i) => (
          <mesh key={y} position={[-0.5 + (i % 2) * 0.2, y, PAGE_Z]}>
            <boxGeometry args={[2.2 - (i % 2) * 0.6, 0.14, 0.04]} />
            <ChromeMaterial color="#9aa2ad" roughness={0.35} />
          </mesh>
        ))}

        {/* Accent "</>" tag on the lower half. */}
        <group position={[0, -0.9, PAGE_Z + 0.05]} scale={0.95}>
          {tagGeos.map((geo, i) => (
            <mesh key={i} geometry={geo} position={[[-0.75, 0, 0.75][i], 0, 0]}>
              <AccentMaterial />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
