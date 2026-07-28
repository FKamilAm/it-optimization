"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ContactSection } from "@/components/sections/contact-section";
import { ProjectCard } from "@/components/sections/project-card";
import type { CaseItem } from "@/lib/cases";

export function ProjectsContent({ cases }: { cases: CaseItem[] }) {
  const t = useTranslations("projectsPage");
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);

  return (
    <>
      {/* Hero + all cases in one flow (tight gap, like the homepage sections). */}
      <section className="surface-light relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="text-foreground/50 flex flex-wrap items-center gap-2 text-sm">
              <li>
                <a
                  href="/"
                  className="hover:text-foreground cursor-pointer transition-colors"
                >
                  {t("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight className="text-foreground/30 h-4 w-4" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>

          <Reveal>
            <h1 className="heading-display max-w-4xl">{t("title")}</h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body-large text-muted-foreground mt-8 max-w-3xl">
              {t("description")}
            </p>
          </Reveal>

          <StaggerReveal className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14">
            {cases.map((item, index) => (
              <div key={item.slug} className="h-full">
                <ProjectCard index={index} item={item} onOpen={() => setOpenCase(item)} />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <ContactSection />

      <CaseLightbox
        src={openCase?.detail ?? null}
        srcMobile={openCase?.detailMobile ?? null}
        alt={openCase?.title ?? ""}
        onClose={() => setOpenCase(null)}
      />
    </>
  );
}
