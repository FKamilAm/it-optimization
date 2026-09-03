"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const SEGMENTS = 7;
/** Сегмент занимает не весь свой сектор — по зазорам и читается «эшелоны». */
const ARC = ((Math.PI * 2) / SEGMENTS) * 0.76;
const RADIUS = 2.05;

/**
 * Внедрение средств защиты — периметр, собранный из отдельных дуг: не один
 * сплошной барьер, а несколько независимых средств, каждое на своём участке.
 *
 * Щит в серии занят поддержкой продукта, и он про «закрыто целиком». Здесь
 * смысл другой: защита ставится по частям, и зазоры между сегментами это
 * показывают честнее сплошного кольца. Зелёный сегмент — тот, что ставим
 * сейчас, он вынесен чуть вперёд и наружу.
 */
export function InfosecToolsScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!animate || !ringRef.current) return;
    ringRef.current.rotation.z += Math.min(delta, 0.05) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <group scale={1.05} rotation={[0.42, -0.2, 0]}>
        <group ref={ringRef}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const active = i === 0;
            const angle = (i / SEGMENTS) * Math.PI * 2;
            const push = active ? 0.16 : 0;
            return (
              <group
                key={i}
                rotation={[0, 0, angle - ARC / 2]}
                position={[
                  Math.cos(angle) * push,
                  Math.sin(angle) * push,
                  active ? 0.22 : 0,
                ]}
              >
                <mesh>
                  <torusGeometry args={[RADIUS, 0.17, 18, 48, ARC]} />
                  {active ? (
                    <AccentMaterial />
                  ) : (
                    <ChromeMaterial color={i % 2 ? "#b7bfca" : "#cdd4dd"} />
                  )}
                </mesh>
              </group>
            );
          })}
        </group>

        {/* То, что защищают: спокойное ядро в центре периметра. */}
        <mesh>
          <icosahedronGeometry args={[0.68, 0]} />
          <ChromeMaterial roughness={0.28} />
        </mesh>
      </group>
    </group>
  );
}
