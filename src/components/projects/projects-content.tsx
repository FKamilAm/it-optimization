"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ContactSection } from "@/components/sections/contact-section";
import { ProjectCard } from "@/components/sections/project-card";
import { countCasesByService, type CaseItem } from "@/lib/cases";
import { SERVICE_NAV } from "@/lib/constants";
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select";

export function ProjectsContent({ cases }: { cases: CaseItem[] }) {
  const t = useTranslations("projectsPage");
  const services = useTranslations("services.items");
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);
  /** Выбранная услуга; null — весь каталог. */
  const [filter, setFilter] = useState<string | null>(null);

  const counts = useMemo(() => countCasesByService(cases), [cases]);
  // В фильтре показываем только услуги, у которых есть хотя бы один кейс:
  // пустая кнопка ведёт в пустоту и лишь захламляет строку.
  const options = useMemo<FilterOption[]>(
    () => [
      { value: null, label: t("filterAll"), count: cases.length },
      ...SERVICE_NAV.filter((entry) => (counts[entry.key] ?? 0) > 0).map((entry) => ({
        value: entry.key,
        label: services(`${entry.key}.title`),
        count: counts[entry.key] ?? 0,
      })),
    ],
    [cases.length, counts, services, t],
  );
  const visible = useMemo(
    () => (filter ? cases.filter((item) => item.services.includes(filter)) : cases),
    [cases, filter],
  );

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

          {/* Заголовок и фильтр в одну строку: на широком экране фильтр уходит
              вправо к верхней кромке заголовка, на узком встаёт под ним. */}
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
            <Reveal className="min-w-0">
              <h1 className="heading-display max-w-4xl">{t("title")}</h1>
            </Reveal>

            {options.length > 2 && (
              // Слой задаётся здесь, а не внутри Reveal: у .reveal есть transform,
              // а он сам создаёт stacking context — z-index внутри него сортирует
              // только собственных детей и не поднимает блок над сеткой карточек.
              <div className="relative z-40 md:w-72 md:shrink-0">
                <Reveal delay={0.1}>
                  <FilterSelect
                    label={t("filterLabel")}
                    options={options}
                    value={filter}
                    onChange={setFilter}
                    showCounts={false}
                    className="sm:max-w-sm md:max-w-none"
                  />
                </Reveal>
              </div>
            )}
          </div>

          <StaggerReveal
            key={filter ?? "all"}
            className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-2 md:gap-12 xl:grid-cols-3 xl:gap-14"
          >
            {visible.map((item, index) => (
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
