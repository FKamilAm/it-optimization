"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, roundedRectShape, useIdleAnimation } from "../shared";

const ICON_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.14,
  bevelSize: 0.12,
  bevelSegments: 5,
  curveSegments: 32,
};

const ARROW_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.18,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.04,
  bevelSegments: 3,
  curveSegments: 6,
};

// Download glyph: a down-pointing arrow (shaft + head) centred on the origin.
function downArrowShape() {
  const sw = 0.34; // shaft half-width
  const hw = 0.92; // arrow-head half-width
  const top = 0.9;
  const headTop = 0.0;
  const tip = -0.78;
  const s = new THREE.Shape();
  s.moveTo(-sw, top);
  s.lineTo(sw, top);
  s.lineTo(sw, headTop);
  s.lineTo(hw, headTop);
  s.lineTo(0, tip);
  s.lineTo(-hw, headTop);
  s.lineTo(-sw, headTop);
  s.closePath();
  return s;
}

/**
 * Mobile apps — a chunky app-icon "squircle" (extruded rounded square, chrome)
 * with a brand-green download glyph (arrow + tray) on its face: the universal
 * symbol of installing a mobile app.
 */
export function MobileScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const iconGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roundedRectShape(3.3, 3.3, 0.82), ICON_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  const arrowGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(downArrowShape(), ARROW_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      iconGeo.dispose();
      arrowGeo.dispose();
    };
  }, [iconGeo, arrowGeo]);

  // Front face of the icon (half depth + bevel) — glyph sits just proud of it.
  const faceZ = ICON_EXTRUDE.depth! / 2 + ICON_EXTRUDE.bevelThickness! + 0.14;

  return (
    <group ref={groupRef}>
      <group scale={1.6} rotation={[0.05, -0.3, 0.02]}>
        {/* App-icon tile. */}
        <mesh geometry={iconGeo}>
          <ChromeMaterial />
        </mesh>

        {/* Download arrow. */}
        <mesh geometry={arrowGeo} position={[0, 0.28, faceZ]}>
          <AccentMaterial />
        </mesh>

        {/* Download tray / base line. */}
        <mesh position={[0, -0.95, faceZ]}>
          <boxGeometry args={[1.5, 0.22, 0.18]} />
          <AccentMaterial />
        </mesh>
      </group>
    </group>
  );
}
