"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ServiceHeroVariant } from "./service-hero-3d";
import { ServiceHeroFallback } from "./service-hero-fallback";

// The three.js stack is client-only and code-split, so it never ships in the
// initial service-page payload and never runs on the server.
const ServiceHero3D = dynamic(() => import("./service-hero-3d"), {
  ssr: false,
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

export function ServiceHeroVisual({
  variant,
  className,
}: {
  variant: ServiceHeroVariant;
  className?: string;
}) {
  // Start with the fallback (also what SSR renders), then upgrade to the real
  // 3D scene wherever WebGL is available — including mobile, so every service
  // hero shows its actual model, not a placeholder silhouette.
  const [render3d, setRender3d] = useState(false);

  useEffect(() => {
    setRender3d(hasWebGL());
  }, []);

  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {render3d ? (
        <WebGLBoundary fallback={<ServiceHeroFallback variant={variant} />}>
          <ServiceHero3D variant={variant} />
        </WebGLBoundary>
      ) : (
        <ServiceHeroFallback variant={variant} />
      )}
    </div>
  );
}
