"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const STEM = 0.5; // толщина штриха, общая для обеих букв
const HALF_H = 0.9;

/** Буква «I» — простой штрих; рядом с «T» читается однозначно. */
function letterI(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-STEM / 2, HALF_H);
  shape.lineTo(STEM / 2, HALF_H);
  shape.lineTo(STEM / 2, -HALF_H);
  shape.lineTo(-STEM / 2, -HALF_H);
  shape.closePath();
  return shape;
}

/** Буква «T»: перекладина сверху и штрих той же толщины, что у «I». */
function letterT(): THREE.Shape {
  const barHalf = 0.85;
  const barBottom = HALF_H - 0.36;
  const shape = new THREE.Shape();
  shape.moveTo(-barHalf, HALF_H);
  shape.lineTo(barHalf, HALF_H);
  shape.lineTo(barHalf, barBottom);
  shape.lineTo(STEM / 2, barBottom);
  shape.lineTo(STEM / 2, -HALF_H);
  shape.lineTo(-STEM / 2, -HALF_H);
  shape.lineTo(-STEM / 2, barBottom);
  shape.lineTo(-barHalf, barBottom);
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
 * Дизайн и брендинг — объёмный знак «IT» в акцентном цвете, медленно
 * поворачивающийся вокруг вертикали, а вокруг него бледные носители фирстиля.
 * Идея буквальная: один знак задаёт систему, всё остальное её носит.
 */
export function BrandingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const markRef = useRef<THREE.Group>(null);
  const shapeI = useMemo(letterI, []);
  const shapeT = useMemo(letterT, []);

  useFrame(({ clock }) => {
    const mark = markRef.current;
    if (!mark || !animate) return;
    const t = clock.getElapsedTime();
    // Качание в пределах ±30°, а не полный оборот: логотип обязан читаться в
    // любой момент. На полном обороте «IT» половину времени видно с ребра, а
    // ещё четверть — зеркально, как «TI».
    mark.rotation.y = Math.sin(t * 0.42) * 0.52;
    mark.rotation.x = Math.sin(t * 0.7) * 0.1;
    mark.position.y = Math.sin(t * 0.9) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <group scale={1.25}>
        {/* Знак «IT»: обе буквы вращаются как одно целое. */}
        <group ref={markRef} scale={1.45}>
          <Extrude args={[shapeI, EXTRUDE]} position={[-0.95, 0, -EXTRUDE.depth / 2]}>
            <AccentMaterial />
          </Extrude>
          <Extrude args={[shapeT, EXTRUDE]} position={[0.35, 0, -EXTRUDE.depth / 2]}>
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
