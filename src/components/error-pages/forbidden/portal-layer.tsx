"use client";

import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortalLayerProps {
  /** Нормированное положение курсора, −1…1, уже сглаженное пружиной. */
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  /** Амплитуда отклика, px: внешнее кольцо 2, среднее 5, внутреннее 8. */
  depth: number;
  className?: string;
  children: ReactNode;
}

/**
 * Один слой портала. Чем глубже слой, тем сильнее он смещается за курсором —
 * так плоские кольца складываются в объём без WebGL.
 */
export function PortalLayer({ sx, sy, depth, className, children }: PortalLayerProps) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  return (
    <motion.div className={cn("absolute inset-0", className)} style={{ x, y }}>
      {children}
    </motion.div>
  );
}
