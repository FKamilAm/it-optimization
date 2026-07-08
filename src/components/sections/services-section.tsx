"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { TiltCard } from "@/components/ui/tilt-card";
import { cn } from "@/lib/utils";

const SERVICE_KEYS = [
  "platforms",
  "websites",
  "telegram",
  "mobile",
  "ai",
  "integrations",
  "blockchain",
  "support",
] as const;

export function ServicesSection() {
  const t = useTranslations("services");
  const { openContactModal } = useContactModal();

  return (
    <section id="services" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{t("title")}</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body-base max-w-xl text-muted-foreground">{t("description")}</p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
          {SERVICE_KEYS.map((key, index) => {
            const tags = t.raw(`items.${key}.tags`) as string[];
            const isDark = index % 3 === 1;

            const openForService = () => openContactModal(key);

            return (
              <div key={key} className="h-full">
                <TiltCard
                  as="article"
                  max={2.5}
                  data-cursor="dark"
                  role="button"
                  tabIndex={0}
                  aria-label={t("cardCta", { service: t(`items.${key}.title`) })}
                  onClick={openForService}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openForService();
                    }
                  }}
                  className={cn(
                    "group relative flex h-full min-h-[280px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-8 duration-500 md:p-10",
                    "transition-[border-color,box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isDark
                      ? "border-white/10 bg-surface text-surface-foreground hover:border-accent"
                      : "border-border bg-background hover:border-accent hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-full translate-y-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transition-none"
                  />
                  <div className="relative z-10 transition-colors duration-500 group-hover:text-accent-foreground">
                    <ArrowUpRight
                      className={cn(
                        "h-5 w-5 transition-[transform,color] duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-foreground",
                        isDark ? "text-white/50" : "text-muted-foreground",
                      )}
                    />
                    <h3 className="heading-subsection mt-8 max-w-[16ch]">
                      {t(`items.${key}.title`)}
                    </h3>
                  </div>
                  <ul className="relative z-10 mt-6 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className={cn(
                          "rounded-full border px-3 py-1 text-base transition-colors duration-500 group-hover:border-accent-foreground/25 group-hover:text-accent-foreground/80",
                          isDark
                            ? "border-white/10 text-white/60"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
