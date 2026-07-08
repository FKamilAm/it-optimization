"use client";

import { useEffect, useRef } from "react";
import { canUsePointerEffects } from "@/lib/utils";

interface TiltOptions {
  enabled?: boolean;
  /** Max rotation in degrees for X/Y axes. */
  max?: number;
}

/**
 * Soft card tilt + spotlight tracking. Desktop + fine-pointer only.
 * Exposes `--mouse-x` / `--mouse-y` (percent, for spotlight) and
 * `--tilt-x` / `--tilt-y` (deg). A `data-tilting` flag toggles the spotlight.
 */
export function usePointerTilt<T extends HTMLElement = HTMLElement>({
  enabled = true,
  max = 3,
}: TiltOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !canUsePointerEffects()) return;

    let frame = 0;

    const handleMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mouse-x", `${(px * 100).toFixed(2)}%`);
        el.style.setProperty("--mouse-y", `${(py * 100).toFixed(2)}%`);
        el.style.setProperty("--tilt-x", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      });
    };

    const handleEnter = () => {
      el.dataset.tilting = "true";
      el.addEventListener("mousemove", handleMove);
    };

    const handleLeave = () => {
      el.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frame);
      delete el.dataset.tilting;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled, max]);

  return ref;
}
