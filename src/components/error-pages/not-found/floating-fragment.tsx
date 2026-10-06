"use client";

import { useRef } from "react";
import {
  motion,
  motionValue,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Сцена размечена в модулях: 13 × 8. Отсюда — проценты для CSS. */
export const SCENE_W = 13;
export const SCENE_H = 8;

export function boxStyle({ x, y, w, h }: Box) {
  return {
    left: `${(x / SCENE_W) * 100}%`,
    top: `${(y / SCENE_H) * 100}%`,
    width: `${(w / SCENE_W) * 100}%`,
    height: `${(h / SCENE_H) * 100}%`,
  };
}

interface FloatingFragmentProps {
  box: Box;
  material: string;
  /** Курсор в координатах окна; null — взаимодействие выключено. */
  pointer: MotionValue<{ x: number; y: number }> | null;
  /** Период покачивания, секунды: 5–10, у каждого свой. */
  period: number;
  delay?: number;
  rotate?: number;
  idle: boolean;
  className?: string;
}

const PULL_RADIUS = 220;
const PULL_MAX = 8;

/**
 * Обломок вокруг 404. Три вложенных слоя — у каждого своя забота:
 * внешний ловит притяжение к курсору, средний покачивается в простое,
 * внутренний несёт материал. Так движения складываются, а не спорят за один
 * transform.
 *
 * Притяжение мягкое и короткое: не ближе 220px и не больше 8px. Обломок
 * «тянется» к курсору, но не прилипает и не убегает — резкая магнитность
 * читается как баг и укачивает.
 */
export function FloatingFragment({
  box,
  material,
  pointer,
  period,
  delay = 0,
  rotate = 0,
  idle,
  className,
}: FloatingFragmentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const x = useSpring(pullX, { stiffness: 70, damping: 16, mass: 0.6 });
  const y = useSpring(pullY, { stiffness: 70, damping: 16, mass: 0.6 });

  useMotionValueEvent(pointer ?? NO_POINTER, "change", (p) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = p.x - (r.left + r.width / 2);
    const dy = p.y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > PULL_RADIUS || d === 0) {
      pullX.set(0);
      pullY.set(0);
      return;
    }
    const force = (1 - d / PULL_RADIUS) * PULL_MAX;
    pullX.set((dx / d) * force);
    pullY.set((dy / d) * force);
  });

  return (
    <div ref={ref} className={cn("absolute", className)} style={boxStyle(box)}>
      <motion.div className="h-full w-full" style={{ x, y }}>
        <motion.div
          className="h-full w-full"
          animate={
            idle
              ? {
                  y: [0, -4, 0, 3, 0],
                  rotate: [rotate, rotate + 1, rotate, rotate - 1, rotate],
                }
              : undefined
          }
          initial={{ rotate }}
          transition={{ duration: period, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <div className={cn("e404-piece inset-0", material)} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Заглушка для подписки: хук нельзя вызвать условно, а без курсора
// (телефон, reduced motion) слушать нечего — это значение не меняется никогда.
const NO_POINTER = motionValue({ x: -1e6, y: -1e6 });
