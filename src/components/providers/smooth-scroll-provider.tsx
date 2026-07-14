"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/utils";

export const HEADER_OFFSET = -80;

interface ScrollOptions {
  offset?: number;
  onComplete?: () => void;
  updateHash?: boolean;
}

interface SmoothScrollContextValue {
  scrollToSection: (target: string | HTMLElement, options?: ScrollOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target === "string") {
    const selector = target.startsWith("#") ? target : `#${target}`;
    const el = document.querySelector(selector);
    return el instanceof HTMLElement ? el : null;
  }
  return target;
}

function fallbackScroll(
  el: HTMLElement,
  offset: number,
  onComplete?: () => void,
  updateHash = true,
) {
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  if (updateHash && el.id) {
    history.replaceState(null, "", `#${el.id}`);
  }
  onComplete?.();
}

export function useSmoothScroll(): SmoothScrollContextValue {
  const ctx = useContext(SmoothScrollContext);
  return (
    ctx ?? {
      scrollToSection: (target, options) => {
        const el = resolveElement(target);
        if (!el) return;
        fallbackScroll(
          el,
          options?.offset ?? HEADER_OFFSET,
          options?.onComplete,
          options?.updateHash ?? true,
        );
      },
    }
  );
}

function shouldUseSmoothScroll() {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  const scrollToSection = useCallback(
    (target: string | HTMLElement, options?: ScrollOptions) => {
      const el = resolveElement(target);
      if (!el) return;

      const offset = options?.offset ?? HEADER_OFFSET;
      const updateHash = options?.updateHash ?? true;
      const onComplete = options?.onComplete;

      if (!lenisRef.current) {
        fallbackScroll(el, offset, onComplete, updateHash);
        return;
      }

      lenisRef.current.scrollTo(el, {
        offset,
        duration: 0.9,
        onComplete: () => {
          if (updateHash && el.id) {
            history.replaceState(null, "", `#${el.id}`);
          }
          onComplete?.();
        },
      });
    },
    [],
  );

  useEffect(() => {
    if (!shouldUseSmoothScroll()) return;

    const lenis = new Lenis({
      lerp: 0.14,
      duration: 0.9,
      smoothWheel: true,
      autoRaf: true,
    });

    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ scrollToSection }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
