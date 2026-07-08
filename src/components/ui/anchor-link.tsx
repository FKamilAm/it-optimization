"use client";

import { type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { cn } from "@/lib/utils";

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  onAfterNavigate?: () => void;
  navigateDelay?: number;
}

export function AnchorLink({
  href,
  onClick,
  onAfterNavigate,
  navigateDelay = 0,
  className,
  children,
  ...props
}: AnchorLinkProps) {
  const { scrollToSection } = useSmoothScroll();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    e.preventDefault();
    onAfterNavigate?.();

    window.setTimeout(() => {
      scrollToSection(href);
    }, navigateDelay);

    onClick?.(e);
  };

  return (
    <a href={href} onClick={handleClick} className={cn("cursor-pointer", className)} {...props}>
      {children}
    </a>
  );
}
