"use client";

import { Fragment, useRef } from "react";
import { useTranslations } from "next-intl";
import { AnimatedCounter } from "@/components/animations/counter";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { AnimatedGrowthChart } from "@/components/visuals/animated-growth-chart";
import { cn } from "@/lib/utils";
import { INDUSTRIES, METRICS } from "@/lib/constants";

// The pill that starts the second row; it and everything after it wrap below.
const SECOND_ROW_FROM = "E-Learning";

function IndustryPill({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const setOrigin = (event: React.MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty(
      "--fill-x",
      `${((event.clientX - rect.left) / rect.width) * 100}%`,
    );
    el.style.setProperty(
      "--fill-y",
      `${((event.clientY - rect.top) / rect.height) * 100}%`,
    );
  };

  return (
    <span
      ref={ref}
      onMouseEnter={setOrigin}
      onMouseLeave={setOrigin}
      data-cursor="hover"
      className="pill-fill inline-flex cursor-default items-center rounded-full border border-white/10 px-4 py-2 text-base text-white/70"
    >
      {label}
    </span>
  );
}

export function IndustriesSection() {
  const t = useTranslations("industries");

  return (
    <section id="industries" className="surface-dark section-padding relative">
      <div className="container-premium relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_420px] lg:gap-16 xl:grid-cols-[1fr_500px]">
          {/* Left: short heading, description, industries and metrics */}
          <div>
            <Reveal>
              <h2 className="heading-section max-w-2xl">{t("title")}</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="body-large mt-6 max-w-2xl text-white/60">{t("manifest")}</p>
            </Reveal>

            {/* Industries — a full-width flex break forces E-Learning and the
                pills after it onto a second row (they're consecutive at the end
                of INDUSTRIES). */}
            <StaggerReveal className="mt-10 flex flex-wrap gap-2.5">
              {INDUSTRIES.map((industry) => (
                <Fragment key={industry}>
                  {industry === SECOND_ROW_FROM && (
                    <span aria-hidden className="basis-full" />
                  )}
                  <IndustryPill label={industry} />
                </Fragment>
              ))}
            </StaggerReveal>

            {/* Metrics — on mobile they sit in an even, gap-separated row (no
                dividers, so wrapping never looks broken); from sm+ they tighten
                up with vertical dividers between them. */}
            <StaggerReveal className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-6 sm:gap-x-0">
              {METRICS.map(({ valueKey, labelKey }, i) => (
                <div
                  key={valueKey}
                  className={cn(
                    "flex flex-col sm:pr-12 md:pr-16",
                    i > 0 && "sm:border-l sm:border-white/15 sm:pl-12 md:pl-16",
                  )}
                >
                  <AnimatedCounter
                    value={t(valueKey)}
                    className="font-display text-accent text-3xl leading-none font-bold tracking-tight sm:text-4xl md:text-5xl"
                  />
                  <span className="mt-3 text-sm tracking-[0.14em] text-white/45 uppercase">
                    {t(labelKey)}
                  </span>
                </div>
              ))}
            </StaggerReveal>
          </div>

          {/* Right: larger 3D model, nudged toward the left of the block. The
              shift lives on the wrapper because the chart's own transform is
              driven by its idle GSAP float. */}
          <div className="hidden lg:block lg:-translate-x-8 xl:-translate-x-16">
            <AnimatedGrowthChart className="mx-auto w-full max-w-[520px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
