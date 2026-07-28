"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude } from "@react-three/drei";
import * as THREE from "three";
import { ACCENT, AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const R = 1.55; // радиус палитры
const THUMB = { x: 0.42, y: -0.52, r: 0.42 }; // отверстие для большого пальца

/**
 * Силуэт палитры — тот же, что у иконки услуги в шапке: почти круг с вырезом
 * под большой палец. Вырез сделан отверстием в фигуре, поэтому сквозь него
 * видно фон, как и положено палитре.
 */
function paletteShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(THUMB.x, THUMB.y, THUMB.r, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  return shape;
}

const EXTRUDE = {
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelSegments: 4,
  curveSegments: 32,
};

/**
 * Краски по дуге, как на иконке. Одна — фирменная зелёная, остальные приглушены:
 * акцент на сайте один, и палитра не должна с ним спорить.
 */
const PAINTS = [
  { x: -0.72, y: 0.78, color: ACCENT.color, accent: true },
  { x: 0.28, y: 0.98, color: "#4b5563", accent: false },
  { x: 1.0, y: 0.32, color: "#94a3b8", accent: false },
  { x: -1.05, y: -0.28, color: "#64748b", accent: false },
] as const;

/**
 * Дизайн и брендинг — палитра с красками, повторяющая иконку услуги в шапке.
 * Она покачивается, а не крутится: по кругу палитра быстро перестаёт читаться,
 * потому что узнаётся именно силуэтом с вырезом.
 */
export function BrandingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const paletteRef = useRef<THREE.Group>(null);
  const shape = useMemo(paletteShape, []);

  useFrame(({ clock }) => {
    const palette = paletteRef.current;
    if (!palette || !animate) return;
    const t = clock.getElapsedTime();
    palette.rotation.y = Math.sin(t * 0.4) * 0.46;
    palette.rotation.x = Math.sin(t * 0.63) * 0.12;
    palette.rotation.z = Math.sin(t * 0.33) * 0.07;
    palette.position.y = Math.sin(t * 0.85) * 0.07;
  });

  return (
    <group ref={groupRef}>
      <group ref={paletteRef} scale={1.32} rotation={[0, 0, 0.12]}>
        <Extrude args={[shape, EXTRUDE]} position={[0, 0, -EXTRUDE.depth / 2]}>
          <ChromeMaterial color="#e9eef4" roughness={0.28} />
        </Extrude>

        {PAINTS.map((paint) => (
          <mesh
            key={`${paint.x}-${paint.y}`}
            position={[paint.x, paint.y, EXTRUDE.depth / 2 + 0.06]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.27, 0.27, 0.12, 32]} />
            {paint.accent ? (
              <AccentMaterial />
            ) : (
              <ChromeMaterial color={paint.color} roughness={0.32} metalness={0.1} />
            )}
          </mesh>
        ))}
      </group>
    </group>
  );
}
