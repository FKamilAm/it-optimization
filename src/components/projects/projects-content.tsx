"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ContactSection } from "@/components/sections/contact-section";
import {
  CASE_DETAIL,
  CASE_DETAIL_MOBILE,
  PROJECT_KEYS,
  ProjectCard,
  type ProjectVisualVariant,
} from "@/components/sections/project-card";

export function ProjectsContent() {
  const t = useTranslations("projectsPage");
  const s = useTranslations("solutions");
  const [openKey, setOpenKey] = useState<ProjectVisualVariant | null>(null);

  return (
    <>
      {/* Hero + all cases in one flow (tight gap, like the homepage sections). */}
      <section className="surface-light relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-foreground/50">
              <li>
                <a href="/" className="cursor-pointer transition-colors hover:text-foreground">
                  {t("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight className="h-4 w-4 text-foreground/30" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>

          <Reveal>
            <h1 className="heading-display max-w-4xl">{t("title")}</h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body-large mt-8 max-w-3xl text-muted-foreground">{t("description")}</p>
          </Reveal>

          <StaggerReveal className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14">
            {PROJECT_KEYS.map((key, index) => (
              <div key={key} className="h-full">
                <ProjectCard
                  index={index}
                  title={s(`items.${key}.title`)}
                  description={s(`items.${key}.description`)}
                  quote={s(`items.${key}.quote`)}
                  tags={s(`items.${key}.tags`)}
                  visual={key}
                  onOpen={() => setOpenKey(key)}
                />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <ContactSection />

      <CaseLightbox
        src={openKey ? CASE_DETAIL[openKey] : null}
        srcMobile={openKey ? CASE_DETAIL_MOBILE[openKey] : null}
        alt={openKey ? s(`items.${openKey}.title`) : ""}
        onClose={() => setOpenKey(null)}
      />
    </>
  );
}
