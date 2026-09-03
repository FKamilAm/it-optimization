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

const PANEL_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.03,
  bevelSegments: 2,
  curveSegments: 14,
};

const PACKETS = 5;
const RISE_FROM = -0.35;
const RISE_TO = 1.75;
const PANEL_Y = 2.25;

/**
 * Интеграция с оборудованием и производственными системами — станок, от
 * которого вверх идут пакеты телеметрии, и панель, куда они приходят.
 *
 * Единственная сцена серии, где зелёного больше одной детали, и это осознанно:
 * поток данных здесь и есть услуга. Станок и панель остаются хромовыми — они
 * были и до нас, появляется только связь между ними.
 *
 * Пара шестерён занята интеграциями сервисов; там речь про стыковку систем
 * между собой, здесь — про снятие показаний с железа, и общего образа у них
 * быть не должно.
 */
export function IndustrialScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const flowRef = useRef<THREE.Group>(null);

  const panelGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(
      roundedRectShape(2.5, 1.5, 0.18),
      PANEL_EXTRUDE,
    );
    geo.center();
    return geo;
  }, []);

  const packetGeo = useMemo(() => new THREE.BoxGeometry(0.28, 0.28, 0.28), []);

  useEffect(() => {
    return () => {
      panelGeo.dispose();
      packetGeo.dispose();
    };
  }, [panelGeo, packetGeo]);

  useFrame(({ clock }) => {
    const flow = flowRef.current;
    if (!flow || !animate) return;
    const t = clock.getElapsedTime() * 0.35;
    const span = RISE_TO - RISE_FROM;
    flow.children.forEach((packet, i) => {
      // Каждый пакет идёт по той же дорожке со своим сдвигом фазы и
      // возвращается вниз — поток непрерывный, а меша всего пять.
      const phase = (t + i / PACKETS) % 1;
      packet.position.y = RISE_FROM + phase * span;
      packet.scale.setScalar(0.75 + Math.sin(phase * Math.PI) * 0.45);
    });
  });

  return (
    <group ref={groupRef}>
      <group scale={0.95} rotation={[0.14, -0.34, 0]}>
        {/* Станина и корпус. */}
        <mesh position={[0, -2.05, 0]}>
          <boxGeometry args={[2.9, 0.4, 1.7]} />
          <ChromeMaterial color="#9ca5b1" roughness={0.34} />
        </mesh>
        <mesh position={[0, -1.35, 0]}>
          <boxGeometry args={[2.3, 1.1, 1.4]} />
          <ChromeMaterial />
        </mesh>
        {/* Шпиндель: по нему корпус читается станком, а не тумбой. */}
        <mesh position={[0, -0.5, 0.15]}>
          <cylinderGeometry args={[0.26, 0.16, 0.75, 28]} />
          <ChromeMaterial color="#b7bfca" />
        </mesh>

        <group ref={flowRef}>
          {Array.from({ length: PACKETS }, (_, i) => (
            <mesh
              key={`p${i}`}
              geometry={packetGeo}
              position={[0, RISE_FROM + (i / PACKETS) * (RISE_TO - RISE_FROM), 0.15]}
              rotation={[0.4, 0.5, 0]}
            >
              <AccentMaterial />
            </mesh>
          ))}
        </group>

        {/* Панель, куда приходят показания. */}
        <mesh geometry={panelGeo} position={[0, PANEL_Y, 0.15]} rotation={[-0.22, 0, 0]}>
          <ChromeMaterial />
        </mesh>
        {[0.42, 0.05, -0.32].map((y, i) => (
          <mesh
            key={`l${i}`}
            position={[-0.35 + i * 0.12, PANEL_Y + y, 0.28]}
            rotation={[-0.22, 0, 0]}
          >
            <boxGeometry args={[1.5 - i * 0.35, 0.1, 0.04]} />
            <ChromeMaterial color="#8e97a3" roughness={0.45} metalness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
