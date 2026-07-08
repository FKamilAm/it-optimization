"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SESSION_KEY = "hasSeenPreloader";

export function SitePreloader() {
  const [show, setShow] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY) === "1";
    setReduced(isReduced);

    document.body.style.overflow = "hidden";

    // Timeline (full run): I ≈ 0.42s → O ≈ 0.36–1.02s → dot ≈ 1.02–1.36s → hold → exit.
    const holdMs = isReduced ? 420 : seen ? 1450 : 1650;
    const timer = window.setTimeout(() => setShow(false), holdMs);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  const handleExitComplete = () => {
    document.body.style.overflow = "";
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore storage errors */
    }
  };

  const label = "Оптимизируем систему…";

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
          initial={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", opacity: 1 }}
          transition={{ duration: reduced ? 0.3 : 0.55, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg width="132" height="132" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              {/* "I" — vertical stroke drawn top → bottom */}
              <motion.line
                x1="33"
                y1="36"
                x2="33"
                y2="84"
                stroke="#fafafa"
                strokeWidth="8"
                strokeLinecap="round"
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={reduced ? { duration: 0 } : { duration: 0.42, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* "O" — ring drawn around, leaving a gap in the top-right */}
              <motion.circle
                cx="74"
                cy="60"
                r="24"
                stroke="#fafafa"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 0.82 }}
                transition={reduced ? { duration: 0 } : { duration: 0.66, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* accent dot sitting in the gap at the top-right of the O */}
              <motion.circle
                cx="94"
                cy="47"
                r="5"
                fill="#B4E02D"
                initial={reduced ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.34, delay: 1.02, ease: [0.34, 1.56, 0.64, 1] }
                }
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            </svg>

            <motion.p
              className="mt-6 text-sm font-medium uppercase tracking-[0.28em] text-white/50"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.5 }}
            >
              {label}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
