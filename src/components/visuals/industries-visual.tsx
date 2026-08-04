"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";

interface IndustriesVisualProps {
  className?: string;
}

export function IndustriesVisual({ className }: IndustriesVisualProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -30,
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
      gsap.to(el.querySelector(".ind-core"), {
        rotationY: 15,
        rotationX: -8,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative aspect-[4/5] w-full max-w-[560px]", className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent" />
      <div className="grid-pattern-dark absolute inset-0 rounded-[2rem] opacity-40" />
      <div
        className="ind-core absolute inset-[10%] rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent shadow-[0_40px_100px_rgba(0,0,0,0.45)]"
        style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      >
        <div className="absolute inset-[18%] rounded-[2rem] border border-white/10 bg-black/40" />
        <div className="absolute top-[18%] left-[22%] h-16 w-16 rounded-2xl border border-white/20 bg-white/10 md:h-20 md:w-20" />
        <div className="absolute right-[18%] bottom-[20%] h-24 w-24 rounded-full border border-white/15 bg-gradient-to-tr from-white/20 to-transparent md:h-28 md:w-28" />
        <div className="absolute top-1/2 left-1/2 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute top-1/2 left-1/2 h-[70%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
}
