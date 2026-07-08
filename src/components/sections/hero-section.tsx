"use client";

import { useTranslations } from "next-intl";
import { ArrowDownRight } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { Button } from "@/components/ui/button";
import { HeroLogo } from "@/components/hero/hero-logo";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

export function HeroSection() {
  const t = useTranslations("hero");
  const { openContactModal } = useContactModal();
  const { scrollToSection } = useSmoothScroll();

  return (
    <section
      id="home"
      className="surface-light relative flex min-h-svh flex-col justify-center overflow-hidden pt-28 md:justify-end md:pt-36"
    >
      {/* 3D logo. On mobile it's a normal-flow block shown FIRST and enlarged, so
          it never overlaps the heading; on md+ it becomes the absolute accent on
          the right. (Static silver fallback on mobile / when WebGL is off.) */}
      <div className="pointer-events-none relative z-0 mx-auto aspect-[19/10] w-[94%] max-w-[460px] md:absolute md:left-auto md:right-0 md:top-[16%] md:mx-0 md:aspect-auto md:h-[70%] md:w-[54%] md:max-w-none lg:right-[1%] lg:w-[50%]">
        <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(148,163,184,0.30),transparent_70%)] blur-2xl" />
        <HeroLogo className="h-full w-full" />
      </div>

      <div className="container-premium relative z-10 pt-8 pb-12 md:py-[var(--spacing-section)]">
        <Reveal>
          <h1 className="heading-display max-w-[1450px] text-balance lg:max-w-[58%]">
            {t("title")}
          </h1>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body-large mt-6 max-w-[920px] text-muted-foreground sm:mt-10 lg:max-w-[50%]">
            {t("subtitle")}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => openContactModal()}>
              {t("ctaPrimary")}
              <ArrowDownRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToSection("#services")}
            >
              {t("ctaSecondary")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
