"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

/**
 * Shared building blocks for the service-page hero 3D scenes. Every scene reuses
 * the exact chrome look, studio lighting and idle motion from the homepage logo
 * (`hero-logo-3d.tsx`) so the eight visuals read as one cohesive series.
 */

// Polished white-to-graphite chrome — identical values to the homepage mark.
export const CHROME = {
  color: "#cdd4dd",
  metalness: 1,
  roughness: 0.23,
  envMapIntensity: 1.6,
} as const;

// Brand green, used sparingly as a single accent detail per scene.
export const ACCENT = {
  color: "#b4e02d",
  metalness: 0.35,
  roughness: 0.32,
  emissive: "#b4e02d",
  emissiveIntensity: 0.4,
  envMapIntensity: 1,
} as const;

export function ChromeMaterial(props: React.ComponentProps<"meshStandardMaterial">) {
  return <meshStandardMaterial {...CHROME} {...props} />;
}

export function AccentMaterial(props: React.ComponentProps<"meshStandardMaterial">) {
  return <meshStandardMaterial {...ACCENT} {...props} />;
}

/**
 * The same in-scene studio reflection map as the homepage — no external HDRI, so
 * it works offline and stays lightweight. Bright top panel + darker side/bottom
 * panels give the polished chrome read.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#0d1016"]} />
      <Lightformer
        form="rect"
        intensity={5}
        color="#ffffff"
        position={[0, 6, 4]}
        scale={[12, 6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#cbd5e1"
        position={[-6, 2, 2]}
        scale={[6, 9, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#334155"
        position={[6, -3, 3]}
        scale={[7, 5, 1]}
      />
      <Lightformer
        form="ring"
        intensity={1.5}
        color="#e2e8f0"
        position={[3, 4, -5]}
        scale={[3, 3, 1]}
      />
      <Lightformer
        form="circle"
        intensity={1.2}
        color="#94a3b8"
        position={[-4, -4, -3]}
        scale={[4, 4, 1]}
      />
    </Environment>
  );
}

/**
 * Sine-driven idle motion — gentle, slow and seamless. Kept softer than the
 * homepage logo (smaller amplitude + slower cycles) so the accent visual reads
 * as a calm ambient detail rather than an attention-grabbing spin. Returns a ref
 * to attach to the animated group; when `animate` is false the scene renders
 * once (on-demand frameloop) in a resting pose.
 */
export function useIdleAnimation(
  animate: boolean,
  restRotation: [number, number, number] = [-0.04, -0.28, 0],
) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!animate && ref.current) {
      ref.current.rotation.set(...restRotation);
      invalidate();
    }
    // restRotation is a literal — spread avoids identity churn deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, invalidate]);

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group || !animate) return;
    const t = clock.getElapsedTime();
    // Slower cycles + smaller amplitude → smooth, unobtrusive drift with no
    // perceptible "zoom" from perspective foreshortening.
    group.rotation.y = Math.sin(t * 0.28) * 0.16;
    group.rotation.x = -0.04 + Math.sin(t * 0.2) * 0.04;
    group.position.y = Math.sin(t * 0.34) * 0.06;
  });

  return ref;
}

/** Rounded-rectangle 2D shape, centred on the origin — handy for cards/bubbles. */
export function roundedRectShape(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

/**
 * Thin chrome cylinder spanning two points — used as connection "wires" between
 * nodes/blocks. Orients a unit +Y cylinder onto the start→end direction.
 */
const UP = new THREE.Vector3(0, 1, 0);
export function Connector({
  from,
  to,
  radius = 0.05,
  accent = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  accent?: boolean;
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());

  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 16]} />
      {accent ? <AccentMaterial /> : <ChromeMaterial roughness={0.3} />}
    </mesh>
  );
}

/**
 * Spur-gear 2D shape: an inner disc with `teeth` rectangular teeth around the
 * rim and a central bore. Centred on the origin.
 */
export function gearShape(
  teeth: number,
  rootRadius: number,
  toothHeight: number,
  bore: number,
) {
  const shape = new THREE.Shape();
  const tip = rootRadius + toothHeight;
  const half = Math.PI / teeth; // half tooth+gap angular width
  // Tooth occupies ~48% of each pitch; the rest is the valley.
  const toothHalf = half * 0.48;

  for (let i = 0; i < teeth; i++) {
    const c = (i / teeth) * Math.PI * 2;
    const a0 = c - toothHalf;
    const a1 = c + toothHalf;
    const a2 = c + half - toothHalf; // valley start (next gap)
    const a3 = c + half + toothHalf;

    const p = (radius: number, ang: number): [number, number] => [
      Math.cos(ang) * radius,
      Math.sin(ang) * radius,
    ];

    if (i === 0) shape.moveTo(...p(tip, a0));
    else shape.lineTo(...p(tip, a0));
    shape.lineTo(...p(tip, a1)); // tooth tip
    shape.lineTo(...p(rootRadius, a2)); // down into valley
    shape.lineTo(...p(rootRadius, a3)); // along valley to next tooth base
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

/**
 * Stroke a polyline into a filled 2D shape of constant `width`, with proper
 * mitered joins — so a checkmark (or any bent line) has clean, flush corners
 * instead of overlapping square caps that poke out.
 */
export function strokeShape(points: [number, number][], width: number) {
  const w = width / 2;
  const pts = points.map(([x, y]) => new THREE.Vector2(x, y));
  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  const perp = (d: THREE.Vector2) => new THREE.Vector2(-d.y, d.x);

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0) {
      const d = pts[i + 1].clone().sub(p).normalize();
      const n = perp(d);
      left.push(p.clone().addScaledVector(n, w));
      right.push(p.clone().addScaledVector(n, -w));
    } else if (i === pts.length - 1) {
      const d = p
        .clone()
        .sub(pts[i - 1])
        .normalize();
      const n = perp(d);
      left.push(p.clone().addScaledVector(n, w));
      right.push(p.clone().addScaledVector(n, -w));
    } else {
      const d0 = p
        .clone()
        .sub(pts[i - 1])
        .normalize();
      const d1 = pts[i + 1].clone().sub(p).normalize();
      const n0 = perp(d0);
      const n1 = perp(d1);
      const miter = n0.clone().add(n1).normalize();
      const len = w / Math.max(miter.dot(n0), 0.35);
      left.push(p.clone().addScaledVector(miter, len));
      right.push(p.clone().addScaledVector(miter, -len));
    }
  }

  const outline = [...left, ...right.reverse()];
  const shape = new THREE.Shape();
  shape.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i].x, outline[i].y);
  shape.closePath();
  return shape;
}

/**
 * Heraldic shield 2D shape: flat rounded shoulders tapering to a rounded point.
 * Centred roughly on the origin; `w`/`h` are full width/height.
 */
export function shieldShape(w: number, h: number) {
  const halfW = w / 2;
  const top = h / 2;
  const bottom = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(0, top);
  s.quadraticCurveTo(halfW, top, halfW, top * 0.4);
  s.lineTo(halfW, -top * 0.1);
  // Sweep down each flank to the point.
  s.quadraticCurveTo(halfW, bottom * 0.55, 0, bottom);
  s.quadraticCurveTo(-halfW, bottom * 0.55, -halfW, -top * 0.1);
  s.lineTo(-halfW, top * 0.4);
  s.quadraticCurveTo(-halfW, top, 0, top);
  return s;
}
