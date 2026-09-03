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

const PLATE_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.42,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.045,
  bevelSegments: 3,
  curveSegments: 14,
};

const PIECE_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.4,
  bevelEnabled: true,
  bevelThickness: 0.045,
  bevelSize: 0.04,
  bevelSegments: 3,
  curveSegments: 14,
};

const PLATE_W = 3.7;
const PLATE_H = 2.7;
const PIECE = 1.35;
const TAB = 0.3;
/** Гнездо смещено вправо-вниз: по центру вырез читался бы дырой в плите. */
const SLOT: [number, number] = [0.72, -0.4];

/**
 * Фрагмент паззла: квадрат с выступом на правой грани и впадиной на левой —
 * той же формы, так что в плите он садится ровно.
 */
function puzzleShape(size: number, tab: number) {
  const h = size / 2;
  const s = new THREE.Shape();
  s.moveTo(-h, -h);
  s.lineTo(h, -h);
  s.lineTo(h, -tab);
  s.absarc(h, 0, tab, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(h, h);
  s.lineTo(-h, h);
  s.lineTo(-h, tab);
  s.absarc(-h, 0, tab, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(-h, -h);
  s.closePath();
  return s;
}

/**
 * Доработка бизнес-систем — плита с гнездом и фрагмент, который в него входит.
 *
 * Образ намеренно самый затёртый из двенадцати, и это его достоинство: смысл
 * «недостающий кусок ровно под ваш процесс» считывается мгновенно и не требует
 * разглядывания. От соседней сцены внедрения отличается тем, что система здесь
 * уже стоит и целая — не хватает одной детали, а не последнего модуля.
 */
export function BusinessSystemsCustomScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const pieceRef = useRef<THREE.Group>(null);

  const plateGeo = useMemo(() => {
    const shape = roundedRectShape(PLATE_W, PLATE_H, 0.24);
    // Отверстие — тот же фрагмент, сдвинутый в гнездо и с обратным обходом.
    const hole = puzzleShape(PIECE + 0.06, TAB + 0.03)
      .getPoints(72)
      .map((p) => new THREE.Vector2(p.x + SLOT[0], p.y + SLOT[1]))
      .reverse();
    shape.holes.push(new THREE.Path(hole));
    const geo = new THREE.ExtrudeGeometry(shape, PLATE_EXTRUDE);
    geo.center();
    return geo;
  }, []);

  const pieceGeo = useMemo(
    () => new THREE.ExtrudeGeometry(puzzleShape(PIECE, TAB), PIECE_EXTRUDE),
    [],
  );

  useEffect(() => {
    return () => {
      plateGeo.dispose();
      pieceGeo.dispose();
    };
  }, [plateGeo, pieceGeo]);

  useFrame(({ clock }) => {
    const piece = pieceRef.current;
    if (!piece || !animate) return;
    // Фрагмент подходит к плите и отходит: доработка — обратимая операция,
    // поэтому и движение возвратное, без щелчка «встало навсегда».
    const t = (Math.sin(clock.getElapsedTime() * 0.55) + 1) / 2;
    piece.position.z = 0.05 + t * 1.15;
    piece.rotation.z = t * 0.14;
  });

  return (
    <group ref={groupRef}>
      <group scale={1.0} rotation={[0.16, -0.36, 0]}>
        <mesh geometry={plateGeo}>
          <ChromeMaterial />
        </mesh>

        <group ref={pieceRef} position={[SLOT[0], SLOT[1], 0.6]}>
          <mesh geometry={pieceGeo} position={[0, 0, -PIECE_EXTRUDE.depth! / 2]}>
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
