"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude } from "@react-three/drei";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const R = 1.5; // радиус палитры
const THUMB = { x: -0.28, y: -0.72, r: 0.4 }; // отверстие для большого пальца

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
  { x: -0.72, y: 0.62, accent: true, color: "#b4e02d" },
  { x: 0.16, y: 0.9, accent: false, color: "#475569" },
  { x: 0.9, y: 0.3, accent: false, color: "#94a3b8" },
  { x: 0.74, y: -0.62, accent: false, color: "#64748b" },
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
      brush.position.y = 0.28 + Math.sin(t * 0.9) * 0.12;
      brush.rotation.z = 0.2 + Math.sin(t * 0.55) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={sceneRef} scale={1.05} position={[-0.3, 0, 0]}>
        <Extrude args={[shape, EXTRUDE]} position={[0, 0, -EXTRUDE.depth / 2]}>
          {/* metalness почти на нуле: у хрома по умолчанию 1, и такая крупная
              плоскость отражала тёмные грани студийного окружения, выглядя
              чёрной вместо светлой палитры. */}
          <ChromeMaterial color="#eef2f7" roughness={0.42} metalness={0.12} />
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
              <ChromeMaterial color={paint.color} roughness={0.34} metalness={0.1} />
            )}
          </mesh>
        ))}

        {/* Кисть справа от палитры, ворсом вниз. */}
        <group ref={brushRef} position={[2.05, 0.28, 0.3]} rotation={[0, 0, 0.2]}>
          {/* Ручка. */}
          <mesh position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.11, 0.14, 2.1, 20]} />
            <ChromeMaterial color="#cfd8e3" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Обойма. */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.36, 20]} />
            <ChromeMaterial color="#94a3b8" roughness={0.22} metalness={0.7} />
          </mesh>
          {/* Ворс — сходится в кончик. */}
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.14, 0.02, 0.56, 20]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
