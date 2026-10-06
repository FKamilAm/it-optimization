"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { PortalLayer } from "./portal-layer";
import "../error-pages.css";

/**
 * «Закрытый цифровой портал»: пространство за ним есть, прохода нет.
 *
 * Семь крупных слоёв вместо сотни деталей: тень, внешнее кольцо из чёрного
 * хрома, шкала насечек, среднее кольцо из дымчатого стекла, свет, четыре
 * створки с датчиком в центре и сканер. Свет лежит под створками и виден
 * только в щелях между ними — «там что-то есть».
 *
 * Сканер проходит сверху вниз раз в 5 секунд, контур в этот момент
 * подсвечивается — это одна CSS-анимация на двух элементах с общим периодом.
 *
 * Наведение на центр — попытка открыть: створки расходятся на 7px, свет
 * ярче, через 650ms всё закрывается обратно, и по поверхности проходит
 * короткий импульс. «Почти пустили». Повторно — только после того, как
 * курсор ушёл и вернулся: портал, который хлопает без остановки, раздражает.
 *
 * На телефоне наведения нет — вместо него свет тихо «дышит». При reduced
 * motion — ни сканера, ни открытия, ни параллакса: только свечение.
 */

type State = "closed" | "open";

export function AccessPortal() {
  const reduce = useReducedMotion();
  const [interactive, setInteractive] = useState(false);
  const [state, setState] = useState<State>("closed");
  const [pulsing, setPulsing] = useState(false);
  const armed = useRef(true);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    setInteractive(fine.matches && !reduce);
  }, [reduce]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const sx = useSpring(nx, { stiffness: 50, damping: 18, mass: 0.7 });
  const sy = useSpring(ny, { stiffness: 50, damping: 18, mass: 0.7 });
  const rotateY = useTransform(sx, (v) => v * 2.5);
  const rotateX = useTransform(sy, (v) => v * -2.5);

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
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [interactive, nx, ny]);

  const tryOpen = useCallback(() => {
    if (!interactive || !armed.current) return;
    armed.current = false;
    setState("open");
    timers.current.push(
      window.setTimeout(() => {
        setState("closed");
        setPulsing(true);
        timers.current.push(window.setTimeout(() => setPulsing(false), 460));
      }, 650),
    );
  }, [interactive]);

  return (
    <div
      className="e403-portal relative"
      style={{ perspective: 1400 }}
      aria-hidden="true"
    >
      <motion.div
        className="relative h-full w-full"
        style={interactive ? { rotateX, rotateY } : undefined}
      >
        {/* Мягкая тень-ореол под порталом. */}
        <div className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(180,224,45,0.08),transparent_62%)]" />

        <PortalLayer sx={sx} sy={sy} depth={interactive ? 2 : 0}>
          <div className="e403-ring-outer absolute inset-0" />
          <div className="e403-ring-edge absolute inset-0" />
          <svg className="e403-ticks absolute inset-[3%]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.35"
              strokeDasharray="0.35 2.1"
            />
          </svg>
        </PortalLayer>

        <PortalLayer sx={sx} sy={sy} depth={interactive ? 5 : 0} className="inset-[11%]">
          <div className="e403-ring-middle absolute inset-0" />
        </PortalLayer>

        <PortalLayer
          sx={sx}
          sy={sy}
          depth={interactive ? 8 : 0}
          className="inset-[19.5%]"
        >
          <div className="e403-aperture absolute inset-0" data-state={state}>
            <div className="e403-core absolute inset-[-6%]" />
            <div
              className="e403-shutter"
              data-q="tl"
              style={{ borderTopLeftRadius: "100% 100%" }}
            />
            <div
              className="e403-shutter"
              data-q="tr"
              style={{ borderTopRightRadius: "100% 100%" }}
            />
            <div
              className="e403-shutter"
              data-q="bl"
              style={{ borderBottomLeftRadius: "100% 100%" }}
            />
            <div
              className="e403-shutter"
              data-q="br"
              style={{ borderBottomRightRadius: "100% 100%" }}
            />
            <div className="e403-lens absolute inset-[39%]" />
          </div>
        </PortalLayer>

        <div className="e403-scan-clip absolute inset-0">
          <div className="e403-scan" />
        </div>
        <div
          className={`e403-pulse absolute inset-[19.5%] ${pulsing ? "is-pulsing" : ""}`}
        />

        {/* Зона наведения — центр портала, а не весь круг: «попытка открыть»
            начинается, когда тянутся именно к проходу. */}
        {interactive && (
          <div
            className="pointer-events-auto absolute inset-[30%] rounded-full"
            data-cursor="portal"
            onPointerEnter={tryOpen}
            onPointerLeave={() => {
              armed.current = true;
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
