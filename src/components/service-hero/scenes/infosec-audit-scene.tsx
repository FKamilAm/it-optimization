"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const COLS = 4;
const ROWS = 4;
const STEP = 1.05;
const DEPTH_LAYERS = [0.55, -0.75];
const SWEEP_TOP = ((ROWS - 1) * STEP) / 2 + 0.75;

/**
 * Аудит информационной безопасности — правильная решётка узлов, сквозь которую
 * медленно идёт зелёная плоскость проверки.
 *
 * От нейросети в этой же серии отличается двумя вещами: решётка регулярная, а
 * не хаотичная (это инвентаризация, а не модель), и есть развёртка — аудит это
 * процесс, который проходит по всему периметру, а не картинка связей.
 */
export function InfosecAuditScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const sweepRef = useRef<THREE.Group>(null);

  const nodeGeo = useMemo(() => new THREE.SphereGeometry(0.19, 24, 24), []);
  useEffect(() => () => nodeGeo.dispose(), [nodeGeo]);

  const nodes = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const z of DEPTH_LAYERS) {
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          list.push([(c - (COLS - 1) / 2) * STEP, (r - (ROWS - 1) / 2) * STEP, z]);
        }
      }
    }
    return list;
  }, []);

  useFrame(({ clock }) => {
    const sweep = sweepRef.current;
    if (!sweep || !animate) return;
    // Треугольная волна: проход сверху вниз и обратно, без рывка на стыке.
    const phase = (clock.getElapsedTime() % 9) / 9;
    const t = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    sweep.position.y = SWEEP_TOP - t * SWEEP_TOP * 2;
  });

  return (
    <group ref={groupRef}>
      <group scale={0.95} rotation={[0.14, -0.34, 0]}>
        {nodes.map((pos, i) => (
          <mesh key={`n${i}`} geometry={nodeGeo} position={pos}>
            <ChromeMaterial color={pos[2] < 0 ? "#9ca5b1" : "#cdd4dd"} />
          </mesh>
        ))}

        <group ref={sweepRef} position={[0, SWEEP_TOP, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[COLS * STEP + 0.9, 0.06, 2.4]} />
            {/* Полупрозрачная: узлы под плоскостью должны просвечивать, иначе
                это не проверка, а перекрытие. */}
            <AccentMaterial transparent opacity={0.62} emissiveIntensity={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
