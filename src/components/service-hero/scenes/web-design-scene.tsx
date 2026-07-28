"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, strokeShape, useIdleAnimation } from "../shared";

/** Опорные точки кривой: две вершины и по управляющей ручке к каждой. */
const P0 = new THREE.Vector2(-2.15, -0.95);
const C0 = new THREE.Vector2(-1.15, 1.35);
const C1 = new THREE.Vector2(1.0, -1.7);
const P1 = new THREE.Vector2(2.05, 0.85);

const CURVE_EXTRUDE = {
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.025,
  bevelSegments: 2,
  curveSegments: 8,
};

const NIB_EXTRUDE = { ...CURVE_EXTRUDE, depth: 0.22 };

/** Кубическая кривая Безье, разложенная в ломаную для объёмного штриха. */
function curvePoints(segments = 48): [number, number][] {
  const curve = new THREE.CubicBezierCurve(P0, C0, C1, P1);
  return curve.getPoints(segments).map((p) => [p.x, p.y] as [number, number]);
}

/** Перо: вытянутый наконечник со скошенным кончиком. */
function nibShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.62);
  s.lineTo(0.26, -0.12);
  s.lineTo(0.26, 0.66);
  s.lineTo(-0.26, 0.66);
  s.lineTo(-0.26, -0.12);
  s.closePath();
  return s;
}

/**
 * Веб-дизайн системы — перо ведёт кривую Безье: сам штрих, две опорные точки и
 * управляющие ручки с круглыми маркерами. Кривая «прорисовывается» от начала к
 * концу и начинается заново, перо идёт по ней остриём вперёд.
 */
export function WebDesignScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const penRef = useRef<THREE.Group>(null);
  const drawnRef = useRef<THREE.Group>(null);

  const points = useMemo(() => curvePoints(), []);
  const curve = useMemo(() => new THREE.CubicBezierCurve(P0, C0, C1, P1), []);
  const fullStroke = useMemo(() => strokeShape(points, 0.11), [points]);
  const nib = useMemo(nibShape, []);

  // Штрих собран из коротких сегментов: показывая их по очереди, получаем
  // эффект прорисовки без пересборки геометрии на каждом кадре.
  const segments = useMemo(
    () =>
      points.slice(0, -1).map((point, index) => ({
        shape: strokeShape([point, points[index + 1]], 0.11),
        t: index / (points.length - 1),
      })),
    [points],
  );

  useFrame(({ clock }) => {
    if (!animate) return;
    // Цикл: 0 → 1 рисуем, затем короткая пауза перед новым проходом.
    const cycle = (clock.getElapsedTime() % 6) / 4.6;
    const progress = Math.min(1, Math.max(0, cycle));

    const drawn = drawnRef.current;
    if (drawn) {
      drawn.children.forEach((child, index) => {
        child.visible = segments[index] !== undefined && segments[index].t <= progress;
      });
    }

    const pen = penRef.current;
    if (pen) {
      const at = curve.getPoint(progress);
      const tangent = curve.getTangent(Math.min(0.999, progress));
      pen.position.set(at.x, at.y + 0.5, 0.42);
      // Остриё смотрит по касательной к кривой.
      pen.rotation.z = Math.atan2(tangent.y, tangent.x) - Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef}>
      <group scale={1.12} rotation={[0.05, -0.26, 0.02]}>
        {/* Бледный контур всей кривой — куда штрих придёт. */}
        <Extrude
          args={[fullStroke, { ...CURVE_EXTRUDE, depth: 0.06 }]}
          position={[0, 0, -0.02]}
        >
          <ChromeMaterial color="#c9d3de" roughness={0.45} transparent opacity={0.5} />
        </Extrude>

        {/* Прорисованная часть. */}
        <group ref={drawnRef}>
          {segments.map((segment, index) => (
            <Extrude key={index} args={[segment.shape, CURVE_EXTRUDE]}>
              <AccentMaterial />
            </Extrude>
          ))}
        </group>

        {/* Управляющие ручки: линия от вершины к маркеру. */}
        {[
          [P0, C0],
          [P1, C1],
        ].map(([anchor, handle], index) => (
          <group key={index}>
            <Extrude
              args={[
                strokeShape(
                  [
                    [anchor.x, anchor.y],
                    [handle.x, handle.y],
                  ],
                  0.025,
                ),
                { ...CURVE_EXTRUDE, depth: 0.04, bevelEnabled: false },
              ]}
              position={[0, 0, 0.06]}
            >
              <ChromeMaterial color="#94a3b8" roughness={0.4} />
            </Extrude>
            {/* Круглый маркер ручки. */}
            <mesh position={[handle.x, handle.y, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.07, 24]} />
              <ChromeMaterial color="#e2e8f0" roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Квадратные опорные точки — как в любом векторном редакторе. */}
        {[P0, P1].map((anchor) => (
          <RoundedBox
            key={`${anchor.x}-${anchor.y}`}
            args={[0.2, 0.2, 0.09]}
            radius={0.03}
            smoothness={3}
            position={[anchor.x, anchor.y, 0.14]}
          >
            <ChromeMaterial color="#f1f5f9" roughness={0.2} />
          </RoundedBox>
        ))}

        {/* Перо. */}
        <group ref={penRef}>
          <Extrude args={[nib, NIB_EXTRUDE]}>
            <ChromeMaterial color="#e8edf3" roughness={0.22} />
          </Extrude>
          {/* Акцентная вставка у основания пера. */}
          <mesh position={[0, 0.42, NIB_EXTRUDE.depth + 0.02]}>
            <boxGeometry args={[0.34, 0.16, 0.05]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
