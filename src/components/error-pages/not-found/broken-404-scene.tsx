"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { FloatingFragment, boxStyle, type Box } from "./floating-fragment";
import "../error-pages.css";

/**
 * «Страница распалась»: 404, собранная из стекла, хрома, графита и каркаса.
 *
 * Сцена размечена в модулях 13 × 8 (см. boxStyle): цифры занимают 11 × 5,
 * остальное — воздух для обломков и упавшего блока. Всё в процентах, поэтому
 * конструкция масштабируется одним размером контейнера.
 *
 * Чего не хватает и почему: блок в правом нижнем углу «0» отрывается при
 * появлении и зависает ниже — его пустое место и есть «потерянная страница».
 * У второй «4» нет перекладины: на её месте пунктир, а сама деталь висит
 * рядом обломком. Единственный свет — внутренний контур «0».
 *
 * Глубина — три слоя с разной амплитудой отклика на курсор: фон 4px,
 * конструкция 10px с наклоном до 2°, обломки 18px. Только transform; на
 * телефоне и при reduced motion курсор не слушается вовсе.
 */

type Material = "e404-glass" | "e404-metal" | "e404-graphite" | "e404-wire";

interface Piece extends Box {
  material: Material;
  /** Смещение «распавшейся» детали: доли модуля и градусы. */
  shift?: { x: number; y: number; r: number };
}

// Цифры начинаются с (1, 0.8): модуль отступа слева и сверху.
const PIECES: Piece[] = [
  // 4
  { x: 1, y: 0.8, w: 1, h: 3, material: "e404-glass" },
  {
    x: 2,
    y: 2.8,
    w: 1,
    h: 1,
    material: "e404-wire",
    shift: { x: -0.06, y: 0.12, r: -3 },
  },
  { x: 3, y: 0.8, w: 1, h: 5, material: "e404-metal" },
  // 0
  {
    x: 5,
    y: 0.8,
    w: 3,
    h: 1,
    material: "e404-metal",
    shift: { x: 0, y: -0.14, r: -1.2 },
  },
  { x: 5, y: 1.8, w: 1, h: 3, material: "e404-glass" },
  { x: 7, y: 1.8, w: 1, h: 2, material: "e404-graphite" },
  { x: 5, y: 4.8, w: 3, h: 1, material: "e404-glass" },
  // 4
  { x: 9, y: 0.8, w: 1, h: 3, material: "e404-graphite" },
  {
    x: 11,
    y: 0.8,
    w: 1,
    h: 5,
    material: "e404-glass",
    shift: { x: 0.12, y: 0.05, r: 1.6 },
  },
];

// Пустое место перекладины второй «4».
const GHOST: Box = { x: 10, y: 2.8, w: 1, h: 1 };
// Внутренний контур «0» — единственный свет на сцене.
const GLOW: Box = { x: 6.18, y: 2.02, w: 0.64, h: 2.56 };
// Блок, который выпадает: его место — правый нижний угол «0».
const FALLING: Box = { x: 7, y: 3.8, w: 1, h: 1 };

interface Fragment {
  box: Box;
  material: Material;
  period: number;
  rotate?: number;
  /** Только на широком экране: на телефоне обломков вдвое меньше. */
  desktop?: boolean;
}

const FRAGMENTS: Fragment[] = [
  {
    box: { x: 0.25, y: 0.55, w: 0.45, h: 0.45 },
    material: "e404-glass",
    period: 7,
    rotate: 8,
  },
  {
    box: { x: 4.25, y: 0.15, w: 0.3, h: 0.3 },
    material: "e404-metal",
    period: 6,
    rotate: -12,
    desktop: true,
  },
  {
    box: { x: 8.3, y: 0.25, w: 0.55, h: 0.55 },
    material: "e404-wire",
    period: 9,
    rotate: 14,
  },
  {
    box: { x: 12.25, y: 1.55, w: 0.4, h: 0.4 },
    material: "e404-metal",
    period: 8,
    rotate: 20,
    desktop: true,
  },
  {
    box: { x: 12.35, y: 4.5, w: 0.6, h: 0.6 },
    material: "e404-glass",
    period: 10,
    rotate: -8,
  },
  {
    box: { x: 0.35, y: 4.35, w: 0.35, h: 0.35 },
    material: "e404-graphite",
    period: 5.5,
    rotate: 18,
    desktop: true,
  },
  // Деталь перекладины второй «4»: висит под своим пустым местом.
  {
    box: { x: 10.25, y: 6.3, w: 0.5, h: 0.5 },
    material: "e404-glass",
    period: 7.5,
    rotate: -16,
  },
  {
    box: { x: 3.35, y: 6.45, w: 0.3, h: 0.3 },
    material: "e404-wire",
    period: 6.5,
    rotate: 30,
    desktop: true,
  },
  {
    box: { x: 9.45, y: 6.85, w: 0.22, h: 0.22 },
    material: "e404-metal",
    period: 9.5,
    rotate: -25,
    desktop: true,
  },
];

// Насколько падает блок: в долях его же размера (1 модуль).
const FALL = { y: 2.75, x: 0.32, r: 10 };
// Сколько блок «пытается вернуться», когда к нему подводят курсор: доля пути.
const ATTEMPT = 0.7;

export function Broken404Scene() {
  const reduce = useReducedMotion();
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    setInteractive(fine.matches && !reduce);
  }, [reduce]);

  // Курсор: нормированный для параллакса и в пикселях — для притяжения.
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const sx = useSpring(nx, { stiffness: 45, damping: 18, mass: 0.8 });
  const sy = useSpring(ny, { stiffness: 45, damping: 18, mass: 0.8 });
  const pointer = useMotionValue({ x: -1e6, y: -1e6 });

  const fallingRef = useRef<HTMLDivElement>(null);
  const fallTarget = useMotionValue(0);
  // Медленное падение с лёгким «зависанием»: пружина, а не кривая.
  const fall = useSpring(fallTarget, { stiffness: 18, damping: 6, mass: 1.3 });
  const [fallen, setFallen] = useState(false);

  // Появление: конструкция почти собрана, через секунду блок отрывается.
  useEffect(() => {
    if (reduce) {
      fallTarget.set(1);
      fall.jump(1);
      setFallen(true);
      return;
    }
    const t = window.setTimeout(() => {
      fallTarget.set(1);
      setFallen(true);
    }, 1300);
    return () => window.clearTimeout(t);
  }, [reduce, fall, fallTarget]);

  useEffect(() => {
    if (!interactive) return;
    let raf = 0;
    let last = { x: 0, y: 0 };
    const onMove = (event: PointerEvent) => {
      last = { x: event.clientX, y: event.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        nx.set((last.x / window.innerWidth) * 2 - 1);
        ny.set((last.y / window.innerHeight) * 2 - 1);
        pointer.set(last);
        // Упавший блок пытается вернуться, когда к нему подводят курсор, —
        // но никогда не возвращается до конца.
        const el = fallingRef.current;
        if (!el || fallTarget.get() < ATTEMPT) return;
        const r = el.getBoundingClientRect();
        const d = Math.hypot(
          last.x - (r.left + r.width / 2),
          last.y - (r.top + r.height / 2),
        );
        if (d < 170) fallTarget.set(ATTEMPT);
        else if (d > 240) fallTarget.set(1);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [interactive, nx, ny, pointer, fallTarget]);

  const bgX = useTransform(sx, (v) => v * 4);
  const bgY = useTransform(sy, (v) => v * 4);
  const mainX = useTransform(sx, (v) => v * 10);
  const mainY = useTransform(sy, (v) => v * 10);
  const tiltY = useTransform(sx, (v) => v * 2);
  const tiltX = useTransform(sy, (v) => v * -2);
  const frontX = useTransform(sx, (v) => v * 18);
  const frontY = useTransform(sy, (v) => v * 18);

  const fallY = useTransform(fall, (p) => `${p * FALL.y * 100}%`);
  const fallX = useTransform(fall, (p) => `${p * FALL.x * 100}%`);
  const fallR = useTransform(fall, (p) => p * FALL.r);
  const threadScale = useTransform(fall, (p) => Math.max(0, p));
  const markerOpacity = useTransform(fall, [0.85, 1], [0, 1]);

  const idle = !reduce;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Фон: крупная чёрная геометрия и сетка — слой с наименьшим откликом. */}
      <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
        <div className="e404-grid absolute inset-0" />
        <div className="absolute -right-[14vw] -bottom-[30vw] aspect-square w-[58vw] rounded-full bg-[#0a0a0a] md:-right-[8vw] md:-bottom-[24vw] md:w-[44vw]" />
        <div className="absolute top-[14%] -right-[6vw] hidden h-[34svh] w-[18vw] rotate-[8deg] rounded-[2rem] bg-[#0f0f0f] lg:block" />
        <div className="absolute top-[58%] left-[6vw] hidden h-px w-[22vw] bg-[#0a0a0a]/15 lg:block" />
      </motion.div>

      {/* Конструкция. Высота ограничена и шириной, и высотой окна, чтобы
          текст и кнопки снизу помещались в первый экран. */}
      <div
        className="absolute top-[44%] left-1/2 w-[min(92vw,calc((100svh_-_18rem)*13/8))] -translate-x-1/2 -translate-y-1/2 md:top-[42%] lg:left-[54%] lg:w-[min(64vw,64rem,calc((100svh_-_12rem)*13/8))]"
        style={{ perspective: 1400 }}
      >
        <motion.div
          className="relative aspect-[13/8] w-full"
          style={{ x: mainX, y: mainY, rotateX: tiltX, rotateY: tiltY }}
        >
          {PIECES.map((piece, i) => (
            // Сдвиг «распавшейся» детали — снаружи, появление — внутри:
            // анимация появления заканчивается transform: none и затёрла бы
            // сдвиг, окажись они на одном элементе.
            <div
              key={i}
              className="e404-piece"
              style={{
                ...boxStyle(piece),
                transform: piece.shift
                  ? `translate(${piece.shift.x * 100}%, ${piece.shift.y * 100}%) rotate(${piece.shift.r}deg)`
                  : undefined,
              }}
            >
              <div
                className={`e404-piece e404-assemble inset-0 ${piece.material}`}
                style={{ animationDelay: `${0.08 * i}s` }}
              />
            </div>
          ))}

          <div
            className="e404-piece e404-ghost e404-assemble"
            style={{ ...boxStyle(GHOST), animationDelay: "0.7s" }}
          />
          {/* Нить от пустого места перекладины к её обломку внизу. */}
          <div
            className="e404-line e404-assemble absolute w-px"
            style={{
              left: `${(10.5 / 13) * 100}%`,
              top: `${(3.8 / 8) * 100}%`,
              height: `${(2.5 / 8) * 100}%`,
              animationDelay: "0.9s",
            }}
          />

          <div
            className="e404-piece e404-glow e404-assemble"
            style={{ ...boxStyle(GLOW), animationDelay: "0.75s" }}
          />

          {/* Нить от пустого места к упавшему блоку — растёт вместе с падением. */}
          <motion.div
            className="e404-line absolute w-px origin-top"
            style={{
              left: `${(7.62 / 13) * 100}%`,
              top: `${(4.3 / 8) * 100}%`,
              height: `${((FALL.y + 0.05) / 8) * 100}%`,
              scaleY: threadScale,
            }}
          />

          {/* Упавший блок: внешний слой — падение и попытка вернуться,
              внутренний — покачивание, когда упал. */}
          <motion.div
            ref={fallingRef}
            className="absolute"
            style={{ ...boxStyle(FALLING), x: fallX, y: fallY, rotate: fallR }}
          >
            <motion.div
              className="h-full w-full"
              animate={fallen && idle ? { y: [0, -4, 0], rotate: [0, 1, 0] } : undefined}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.2,
              }}
            >
              <div className="e404-piece e404-metal inset-0" />
            </motion.div>
          </motion.div>

          {/* Метка у упавшего блока: точка и тонкая черта, без букв и цифр. */}
          <motion.div
            className="absolute flex items-center"
            style={{
              left: `${((FALLING.x + FALL.x + 1.15) / 13) * 100}%`,
              top: `${((FALLING.y + FALL.y + 0.5) / 8) * 100}%`,
              opacity: markerOpacity,
            }}
          >
            <span className="block h-px w-[clamp(18px,2.4vw,40px)] bg-[#0a0a0a]/35" />
            <span className="ml-1.5 block h-2 w-2 rounded-full bg-[#b4e02d] shadow-[0_0_10px_rgba(180,224,45,0.8)]" />
          </motion.div>
        </motion.div>
      </div>

      {/* Обломки — передний слой, самый подвижный. */}
      <div className="absolute top-[44%] left-1/2 w-[min(92vw,calc((100svh_-_18rem)*13/8))] -translate-x-1/2 -translate-y-1/2 md:top-[42%] lg:left-[54%] lg:w-[min(64vw,64rem,calc((100svh_-_12rem)*13/8))]">
        <motion.div
          className="relative aspect-[13/8] w-full"
          style={{ x: frontX, y: frontY }}
        >
          {FRAGMENTS.map((f, i) => (
            <FloatingFragment
              key={i}
              box={f.box}
              material={f.material}
              period={f.period}
              rotate={f.rotate}
              delay={i * 0.4}
              idle={idle}
              pointer={interactive ? pointer : null}
              className={f.desktop ? "hidden md:block" : undefined}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
