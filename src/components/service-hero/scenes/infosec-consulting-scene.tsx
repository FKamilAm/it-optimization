"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AccentMaterial,
  ChromeMaterial,
  roundedRectShape,
  useIdleAnimation,
} from "../shared";

const SHEET_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.14,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.025,
  bevelSegments: 2,
  curveSegments: 12,
};

const SHEET_W = 2.7;
const SHEET_H = 3.5;
const FACE_Z = SHEET_EXTRUDE.depth! / 2 + SHEET_EXTRUDE.bevelThickness! + 0.015;

/** Строки текста: длина убывает к концу абзацев, иначе лист читается таблицей. */
const LINES: [number, number][] = [
  [1.32, 1.9],
  [1.9, 1.55],
  [1.75, 1.2],
  [1.2, 0.85],
  [1.9, 0.3],
  [1.7, -0.05],
  [1.1, -0.4],
];

/**
 * Консалтинг по ИБ и соответствию требованиям — лист регламента с круглой
 * печатью.
 *
 * Документ в серии уже есть у технического контента, но там он про разметку:
 * тег и шестерня. Здесь смысл юридический, и его несёт печать — единственное,
 * что отличает согласованный документ от черновика. Печать гербовая, кольцо в
 * кольце: галочка занята поддержкой, а звезда читалась бы как рейтинг.
 */
export function InfosecConsultingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const sheetGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(
      roundedRectShape(SHEET_W, SHEET_H, 0.14),
      SHEET_EXTRUDE,
    );
    geo.center();
    return geo;
  }, []);

  useEffect(() => () => sheetGeo.dispose(), [sheetGeo]);

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.08, -0.3, 0.04]}>
        {/* Второй лист позади: комплект документов, а не одна бумажка. */}
        <mesh
          geometry={sheetGeo}
          position={[0.34, -0.16, -0.24]}
          rotation={[0, 0, -0.07]}
        >
          <ChromeMaterial color="#9ca5b1" roughness={0.32} />
        </mesh>

        <mesh geometry={sheetGeo}>
          <ChromeMaterial />
        </mesh>

        {LINES.map(([w, y], i) => (
          <mesh key={`t${i}`} position={[-(SHEET_W / 2 - 0.36) + w / 2, y, FACE_Z]}>
            <boxGeometry args={[w, 0.115, 0.05]} />
            <ChromeMaterial color="#8e97a3" roughness={0.45} metalness={0.85} />
          </mesh>
        ))}

        {/* Печать: слегка развёрнута — её ставят от руки, а не печатают. */}
        <group position={[0.52, -1.12, FACE_Z + 0.06]} rotation={[0, 0, -0.22]}>
          <mesh>
            <torusGeometry args={[0.62, 0.075, 16, 64]} />
            <AccentMaterial />
          </mesh>
          <mesh>
            <torusGeometry args={[0.44, 0.055, 16, 64]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
