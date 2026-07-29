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

/** Наклон пера к линии — держат его не перпендикулярно, а под углом. */
const PEN_TILT = 0.42;

/** Кубическая кривая Безье, разложенная в ломаную для объёмного штриха. */
function curvePoints(segments = 48): [number, number][] {
  const curve = new THREE.CubicBezierCurve(P0, C0, C1, P1);
  return curve.getPoints(segments).map((p) => [p.x, p.y] as [number, number]);
}

/**
 * Каллиграфическое перо: вытянутый ромб с остриём внизу, круглым отверстием
 * посередине и прорезью от него к кончику — тот самый силуэт, которым во всех
 * редакторах обозначают инструмент «перо». Отверстие и прорезь сделаны
 * настоящими дырками в геометрии, поэтому сквозь них виден фон.
 */
function nibShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -1.18); // остриё
  s.lineTo(0.54, -0.12); // правая скула
  s.lineTo(0.34, 0.76);
  s.lineTo(0.19, 1.02); // хвостовик под держатель
  s.lineTo(-0.19, 1.02);
  s.lineTo(-0.34, 0.76);
  s.lineTo(-0.54, -0.12); // левая скула
  s.closePath();

  // Отверстие для чернил.
  const hole = new THREE.Path();
  hole.absarc(0, -0.04, 0.14, 0, Math.PI * 2, true);
  s.holes.push(hole);

  // Прорезь от отверстия к острию — книзу сходится в ноль.
  const slit = new THREE.Path();
  slit.moveTo(-0.05, -0.1);
  slit.lineTo(0.05, -0.1);
  slit.lineTo(0.012, -1.04);
  slit.lineTo(-0.012, -1.04);
  slit.closePath();
  s.holes.push(slit);

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

    // Маятник: 0 → 1 перо идёт слева направо снизу линии, 1 → 0 возвращается
    // справа налево уже сверху. Ни рывка, ни перезапуска — на концах перо
    // просто переворачивается на другую сторону штриха.
    const period = 13;
    const phase = (clock.getElapsedTime() % period) / period;
    const forward = phase < 0.5;
    const linear = forward ? phase * 2 : 2 - phase * 2;
    // Сглаживание у концов: перо притормаживает перед разворотом, и на сам
    // разворот остаётся заметно больше времени, чем при равномерном ходе.
    const progress = linear * linear * (3 - 2 * linear);

    const drawn = drawnRef.current;
    if (drawn) {
      drawn.children.forEach((child, index) => {
        // На обратном ходу линия уже нарисована и остаётся целиком.
        child.visible =
          !forward || (segments[index] !== undefined && segments[index].t <= progress);
      });
    }

    const pen = penRef.current;
    if (pen) {
      const at = curve.getPoint(progress);
      const tangent = curve.getTangent(Math.min(0.999, Math.max(0.001, progress)));
      // Перо ставим ровно в точку кривой: смещение к острию задано внутри
      // группы, поэтому кончик всегда лежит на линии.
      pen.position.set(at.x, at.y, 0.44);

      // Остриё пера в его системе координат смотрит в −Y, поэтому направление
      // задаётся как atan2(tx, −ty). На обратном ходу берём противоположную
      // касательную и зеркалим наклон — перо оказывается над линией.
      const dirX = forward ? tangent.x : -tangent.x;
      const dirY = forward ? tangent.y : -tangent.y;
      const target = Math.atan2(dirX, -dirY) + (forward ? PEN_TILT : -PEN_TILT);

      // Доворачиваем плавно и кратчайшим путём, иначе на развороте перо
      // прыгает через полный оборот.
      const delta = Math.atan2(
        Math.sin(target - pen.rotation.z),
        Math.cos(target - pen.rotation.z),
      );
      // Мягче, чем раньше: разворот занимает несколько кадров, а не рывок.
      pen.rotation.z += delta * 0.055;
    }
  });

  return (
    <group ref={groupRef}>
      <group scale={1.45} rotation={[0.05, -0.26, 0.02]}>
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

        {/* Перо. Внутренний сдвиг ставит остриё в начало координат группы. */}
        <group ref={penRef}>
          <group scale={0.66} position={[0, 0.779, 0]}>
            <Extrude args={[nib, NIB_EXTRUDE]}>
              <ChromeMaterial color="#dfe6ee" roughness={0.2} metalness={0.55} />
            </Extrude>
            {/* Акцентная обойма на хвостовике. */}
            <mesh position={[0, 0.88, NIB_EXTRUDE.depth / 2]}>
              <boxGeometry args={[0.46, 0.2, NIB_EXTRUDE.depth + 0.12]} />
              <AccentMaterial />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
