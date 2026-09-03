"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const SIZE = 1.15;
const GAP = 0.09;
const STEP = SIZE + GAP;
/** Место, откуда приезжает последний модуль, — по диагонали от своего гнезда. */
const OFFSET = new THREE.Vector3(1.5, 1.2, 1.5);

const CELLS: [number, number, number][] = [];
for (const x of [-0.5, 0.5]) {
  for (const y of [-0.5, 0.5]) {
    for (const z of [-0.5, 0.5]) {
      CELLS.push([x * STEP, y * STEP, z * STEP]);
    }
  }
}
/** Зелёный модуль — верхний ближний правый: он на виду и не заслонён. */
const ACTIVE = CELLS.findIndex(([x, y, z]) => x > 0 && y > 0 && z > 0);

/**
 * Внедрение бизнес-систем — куб из восьми модулей, последний из которых как раз
 * встаёт на место.
 *
 * Монитор и моноблок в серии заняты сайтами, хаб — CRM. Здесь смысл не в
 * экране и не в связях, а в сборке: учётная система собирается из блоков —
 * склад, продажи, деньги, — и внедрение это процесс, у которого видно
 * последний недостающий кусок.
 */
export function BusinessSystemsScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const moduleRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const mod = moduleRef.current;
    if (!mod || !animate) return;
    // Цикл: приезжает, стоит на месте, отъезжает. Пауза в конце важнее самого
    // движения — именно в ней куб читается собранным.
    const phase = (clock.getElapsedTime() % 8) / 8;
    let t: number;
    if (phase < 0.28) t = 1 - phase / 0.28;
    else if (phase < 0.78) t = 0;
    else t = (phase - 0.78) / 0.22;
    // Плавные концы: без сглаживания модуль дёргается на старте и финише.
    const eased = t * t * (3 - 2 * t);
    const [cx, cy, cz] = CELLS[ACTIVE];
    mod.position.set(cx + OFFSET.x * eased, cy + OFFSET.y * eased, cz + OFFSET.z * eased);
  });

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.3, -0.5, 0]}>
        {CELLS.map((pos, i) =>
          i === ACTIVE ? null : (
            <mesh key={`b${i}`} position={pos}>
              <boxGeometry args={[SIZE, SIZE, SIZE]} />
              <ChromeMaterial color={i % 3 ? "#cdd4dd" : "#b7bfca"} />
            </mesh>
          ),
        )}

        <group ref={moduleRef} position={CELLS[ACTIVE]}>
          <mesh>
            <boxGeometry args={[SIZE, SIZE, SIZE]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
