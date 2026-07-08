"use client";

import { createElement, type ElementType, type HTMLAttributes, type Ref } from "react";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { cn } from "@/lib/utils";

interface TiltCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  max?: number;
}

/**
 * Wraps card content with a soft pointer tilt for depth.
 * Effects are automatically disabled on touch / mobile / reduced-motion.
 *
 * Rendered via createElement so the polymorphic `as` prop stays type-safe across
 * React type versions (JSX with a bare ElementType can infer props as `never`).
 */
export function TiltCard({
  as: Tag = "div",
  className,
  children,
  max = 3,
  ...props
}: TiltCardProps) {
  const ref = usePointerTilt<HTMLElement>({ max });

  return createElement(
    Tag,
    { ref: ref as Ref<HTMLElement>, className: cn("tilt-card", className), ...props },
    children,
  );
}
