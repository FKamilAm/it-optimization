"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Цифра «4» как скульптура из трёх крупных деталей: вертикаль, перекладина,
 * стойка. Не текст и не россыпь кубиков — три цельные формы разных
 * материалов, которые читаются как цифра.
 *
 * Пока система не собрана, детали чуть сбиты (сдвиг и наклон в пару
 * градусов). Когда модуль встаёт в гнездо, они выравниваются — «система
 * восстановлена» видно по самим цифрам, а не только по надписи.
 */

interface PieceSpec {
  /** Положение в сетке цифры 3 × 5. */
  x: number;
  y: number;
  w: number;
  h: number;
  material: string;
  /** Сбитость до сборки: доли собственного размера и градусы. */
  off?: { x: number; y: number; r: number };
  detail?: "bar" | "dots";
}

const VARIANTS: Record<"left" | "right", PieceSpec[]> = {
  left: [
    { x: 0, y: 0, w: 1, h: 3, material: "e404-glass" },
    { x: 2, y: 0, w: 1, h: 5, material: "e404-matte", detail: "bar" },
    { x: 0, y: 2, w: 3, h: 1, material: "e404-chrome", off: { x: 0, y: 0.08, r: -3 } },
  ],
  right: [
    { x: 0, y: 0, w: 1, h: 3, material: "e404-matte", off: { x: 0, y: -0.05, r: 2 } },
    {
      x: 2,
      y: 0,
      w: 1,
      h: 5,
      material: "e404-glass",
      off: { x: 0.06, y: 0, r: 1.5 },
      detail: "dots",
    },
    { x: 0, y: 2, w: 3, h: 1, material: "e404-white" },
  ],
};

interface DigitFourProps {
  side: "left" | "right";
  solved: boolean;
  /** Вспышка энергии после сборки — задержка, чтобы ток шёл слева направо. */
  energyDelay: number;
  reduce: boolean;
}

export function DigitFour({ side, solved, energyDelay, reduce }: DigitFourProps) {
  const pieces = VARIANTS[side];

  return (
    <motion.div
      className="absolute inset-0"
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: side === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
        delay: side === "left" ? 0.05 : 0.15,
      }}
    >
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${(p.x / 3) * 100}%`,
            top: `${(p.y / 5) * 100}%`,
            width: `${(p.w / 3) * 100}%`,
            height: `${(p.h / 5) * 100}%`,
          }}
          initial={false}
          animate={
            solved || !p.off
              ? { x: "0%", y: "0%", rotate: 0 }
              : { x: `${p.off.x * 100}%`, y: `${p.off.y * 100}%`, rotate: p.off.r }
          }
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-[clamp(8px,1.1vw,18px)]",
              p.material,
              solved && !reduce && "e404-energized",
            )}
            style={solved ? { animationDelay: `${energyDelay + i * 60}ms` } : undefined}
          >
            {p.detail === "bar" && (
              <span className="absolute top-[7%] left-1/2 h-[3%] w-[46%] -translate-x-1/2 rounded-full bg-[#b4e02d] shadow-[0_0_10px_rgba(180,224,45,0.7)]" />
            )}
            {p.detail === "dots" && (
              <span className="absolute bottom-[8%] left-1/2 flex -translate-x-1/2 gap-[18%]">
                <span className="block aspect-square w-[clamp(4px,0.5vw,8px)] rounded-full bg-[#b4e02d]" />
                <span className="block aspect-square w-[clamp(4px,0.5vw,8px)] rounded-full bg-[#b4e02d]/50" />
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
