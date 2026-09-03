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
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.03,
  bevelSegments: 2,
  curveSegments: 14,
};

const CURSOR_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.1,
  bevelEnabled: true,
  bevelThickness: 0.025,
  bevelSize: 0.02,
  bevelSegments: 2,
  curveSegments: 3,
};

const SHEET_W = 3.6;
const SHEET_H = 2.6;
const FACE_Z = SHEET_EXTRUDE.depth! / 2 + SHEET_EXTRUDE.bevelThickness! + 0.02;

/** Классический указатель мыши: остриё вверх-влево, «хвост» вниз-вправо. */
function cursorShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, -1);
  s.lineTo(0.26, -0.73);
  s.lineTo(0.45, -1.08);
  s.lineTo(0.63, -0.99);
  s.lineTo(0.44, -0.65);
  s.lineTo(0.78, -0.6);
  s.closePath();
  return s;
}

/** Три курсора над одним документом; зелёный — ваш. */
const CURSORS: { pos: [number, number, number]; rot: number; accent: boolean }[] = [
  { pos: [-0.95, 0.72, FACE_Z], rot: 0.12, accent: false },
  { pos: [0.62, 0.15, FACE_Z + 0.16], rot: -0.18, accent: true },
  { pos: [-0.15, -0.62, FACE_Z], rot: 0.05, accent: false },
];

const LINES: [number, number][] = [
  [2.5, 0.92],
  [2.9, 0.55],
  [2.2, 0.18],
  [2.8, -0.35],
  [1.7, -0.72],
];

/**
 * Корпоративные коммуникации — один документ и три курсора на нём: совместная
 * работа, где у людей общий предмет, а не переписка про него.
 *
 * Пузырь сообщения в серии занят мессенджерами, а хаб со спутниками — CRM,
 * поэтому образ «люди вокруг центра» отпадал дважды. Курсоры точнее и по
 * смыслу: услуга про то, чтобы работа шла в одном месте, а не расползалась по
 * личным чатам.
 */
export function CollaborationScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const sheetGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(
      roundedRectShape(SHEET_W, SHEET_H, 0.2),
      SHEET_EXTRUDE,
    );
    geo.center();
    return geo;
  }, []);

  const cursorGeo = useMemo(
    () => new THREE.ExtrudeGeometry(cursorShape(), CURSOR_EXTRUDE),
    [],
  );

  useEffect(() => {
    return () => {
      sheetGeo.dispose();
      cursorGeo.dispose();
    };
  }, [sheetGeo, cursorGeo]);

  return (
    <group ref={groupRef}>
      <group scale={1.08} rotation={[0.16, -0.3, 0]}>
        <mesh geometry={sheetGeo}>
          <ChromeMaterial />
        </mesh>

        {LINES.map(([w, y], i) => (
          <mesh key={`t${i}`} position={[-(SHEET_W / 2 - 0.35) + w / 2, y, FACE_Z]}>
            <boxGeometry args={[w, 0.12, 0.05]} />
            <ChromeMaterial color="#8e97a3" roughness={0.45} metalness={0.85} />
          </mesh>
        ))}

        {CURSORS.map((cursor, i) => (
          <mesh
            key={`c${i}`}
            geometry={cursorGeo}
            position={cursor.pos}
            rotation={[0, 0, cursor.rot]}
            scale={cursor.accent ? 0.78 : 0.62}
          >
            {cursor.accent ? (
              <AccentMaterial />
            ) : (
              <ChromeMaterial color="#b7bfca" roughness={0.3} />
            )}
          </mesh>
        ))}
      </group>
    </group>
  );
}
