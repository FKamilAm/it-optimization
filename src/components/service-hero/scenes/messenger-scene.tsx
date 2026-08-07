"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AccentMaterial, ChromeMaterial, useIdleAnimation } from "../shared";

const BUBBLE_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.36,
  bevelEnabled: true,
  bevelThickness: 0.08,
  bevelSize: 0.07,
  bevelSegments: 3,
  curveSegments: 10,
};

/** Front face of an extruded bubble, plus bevel — where the text bars sit. */
const FACE_Z = 0.46;

/**
 * Rounded rectangle with a tail hanging off one bottom corner.
 *
 * The tail is part of the outline rather than a separate mesh, so it extrudes
 * and bevels with the body and reads as one solid shape. Both cases are written
 * out instead of being mirrored with a sign: the outline has to stay wound in
 * one direction, and flipping coordinates mid-path is what made the first
 * version come out crooked.
 */
function bubbleShape(
  width: number,
  height: number,
  radius: number,
  tail: "left" | "right",
) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const s = new THREE.Shape();

  s.moveTo(-w + r, -h);

  if (tail === "left") {
    s.lineTo(-w + r * 0.35, -h - r * 1.25); // tip, angled down and outward
    s.lineTo(-w + r * 1.9, -h);
  }

  if (tail === "right") {
    s.lineTo(w - r * 1.9, -h);
    s.lineTo(w - r * 0.35, -h - r * 1.25);
  }

  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

/** Accent bars standing in for lines of text on a bubble face. */
function TextLines({ widths, gap = 0.34 }: { widths: number[]; gap?: number }) {
  const top = ((widths.length - 1) * gap) / 2;
  return (
    <>
      {widths.map((w, i) => (
        <mesh key={i} position={[-0.1, top - i * gap, FACE_Z]}>
          <boxGeometry args={[w, 0.16, 0.09]} />
          <AccentMaterial />
        </mesh>
      ))}
    </>
  );
}

/**
 * Corporate messenger — two chrome speech bubbles from opposite sides of a
 * conversation, each carrying accent-green bars for text.
 *
 * The Telegram scene in this series is a paper plane: one message, sent
 * outward. Bubbles read as an exchange between people, which is what an
 * internal messenger is for.
 */
export function MessengerScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  const backGeo = useMemo(
    () => new THREE.ExtrudeGeometry(bubbleShape(3.7, 2.35, 0.5, "left"), BUBBLE_EXTRUDE),
    [],
  );
  const frontGeo = useMemo(
    () => new THREE.ExtrudeGeometry(bubbleShape(3.1, 2.0, 0.44, "right"), BUBBLE_EXTRUDE),
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
      <group scale={1.06} rotation={[0.05, -0.24, 0]} position={[0, 0.05, 0]}>
        {/* Incoming — sitting back and up-left, tail on the left. */}
        <group position={[-0.72, 0.92, -0.5]}>
          <mesh geometry={backGeo}>
            <ChromeMaterial />
          </mesh>
          <TextLines widths={[2.3, 1.6]} />
        </group>

        {/* Reply — nearer, down-right, tail on the right. */}
        <group position={[0.86, -0.95, 0.4]}>
          <mesh geometry={frontGeo}>
            <ChromeMaterial />
          </mesh>
          <TextLines widths={[1.9, 1.25]} />
        </group>
      </group>
    </group>
  );
}
