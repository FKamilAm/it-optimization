"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const HOVER_SELECTOR =
  'a, button, [role="button"], [data-cursor="hover"], [data-cursor="dark"], label, summary, .cursor-target';
// Elements with an accent-green surface: the cursor turns solid black over them.
const ACCENT_SELECTOR = '[data-cursor="dark"]';
const TEXT_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/**
 * Single global cursor follower (Cuberto-style). Renders a small disc that
 * tracks the pointer and inverts against the background via mix-blend-mode.
 * Desktop + fine-pointer only; disabled for touch / reduced motion, and hands
 * the native caret back over form fields.
 *
 * The disc tracks the pointer exactly, with no easing. It used to lerp 20% of
 * the remaining distance per frame, which read as lag rather than polish: the
 * native cursor is hidden, so this disc *is* the pointer, and a pointer that
 * trails its own position looks broken. Worse, a per-frame step is tied to the
 * frame rate — once the WebGL hero, GSAP or Lenis pushed the page below 60fps,
 * the same 20% covered the same distance in twice the wall-clock time, so the
 * lag grew exactly when the page felt busiest.
 *
 * The Cuberto look survives in the size changes, which CSS still animates.
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  // В панели — обычный системный курсор. Диск вместо стрелки хорош на витрине,
  // но /panel это рабочий инструмент: там попадают в поля, чекбоксы и мелкие
  // кнопки, а `cursor: none` отбирает и привычную стрелку, и текстовый каретку
  // ровно там, где они помогают целиться.
  const pathname = usePathname();
  const onPanel = pathname?.startsWith("/panel") ?? false;

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(fine.matches && !reduced.matches && !onPanel);
  }, [onPanel]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    if (!dot) return;

    const root = document.documentElement;
    root.classList.add("has-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let visible = false;
    let raf = 0;

    const paint = () => {
      raf = 0;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!visible) {
        visible = true;
        dot.classList.add("is-visible");
      }
      // One style write per frame. Several mousemove events can land between
      // frames, and only the last position is worth painting. Scheduling
      // through rAF also keeps the write inside the frame the browser is
      // already about to composite, so this costs nothing in latency.
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== "function") return;
      if (target.closest(TEXT_SELECTOR)) {
        dot.classList.add("is-hidden");
        dot.classList.remove("is-hover", "is-on-accent");
        return;
      }
      dot.classList.remove("is-hidden");
      dot.classList.toggle("is-hover", Boolean(target.closest(HOVER_SELECTOR)));
      dot.classList.toggle("is-on-accent", Boolean(target.closest(ACCENT_SELECTOR)));
    };

    const onLeave = () => {
      visible = false;
      dot.classList.remove("is-visible");
    };
    const onDown = () => dot.classList.add("is-down");
    const onUp = () => dot.classList.remove("is-down");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={dotRef} className="cursor-follower" aria-hidden="true" />;
}
