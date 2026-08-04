"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/animations/reveal";
import { ContactChannels } from "@/components/contact/contact-channels";

export function ContactSection() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <Reveal>
              <h2 className="heading-section max-w-xl">{t("title")}</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="body-large text-muted-foreground mt-6 max-w-md">
                {t("subtitle")}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <ContactChannels message={t("starter.default")} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
