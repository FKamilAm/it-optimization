"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn, prefersReducedMotion } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * The chart lives in a single image (public/industries-chart.webp, 820x936).
 * To animate the bars growing and the arrow climbing we render the same image
 * in several SVG layers, each revealed through its own clip/mask:
 *   - one clipped layer per bar (revealed bottom -> top),
 *   - one masked layer for the arrow (wiped left -> right, bars removed).
 * The geometry below was measured from the asset, so the composited result is
 * pixel-identical to the original once the animation finishes.
 */
const VB_W = 820;
const VB_H = 936;
const ARROW_X = 86;

// left -> right: x/width of each vertical strip (partitioned at the gaps between
// bars) and the top edge (highest pixel) of the bar inside it.
const BARS = [
  { x: 0, w: 220, top: 565 },
  { x: 220, w: 183, top: 480 },
  { x: 403, w: 193, top: 419 },
  { x: 596, w: 224, top: 242 },
] as const;

const IMG = "/industries-chart.webp";

export function AnimatedGrowthChart({ className }: { className?: string }) {
  const rootRef = useRef<SVGSVGElement>(null);
  const barRects = useRef<Array<SVGRectElement | null>>([]);
  const barGroups = useRef<Array<SVGGElement | null>>([]);
  const arrowWipeRef = useRef<SVGRectElement>(null);
  const arrowGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Only animate on the desktop layout where the chart is visible; respect
    // reduced-motion. Otherwise the SVG stays in its final (static) state.
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const ctx = gsap.context((self) => {
      BARS.forEach((_, i) => {
        gsap.set(barRects.current[i], { attr: { y: VB_H, height: 0 } });
        gsap.set(barGroups.current[i], { autoAlpha: 0 });
      });
      gsap.set(arrowWipeRef.current, { attr: { width: 0 } });
      gsap.set(arrowGroupRef.current, { autoAlpha: 0 });

      // Phase 2: once the intro finishes, the fully assembled model floats
      // forever as a single object. Slightly desynced durations keep it organic,
      // and the root <svg> carries no layout transform so this never fights the
      // intro (which only animates the inner clip/mask/opacity).
      const startIdleFloat = () => {
        gsap.to(root, {
          y: -12,
          duration: 5.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root, {
          x: 3,
          duration: 7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root, {
          rotation: 1,
          transformOrigin: "50% 50%",
          duration: 6.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
        onComplete: () => self.add(startIdleFloat),
      });

      BARS.forEach((bar, i) => {
        const at = i * 0.3;
        tl.to(
          barGroups.current[i],
          { autoAlpha: 1, duration: 0.4, ease: "power1.out" },
          at,
        );
        tl.to(
          barRects.current[i],
          { attr: { y: bar.top, height: VB_H - bar.top }, duration: 1.1 },
          at,
        );
      });

      const arrowAt = 1;
      tl.to(
        arrowGroupRef.current,
        { autoAlpha: 1, duration: 0.6, ease: "power1.out" },
        arrowAt,
      );
      tl.to(
        arrowWipeRef.current,
        { attr: { width: VB_W - ARROW_X }, duration: 1.6, ease: "power2.out" },
        arrowAt,
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-auto w-full select-none", className)}
      aria-hidden="true"
    >
      <defs>
        {BARS.map((bar, i) => (
          <clipPath key={i} id={`agc-bar-${i}`} clipPathUnits="userSpaceOnUse">
            <rect
              ref={(el) => {
                barRects.current[i] = el;
              }}
              x={bar.x}
              y={bar.top}
              width={bar.w}
              height={VB_H - bar.top}
            />
          </clipPath>
        ))}

        <mask
          id="agc-arrow"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
        >
          {/* left -> right wipe reveals the arrow drawing itself up the steps */}
          <rect
            ref={arrowWipeRef}
            x={ARROW_X}
            y="0"
            width={VB_W - ARROW_X}
            height={VB_H}
            fill="#fff"
          />
          {/* remove the bars from the arrow layer so only the arrow shows */}
          {BARS.map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={bar.top}
              width={bar.w}
              height={VB_H - bar.top}
              fill="#000"
            />
          ))}
        </mask>
      </defs>

      {BARS.map((_, i) => (
        <g
          key={i}
          ref={(el) => {
            barGroups.current[i] = el;
          }}
          clipPath={`url(#agc-bar-${i})`}
        >
          <image href={IMG} x="0" y="0" width={VB_W} height={VB_H} />
        </g>
      ))}

      <g ref={arrowGroupRef} mask="url(#agc-arrow)">
        <image href={IMG} x="0" y="0" width={VB_W} height={VB_H} />
      </g>
    </svg>
  );
}
