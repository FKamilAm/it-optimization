"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const BOARD = { w: 4.6, h: 3.0 };
const PLATE = 0.08;

/** Направляющие модульной сетки — по ним встают блоки. */
const GUIDES = [-1.68, -0.56, 0.56, 1.68];

/**
 * Блоки макета: ширина кратна колонкам, поэтому вместе они и читаются как
 * система, а не как случайные прямоугольники. `phase` разводит их во времени,
 * чтобы они вставали на сетку по очереди.
 */
const BLOCKS = [
  { x: -0.56, y: 0.86, w: 3.36, h: 0.7, phase: 0.0, accent: false },
  { x: 1.68, y: 0.86, w: 1.12, h: 0.7, phase: 0.5, accent: true },
  { x: -1.68, y: -0.16, w: 1.12, h: 1.0, phase: 1.0, accent: false },
  { x: -0.56, y: -0.16, w: 1.12, h: 1.0, phase: 1.5, accent: false },
  { x: 0.56, y: -0.16, w: 1.12, h: 1.0, phase: 2.0, accent: false },
  { x: 1.68, y: -0.16, w: 1.12, h: 1.0, phase: 2.5, accent: false },
  { x: 0, y: -1.12, w: 4.48, h: 0.42, phase: 3.0, accent: false },
] as const;

/**
 * Веб-дизайн системы — модульная сетка, по которой раскладываются блоки разной
 * ширины. Блоки по очереди приподнимаются и снова садятся на направляющие: из
 * одних и тех же колонок собирается любая страница, в этом и смысл системы.
 */
export function WebDesignScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const blocksRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const blocks = blocksRef.current;
    if (!blocks || !animate) return;
    const t = clock.getElapsedTime();
    blocks.children.forEach((child, index) => {
      const phase = BLOCKS[index]?.phase ?? 0;
      // Половина периода блок стоит на сетке, половину — приподнят: движение
      // заметное, но не суетливое.
      const lift = Math.max(0, Math.sin(t * 0.8 - phase));
      child.position.z = 0.12 + lift * 0.34;
    });
  });

  return (
    <group ref={groupRef}>
      <group scale={1.12} rotation={[0.06, -0.32, 0.03]}>
        {/* Монтажная область. */}
        <RoundedBox args={[BOARD.w, BOARD.h, PLATE]} radius={0.12} smoothness={5}>
          <ChromeMaterial color="#eef2f6" roughness={0.32} />
        </RoundedBox>

        {/* Направляющие колонок. */}
        {GUIDES.map((x) => (
          <mesh key={x} position={[x, 0, PLATE / 2 + 0.01]}>
            <boxGeometry args={[0.015, BOARD.h - 0.24, 0.01]} />
            <ChromeMaterial color="#b6c2cf" roughness={0.5} transparent opacity={0.75} />
          </mesh>
        ))}

        {/* Горизонтальные базовые линии. */}
        {[1.28, 0.42, -0.74].map((y) => (
          <mesh key={y} position={[0, y, PLATE / 2 + 0.01]}>
            <boxGeometry args={[BOARD.w - 0.24, 0.012, 0.01]} />
            <ChromeMaterial color="#c3cdd8" roughness={0.5} transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Блоки, встающие по сетке. */}
        <group ref={blocksRef}>
          {BLOCKS.map((block) => (
            <RoundedBox
              key={`${block.x}-${block.y}`}
              args={[block.w - 0.12, block.h - 0.12, 0.1]}
              radius={0.07}
              smoothness={4}
              position={[block.x, block.y, 0.12]}
            >
              {block.accent ? (
                <AccentMaterial />
              ) : (
                <ChromeMaterial color="#dbe3ec" roughness={0.28} />
              )}
            </RoundedBox>
          ))}
        </group>
      </group>
    </group>
  );
}
