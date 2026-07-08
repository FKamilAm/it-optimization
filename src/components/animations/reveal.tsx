"use client";

import { useEffect, useRef } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
}

function isInViewport(el: HTMLElement, threshold = 0.92) {
  const rect = el.getBoundingClientRect();
  return rect.top <= window.innerHeight * threshold;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  duration = 0.45,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => {
      el.style.setProperty("--reveal-delay", `${delay}s`);
      el.dataset.revealed = "true";
    };

    if (prefersReducedMotion()) {
      show();
      return;
    }

    if (isInViewport(el)) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          if (once) observer.disconnect();
        } else if (!once) {
          delete el.dataset.revealed;
        }
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, once]);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={
        {
          "--reveal-y": `${y}px`,
          "--reveal-duration": `${duration}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  childSelector?: string;
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.06,
  childSelector = ":scope > *",
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll<HTMLElement>(childSelector));
    if (!items.length) return;

    const show = () => {
      items.forEach((item, index) => {
        item.style.setProperty("--stagger-delay", `${index * stagger}s`);
        item.dataset.revealed = "true";
      });
    };

    if (prefersReducedMotion()) {
      show();
      return;
    }

    if (isInViewport(el)) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [childSelector, stagger]);

  return (
    <div ref={ref} className={cn("stagger-reveal", className)}>
      {children}
    </div>
  );
}
