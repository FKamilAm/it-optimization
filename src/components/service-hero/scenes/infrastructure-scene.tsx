"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const W = 2.9;
const D = 1.7;
const UNITS = 6;
const UNIT_H = 0.58;
const PITCH = 0.72;
/** Зелёный юнит — второй сверху: на виду и не срезается краем кадра. */
const ACTIVE = 1;

const TOP = ((UNITS - 1) * PITCH) / 2;
const POST = 0.12;

/**
 * Проектирование ИТ-инфраструктуры — серверная стойка в три четверти: рама на
 * четырёх стойках и шесть юнитов, один из которых зелёный — тот, что добавляет
 * проект.
 *
 * Первый вариант был схемой из горизонтальных плит, и он не сработал дважды.
 * По смыслу схема слоёв не читалась как ИТ вообще, а технически лежащая плашмя
 * хромовая плита зеркалит тёмный фон окружения и выглядит чёрным стеклом:
 * светлые панели студии стоят спереди и сверху, поэтому блестят грани,
 * повёрнутые к зрителю, а не к потолку. Стойка из вертикальных граней этой
 * проблемы лишена по построению.
 */
export function InfrastructureScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const posts: [number, number][] = [
    [W / 2 - POST / 2, D / 2 - POST / 2],
    [-(W / 2 - POST / 2), D / 2 - POST / 2],
    [W / 2 - POST / 2, -(D / 2 - POST / 2)],
    [-(W / 2 - POST / 2), -(D / 2 - POST / 2)],
  ];

  const frameH = UNITS * PITCH + 0.5;

  return (
    <group ref={groupRef}>
      <group scale={0.95} rotation={[0.06, -0.52, 0]}>
        {/* Стойки рамы. */}
        {posts.map(([x, z], i) => (
          <RoundedBox
            key={`p${i}`}
            args={[POST, frameH, POST]}
            radius={0.04}
            smoothness={4}
            position={[x, 0, z]}
          >
            <ChromeMaterial color="#b7bfca" />
          </RoundedBox>
        ))}

        {/* Верхняя и нижняя обвязка — узкие перемычки, а не сплошные крышки:
            широкая горизонтальная грань здесь снова ушла бы в чёрное. */}
        {[frameH / 2 - POST / 2, -(frameH / 2 - POST / 2)].map((y, i) => (
          <group key={`c${i}`}>
            {[D / 2 - POST / 2, -(D / 2 - POST / 2)].map((z, j) => (
              <RoundedBox
                key={j}
                args={[W, POST, POST]}
                radius={0.04}
                smoothness={4}
                position={[0, y, z]}
              >
                <ChromeMaterial color="#b7bfca" />
              </RoundedBox>
            ))}
          </group>
        ))}

        {/* Юниты. */}
        {Array.from({ length: UNITS }, (_, i) => {
          const y = TOP - i * PITCH;
          const active = i === ACTIVE;
          return (
            <group key={`u${i}`} position={[0, y, 0]}>
              <RoundedBox args={[W - 0.3, UNIT_H, D - 0.16]} radius={0.06} smoothness={4}>
                {active ? (
                  <AccentMaterial />
                ) : (
                  <ChromeMaterial color={i % 2 ? "#cdd4dd" : "#c2c9d3"} />
                )}
              </RoundedBox>

              {/* Передняя панель: вентиляционные прорези и ручка. Без них
                  юнит читается бруском, а стойка — стопкой брусков. */}
              {!active && (
                <>
                  {[-0.16, 0, 0.16].map((dy, j) => (
                    <mesh key={j} position={[-0.42, dy, (D - 0.16) / 2 + 0.03]}>
                      <boxGeometry args={[1.5, 0.07, 0.04]} />
                      <ChromeMaterial color="#8b939f" roughness={0.4} />
                    </mesh>
                  ))}
                  <mesh position={[0.92, 0, (D - 0.16) / 2 + 0.04]}>
                    <boxGeometry args={[0.42, 0.14, 0.07]} />
                    <ChromeMaterial color="#9aa2ad" roughness={0.32} />
                  </mesh>
                </>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}
