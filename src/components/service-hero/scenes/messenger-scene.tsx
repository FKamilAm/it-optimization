"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const BUBBLE_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.34,
  bevelEnabled: true,
  bevelThickness: 0.07,
  bevelSize: 0.06,
  bevelSegments: 3,
  curveSegments: 10,
};

/**
 * Rounded rectangle with a tail on one bottom corner — a speech bubble.
 *
 * roundedRectShape from ../shared would give the body, but a bubble without a
 * tail reads as a card, and this series already has cards (business-card,
 * tech-content). The tail is what makes it a conversation.
 */
function bubbleShape(width: number, height: number, radius: number, flip: boolean) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const s = new THREE.Shape();
  const dir = flip ? -1 : 1;

  s.moveTo(-w + r, -h);
  // Tail sits just inside the bottom corner, pointing down and outward.
  s.lineTo(dir * (w - r * 1.6), -h);
  s.lineTo(dir * (w - r * 0.5), -h - r * 1.15);
  s.lineTo(dir * (w - r * 0.15), -h);
  s.lineTo(dir * (w - r), -h);
  s.quadraticCurveTo(dir * w, -h, dir * w, -h + r);
  s.lineTo(dir * w, h - r);
  s.quadraticCurveTo(dir * w, h, dir * (w - r), h);
  s.lineTo(dir * (-w + r), h);
  s.quadraticCurveTo(dir * -w, h, dir * -w, h - r);
  s.lineTo(dir * -w, -h + r);
  s.quadraticCurveTo(dir * -w, -h, dir * (-w + r), -h);
  return s;
}

/**
 * Corporate messenger — two speech bubbles from opposite sides of a
 * conversation, the near one in brand green. The chrome bubble carries two
 * short bars standing in for text.
 *
 * The Telegram scene in this series is a paper plane (one message, sent
 * outward); bubbles read as an exchange between people, which is what an
 * internal messenger is for.
 */
export function MessengerScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const backGeo = useMemo(
    () => new THREE.ExtrudeGeometry(bubbleShape(3.0, 1.9, 0.42, false), BUBBLE_EXTRUDE),
    [],
  );
  const frontGeo = useMemo(
    () => new THREE.ExtrudeGeometry(bubbleShape(2.4, 1.5, 0.36, true), BUBBLE_EXTRUDE),
    [],
  );

  useEffect(() => {
    return () => {
      backGeo.dispose();
      frontGeo.dispose();
    };
  }, [backGeo, frontGeo]);

  return (
    <group ref={groupRef}>
      <group scale={1.02} rotation={[0.05, -0.26, 0]} position={[0, 0.1, 0]}>
        {/* Incoming message — chrome, sitting back and to the left. */}
        <group position={[-0.75, 0.72, -0.45]}>
          <mesh geometry={backGeo}>
            <ChromeMaterial />
          </mesh>
          {[0.3, -0.15].map((y, i) => (
            <mesh key={y} position={[-0.2 - i * 0.22, y, 0.4]}>
              <boxGeometry args={[1.7 - i * 0.44, 0.16, 0.08]} />
              <ChromeMaterial roughness={0.42} color="#9aa5b1" />
            </mesh>
          ))}
        </group>

        {/* Reply — accent, nearer and to the right. */}
        <mesh geometry={frontGeo} position={[0.95, -0.78, 0.35]}>
          <AccentMaterial />
        </mesh>
      </group>
    </group>
  );
}
