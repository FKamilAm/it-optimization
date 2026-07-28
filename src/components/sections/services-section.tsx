"use client";

import { useTranslations } from "next-intl";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ServiceCard } from "@/components/sections/service-card";

const SERVICE_KEYS = [
  "corporate",
  "websites",
  "websiteTurnkey",
  "ecommerce",
  "businessCard",
  "webDesign",
  "branding",
  "b2b",
  "telegram",
  "mobile",
  "ai",
  "integrations",
  "blockchain",
  "support",
  "contentAnalysis",
  "techContent",
  "commercialAudit",
  "platforms",
] as const;

export function ServicesSection() {
  const t = useTranslations("services");

  return (
    <section id="services" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{t("title")}</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body-base max-w-xl text-muted-foreground">{t("description")}</p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
          {SERVICE_KEYS.map((key, index) => (
            <div key={key} className="h-full">
              <ServiceCard serviceKey={key} index={index} />
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
