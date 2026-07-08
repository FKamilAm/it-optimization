import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MutableRefObject, Ref } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True only on desktop pointer devices without reduced-motion preference.
 * Gate all magnetic / tilt / parallax effects behind this.
 */
export function canUsePointerEffects(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    });
  };
}
