"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/animations/reveal";
import { FaqAccordion } from "@/components/ui/faq-accordion";

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const items = FAQ_KEYS.map((key) => ({
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`),
  }));

  return (
    <section id="faq" className="surface-dark section-padding relative overflow-hidden">
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section">{t("title")}</h2>
        </Reveal>
        <div className="mt-16">
          <FaqAccordion items={items} surface="dark" />
        </div>
      </div>
    </section>
  );
}
