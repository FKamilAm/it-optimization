"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const R = 2.15;
const SWEEP = Math.PI * 0.32;

/**
 * Мониторинг ИБ и реагирование — радар: диск с кольцами дальности, сеткой
 * азимута и зелёным сектором развёртки, который идёт по кругу.
 *
 * Единственная сцена серии с непрерывным вращением, и это оправдано смыслом:
 * мониторинг — процесс без начала и конца, в отличие от аудита, у которого
 * есть срок и отчёт.
 */
export function InfosecMonitoringScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const sweepRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!animate || !sweepRef.current) return;
    sweepRef.current.rotation.z -= Math.min(delta, 0.05) * 0.55;
  });

  return (
    <group ref={groupRef}>
      <group scale={1.0} rotation={[0.18, -0.26, 0]}>
        {/* Экран. Тонкий цилиндр, развёрнутый лицом к зрителю. */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R, R, 0.24, 72]} />
          <ChromeMaterial color="#9ca5b1" roughness={0.34} />
        </mesh>

        {/* Кольца дальности и обод. */}
        {[R, R * 0.68, R * 0.36].map((radius, i) => (
          <mesh key={`r${i}`} position={[0, 0, 0.14]}>
            <torusGeometry args={[radius, i === 0 ? 0.1 : 0.045, 14, 84]} />
            <ChromeMaterial />
          </mesh>
        ))}

        {/* Сетка азимута: две перекладины, чтобы диск не читался монетой. */}
        {[0, Math.PI / 2].map((angle, i) => (
          <mesh key={`a${i}`} position={[0, 0, 0.14]} rotation={[0, 0, angle]}>
            <boxGeometry args={[R * 2, 0.05, 0.05]} />
            <ChromeMaterial color="#b7bfca" />
          </mesh>
        ))}

        <group ref={sweepRef} position={[0, 0, 0.2]}>
          <mesh rotation={[0, 0, 0]}>
            <circleGeometry args={[R * 0.94, 48, 0, SWEEP]} />
            <AccentMaterial transparent opacity={0.75} side={THREE.DoubleSide} />
          </mesh>
          {/* Ведущий луч сектора — по нему видно направление обхода. */}
          <mesh position={[(R * 0.94) / 2, 0, 0.02]}>
            <boxGeometry args={[R * 0.94, 0.07, 0.04]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
