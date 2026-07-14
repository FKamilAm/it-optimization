"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AccentMaterial,
  ChromeMaterial,
  useIdleAnimation,
} from "../shared";

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.06,
  bevelSize: 0.045,
  bevelSegments: 4,
  curveSegments: 24,
};

/**
 * Classic "send" paper plane (Telegram dart) pointing up-right. Two extruded
 * shapes — the top wing and the shaded lower fold — give the origami read; a
 * short trail of shrinking spheres behind the tail reads as a sent message,
 * with the final dot in brand green as the single accent.
 */
function buildPlane() {
  // Dart silhouette, nose at +x, concave back — the recognisable send glyph.
  // The two halves share the exact nose (NOSE) and crease (CENTER) vertices and
  // use identical extrude settings, so their faces meet flush at the tip with no
  // step or protruding sliver.
  const NOSE: [number, number] = [2.3, 0];
  const CENTER: [number, number] = [-0.45, 0.14];

  const wing = new THREE.Shape();
  wing.moveTo(...NOSE);
  wing.lineTo(-1.9, 1.55);
  wing.lineTo(...CENTER);
  wing.lineTo(...NOSE);

  const fold = new THREE.Shape();
  fold.moveTo(...NOSE);
  fold.lineTo(...CENTER);
  fold.lineTo(-1.9, -1.55);
  fold.lineTo(...NOSE);

  const wingGeo = new THREE.ExtrudeGeometry(wing, EXTRUDE);
  const foldGeo = new THREE.ExtrudeGeometry(fold, EXTRUDE);

  // Centre the pair on the origin so the group rotates in place.
  const box = new THREE.Box3();
  for (const g of [wingGeo, foldGeo]) {
    g.computeBoundingBox();
    if (g.boundingBox) box.union(g.boundingBox);
  }
  const c = box.getCenter(new THREE.Vector3());
  wingGeo.translate(-c.x, -c.y, -c.z);
  foldGeo.translate(-c.x, -c.y, -c.z);

  return { wingGeo, foldGeo };
}

export function TelegramScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const { wingGeo, foldGeo } = useMemo(buildPlane, []);

  useEffect(() => {
    return () => {
      wingGeo.dispose();
      foldGeo.dispose();
    };
  }, [wingGeo, foldGeo]);

  // Trail dots behind the tail, receding down-left along the flight line.
  // Kept fairly compact so the whole composition fits without a re-fitting
  // <Bounds> (which caused the size to pulse as the plane rotated).
  const trail = useMemo(
    () => [
      { pos: [-2.35, -0.95, -0.1] as const, r: 0.24, accent: false },
      { pos: [-2.95, -1.4, -0.2] as const, r: 0.17, accent: false },
      { pos: [-3.45, -1.78, -0.3] as const, r: 0.12, accent: true },
    ],
    [],
  );

  return (
    <group ref={groupRef}>
      {/* Fixed scale (no auto-fit) → stable size; base pose tilts the plane into
          a calm up-right ascent. The inner offset recentres the plane+trail on
          the origin so the idle rotation pivots around the composition. */}
      <group scale={1.15} rotation={[0.24, -0.3, 0.24]}>
        <group position={[0.55, 0.3, 0]}>
          <mesh geometry={wingGeo}>
            <ChromeMaterial />
          </mesh>
          <mesh geometry={foldGeo}>
            <ChromeMaterial color="#aab2be" roughness={0.3} />
          </mesh>

          {trail.map((dot, i) => (
            <mesh key={i} position={dot.pos}>
              <sphereGeometry args={[dot.r, 32, 32]} />
              {dot.accent ? <AccentMaterial /> : <ChromeMaterial />}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
