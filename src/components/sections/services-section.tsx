"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ServiceCard } from "@/components/sections/service-card";
import { HOME_SERVICE_KEYS } from "@/lib/constants";

/**
 * Витрина услуг на главной. Показывает четыре направления из
 * HOME_SERVICE_KEYS и уводит на /uslugi/ за полным списком — ровно так же,
 * как блок кейсов уводит на /proekty/.
 */
export function ServicesSection() {
  const t = useTranslations("services");

  return (
    <section id="services" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{t("title")}</h2>
          </Reveal>
          <Link
            href="/uslugi/"
            className="group/all border-foreground bg-foreground text-background hover:text-accent-foreground focus-visible:outline-accent relative inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-full border px-6 text-base font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span
              aria-hidden="true"
              className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/all:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {t("allServices")}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <StaggerReveal className="mt-16 grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
          {HOME_SERVICE_KEYS.map((key, index) => (
            <div key={key} className="h-full">
              <ServiceCard serviceKey={key} index={index} />
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
