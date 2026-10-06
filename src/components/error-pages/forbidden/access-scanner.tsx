"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiddenInterface } from "./hidden-interface";
import "../error-pages.css";

/**
 * «Сканер доступа»: защищённая область, которую можно исследовать, но не
 * открыть.
 *
 * Сканер. Поле — дымчатое стекло, за которым размыто виден интерфейс
 * системы. Вокруг курсора (или пальца) — круглое окно, в котором стекло
 * прозрачно: чёткий слой открывается маской radial-gradient, с салатовой
 * кромкой, лёгким увеличением и цветной каймой — «преломлением». Без WebGL.
 *
 * Удержание. Кнопка в центре заполняет кольцо за ~2,7 с до 93% — и дальше не
 * идёт. По мере удержания поле реагирует: кольцо приоткрывается (0–30%),
 * свет из глубины растёт (30–60%), стекло проясняется (60–93%). На 93% —
 * пауза 150 мс, отказ: кольцо сбрасывается, барьер захлопывается, импульс,
 * «403 · доступ ограничен», через 1,5 с — исходное состояние. Ощущение
 * «ещё чуть-чуть» — замедление у самого конца.
 *
 * Пасхалка: на третьей попытке барьер «трескается» салатовым светом, и
 * появляется маленькая кнопка «Ладно, на главную». Заранее не объясняется.
 *
 * Состояние поля — CSS-переменные (--sx/--sy/--sr сканера, --p прогресса),
 * их пишет один requestAnimationFrame, и только пока что-то движется: в
 * покое цикл не крутится.
 */

const HOLD_MS = 2700;
const PEAK = 0.93;
const PAUSE_MS = 150;
const DENIED_MS = 1500;

type Mode = "idle" | "holding" | "draining" | "peak" | "denied";

interface AccessScannerProps {
  labels: { hold: string; denied: string; fine: string };
  homeHref: string;
}

export function AccessScanner({ labels, homeHref }: AccessScannerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const s = useRef({
    tx: 0,
    ty: 0,
    sx: 0,
    sy: 0,
    sr: 0,
    tr: 0,
    radius: 82,
    p: 0,
    mode: "idle" as Mode,
    holdStart: 0,
    peakAt: 0,
    last: 0,
    attempts: 0,
  });
  const [mode, setMode] = useState<"idle" | "denied">("idle");
  const [cracked, setCracked] = useState(false);
  const [egg, setEgg] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // Окно сканера: 160–170px на компьютере, поменьше на телефоне.
    s.current.radius = window.matchMedia("(max-width: 767px)").matches ? 64 : 84;
    const list = timers.current;
    return () => {
      cancelAnimationFrame(raf.current);
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const write = () => {
    const el = fieldRef.current;
    if (!el) return;
    const st = s.current;
    // Мембрана вписана с отступом 8,5% — маска считается от её угла.
    const offset = el.clientWidth * 0.085;
    el.style.setProperty("--sx", `${st.sx}px`);
    el.style.setProperty("--sy", `${st.sy}px`);
    el.style.setProperty("--mx", `${st.sx - offset}px`);
    el.style.setProperty("--my", `${st.sy - offset}px`);
    el.style.setProperty("--sr", `${st.sr}px`);
    el.style.setProperty("--p", st.p.toFixed(4));
  };

  const deny = useCallback(() => {
    const st = s.current;
    st.mode = "denied";
    st.attempts += 1;
    setMode("denied");
    if (st.attempts === 3) {
      setCracked(true);
      timers.current.push(window.setTimeout(() => setEgg(true), 480));
    }
    timers.current.push(
      window.setTimeout(() => {
        st.mode = "idle";
        setMode("idle");
        kick();
      }, DENIED_MS),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loop = useCallback(
    (t: number) => {
      const st = s.current;
      const dt = st.last ? Math.min(t - st.last, 64) : 16;
      st.last = t;

      // Сканер догоняет курсор мягко, но без ощутимой задержки.
      st.sx += (st.tx - st.sx) * 0.3;
      st.sy += (st.ty - st.sy) * 0.3;
      st.sr += (st.tr - st.sr) * 0.22;

      if (st.mode === "holding") {
        const e = Math.min((t - st.holdStart) / HOLD_MS, 1);
        // Замедление к концу — «ещё чуть-чуть».
        st.p = PEAK * (1 - Math.pow(1 - e, 1.8));
        if (e >= 1) {
          st.mode = "peak";
          st.peakAt = t;
        }
      } else if (st.mode === "peak") {
        if (t - st.peakAt >= PAUSE_MS) deny();
      } else if (st.mode === "draining") {
        st.p = Math.max(0, st.p - dt / 650);
        if (st.p === 0) st.mode = "idle";
      } else if (st.mode === "denied") {
        st.p = Math.max(0, st.p - dt / 220);
      }

      write();

      const moving =
        Math.abs(st.tx - st.sx) > 0.3 ||
        Math.abs(st.ty - st.sy) > 0.3 ||
        Math.abs(st.tr - st.sr) > 0.3;
      if (moving || st.mode !== "idle" || st.p > 0) {
        raf.current = requestAnimationFrame(loop);
      } else {
        raf.current = 0;
        st.last = 0;
      }
    },
    [deny],
  );

  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [loop]);

  const track = (clientX: number, clientY: number) => {
    const el = fieldRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const st = s.current;
    st.tx = clientX - r.left;
    st.ty = clientY - r.top;
    const inside = Math.hypot(st.tx - r.width / 2, st.ty - r.height / 2) < r.width * 0.46;
    // Окно появляется прямо под курсором, а не выезжает из угла.
    if (inside && st.sr < 1) {
      st.sx = st.tx;
      st.sy = st.ty;
    }
    st.tr = inside ? st.radius : 0;
    kick();
  };

  const start = () => {
    const st = s.current;
    if (st.mode === "denied" || st.mode === "peak" || st.mode === "holding") return;
    // Продолжаем с текущего прогресса, если отпустили и снова нажали.
    const e = st.p > 0 ? 1 - Math.pow(1 - st.p / PEAK, 1 / 1.8) : 0;
    st.holdStart = performance.now() - e * HOLD_MS;
    st.mode = "holding";
    kick();
  };

  const release = () => {
    const st = s.current;
    if (st.mode === "holding") {
      st.mode = "draining";
      kick();
    }
  };

  return (
    <div className="relative">
      <div
        ref={fieldRef}
        className="e403-field relative"
        data-state={mode}
        data-cracked={cracked ? "true" : undefined}
        data-cursor="scan"
        onPointerMove={(e) => track(e.clientX, e.clientY)}
        onPointerDown={(e) => track(e.clientX, e.clientY)}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            s.current.tr = 0;
            kick();
          }
        }}
        onPointerUp={(e) => {
          // Палец убрали — окно сканера гаснет, мышь же остаётся над полем.
          if (e.pointerType !== "mouse") {
            s.current.tr = 0;
            kick();
          }
        }}
      >
        <div className="pointer-events-none" aria-hidden="true">
          <div className="e403-ring-half" data-half="top">
            <div />
          </div>
          <div className="e403-ring-half" data-half="bottom">
            <div />
          </div>

          <div className="e403-membrane">
            <div className="e403-content-blur">
              <HiddenInterface className="h-full w-full" />
            </div>
            <div className="e403-tint" />
            <div className="e403-depth" />
            <div className="e403-content-sharp">
              <HiddenInterface className="h-full w-full" />
            </div>
            <svg
              className="e403-crack absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
            >
              <g
                fill="none"
                stroke="#b4e02d"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 2px #b4e02d)" }}
              >
                <path pathLength={1} d="M50 50 L58 41 L63 43 L70 31 L78 27" />
                <path pathLength={1} d="M50 50 L41 57 L37 55 L30 67 L24 71" />
                <path pathLength={1} d="M50 50 L57 60 L55 66 L62 75" />
                <path pathLength={1} d="M50 50 L42 43 L44 36 L37 28" />
              </g>
            </svg>
          </div>

          <div className="e403-scan-ring" />
          <div className="e403-pulse" />
        </div>

        {/* Кнопка удержания: мышь, палец и клавиатура (пробел или Enter). */}
        <button
          type="button"
          className="e403-hold absolute top-1/2 left-1/2 flex aspect-square w-[30%] min-w-[7.5rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center"
          aria-label={labels.hold}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            start();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              release();
            }
          }}
        >
          <svg
            className="pointer-events-none absolute inset-[-7%] h-[114%] w-[114%] -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1.6"
            />
            <circle
              className="e403-progress"
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#b4e02d"
              strokeWidth="2.4"
              strokeLinecap="round"
              pathLength={100}
              style={{ filter: "drop-shadow(0 0 3px rgba(180,224,45,0.8))" }}
            />
          </svg>
          <span className="e403-hold-label pointer-events-none px-3 text-center text-[0.68rem] leading-snug font-semibold tracking-[0.18em] text-white/75 uppercase">
            {labels.hold}
          </span>
          <span
            className="e403-denied pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            role="status"
            aria-live="polite"
          >
            {mode === "denied" && (
              <>
                <span className="font-display text-2xl font-black text-[#b4e02d]">
                  403
                </span>
                <span className="mt-1 px-3 text-[0.62rem] font-semibold tracking-[0.18em] text-white/80 uppercase">
                  {labels.denied}
                </span>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Пасхалка — только после третьей попытки. */}
      <AnimatePresence>
        {egg && (
          <motion.a
            href={homeHref}
            data-cursor="dark"
            className="absolute -bottom-14 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#b4e02d]/60 px-5 py-2.5 text-sm font-medium whitespace-nowrap text-[#b4e02d] transition-colors duration-300 hover:bg-[#b4e02d] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4e02d]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {labels.fine}
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
