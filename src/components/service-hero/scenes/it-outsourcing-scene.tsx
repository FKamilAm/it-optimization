"use client";

import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const BAND_RADIUS = 1.55;
const CUP_X = BAND_RADIUS;
const CUP_Y = -0.15;

/**
 * ИТ-аутсорсинг — гарнитура: дуга оголовья, две чашки и зелёная штанга
 * микрофона.
 *
 * Щит и замок в серии уже заняты аудитом сайта и поддержкой продукта, да и
 * говорят они про защиту. Здесь услуга про другое — дежурство, заявки и время
 * реакции, — поэтому образ взят из диспетчерской, а не из охраны.
 */
export function ItOutsourcingScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.15} rotation={[0.12, -0.34, 0]}>
        {/* Оголовье — полукольцо, концы приходят ровно на оси чашек. */}
        <mesh position={[0, CUP_Y, 0]}>
          <torusGeometry args={[BAND_RADIUS, 0.14, 20, 96, Math.PI]} />
          <ChromeMaterial />
        </mesh>

        {[-1, 1].map((side) => (
          <group key={side} position={[side * CUP_X, CUP_Y, 0]}>
            {/* Чашка лежит на боку: ось цилиндра смотрит на слушателя. */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.62, 0.62, 0.62, 40]} />
              <ChromeMaterial />
            </mesh>
            {/* Амбушюра — темнее корпуса, иначе чашка читается сплошным диском. */}
            <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.44, 0.44, 0.16, 36]} />
              <ChromeMaterial color="#9ca5b1" roughness={0.34} />
            </mesh>
          </group>
        ))}

        {/* Штанга микрофона: дуга от левой чашки вперёд и вниз, с шариком. */}
        <group position={[-CUP_X, CUP_Y - 0.1, 0.2]} rotation={[0.5, 0, -0.35]}>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <torusGeometry args={[1.0, 0.065, 14, 64, Math.PI * 0.52]} />
            <AccentMaterial />
          </mesh>
          <mesh
            position={[
              Math.sin(Math.PI * 0.52) * 1.0,
              -1.0 + Math.cos(Math.PI * 0.52) * 1.0,
              0,
            ]}
          >
            <sphereGeometry args={[0.19, 28, 28]} />
            <AccentMaterial />
          </mesh>
        </group>
      </group>
    </group>
  );
}
