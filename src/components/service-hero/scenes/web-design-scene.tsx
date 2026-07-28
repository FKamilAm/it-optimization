"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

/** Слои макета: чем дальше от зрителя, тем «глубже» в интерфейсе. */
const LAYERS = [
  { z: -1.5, scale: 1.0, opacity: 0.32 },
  { z: -0.75, scale: 1.06, opacity: 0.55 },
  { z: 0, scale: 1.12, opacity: 1 },
] as const;

const PLATE = 0.07;

/**
 * Веб-дизайн системы — три плоскости макета, парящие одна над другой. Они
 * медленно сходятся в один экран и снова расступаются: собранный интерфейс
 * распадается на слои, из которых собран.
 *
 * Верхний слой несёт узнаваемые элементы страницы (шапка, две карточки,
 * акцентная кнопка), нижние — только каркас, чтобы не рябило.
 */
export function WebDesignScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const layersRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const layers = layersRef.current;
    if (!layers || !animate) return;
    // 0 — слои сведены в один экран, 1 — разнесены полностью.
    const spread = (Math.sin(clock.getElapsedTime() * 0.45) + 1) / 2;
    layers.children.forEach((child, index) => {
      const base = LAYERS[index]?.z ?? 0;
      child.position.z = base * (0.35 + spread * 0.65);
    });
  });

  return (
    <group ref={groupRef}>
      <group ref={layersRef} scale={1.15} rotation={[0.05, -0.3, 0.02]}>
        {LAYERS.map((layer, index) => {
          const top = index === LAYERS.length - 1;
          return (
            <group key={layer.z} position={[0, 0, layer.z]} scale={layer.scale}>
              {/* Плоскость макета. */}
              <RoundedBox args={[4.2, 2.9, PLATE]} radius={0.14} smoothness={5}>
                <ChromeMaterial
                  color={top ? "#f1f5f9" : "#cbd5e1"}
                  roughness={top ? 0.25 : 0.4}
                  transparent
                  opacity={layer.opacity}
                />
              </RoundedBox>

              {/* Шапка страницы есть на всех слоях — по ней читается вертикаль. */}
              <mesh position={[0, 1.12, PLATE]}>
                <boxGeometry args={[3.6, 0.22, 0.04]} />
                <ChromeMaterial
                  color="#94a3b8"
                  roughness={0.35}
                  transparent
                  opacity={layer.opacity}
                />
              </mesh>

              {top && (
                <>
                  {/* Две карточки контента. */}
                  {[-0.95, 0.95].map((x) => (
                    <RoundedBox
                      key={x}
                      args={[1.6, 1.15, 0.05]}
                      radius={0.08}
                      smoothness={4}
                      position={[x, 0.2, PLATE]}
                    >
                      <ChromeMaterial color="#e2e8f0" roughness={0.3} />
                    </RoundedBox>
                  ))}

                  {/* Строки текста под карточками. */}
                  {[-0.72, -1.02].map((y, i) => (
                    <mesh key={y} position={[-0.55 + i * 0.25, y, PLATE]}>
                      <boxGeometry args={[2.5 - i * 0.7, 0.12, 0.04]} />
                      <ChromeMaterial color="#9aa2ad" roughness={0.35} />
                    </mesh>
                  ))}

                  {/* Акцентная кнопка — единственное цветное пятно. */}
                  <RoundedBox
                    args={[0.95, 0.3, 0.06]}
                    radius={0.14}
                    smoothness={4}
                    position={[1.28, -0.95, PLATE]}
                  >
                    <AccentMaterial />
                  </RoundedBox>
                </>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}
