"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { ServiceCard } from "@/components/sections/service-card";
import { SERVICE_NAV } from "@/lib/constants";

/**
 * Полный каталог услуг. Главная показывает четыре направления из
 * HOME_SERVICE_KEYS и уводит сюда — здесь лежат все 18 на тех же карточках,
 * что и на главной.
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

          <StaggerReveal className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
            {SERVICE_NAV.map(({ key }, index) => (
              <div key={key} className="h-full">
                <ServiceCard serviceKey={key} index={index} headingAs="h2" />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
