"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AccentMaterial,
  ChromeMaterial,
  roundedRectShape,
  useIdleAnimation,
} from "../shared";

const TILE_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.28,
  bevelEnabled: true,
  bevelThickness: 0.06,
  bevelSize: 0.05,
  bevelSegments: 3,
  curveSegments: 16,
};

const TILE_W = 2.9;
const TILE_H = 2.2;
const FACE_Z = TILE_EXTRUDE.depth! / 2 + TILE_EXTRUDE.bevelThickness! + 0.02;

/** Уступ: одинаковые рабочие места за передним — тот же образ на весь парк. */
const STACK: [number, number, number][] = [
  [-0.62, 0.5, -1.1],
  [-0.31, 0.25, -0.55],
];

/**
 * Внедрение операционных систем — одно рабочее место крупно и два таких же
 * уступом позади: один образ, развёрнутый на весь парк машин.
 *
 * На передней плитке зелёный символ питания — разомкнутое кольцо с чертой.
 * Знак в серии не занят и читается как «система», не требуя ни текста, ни
 * логотипа конкретной ОС, которого здесь и не должно быть: услуга про переход
 * вообще, а не про один дистрибутив.
 */
export function OsScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const tileGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(
      roundedRectShape(TILE_W, TILE_H, 0.34),
      TILE_EXTRUDE,
    );
    geo.center();
    return geo;
  }, []);

  useEffect(() => () => tileGeo.dispose(), [tileGeo]);

  return (
    <group ref={groupRef}>
      <group scale={1.1} rotation={[0.1, -0.3, 0]}>
        {STACK.map(([x, y, z], i) => (
          <mesh key={`s${i}`} geometry={tileGeo} position={[x, y, z]}>
            <ChromeMaterial color={i ? "#b7bfca" : "#9ca5b1"} roughness={0.3} />
          </mesh>
        ))}

        <mesh geometry={tileGeo}>
          <ChromeMaterial />
        </mesh>

        {/* Символ питания: кольцо с разрывом сверху и вертикальная черта. */}
        <group position={[0, 0, FACE_Z]}>
          <mesh rotation={[0, 0, Math.PI / 2 + 0.42]}>
            <torusGeometry args={[0.6, 0.1, 16, 64, Math.PI * 2 - 0.84]} />
            <AccentMaterial />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
