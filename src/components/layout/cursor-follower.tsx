"use client";

import { useEffect, useRef, useState } from "react";

const HOVER_SELECTOR =
  'a, button, [role="button"], [data-cursor="hover"], [data-cursor="dark"], label, summary, .cursor-target';
// Elements with an accent-green surface: the cursor turns solid black over them.
const ACCENT_SELECTOR = '[data-cursor="dark"]';
const TEXT_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/**
 * Single global cursor follower (Cuberto-style). Renders a small disc that
 * smoothly trails the pointer and inverts against the background via
 * mix-blend-mode. Desktop + fine-pointer only; disabled for touch / reduced
 * motion, and hands the native caret back over form fields.
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(fine.matches && !reduced.matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    if (!dot) return;

    const root = document.documentElement;
    root.classList.add("has-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let visible = false;
    let raf = 0;

    const render = () => {
      curX += (mouseX - curX) * 0.2;
      curY += (mouseY - curY) * 0.2;
      dot.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!visible) {
        visible = true;
        dot.classList.add("is-visible");
      }
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
      cancelAnimationFrame(raf);
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
