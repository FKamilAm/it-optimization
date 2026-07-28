"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ProjectCard } from "@/components/sections/project-card";
import type { CaseItem } from "@/lib/cases";

export function SolutionsSection({ cases }: { cases: CaseItem[] }) {
  const t = useTranslations("solutions");
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);

  return (
    <section id="solutions" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-3xl">
            <h2 className="heading-section">{t("title")}</h2>
            <p className="body-large text-muted-foreground mt-6">{t("description")}</p>
          </div>
          <Link
            href="/proekty/"
            className="group/all border-foreground bg-foreground text-background hover:text-accent-foreground focus-visible:outline-accent relative inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-full border px-6 text-base font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span
              aria-hidden="true"
              className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/all:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {t("allProjects")}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <StaggerReveal className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14">
          {cases.map((item, index) => (
            <div key={item.slug} className="h-full">
              <ProjectCard index={index} item={item} onOpen={() => setOpenCase(item)} />
            </div>
          ))}
        </StaggerReveal>
      </div>

      <CaseLightbox
        src={openCase?.detail ?? null}
        srcMobile={openCase?.detailMobile ?? null}
        alt={openCase?.title ?? ""}
        onClose={() => setOpenCase(null)}
      />
    </section>
  );
}
