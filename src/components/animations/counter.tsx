"use client";

import { useEffect, useRef } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";

interface CounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const numericMatch = value.match(/^(\d+)(.*)$/);

  useEffect(() => {
    const el = ref.current;
    if (!el || !numericMatch || prefersReducedMotion()) return;

    const target = parseInt(numericMatch[1], 10);
    const suffix = numericMatch[2];
    let frame = 0;
    let started = false;

    const animate = (startTime: number) => {
      const progress = Math.min((performance.now() - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) frame = requestAnimationFrame(() => animate(startTime));
    };

    const start = () => {
      if (started) return;
      started = true;
      animate(performance.now());
    };

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.95) {
      start();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [numericMatch, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {value}
    </span>
  );
}
