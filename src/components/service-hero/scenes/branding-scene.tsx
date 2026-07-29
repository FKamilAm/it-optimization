"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude } from "@react-three/drei";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const R = 1.95; // радиус палитры
const THUMB = { x: -0.34, y: -0.9, r: 0.5 }; // отверстие для большого пальца

/**
 * Силуэт палитры — круг с отверстием под большой палец. Залив по краю пробовали
 * вырезать второй окружностью: математически контур замыкался верно, но при
 * повороте срез читался как обрезанная модель, поэтому форма оставлена цельной.
 * Палитру здесь опознают отверстие, краски и кисть, а не изгиб края.
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
  depth: 0.28,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelSegments: 4,
  curveSegments: 32,
};

/**
 * Краски по дуге, как на палитре художника. Одна фирменная зелёная, остальные
 * приглушены: акцент на сайте один, и палитра не должна с ним спорить.
 */
const PAINTS = [
  { x: -0.95, y: 0.82, accent: true, color: "#b4e02d" },
  { x: 0.2, y: 1.2, accent: false, color: "#475569" },
  { x: 1.2, y: 0.42, accent: false, color: "#94a3b8" },
  { x: 0.98, y: -0.82, accent: false, color: "#64748b" },
] as const;

/**
 * Дизайн и брендинг — палитра с красками и кисть рядом, остриём вниз. Сцена
 * покачивается, а не крутится: палитра узнаётся силуэтом с вырезом, и при
 * полном обороте он пропадает.
 */
export function BrandingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const sceneRef = useRef<THREE.Group>(null);
  const brushRef = useRef<THREE.Group>(null);
  const shape = useMemo(paletteShape, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const scene = sceneRef.current;
    if (scene && animate) {
      scene.rotation.y = Math.sin(t * 0.4) * 0.44;
      scene.rotation.x = Math.sin(t * 0.63) * 0.1;
      scene.position.y = Math.sin(t * 0.85) * 0.06;
    }

    // Кисть слегка «макает» в краску — движение вдоль своей оси.
    const brush = brushRef.current;
    if (brush && animate) {
      brush.position.y = -1.55 + Math.sin(t * 0.9) * 0.1;
      brush.rotation.z = -0.62 + Math.sin(t * 0.55) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={sceneRef} scale={1.08} position={[-0.15, 0.15, 0]}>
        <Extrude args={[shape, EXTRUDE]} position={[0, 0, -EXTRUDE.depth / 2]}>
          {/* Материал по умолчанию — тот же тёмный хром, что и в остальных
              сценах сайта. */}
          <ChromeMaterial />
        </Extrude>

        {PAINTS.map((paint) => (
          <mesh
            key={`${paint.x}-${paint.y}`}
            position={[paint.x, paint.y, EXTRUDE.depth / 2 + 0.05]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.26, 0.26, 0.1, 32]} />
            {paint.accent ? (
              <AccentMaterial />
            ) : (
              <ChromeMaterial color={paint.color} roughness={0.3} metalness={0.35} />
            )}
          </mesh>
        ))}

        {/* Кисть под палитрой, наискось, ворсом вниз. */}
        <group
          ref={brushRef}
          position={[1.25, -1.55, 0.45]}
          rotation={[0, 0, -0.62]}
          scale={0.82}
        >
          {/* Ручка. */}
          <mesh position={[0, 1.05, 0]}>
            <cylinderGeometry args={[0.1, 0.13, 1.9, 20]} />
            <ChromeMaterial color="#aab4c1" roughness={0.28} />
          </mesh>
          {/* Обойма. */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.32, 20]} />
            <ChromeMaterial roughness={0.18} />
          </mesh>
          {/* Ворс — сходится в кончик. */}
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.13, 0.02, 0.54, 20]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
