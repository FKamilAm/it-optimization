"use client";

import { useTranslations } from "next-intl";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
const VALUE_KEYS = ["system", "flexibility", "complexity", "support"] as const;

export function AboutSection() {
  const t = useTranslations("about");

  return (
    <section id="about" className="surface-dark section-padding relative overflow-hidden">
      <div className="container-premium relative z-10">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <Reveal>
            <h2 className="heading-section max-w-xl">{t("title")}</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body-large max-w-2xl text-white/65">{t("description")}</p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {VALUE_KEYS.map((key, index) => (
            <article
              key={key}
              data-cursor="hover"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors duration-500 hover:border-white md:p-10"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full -translate-y-full bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transition-none"
              />
              <div className="relative z-10">
                <span className="text-base uppercase tracking-[0.18em] text-white/55 transition-colors duration-500 group-hover:text-black/55">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="heading-subsection mt-6 transition-colors duration-500 group-hover:text-black">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="body-base mt-3 text-white/60 transition-colors duration-500 group-hover:text-black/70">
                  {t(`values.${key}.description`)}
                </p>
              </div>
            </article>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
