"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import {
  CASE_DETAIL,
  CASE_DETAIL_MOBILE,
  PROJECT_KEYS,
  ProjectCard,
  type ProjectVisualVariant,
} from "@/components/sections/project-card";

// The homepage teases only the first few cases; the rest live on /proekty.
const HOME_PROJECT_KEYS = PROJECT_KEYS.slice(0, 3);

export function SolutionsSection() {
  const t = useTranslations("solutions");
  const [openKey, setOpenKey] = useState<ProjectVisualVariant | null>(null);

  return (
    <section id="solutions" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-3xl">
            <h2 className="heading-section">{t("title")}</h2>
            <p className="body-large mt-6 text-muted-foreground">{t("description")}</p>
          </div>
          <Link
            href="/proekty/"
            className="group/all relative inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-foreground bg-foreground px-6 text-base font-medium text-background transition-colors duration-300 hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/all:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {t("allProjects")}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <StaggerReveal className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14">
          {HOME_PROJECT_KEYS.map((key, index) => (
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
