"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

/**
 * Контур фирменного знака: скошенный шеврон, собранный из двух штрихов. Форма
 * намеренно простая — знак должен читаться силуэтом, как и положено логотипу.
 */
function markShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.95, 0.9);
  shape.lineTo(-0.2, 0.9);
  shape.lineTo(0.55, -0.28);
  shape.lineTo(0.55, 0.9);
  shape.lineTo(1.15, 0.9);
  shape.lineTo(1.15, -0.9);
  shape.lineTo(0.4, -0.9);
  shape.lineTo(-0.35, 0.28);
  shape.lineTo(-0.35, -0.9);
  shape.lineTo(-0.95, -0.9);
  shape.closePath();
  return shape;
}

const EXTRUDE = {
  depth: 0.42,
  bevelEnabled: true,
  bevelThickness: 0.06,
  bevelSize: 0.05,
  bevelSegments: 4,
  curveSegments: 12,
};

/** Носители фирстиля вокруг знака: визитка, бейдж и обрез бланка. */
const CARRIERS = [
  { pos: [-2.5, 0.75, -0.9], rot: [0.1, 0.5, 0.14], size: [1.7, 1.0] },
  { pos: [2.45, -0.5, -0.7], rot: [-0.08, -0.45, -0.1], size: [1.5, 1.9] },
  { pos: [-2.1, -1.15, -1.5], rot: [0.05, 0.34, -0.2], size: [1.3, 0.85] },
] as const;

/**
 * Дизайн и брендинг — гранёный фирменный знак, медленно поворачивающийся в
 * акцентном цвете, а вокруг него бледные носители фирстиля. Идея буквальная:
 * один знак задаёт систему, всё остальное её носит.
 */
export function BrandingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const markRef = useRef<THREE.Group>(null);
  const shape = useMemo(markShape, []);

  useFrame(({ clock }) => {
    const mark = markRef.current;
    if (!mark || !animate) return;
    const t = clock.getElapsedTime();
    // Поворот вокруг вертикали + едва заметное покачивание: знак «показывает
    // грани», но не крутится волчком.
    mark.rotation.y = t * 0.5;
    mark.rotation.x = Math.sin(t * 0.7) * 0.12;
    mark.position.y = Math.sin(t * 0.9) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <group scale={1.25}>
        <group ref={markRef} scale={1.5}>
          <Extrude args={[shape, EXTRUDE]} position={[0, 0, -EXTRUDE.depth / 2]}>
            <AccentMaterial />
          </Extrude>
        </group>

        {CARRIERS.map((carrier) => (
          <RoundedBox
            key={carrier.pos.join()}
            args={[carrier.size[0], carrier.size[1], 0.07]}
            radius={0.07}
            smoothness={4}
            position={carrier.pos as unknown as [number, number, number]}
            rotation={carrier.rot as unknown as [number, number, number]}
          >
            <ChromeMaterial color="#dde3ea" roughness={0.34} transparent opacity={0.75} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}
