"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { prefersReducedMotion } from "@/lib/utils";
import { StudioEnvironment } from "./shared";
import { TelegramScene } from "./scenes/telegram-scene";
import { CrmScene } from "./scenes/crm-scene";
import { WebsitesScene } from "./scenes/websites-scene";
import { MobileScene } from "./scenes/mobile-scene";
import { AiScene } from "./scenes/ai-scene";
import { IntegrationsScene } from "./scenes/integrations-scene";
import { BlockchainScene } from "./scenes/blockchain-scene";
import { SupportScene } from "./scenes/support-scene";

export type ServiceHeroVariant =
  | "platforms"
  | "websites"
  | "telegram"
  | "mobile"
  | "ai"
  | "integrations"
  | "blockchain"
  | "support";

function SceneForVariant({ variant, animate }: { variant: ServiceHeroVariant; animate: boolean }) {
  switch (variant) {
    case "platforms":
      return <CrmScene animate={animate} />;
    case "websites":
      return <WebsitesScene animate={animate} />;
    case "telegram":
      return <TelegramScene animate={animate} />;
    case "mobile":
      return <MobileScene animate={animate} />;
    case "ai":
      return <AiScene animate={animate} />;
    case "integrations":
      return <IntegrationsScene animate={animate} />;
    case "blockchain":
      return <BlockchainScene animate={animate} />;
    case "support":
      return <SupportScene animate={animate} />;
    default:
      return null;
  }
}

export default function ServiceHero3D({ variant }: { variant: ServiceHeroVariant }) {
  const animate = !prefersReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={animate ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 12], fov: 30 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 8]} intensity={1.5} />
      <directionalLight position={[-6, -1, 4]} intensity={0.55} color="#aab4c4" />
      <Suspense fallback={null}>
        <SceneForVariant variant={variant} animate={animate} />
        <StudioEnvironment />
      </Suspense>
    </Canvas>
  );
}
