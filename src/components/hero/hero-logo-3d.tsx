"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Bounds, Environment, Lightformer } from "@react-three/drei";
import { SVGLoader } from "three-stdlib";
import { useInView } from "@/hooks/use-in-view";
import { prefersReducedMotion } from "@/lib/utils";

// curveSegments — во сколько отрезков разбивается каждая кривая контура. В
// logo-mark.svg их 36 плюс скруглённый прямоугольник акцентной точки, так что
// значение множится на весь контур кольца: при 40 грань приходилась на каждые
// 2,3° дуги — примерно 156 граней на окружность. Столько имеет смысл, если
// модель можно приблизить; наш знак занимает фиксированное место на экране.
// 16 даёт грань на 5,6°, на силуэте это неразличимо, а треугольников остаётся
// 32% (28 816 → 9 228) и столько же работы в каждом кадре.
//
// Ниже 16 не опускаемся: материал зеркальный (metalness 1), а на блестящем
// огранка проявляется в бликах раньше, чем на силуэте.
const EXTRUDE_OPTIONS: THREE.ExtrudeGeometryOptions = {
  depth: 8,
  bevelEnabled: true,
  bevelThickness: 1.15,
  bevelSize: 0.85,
  bevelSegments: 3,
  curveSegments: 16,
};

// World size of the mark's largest dimension. Kept modest so it never clips inside
// the (often portrait) hero container regardless of its aspect ratio.
const TARGET_SIZE = 3.6;

function LogoMark({ animate }: { animate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const svg = useLoader(SVGLoader, "/logo-mark.svg");
  const invalidate = useThree((state) => state.invalidate);

  const { geometries, fit } = useMemo(() => {
    const geos: THREE.ExtrudeGeometry[] = [];

    for (const path of svg.paths) {
      // toShapes handles the "O" ring (a single bridged/keyhole contour) correctly.
      for (const shape of path.toShapes()) {
        geos.push(new THREE.ExtrudeGeometry(shape, EXTRUDE_OPTIONS));
      }
    }

    // Center every piece on the shared origin so the group rotates in place.
    const box = new THREE.Box3();
    for (const geo of geos) {
      geo.computeBoundingBox();
      if (geo.boundingBox) box.union(geo.boundingBox);
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    for (const geo of geos) {
      geo.translate(-center.x, -center.y, -center.z);
    }

    const maxDim = Math.max(size.x, size.y) || 1;
    return { geometries: geos, fit: TARGET_SIZE / maxDim };
  }, [svg]);

  // Dispose geometries on unmount / reload to avoid GPU leaks.
  useEffect(() => {
    return () => geometries.forEach((geo) => geo.dispose());
  }, [geometries]);

  // Static scenes render on demand — nudge one frame once the mark is ready.
  useEffect(() => {
    if (!animate) invalidate();
  }, [animate, invalidate]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || !animate) return;
    const t = clock.getElapsedTime();
    // Sine-driven → inherently ease-in-out and perfectly seamless on loop.
    // Main sway ~10.5s, secondary tilt + float layered on for a living, subtle idle.
    group.rotation.y = Math.sin(t * 0.6) * 0.38;
    group.rotation.x = -0.07 + Math.sin(t * 0.45) * 0.08;
    group.position.y = Math.sin(t * 0.72) * 0.12;
  });

  return (
    <group ref={groupRef} rotation={animate ? [0, 0, 0] : [-0.07, -0.5, 0]}>
      {/* Flip the y-down SVG upright with a rotation (keeps face normals correct). */}
      <group scale={fit} rotation={[Math.PI, 0, 0]}>
        {geometries.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <meshStandardMaterial
              color="#cdd4dd"
              metalness={1}
              roughness={0.23}
              envMapIntensity={1.55}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StudioEnvironment() {
  // A studio reflection map built entirely from in-scene lightformers — no external
  // HDRI fetch, so it works offline and stays lightweight. Bright panel up top and
  // darker panels below give the polished white-to-graphite chrome read.
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

export default function HeroLogo3D() {
  const animate = !prefersReducedMotion();
  // Пока сцена за пределами экрана, кадры не рисуются вовсе: "never" полностью
  // останавливает requestAnimationFrame. Видимой разницы нет — за экраном
  // смотреть нечего, — а основной поток освобождается.
  const { ref, inView } = useInView<HTMLDivElement>();

  const frameloop = !animate ? "demand" : inView ? "always" : "never";

  return (
    <div ref={ref} className="h-full w-full">
      {/* dpr до 1.5, а не 2: закраска зеркального металла с отражением
          окружения — самая дорогая часть кадра, и на retina это вчетверо
          больше пикселей при разнице, которую на таком размере не видно.
          У сцен на страницах услуг уже стоит 1.5 — здесь было расхождение. */}
      <Canvas
        dpr={[1, 1.5]}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 12], fov: 30 }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 8]} intensity={1.5} />
        <directionalLight position={[-6, -1, 4]} intensity={0.55} color="#aab4c4" />
        <Suspense fallback={null}>
          {/* Auto-fits the mark to the canvas so it never clips regardless of the
              container's aspect ratio (mobile portrait → wide desktop). */}
          <Bounds fit observe margin={1.2}>
            <LogoMark animate={animate} />
          </Bounds>
          <StudioEnvironment />
        </Suspense>
      </Canvas>
    </div>
  );
}
