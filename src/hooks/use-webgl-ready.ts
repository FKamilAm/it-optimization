"use client";

import { useEffect, useState } from "react";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * True once WebGL is confirmed available *and* the browser has gone idle.
 *
 * three.js ships as ~700 KB of vendor chunks, and `dynamic()` only fetches them
 * once the 3D component actually renders. Flipping this on mount made that
 * download start while the hero was still settling, so it competed with the
 * resources that decide LCP. Waiting for idle keeps the SSR fallback on screen
 * a beat longer and gives the main thread to the hero first — the upgrade to
 * 3D looks the same, it just no longer taxes the first paint.
 */
export function useWebGLReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const upgrade = () => setReady(hasWebGL());

    // Safari (and older iOS) has no requestIdleCallback — a short timeout gets
    // us past the critical window there.
    if (typeof window.requestIdleCallback !== "function") {
      const timer = window.setTimeout(upgrade, 300);
      return () => window.clearTimeout(timer);
    }

    const id = window.requestIdleCallback(upgrade, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }, []);

  return ready;
}
