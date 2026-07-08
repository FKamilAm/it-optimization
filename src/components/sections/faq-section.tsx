"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const [openKey, setOpenKey] = useState<string | null>("1");

  return (
    <section id="faq" className="surface-dark section-padding relative overflow-hidden">
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section">{t("title")}</h2>
        </Reveal>

        <StaggerReveal className="mt-16 divide-y divide-white/10 border-t border-white/10">
          {FAQ_KEYS.map((key) => {
            const isOpen = openKey === key;

            return (
              <div
                key={key}
                className={cn(
                  "py-1 transition-colors duration-300",
                  isOpen && "bg-accent-muted/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  className={cn(
                    "flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left transition-colors duration-300",
                    isOpen && "border-l-2 border-accent pl-4",
                  )}
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      "heading-subsection max-w-3xl font-medium transition-colors duration-300",
                      isOpen ? "text-white" : "text-white/80",
                    )}
                  >
                    {t(`items.${key}.question`)}
                  </span>
                  <span
                    className={cn(
                      "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      isOpen
                        ? "rotate-45 border-accent/50 bg-accent/10 text-accent"
                        : "border-white/15 text-white/70",
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="body-base max-w-3xl pb-6 pl-4 text-white/65">
                      {t(`items.${key}.answer`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
