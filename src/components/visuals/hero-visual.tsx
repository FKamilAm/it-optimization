"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";

interface HeroVisualProps {
  className?: string;
}

export function HeroVisual({ className }: HeroVisualProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(el.querySelector(".hero-orb-1"), {
        y: -20,
        rotation: 8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(el.querySelector(".hero-orb-2"), {
        y: 16,
        rotation: -6,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(el.querySelector(".hero-ring"), {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: "none",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative aspect-square w-full max-w-[520px] justify-self-end", className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 grid-pattern rounded-[2rem] opacity-60" />
      <div className="hero-ring absolute inset-[12%] rounded-full border border-foreground/10" />
      <div className="hero-ring absolute inset-[22%] rounded-full border border-dashed border-foreground/15" />
      <div className="hero-orb-1 absolute left-[18%] top-[22%] h-24 w-24 rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent backdrop-blur-sm md:h-32 md:w-32" />
      <div className="hero-orb-2 absolute bottom-[18%] right-[14%] h-28 w-28 rounded-full border border-foreground/15 bg-gradient-to-tr from-foreground/15 to-transparent md:h-36 md:w-36" />
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-foreground/20 bg-foreground/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.08)]" />
      <div className="absolute inset-x-[18%] bottom-[12%] flex items-center justify-between gap-2 rounded-full border border-foreground/10 bg-background/70 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur md:text-xs">
        <span>Web</span>
        <span>→</span>
        <span>CRM</span>
        <span>→</span>
        <span>AI</span>
        <span>→</span>
        <span>Chain</span>
      </div>
    </div>
  );
}
