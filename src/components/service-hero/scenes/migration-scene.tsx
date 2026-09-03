"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  AccentMaterial,
  ChromeMaterial,
  roundedRectShape,
  useIdleAnimation,
} from "../shared";

const SLAB_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.07,
  bevelSize: 0.06,
  bevelSegments: 3,
  curveSegments: 16,
};

/** Дуга переноса: полуокружность над обеими площадками. */
const ARC_RADIUS = 1.75;
const ARC_SPAN = Math.PI * 0.86;
const ARC_START = (Math.PI - ARC_SPAN) / 2;
const ARC_Y = 0.35;

/**
 * Миграция и модернизация — слева гранёный блок «как было», справа скруглённая
 * плита «куда переезжаем», между ними зелёная дуга со стрелкой, по которой
 * едет груз.
 *
 * Груз хромовый, а не зелёный: акцент в серии один на сцену, и здесь он на
 * маршруте — переносится то же самое, меняется только место.
 */
export function MigrationScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const cargoRef = useRef<THREE.Group>(null);

  const slabGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roundedRectShape(1.9, 1.5, 0.34), SLAB_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  useEffect(() => () => slabGeo.dispose(), [slabGeo]);

  /** Точка на дуге по доле пути 0…1 — ей же пользуется стрелка на конце. */
  const pointAt = useMemo(
    () =>
      (t: number): [number, number, number] => {
        const angle = ARC_START + ARC_SPAN * t;
        return [Math.cos(angle) * -ARC_RADIUS, ARC_Y + Math.sin(angle) * ARC_RADIUS, 0];
      },
    [],
  );

  useFrame(({ clock }) => {
    const cargo = cargoRef.current;
    if (!cargo || !animate) return;
    // Ползунок 0…1 с паузой на концах: linear-петля читалась бы как конвейер,
    // а переезд — событие с началом и концом.
    const raw = (clock.getElapsedTime() % 6) / 6;
    const t = raw < 0.75 ? Math.min(raw / 0.7, 1) : 1;
    const [x, y, z] = pointAt(t);
    cargo.position.set(x, y, z);
    cargo.visible = raw < 0.92;
  });

  const [ax, ay] = pointAt(1);
  const start = pointAt(0);

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.12, -0.24, 0]}>
        {/* Что было: тяжёлый гранёный блок. */}
        <mesh position={[-1.85, -0.75, 0]} rotation={[0, 0.34, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <ChromeMaterial color="#b7bfca" roughness={0.3} />
        </mesh>

        {/* Куда переезжаем: лёгкая скруглённая плита. */}
        <mesh geometry={slabGeo} position={[1.9, -0.75, 0]} rotation={[0, -0.3, 0]}>
          <ChromeMaterial />
        </mesh>

        {/* Маршрут. Дуга открытая — у переезда есть направление. */}
        <mesh position={[0, ARC_Y, 0]} rotation={[0, 0, Math.PI - ARC_START - ARC_SPAN]}>
          <torusGeometry args={[ARC_RADIUS, 0.075, 16, 96, ARC_SPAN]} />
          <AccentMaterial />
        </mesh>

        {/* Наконечник на дальнем конце дуги, развёрнут по касательной. */}
        <mesh position={[ax, ay, 0]} rotation={[0, 0, -(ARC_START + ARC_SPAN)]}>
          <coneGeometry args={[0.2, 0.46, 20]} />
          <AccentMaterial />
        </mesh>

        <group ref={cargoRef} position={start}>
          <mesh rotation={[0.4, 0.5, 0]}>
            <boxGeometry args={[0.46, 0.46, 0.46]} />
            <ChromeMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
