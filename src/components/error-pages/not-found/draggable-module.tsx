"use client";

import { useRef, useState, type RefObject } from "react";
import { animate, motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export type ModuleKind = "key" | "sphere" | "cube" | "warp" | "prism" | "shard";

export interface ModuleDef {
  kind: ModuleKind;
  /** Размер в модулях сцены (1 модуль = ширина конструкции / 10). */
  size: number;
  /** Место в покое, доли площади сцены. */
  pos: { x: number; y: number };
  /** Период покачивания, секунды. */
  period: number;
}

/** С какого расстояния правильный модуль начинает тянуться к гнезду, px. */
const MAGNET = 120;
/** Отпустили ближе — модуль встаёт в гнездо сам. */
const SNAP = 100;
/** Неправильный модуль, отпущенный ближе этого, гнездо отталкивает. */
const REPEL = 95;

interface DraggableModuleProps {
  def: ModuleDef;
  index: number;
  areaRef: RefObject<HTMLDivElement | null>;
  /** Центр гнезда в координатах окна. */
  getSocket: () => { x: number; y: number } | null;
  onNearChange: (near: boolean) => void;
  onSnapped: () => void;
  onRejected: () => void;
  solved: boolean;
  reduce: boolean;
}

/**
 * Модуль, который можно взять и перенести — мышью или пальцем, по-настоящему
 * (Framer Motion drag), а не параллакс. Три вложенных слоя: внешний несёт
 * перетаскивание, средний — покачивание в покое, внутренний — притяжение к
 * гнезду, чтобы движения складывались, а не спорили за один transform.
 *
 * Правильный модуль узнаётся по форме: он того же размера, что гнездо, и у
 * него салатовые контакты на тех же местах, что у гнезда.
 */
export function DraggableModule({
  def,
  index,
  areaRef,
  getSocket,
  onNearChange,
  onSnapped,
  onRejected,
  solved,
  reduce,
}: DraggableModuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const px = useSpring(pullX, { stiffness: 320, damping: 26 });
  const py = useSpring(pullY, { stiffness: 320, damping: 26 });
  const [snapped, setSnapped] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const isKey = def.kind === "key";
  const hidden = solved && !isKey;

  const distanceToSocket = () => {
    const el = ref.current;
    const socket = getSocket();
    if (!el || !socket) return null;
    const r = el.getBoundingClientRect();
    const dx = socket.x - (r.left + r.width / 2);
    const dy = socket.y - (r.top + r.height / 2);
    return { dx, dy, d: Math.hypot(dx, dy) };
  };

  const handleDrag = () => {
    if (!isKey) return;
    const v = distanceToSocket();
    if (!v) return;
    if (v.d < MAGNET) {
      // Притяжение растёт к центру гнезда: модуль «тянет» из руки.
      const k = (1 - v.d / MAGNET) * 0.55;
      pullX.set(v.dx * k);
      pullY.set(v.dy * k);
      onNearChange(true);
    } else {
      pullX.set(0);
      pullY.set(0);
      onNearChange(false);
    }
  };

  const handleDragEnd = () => {
    const v = distanceToSocket();
    pullX.set(0);
    pullY.set(0);
    if (!v) return;

    if (isKey) {
      onNearChange(false);
      if (v.d < SNAP) {
        setSnapped(true);
        const spring = reduce
          ? { duration: 0.25 }
          : { type: "spring" as const, stiffness: 260, damping: 19 };
        animate(x, x.get() + v.dx, spring);
        animate(y, y.get() + v.dy, spring).then(onSnapped);
      }
      return;
    }

    if (v.d < REPEL) {
      // Гнездо мягко выталкивает чужой модуль — от центра наружу.
      const nx = v.d > 1 ? -v.dx / v.d : 1;
      const ny = v.d > 1 ? -v.dy / v.d : 0.35;
      const push = REPEL + 70 - v.d;
      const spring = { type: "spring" as const, stiffness: 300, damping: 12 };
      animate(x, x.get() + nx * push, spring);
      animate(y, y.get() + ny * push, spring);
      setGlitch(true);
      window.setTimeout(() => setGlitch(false), 300);
      onRejected();
    }
  };

  const half = def.size / 2;
  const draggable = !snapped && !solved;

  return (
    <motion.div
      ref={ref}
      className={cn("group absolute touch-none select-none", draggable && "cursor-grab")}
      style={{
        left: `calc(${def.pos.x * 100}% - var(--u) * ${half})`,
        top: `calc(${def.pos.y * 100}% - var(--u) * ${half})`,
        width: `calc(var(--u) * ${def.size})`,
        height: `calc(var(--u) * ${def.size})`,
        x,
        y,
        zIndex: snapped ? 15 : 20,
        pointerEvents: hidden ? "none" : undefined,
      }}
      data-cursor={draggable ? "drag" : undefined}
      aria-hidden="true"
      drag={draggable}
      dragConstraints={areaRef}
      dragElastic={0.1}
      dragMomentum={false}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={hidden ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
      transition={
        hidden
          ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          : {
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: solved ? 0 : 0.45 + index * 0.09,
            }
      }
      whileHover={draggable ? { scale: 1.04 } : undefined}
      whileDrag={{ scale: 1.06, zIndex: 50 }}
    >
      <motion.div
        className="h-full w-full"
        animate={!reduce && draggable ? { y: [0, -5, 0, 5, 0] } : { y: 0 }}
        transition={
          !reduce && draggable
            ? {
                duration: def.period,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }
            : { duration: 0.3 }
        }
      >
        <motion.div className="h-full w-full" style={{ x: px, y: py }}>
          <div
            className={cn(
              "e404-module-art h-full w-full transition-[filter] duration-300",
              draggable &&
                "group-hover:[filter:drop-shadow(0_0_14px_rgba(180,224,45,0.45))]",
              glitch && "e404-glitch",
            )}
          >
            <ModuleArt kind={def.kind} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Формы одной системы: те же материалы, что у цифр. */
function ModuleArt({ kind }: { kind: ModuleKind }) {
  switch (kind) {
    case "key":
      return (
        <div className="e404-chrome relative h-full w-full rounded-[18%]">
          <div className="e404-glass absolute inset-[11%] rounded-[14%]" />
          {/* Канал энергии — салатовая черта, продолжающая перекладины «4». */}
          <span className="absolute top-1/2 right-[18%] left-[18%] h-[5%] -translate-y-1/2 rounded-full bg-[#b4e02d] shadow-[0_0_12px_rgba(180,224,45,0.8)]" />
          {/* Контакты — на тех же местах, что у гнезда. */}
          <span className="e404-pin absolute top-1/2 -left-[5%] h-[14%] w-[10%] -translate-y-1/2" />
          <span className="e404-pin absolute top-1/2 -right-[5%] h-[14%] w-[10%] -translate-y-1/2" />
        </div>
      );
    case "sphere":
      return <div className="e404-sphere h-full w-full" />;
    case "cube":
      return (
        <div className="relative h-full w-full rotate-[12deg]">
          <div className="e404-matte absolute inset-0 rounded-[16%]" />
          <div className="absolute inset-[16%] rounded-[12%] border border-white/12" />
        </div>
      );
    case "warp":
      return (
        <div className="e404-glass h-full w-full [transform:skewX(-14deg)_rotate(9deg)_scaleY(0.82)] rounded-[20%]" />
      );
    case "prism":
      return (
        <div className="h-full w-full bg-[linear-gradient(160deg,#ffffff,#d9d9d4_55%,#9a9a96)] drop-shadow-[0_20px_30px_rgba(10,10,10,0.3)] [clip-path:polygon(50%_4%,96%_92%,4%_92%)]" />
      );
    case "shard":
      return (
        <div className="e404-chrome h-full w-full [clip-path:polygon(12%_22%,68%_2%,98%_52%,58%_98%,4%_70%)]" />
      );
  }
}
