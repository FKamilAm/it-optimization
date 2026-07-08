"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import {
  CASE_DETAIL,
  CASE_DETAIL_MOBILE,
  ProjectCard,
  type ProjectVisualVariant,
} from "@/components/sections/project-card";

const PROJECT_KEYS = [
  "crm",
  "aiAgent",
  "miniapp",
  "marketplace",
  "web3",
  "corporate",
] as const;

export function SolutionsSection() {
  const t = useTranslations("solutions");
  const [openKey, setOpenKey] = useState<ProjectVisualVariant | null>(null);

  return (
    <section id="solutions" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <h2 className="heading-section max-w-4xl">{t("title")}</h2>
        <p className="body-large mt-8 max-w-3xl text-muted-foreground">{t("description")}</p>

        <StaggerReveal className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14">
          {PROJECT_KEYS.map((key, index) => (
            <div key={key} className="h-full">
              <ProjectCard
                index={index}
                title={t(`items.${key}.title`)}
                description={t(`items.${key}.description`)}
                quote={t(`items.${key}.quote`)}
                tags={t(`items.${key}.tags`)}
                visual={key}
                onOpen={() => setOpenKey(key)}
              />
            </div>
          ))}
        </StaggerReveal>
      </div>

      <CaseLightbox
        src={openKey ? CASE_DETAIL[openKey] : null}
        srcMobile={openKey ? CASE_DETAIL_MOBILE[openKey] : null}
        alt={openKey ? t(`items.${openKey}.title`) : ""}
        onClose={() => setOpenKey(null)}
      />
    </section>
  );
}
