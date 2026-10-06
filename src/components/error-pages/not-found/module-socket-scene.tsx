"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DigitFour } from "./digit-four";
import { DraggableModule, type ModuleDef } from "./draggable-module";
import "../error-pages.css";

/**
 * «Найди потерянный модуль».
 *
 * 4 [пустое гнездо] 4: между цифрами не хватает одной детали. Вокруг висят
 * шесть модулей одной системы (на телефоне — три), и только один подходит —
 * тот, у которого контакты на тех же местах, что у гнезда. Его можно
 * перетащить мышью или пальцем: ближе 120px он начинает тянуться к гнезду, а
 * отпущенный рядом — встаёт на место сам. Чужой модуль гнездо отталкивает.
 *
 * После сборки по системе проходит ток, цифры выравниваются, появляется
 * «система восстановлена» и три капсулы навигации — часть сцены, а не ссылки
 * внизу. Играть не обязательно: кнопка «На главную» есть с первой секунды.
 *
 * Геометрия: конструкция 10 × 5 модулей, ширина — --cw, модуль — --u. Модули
 * вокруг лежат в долях площади сцены и размером тоже в --u, поэтому всё
 * масштабируется одним числом.
 */

const DESKTOP: ModuleDef[] = [
  // По краям, а не поверх цифр: слева и справа от конструкции и внизу справа,
  // подальше от текста. Правильный модуль — не ближайший к гнезду.
  { kind: "sphere", size: 1.35, pos: { x: 0.11, y: 0.25 }, period: 7 },
  { kind: "prism", size: 1.55, pos: { x: 0.12, y: 0.5 }, period: 8.5 },
  { kind: "shard", size: 1.5, pos: { x: 0.89, y: 0.23 }, period: 6.5 },
  { kind: "cube", size: 1.3, pos: { x: 0.88, y: 0.5 }, period: 9 },
  { kind: "warp", size: 1.5, pos: { x: 0.57, y: 0.85 }, period: 7.5 },
  { kind: "key", size: 2, pos: { x: 0.79, y: 0.8 }, period: 8 },
];

// На телефоне — три модуля в ряд под конструкцией: правильный посередине не
// ставим, чтобы его приходилось выбирать, а не брать первый попавшийся.
const MOBILE: ModuleDef[] = [
  { kind: "key", size: 2.2, pos: { x: 0.2, y: 0.55 }, period: 8 },
  { kind: "sphere", size: 1.7, pos: { x: 0.5, y: 0.57 }, period: 7 },
  { kind: "prism", size: 1.9, pos: { x: 0.8, y: 0.55 }, period: 8.5 },
];

export interface SceneLinks {
  home: string;
  services: string;
  projects: string;
}

interface ModuleSocketSceneProps {
  labels: { restored: string; home: string; services: string; projects: string };
  links: SceneLinks;
}

export function ModuleSocketScene({ labels, links }: ModuleSocketSceneProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [near, setNear] = useState(false);
  const [solved, setSolved] = useState(false);
  const [socketGlitch, setSocketGlitch] = useState(false);

  const reject = useCallback(() => {
    setSocketGlitch(true);
    window.setTimeout(() => setSocketGlitch(false), 300);
  }, []);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setMobile(narrow.matches);
      setReduce(motion.matches);
    };
    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  const getSocket = useCallback(() => {
    const el = slotRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const modules = mobile ? MOBILE : DESKTOP;

  return (
    <div
      ref={areaRef}
      className="absolute inset-0 [--cw:90vw] [--u:calc(var(--cw)/10)] md:[--cw:min(54vw,56rem,calc((100svh_-_18rem)*2))]"
    >
      {/* Конструкция 10 × 5: «4», гнездо, «4». */}
      <div
        className="absolute top-[30%] left-1/2 aspect-[2/1] w-[var(--cw)] -translate-x-1/2 -translate-y-1/2 md:top-[40%]"
        aria-hidden="true"
      >
        {/* Ток после сборки: идёт через перекладины и гнездо слева направо. */}
        <AnimatePresence>
          {solved && !reduce && (
            <motion.div
              className="e404-current absolute top-1/2 left-[3%] z-10 w-[94%] -translate-y-1/2"
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: [1, 1, 0] }}
              transition={{ duration: 0.9, times: [0, 0.6, 1], ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        <div className="absolute top-0 left-0 h-full w-[30%]">
          <DigitFour side="left" solved={solved} energyDelay={0} reduce={reduce} />
        </div>

        {/* Провода от перекладин к контактам гнезда. */}
        <span className="absolute top-1/2 left-[30%] h-[3%] w-[8%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#3a3a3a,#9a9a9a)]" />
        <span className="absolute top-1/2 right-[30%] h-[3%] w-[8%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#9a9a9a,#3a3a3a)]" />

        {/* Гнездо. */}
        <motion.div
          className={cn(
            "e404-socket absolute top-[26%] left-[38%] h-[48%] w-[24%]",
            socketGlitch && "e404-glitch",
          )}
          data-near={near && !solved ? "true" : undefined}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: solved ? 0 : 1, scale: 1 }}
          transition={{ duration: 0.6, delay: solved ? 0.2 : 0.35 }}
        >
          <div className="e404-socket-pulse absolute -inset-[6%]" />
          <div ref={slotRef} className="e404-socket-inner absolute inset-[8.3%]" />
          {/* Контакты — по ним видно, какой модуль сюда встанет. */}
          <span className="e404-pin absolute top-1/2 -left-[4%] h-[12%] w-[8%] -translate-y-1/2" />
          <span className="e404-pin absolute top-1/2 -right-[4%] h-[12%] w-[8%] -translate-y-1/2" />
        </motion.div>

        <div className="absolute top-0 right-0 h-full w-[30%]">
          <DigitFour side="right" solved={solved} energyDelay={240} reduce={reduce} />
        </div>

        {/* «Система восстановлена» — тихая подпись над конструкцией. */}
        <AnimatePresence>
          {solved && (
            <motion.p
              className="absolute -top-[2.4rem] left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs font-semibold tracking-[0.22em] whitespace-nowrap text-[#0a0a0a]/70 uppercase"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <span className="h-2 w-2 rounded-full bg-[#b4e02d] shadow-[0_0_10px_rgba(180,224,45,0.9)]" />
              {labels.restored}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {modules.map((def, i) => (
        <DraggableModule
          key={`${mobile ? "m" : "d"}-${def.kind}`}
          def={def}
          index={i}
          areaRef={areaRef}
          getSocket={getSocket}
          onNearChange={setNear}
          onSnapped={() => setSolved(true)}
          onRejected={reject}
          solved={solved}
          reduce={reduce}
        />
      ))}

      {/* Навигация после сборки — капсулы в сцене, на месте ушедших модулей. */}
      <AnimatePresence>
        {solved && (
          <motion.nav
            className="absolute top-[52%] left-1/2 z-30 flex w-[min(92vw,40rem)] -translate-x-1/2 flex-wrap justify-center gap-3 md:top-[calc(40%+var(--cw)/4+3.2rem)]"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.65 } },
            }}
          >
            {[
              { href: links.home, label: labels.home },
              { href: links.services, label: labels.services },
              { href: links.projects, label: labels.projects },
            ].map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                data-cursor="dark"
                className="e404-nav-pill text-foreground inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-medium"
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.96 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
              >
                {item.label}
                <ArrowUpRight className="e404-nav-arrow h-4 w-4" aria-hidden="true" />
              </motion.a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
