"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useInView } from "@/hooks/use-in-view";
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
import { CorporateScene } from "./scenes/corporate-scene";
import { LaptopScene } from "./scenes/laptop-scene";
import { EcommerceScene } from "./scenes/ecommerce-scene";
import { BusinessCardScene } from "./scenes/business-card-scene";
import { B2bScene } from "./scenes/b2b-scene";
import { ContentAnalysisScene } from "./scenes/content-analysis-scene";
import { TechContentScene } from "./scenes/tech-content-scene";
import { CommercialAuditScene } from "./scenes/commercial-audit-scene";
import { WebDesignScene } from "./scenes/web-design-scene";
import { BrandingScene } from "./scenes/branding-scene";
import { SecurityScene } from "./scenes/security-scene";
import { MessengerScene } from "./scenes/messenger-scene";
import { InfrastructureScene } from "./scenes/infrastructure-scene";
import { MigrationScene } from "./scenes/migration-scene";
import { OsScene } from "./scenes/os-scene";
import { ItOutsourcingScene } from "./scenes/it-outsourcing-scene";
import { InfosecAuditScene } from "./scenes/infosec-audit-scene";
import { InfosecToolsScene } from "./scenes/infosec-tools-scene";
import { InfosecConsultingScene } from "./scenes/infosec-consulting-scene";
import { InfosecMonitoringScene } from "./scenes/infosec-monitoring-scene";
import { CollaborationScene } from "./scenes/collaboration-scene";
import { BusinessSystemsScene } from "./scenes/business-systems-scene";
import { BusinessSystemsCustomScene } from "./scenes/business-systems-custom-scene";
import { IndustrialScene } from "./scenes/industrial-scene";

export type ServiceHeroVariant =
  | "platforms"
  | "websites"
  | "telegram"
  | "mobile"
  | "ai"
  | "integrations"
  | "blockchain"
  | "support"
  | "corporate"
  | "websiteTurnkey"
  | "ecommerce"
  | "businessCard"
  | "b2b"
  | "contentAnalysis"
  | "techContent"
  | "commercialAudit"
  | "webDesign"
  | "branding"
  | "security"
  | "messenger"
  | "infrastructure"
  | "migration"
  | "os"
  | "itOutsourcing"
  | "infosecAudit"
  | "infosecTools"
  | "infosecConsulting"
  | "infosecMonitoring"
  | "collaboration"
  | "businessSystems"
  | "businessSystemsCustom"
  | "industrial";

function SceneForVariant({
  variant,
  animate,
}: {
  variant: ServiceHeroVariant;
  animate: boolean;
}) {
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
    case "corporate":
      return <CorporateScene animate={animate} />;
    case "websiteTurnkey":
      return <LaptopScene animate={animate} />;
    case "ecommerce":
      return <EcommerceScene animate={animate} />;
    case "businessCard":
      return <BusinessCardScene animate={animate} />;
    case "b2b":
      return <B2bScene animate={animate} />;
    case "contentAnalysis":
      return <ContentAnalysisScene animate={animate} />;
    case "techContent":
      return <TechContentScene animate={animate} />;
    case "commercialAudit":
      return <CommercialAuditScene animate={animate} />;
    case "webDesign":
      return <WebDesignScene animate={animate} />;
    case "branding":
      return <BrandingScene animate={animate} />;
    case "security":
      return <SecurityScene animate={animate} />;
    case "messenger":
      return <MessengerScene animate={animate} />;
    case "infrastructure":
      return <InfrastructureScene animate={animate} />;
    case "migration":
      return <MigrationScene animate={animate} />;
    case "os":
      return <OsScene animate={animate} />;
    case "itOutsourcing":
      return <ItOutsourcingScene animate={animate} />;
    case "infosecAudit":
      return <InfosecAuditScene animate={animate} />;
    case "infosecTools":
      return <InfosecToolsScene animate={animate} />;
    case "infosecConsulting":
      return <InfosecConsultingScene animate={animate} />;
    case "infosecMonitoring":
      return <InfosecMonitoringScene animate={animate} />;
    case "collaboration":
      return <CollaborationScene animate={animate} />;
    case "businessSystems":
      return <BusinessSystemsScene animate={animate} />;
    case "businessSystemsCustom":
      return <BusinessSystemsCustomScene animate={animate} />;
    case "industrial":
      return <IndustrialScene animate={animate} />;
    default:
      return null;
  }
}

export default function ServiceHero3D({ variant }: { variant: ServiceHeroVariant }) {
  const animate = !prefersReducedMotion();
  // См. hero-logo-3d.tsx: за пределами экрана кадры не рисуются вовсе.
  const { ref, inView } = useInView<HTMLDivElement>();

  const frameloop = !animate ? "demand" : inView ? "always" : "never";

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={frameloop}
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
    </div>
  );
}
