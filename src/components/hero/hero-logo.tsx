"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { useWebGLReady } from "@/hooks/use-webgl-ready";
import { cn } from "@/lib/utils";
import { HeroLogoFallback } from "./hero-logo-fallback";

// The whole three.js stack is client-only and code-split, so it never ships in the
// initial hero payload and never runs on the server.
const HeroLogo3D = dynamic(() => import("./hero-logo-3d"), {
  ssr: false,
  loading: () => <HeroLogoFallback />,
});

class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function HeroLogo({ className }: { className?: string }) {
  // Start with the fallback (also what SSR renders), then upgrade to the real 3D
  // logo wherever WebGL is available — including mobile, so the hero mark looks
  // identical on every device instead of dropping to the static silhouette.
  // The upgrade waits for browser idle so the three.js chunk stays out of the
  // hero's critical path.
  const render3d = useWebGLReady();

  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {render3d ? (
        <WebGLBoundary fallback={<HeroLogoFallback />}>
          <HeroLogo3D />
        </WebGLBoundary>
      ) : (
        <HeroLogoFallback />
      )}
    </div>
  );
}
