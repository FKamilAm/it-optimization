"use client";

import { RoundedBox } from "@react-three/drei";
import { AccentMaterial, ChromeMaterial, Connector, useIdleAnimation } from "../shared";

// Dark recessed body behind the chrome wire grid — gives the see-through
// "wire basket" read of a real supermarket cart.
const BODY = {
  color: "#12161d",
  metalness: 0.8,
  roughness: 0.25,
  envMapIntensity: 1.4,
} as const;

const W = 2.4;
const H = 1.3;
const D = 1.4;

// Grid line positions for the wire-mesh basket.
const FRONT_X = [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05];
const ROW_Y = [-0.52, -0.17, 0.18, 0.53];
const END_Z = [-0.5, -0.15, 0.2, 0.55];

// Four wheels at the base corners.
const WHEELS: [number, number][] = [
  [-0.55, -0.45],
  [-0.55, 0.45],
  [1.0, -0.45],
  [1.0, 0.45],
];

/**
 * E-commerce — a chrome supermarket shopping cart: a wire-mesh basket on four
 * wheels (aligned with the cart's travel direction) with a push handle. The
 * handle grip is the brand accent.
 */
export function EcommerceScene({ animate }: { animate: boolean }) {
  const groupRef = useIdleAnimation(animate);

  return (
    <group ref={groupRef}>
      <group scale={1.42} rotation={[0.14, -0.5, 0]} position={[0, 0.1, 0]}>
        {/* ---- Wire-mesh basket (tilted back a touch) ---- */}
        <group position={[0.25, 0.55, 0]} rotation={[0.12, 0, 0]}>
          {/* Dark body behind the grid. */}
          <RoundedBox args={[W, H, D]} radius={0.1} smoothness={5}>
            <meshStandardMaterial {...BODY} />
          </RoundedBox>

          {/* Front grid (facing +Z). */}
          {FRONT_X.map((x) => (
            <mesh key={`fv${x}`} position={[x, 0, D / 2 + 0.02]}>
              <boxGeometry args={[0.06, H * 0.96, 0.05]} />
              <ChromeMaterial />
            </mesh>
          ))}
          {ROW_Y.map((y) => (
            <mesh key={`fh${y}`} position={[0, y, D / 2 + 0.02]}>
              <boxGeometry args={[W * 0.98, 0.06, 0.05]} />
              <ChromeMaterial />
            </mesh>
          ))}

          {/* End grids (facing ±X). */}
          {[-1, 1].map((sx) => (
            <group key={sx} position={[sx * (W / 2 + 0.02), 0, 0]}>
              {END_Z.map((z) => (
                <mesh key={`ev${z}`} position={[0, 0, z]}>
                  <boxGeometry args={[0.05, H * 0.96, 0.06]} />
                  <ChromeMaterial />
                </mesh>
              ))}
              {ROW_Y.map((y) => (
                <mesh key={`eh${y}`} position={[0, y, 0]}>
                  <boxGeometry args={[0.05, 0.06, D * 0.96]} />
                  <ChromeMaterial />
                </mesh>
              ))}
            </group>
          ))}

          {/* Top rim frame. */}
          {(
            [
              [0, D / 2],
              [0, -D / 2],
            ] as const
          ).map(([, z]) => (
            <mesh key={`rim${z}`} position={[0, H / 2, z]}>
              <boxGeometry args={[W + 0.12, 0.11, 0.11]} />
              <ChromeMaterial color="#c8ced6" />
            </mesh>
          ))}
          {[-1, 1].map((sx) => (
            <mesh key={`rimx${sx}`} position={[(sx * W) / 2, H / 2, 0]}>
              <boxGeometry args={[0.11, 0.11, D + 0.12]} />
              <ChromeMaterial color="#c8ced6" />
            </mesh>
          ))}
        </group>

        {/* ---- Push handle: two posts + accent grip ---- */}
        <Connector from={[-0.95, 1.05, 0.35]} to={[-1.75, 1.6, 0.35]} radius={0.08} />
        <Connector from={[-0.95, 1.05, -0.35]} to={[-1.75, 1.6, -0.35]} radius={0.08} />
        <mesh position={[-1.75, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.0, 20]} />
          <AccentMaterial />
        </mesh>

        {/* ---- Legs + four wheels (rolling along the cart, not across) ---- */}
        {WHEELS.map(([x, z]) => (
          <group key={`${x}-${z}`}>
            <Connector from={[x, -0.1, z]} to={[x, -0.72, z]} radius={0.07} />
            <mesh position={[x, -0.9, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.16, 28]} />
              <ChromeMaterial color="#8b939f" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
