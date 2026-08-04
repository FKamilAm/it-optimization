"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { TiltCard } from "@/components/ui/tilt-card";
import { SERVICE_NAV } from "@/lib/constants";

/**
 * Каталог всех услуг на отдельной странице.
 *
 * Карточка здесь намеренно богаче, чем на главной: там ServiceCard показывает
 * только заголовок и теги, а тут — ещё описание, бюджет и срок. Иначе страница
 * была бы дублем блока #services, и поисковику пришлось бы выбирать между
 * двумя одинаковыми документами.
 */
export function ServicesHubContent() {
  const t = useTranslations("servicesPage");
  const services = useTranslations("services.items");

  return (
    <>
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

          <StaggerReveal className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {SERVICE_NAV.map(({ key, slug }) => (
              <div key={key} className="h-full">
                <TiltCard
                  as="a"
                  href={`/uslugi/${slug}/`}
                  aria-label={services(`${key}.title`)}
                  max={2.5}
                  data-cursor="dark"
                  className="group border-border bg-background hover:border-accent focus-visible:outline-accent flex h-full cursor-pointer flex-col rounded-2xl border p-8 transition-[border-color,box-shadow] duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ArrowUpRight className="text-muted-foreground group-hover:text-accent h-5 w-5 transition-[transform,color] duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <h2 className="heading-subsection mt-6">{services(`${key}.title`)}</h2>
                  <p className="body-base text-muted-foreground mt-4 grow">
                    {services(`${key}.description`)}
                  </p>
                  <dl className="border-border mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t pt-6 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("budgetLabel")}</dt>
                      <dd className="mt-1 font-medium">{services(`${key}.budget`)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("deadlineLabel")}</dt>
                      <dd className="mt-1 font-medium">{services(`${key}.deadline`)}</dd>
                    </div>
                  </dl>
                </TiltCard>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
