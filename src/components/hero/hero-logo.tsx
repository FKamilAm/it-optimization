"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
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

export function HeroLogo({ className }: { className?: string }) {
  // Start with the fallback (also what SSR renders), then upgrade to the real 3D
  // logo wherever WebGL is available — including mobile, so the hero mark looks
  // identical on every device instead of dropping to the static silhouette.
  const [render3d, setRender3d] = useState(false);

  useEffect(() => {
    setRender3d(hasWebGL());
  }, []);

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
