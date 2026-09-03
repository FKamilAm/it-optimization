"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { ServiceCard } from "@/components/sections/service-card";
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion";
import { FilterChips, type FilterChipOption } from "@/components/ui/filter-chips";
import { SERVICE_CATEGORY_NAV, SERVICE_NAV } from "@/lib/constants";

/**
 * Полный каталог услуг. Главная показывает четыре направления из
 * HOME_SERVICE_KEYS и уводит сюда — здесь лежат все, на тех же карточках.
 *
 * Разделы — это фильтр, а не заголовки секций: сеткой, разбитой на восемь
 * блоков, страница читается как восемь отдельных списков, и человек, который
 * пришёл за одной услугой, всё равно листает мимо семи чужих разделов. Фильтр
 * оставляет один список и даёт сузить его одним нажатием.
 *
 * Раздел здесь по-прежнему не ссылка: своей страницы у него нет, и адрес при
 * фильтрации не меняется — /uslugi/ должна оставаться одной страницей для
 * поиска, а не размножаться на восемь почти одинаковых.
 */
export function ServicesHubContent() {
  const t = useTranslations("servicesPage");
  const faq = t.raw("faq") as FaqItem[];

  /** Выбранный раздел; null — весь каталог. */
  const [filter, setFilter] = useState<string | null>(null);

  // Названия разделов приходят из данных каталога, а не из `messages/ru.json`:
  // раздел заводится в панели, и подпись должна заводиться там же. Разделы из
  // одних черновиков `SERVICE_CATEGORY_NAV` уже отбросил.
  const options = useMemo<FilterChipOption[]>(
    () => [
      { value: null, label: t("filterAll") },
      ...SERVICE_CATEGORY_NAV.map((category) => ({
        value: category.key,
        label: category.title,
      })),
    ],
    [t],
  );

  const visible = useMemo(() => {
    if (!filter) return SERVICE_NAV;
    const inCategory = new Set(
      SERVICE_CATEGORY_NAV.find((category) => category.key === filter)?.services ?? [],
    );
    return SERVICE_NAV.filter((entry) => inCategory.has(entry.key));
  }, [filter]);

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
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
              {t("description")}
            </p>
          </Reveal>

          {options.length > 2 && (
            <Reveal delay={0.1}>
              <FilterChips
                label={t("filterLabel")}
                options={options}
                value={filter}
                onChange={setFilter}
                className="mt-10 md:mt-12"
              />
            </Reveal>
          )}

          {/* key по фильтру — чтобы карточки заново проявлялись при смене
              раздела, а не подменялись молча под курсором. */}
          <StaggerReveal
            key={filter ?? "all"}
            className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 md:gap-8 xl:grid-cols-4"
          >
            {visible.map(({ key }, index) => (
              <div key={key} className="h-full">
                <ServiceCard serviceKey={key} index={index} headingAs="h2" />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="surface-dark section-padding relative overflow-hidden">
        <div className="container-premium relative z-10">
          <Reveal>
            <h2 className="heading-section">{t("faqTitle")}</h2>
          </Reveal>
          <div className="mt-16">
            <FaqAccordion items={faq} surface="dark" />
          </div>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
