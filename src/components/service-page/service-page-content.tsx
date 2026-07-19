"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactChannels } from "@/components/contact/contact-channels";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ServiceCard } from "@/components/sections/service-card";
import {
  CASE_DETAIL,
  CASE_DETAIL_MOBILE,
  type ProjectVisualVariant,
} from "@/components/sections/project-card";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { Button } from "@/components/ui/button";
import { ServiceHeroVisual } from "@/components/service-hero/service-hero-visual";
import type { ServiceHeroVariant } from "@/components/service-hero/service-hero-3d";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import {
  blogPostByKey,
  RELATED_ARTICLES,
  RELATED_SERVICES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

// Service page key → dedicated 3D hero visual. Every service has its own scene.
const HERO_VISUAL: Partial<Record<string, ServiceHeroVariant>> = {
  platforms: "platforms",
  websites: "websites",
  telegram: "telegram",
  mobile: "mobile",
  ai: "ai",
  integrations: "integrations",
  blockchain: "blockchain",
  support: "support",
  corporate: "corporate",
  websiteTurnkey: "websiteTurnkey",
  ecommerce: "ecommerce",
  businessCard: "businessCard",
  b2b: "b2b",
  contentAnalysis: "contentAnalysis",
  techContent: "techContent",
  commercialAudit: "commercialAudit",
};

// Solutions case key → square cover artwork (mirrors the homepage section).
const CASE_COVER: Record<string, string> = {
  crm: "/cases/case-crm.webp",
  aiAgent: "/cases/case-ai.webp",
  miniapp: "/cases/case-miniapp.webp",
  web3: "/cases/case-web3.webp",
  marketplace: "/cases/case-marketplace.webp",
  corporate: "/cases/case-corporate.webp",
  svpr: "/cases/case-svpr.webp",
  tiger: "/cases/case-tiger.webp",
  mebel: "/cases/case-mebel.webp",
  renegade: "/cases/case-renegade.webp",
  visit: "/cases/case-visit.webp",
  tgMiniApp: "/cases/case-tg-mini-app.webp",
  nori: "/cases/case-nori.webp",
  street: "/cases/case-street.webp",
  crypto: "/cases/case-crypto.webp",
  score99: "/cases/case-99.webp",
};

const CASE_ROTATE_MS = 5000;
const STEP_ROTATE_MS = 3000;

interface UseCaseItem {
  title: string;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Tariff {
  name: string;
  price: string;
  deadline: string;
  recommended?: boolean;
  features: string[];
}

export function ServicePageContent({ pageKey }: { pageKey: string }) {
  const t = useTranslations(`servicePages.${pageKey}`);
  const c = useTranslations("servicePages.common");
  const service = useTranslations("services.items");
  const solutions = useTranslations("solutions.items");
  const blog = useTranslations("blog");
  const { openContactModal } = useContactModal();
  const { scrollToSection } = useSmoothScroll();

  const serviceKey = t("serviceKey");
  const includes = t.raw("includes") as string[];
  const forWhom = t.raw("forWhom") as UseCaseItem[];
  const steps = t.raw("steps") as UseCaseItem[];
  const faq = t.raw("faq") as FaqItem[];
  const cases = (t.raw("cases") as string[] | undefined) ?? [];
  const tariffs = (t.raw("tariffs") as Tariff[] | undefined) ?? [];
  const relatedServices = RELATED_SERVICES[pageKey] ?? [];
  const relatedArticleKeys = RELATED_ARTICLES[pageKey] ?? [];

  const heroVariant = HERO_VISUAL[pageKey];
  // All service pages use the light hero (dark text on white) + re-sequenced
  // layout that was piloted on the Telegram page.
  const lightHero = true;

  const [openFaq, setOpenFaq] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [lightboxCase, setLightboxCase] = useState<ProjectVisualVariant | null>(null);

  const total = cases.length;
  const hasCases = total > 0;
  const hasSlider = total > 1;

  // Infinite slider. `page` is an unbounded counter (up on next, down on prev);
  // the visible case is derived via modulo, so it loops forever in either
  // direction. Each change animates a single slide in/out horizontally, which
  // stays robust under fast clicking (no clone bookkeeping to overshoot).
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const realIndex = total ? (((page % total) + total) % total) : 0;

  const goPrev = () => setPage(([p]) => [p - 1, -1]);
  const goNext = () => setPage(([p]) => [p + 1, 1]);
  const goToReal = (target: number) => {
    const diff = target - realIndex;
    if (diff !== 0) setPage(([p]) => [p + diff, diff > 0 ? 1 : -1]);
  };

  // Auto-advance forward; pauses while the lightbox is open.
  useEffect(() => {
    if (!hasSlider || lightboxCase) return;
    const id = window.setInterval(() => setPage(([p]) => [p + 1, 1]), CASE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [hasSlider, lightboxCase]);

  // Cycle the highlighted process step every few seconds, looping around.
  useEffect(() => {
    if (steps.length < 2) return;
    const id = window.setInterval(
      () => setActiveStep((i) => (i + 1) % steps.length),
      STEP_ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [steps.length]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%" }),
    center: { x: "0%" },
    exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%" }),
  };

  const renderCaseInner = (caseKey: string) => (
    <div className="flex h-full flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-14">
      <div className="flex items-center justify-center lg:h-full">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={CASE_COVER[caseKey] ?? CASE_COVER.miniapp}
            alt={solutions(`${caseKey}.title`)}
            width={720}
            height={540}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 lg:h-full">
        <h3 className="heading-section text-white">{solutions(`${caseKey}.title`)}</h3>
        <p className="body-large text-white/65">{solutions(`${caseKey}.description`)}</p>
        <blockquote className="border-l-2 border-accent pl-5 text-white/80">
          {solutions(`${caseKey}.quote`)}
        </blockquote>
        <p className="text-sm text-white/45">{solutions(`${caseKey}.tags`)}</p>
        <div className="mt-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setLightboxCase(caseKey as ProjectVisualVariant)}
            className="group/more relative inline-flex h-14 w-full max-w-xs cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-white bg-transparent px-8 text-base font-medium text-white transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:max-w-none"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-white transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">{c("caseMore")}</span>
          </button>
          <button
            type="button"
            onClick={() => openContactModal()}
            className="group/cta relative inline-flex h-14 w-full max-w-xs cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-white bg-white px-8 text-base font-medium text-foreground transition-colors duration-300 hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:max-w-none"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {c("ctaPrimary")}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  const heroSection = (
    <section
      key="hero"
      className={cn(
        "relative flex min-h-svh flex-col justify-center overflow-hidden py-28 md:py-32",
        lightHero ? "surface-light" : "surface-dark",
      )}
    >
        {heroVariant && (
          <div className="pointer-events-none relative z-0 mx-auto mb-4 aspect-[4/3] w-[92%] max-w-[460px] md:absolute md:right-[-4%] md:top-1/2 md:mx-0 md:mb-0 md:h-[72%] md:w-[62%] md:max-w-none md:-translate-y-1/2 md:aspect-auto lg:right-[-3%] lg:w-[60%] xl:w-[58%]">
            <div
              className={cn(
                "absolute inset-[6%] rounded-full blur-2xl",
                lightHero
                  ? "bg-[radial-gradient(circle_at_52%_46%,rgba(100,116,139,0.16),transparent_70%)]"
                  : "bg-[radial-gradient(circle_at_52%_46%,rgba(148,163,184,0.22),transparent_70%)]",
              )}
            />
            <ServiceHeroVisual variant={heroVariant} className="h-full w-full" />
          </div>
        )}

        <div className="container-premium relative z-10">
          <div className={cn("w-full", heroVariant && "md:max-w-[44%] lg:max-w-[46%]")}>
          <nav aria-label="breadcrumb" className="mb-10">
            <ol
              className={cn(
                "flex flex-wrap items-center gap-2 text-sm",
                lightHero ? "text-foreground/50" : "text-white/50",
              )}
            >
              <li>
                <a
                  href="/"
                  className={cn(
                    "cursor-pointer transition-colors",
                    lightHero ? "hover:text-foreground" : "hover:text-white",
                  )}
                >
                  {c("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight
                className={cn("h-4 w-4", lightHero ? "text-foreground/30" : "text-white/30")}
                aria-hidden="true"
              />
              <li>
                <a
                  href="/#services"
                  className={cn(
                    "cursor-pointer transition-colors",
                    lightHero ? "hover:text-foreground" : "hover:text-white",
                  )}
                >
                  {c("breadcrumbServices")}
                </a>
              </li>
              <ChevronRight
                className={cn("h-4 w-4", lightHero ? "text-foreground/30" : "text-white/30")}
                aria-hidden="true"
              />
              <li
                aria-current="page"
                className={lightHero ? "text-foreground/80" : "text-white/80"}
              >
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>

          <Reveal>
            <h1 className={cn("heading-display", heroVariant ? "max-w-none" : "max-w-4xl")}>
              {t("h1")}
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p
              className={cn(
                "body-large mt-8",
                heroVariant ? "max-w-none" : "max-w-2xl",
                lightHero ? "text-foreground/70" : "text-white/65",
              )}
            >
              {t("lead")}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              className={cn(
                "mt-12 flex flex-col gap-8",
                !lightHero && "sm:flex-row sm:items-end sm:justify-between",
              )}
            >
              <dl className="flex flex-col gap-6 sm:flex-row sm:gap-12">
                <div className="flex flex-col gap-1">
                  <dt
                    className={cn(
                      "text-xs font-medium uppercase tracking-[0.14em]",
                      lightHero ? "text-foreground/45" : "text-white/45",
                    )}
                  >
                    {c("budgetLabel")}
                  </dt>
                  <dd
                    className={cn(
                      "text-3xl font-semibold md:text-5xl",
                      lightHero ? "text-foreground" : "text-white",
                    )}
                  >
                    {service(`${serviceKey}.budget`)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt
                    className={cn(
                      "text-xs font-medium uppercase tracking-[0.14em]",
                      lightHero ? "text-foreground/45" : "text-white/45",
                    )}
                  >
                    {c("deadlineLabel")}
                  </dt>
                  <dd
                    className={cn(
                      "text-3xl font-semibold md:text-5xl",
                      lightHero ? "text-foreground" : "text-white",
                    )}
                  >
                    {service(`${serviceKey}.deadline`)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  variant={lightHero ? "primary" : "inverse"}
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => openContactModal()}
                >
                  {c("ctaPrimary")}
                </Button>
                {tariffs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("#tariffs")}
                    className={cn(
                      "inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-8 text-base font-medium transition-colors duration-300 hover:border-accent hover:text-accent sm:w-auto",
                      lightHero
                        ? "border-foreground/20 text-foreground"
                        : "border-white/20 text-white",
                    )}
                  >
                    {c("viewTariffs")}
                  </button>
                )}
                <a
                  href="/#services"
                  className={cn(
                    "inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-8 text-base font-medium transition-colors duration-300 hover:border-accent hover:text-accent sm:w-auto",
                    lightHero
                      ? "border-foreground/20 text-foreground"
                      : "border-white/20 text-white",
                  )}
                >
                  {c("otherServices")}
                </a>
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </section>
  );

  const includesSection = (
    <section key="includes" className="surface-light section-padding relative">
        <div className="container-premium relative z-10">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{c("includesTitle")}</h2>
          </Reveal>
          <StaggerReveal className="mt-14 grid gap-4 md:grid-cols-2">
            {includes.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-2xl border border-border bg-background p-6"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-4 w-4" />
                </span>
                <p className="body-base text-foreground">{item}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
  );

  const casesSection = hasCases ? (
        <section key="cases" className="surface-dark section-padding relative overflow-hidden">
          <div className="container-premium relative z-10">
            <Reveal>
              <h2 className="heading-section text-white">{c("caseTitle")}</h2>
            </Reveal>

            <div className="relative mt-12">
              {hasSlider ? (
                <div className="relative">
                  {/* Invisible spacer: every case stacked in one grid cell sizes
                      the block to the TALLEST case, so sliding never makes the
                      height jump (and there's no wasted space either). */}
                  <div className="invisible grid" aria-hidden="true">
                    {cases.map((caseKey) => (
                      <div key={caseKey} className="col-start-1 row-start-1">
                        {renderCaseInner(caseKey)}
                      </div>
                    ))}
                  </div>
                  {/* Animated active slide, overlaid to fill that fixed height. */}
                  <div className="absolute inset-0 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                      <motion.div
                        key={page}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        className="h-full"
                      >
                        {renderCaseInner(cases[realIndex])}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                renderCaseInner(cases[0])
              )}

              {hasSlider && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Предыдущий кейс"
                    className="group/arrow absolute left-0 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-surface text-white transition-colors duration-300 hover:border-accent hover:text-accent-foreground lg:-left-7 lg:flex"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
                    />
                    <ChevronLeft className="relative z-10 h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Следующий кейс"
                    className="group/arrow absolute right-0 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-surface text-white transition-colors duration-300 hover:border-accent hover:text-accent-foreground lg:-right-7 lg:flex"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
                    />
                    <ChevronRight className="relative z-10 h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {hasSlider && (
              <div className="mt-10 flex justify-center gap-2">
                {cases.map((caseKey, i) => (
                  <button
                    key={caseKey}
                    type="button"
                    onClick={() => goToReal(i)}
                    aria-label={`Кейс ${i + 1}`}
                    aria-current={i === realIndex}
                    className={cn(
                      "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                      i === realIndex ? "w-8 bg-white/80" : "w-4 bg-white/25 hover:bg-white/40",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Mobile / tablet slider arrows — below the tabs (side arrows are
                desktop-only). */}
            {hasSlider && (
              <div className="mt-6 flex justify-center gap-4 lg:hidden">
                {[
                  { label: "Предыдущий кейс", onClick: goPrev, Icon: ChevronLeft },
                  { label: "Следующий кейс", onClick: goNext, Icon: ChevronRight },
                ].map(({ label, onClick, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    aria-label={label}
                    className="group/arrow relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-surface text-white transition-colors duration-300 hover:border-accent hover:text-accent-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
                    />
                    <Icon className="relative z-10 h-6 w-6" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
  ) : null;

  const processSection = (
    <section key="process" className="surface-light section-padding relative">
        <div className="container-premium relative z-10">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{c("stepsTitle")}</h2>
          </Reveal>
          <StaggerReveal className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <div key={step.title} className="h-full">
                  <article
                  className={cn(
                    "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-background p-8 transition-transform duration-[1100ms] ease-[cubic-bezier(0.37,0,0.23,1)] will-change-transform motion-reduce:transition-none",
                    isActive && "-translate-y-2.5",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 z-0 origin-left bg-accent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-sm font-semibold transition-colors duration-500",
                      isActive ? "text-accent-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={cn(
                      "relative z-10 heading-subsection transition-colors duration-500",
                      isActive ? "text-accent-foreground" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      "relative z-10 body-base transition-colors duration-500",
                      isActive ? "text-accent-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {step.text}
                  </p>
                  </article>
                </div>
              );
            })}
          </StaggerReveal>
        </div>
      </section>
  );

  const forWhomSection = (
    <section key="forwhom" className="surface-dark section-padding relative overflow-hidden">
        <div className="container-premium relative z-10">
          <Reveal>
            <h2 className="heading-section max-w-3xl">{c("forWhomTitle")}</h2>
          </Reveal>
          <StaggerReveal className="mt-14 grid gap-6 md:grid-cols-3">
            {forWhom.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-full translate-y-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transition-none"
                />
                <div className="relative z-10 flex flex-col gap-3">
                  <h3 className="heading-subsection text-white transition-colors duration-500 group-hover:text-foreground">
                    {item.title}
                  </h3>
                  <p className="body-base text-white/60 transition-colors duration-500 group-hover:text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </StaggerReveal>
        </div>
      </section>
  );

  const faqSection = (
    <section
      key="faq"
      className={cn(
        "section-padding relative overflow-hidden",
        lightHero ? "surface-dark" : "surface-light",
      )}
    >
        <div className="container-premium relative z-10">
          <Reveal>
            <h2 className="heading-section">{c("faqTitle")}</h2>
          </Reveal>
          <div
            className={cn(
              "mt-14 divide-y border-t",
              lightHero ? "divide-white/10 border-white/10" : "divide-border border-border",
            )}
          >
            {faq.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className={cn(
                    "py-1 transition-colors duration-300",
                    isOpen && (lightHero ? "bg-accent-muted/30" : "bg-muted/40"),
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className={cn(
                      "flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left transition-colors duration-300",
                      isOpen && "border-l-2 border-accent pl-4",
                    )}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={cn(
                        "heading-subsection max-w-3xl font-medium",
                        lightHero
                          ? isOpen
                            ? "text-white"
                            : "text-white/80"
                          : isOpen
                            ? "text-foreground"
                            : "text-foreground/80",
                      )}
                    >
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                        isOpen
                          ? lightHero
                            ? "rotate-45 border-accent/50 bg-accent/10 text-accent"
                            : "rotate-45 border-accent/50 bg-accent/10 text-accent-foreground"
                          : lightHero
                            ? "border-white/15 text-white/70"
                            : "border-border text-muted-foreground",
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
                      <p
                        className={cn(
                          "body-base max-w-3xl pb-6 pl-4",
                          lightHero ? "text-white/65" : "text-muted-foreground",
                        )}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
  );

  const contactSection = (
    <section key="contact" className="surface-light section-padding relative border-t border-border">
        <div className="container-premium relative z-10">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <Reveal>
                <h2 className="heading-section max-w-xl">{c("contactTitle")}</h2>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="body-large mt-6 max-w-md text-muted-foreground">
                  {c("contactSubtitle")}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-8"
                  onClick={() => openContactModal()}
                >
                  {c("ctaPrimary")}
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <ContactChannels message={t("h1")} />
            </Reveal>
          </div>
        </div>
      </section>
  );

  const tariffsSection = tariffs.length ? (
    <section key="tariffs" id="tariffs" className="surface-light section-padding relative">
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section max-w-3xl">{c("tariffsTitle")}</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body-base mt-5 max-w-2xl text-muted-foreground">
            {c("tariffsSubtitle")}
          </p>
        </Reveal>

        <StaggerReveal className="mt-14 grid gap-6 md:grid-cols-3 md:gap-7">
          {tariffs.map((tier) => (
            <div key={tier.name} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-8 transition-[border-color,box-shadow] duration-500 md:p-9",
                  tier.recommended
                    ? "border-accent bg-accent-muted/40 shadow-[0_0_40px_rgba(180,224,45,0.16)]"
                    : "border-border bg-background hover:border-accent/50",
                )}
              >
                {tier.recommended && (
                  <span className="absolute right-7 top-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent-foreground md:right-8">
                    {c("recommendedLabel")}
                  </span>
                )}
                <h3 className="heading-subsection text-foreground">{tier.name}</h3>
                <p className="mt-5 text-3xl font-semibold text-foreground md:text-4xl">
                  {tier.price}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {c("deadlineLabel")}: {tier.deadline}
                </p>

                <ul className="mt-7 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="body-base text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.recommended ? "primary" : "outline"}
                  size="lg"
                  className="mt-8 w-full"
                  onClick={() => openContactModal()}
                >
                  {c("tariffCta")}
                </Button>
              </div>
            </div>
          ))}
        </StaggerReveal>

        <Reveal delay={0.1}>
          <p className="mt-8 text-sm text-muted-foreground">{c("tariffsNote")}</p>
        </Reveal>
      </div>
    </section>
  ) : null;

  const relatedSection = relatedServices.length ? (
    <section
      key="related"
      className="surface-light section-padding relative border-t border-border"
    >
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section max-w-3xl">{c("relatedTitle")}</h2>
        </Reveal>
        <StaggerReveal className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
          {relatedServices.map((key, index) => (
            <div key={key} className="h-full">
              <ServiceCard serviceKey={key} index={index} />
            </div>
          ))}
        </StaggerReveal>

        {relatedArticleKeys.length > 0 && (
          <div className="mt-16">
            <Reveal>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {c("relatedArticlesTitle")}
              </h3>
            </Reveal>
            <StaggerReveal className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3 md:gap-8">
              {relatedArticleKeys.map((key) => {
                const post = blogPostByKey(key);
                if (!post) return null;
                return (
                  <div key={key} className="h-full">
                    <Link
                      href={`/blog/${post.slug}/`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:shadow-[0_0_38px_rgba(180,224,45,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                        <Image
                          src={post.cover}
                          alt={blog(`posts.${key}.title`)}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-7 md:p-8">
                        <h4 className="heading-subsection text-foreground">
                          {blog(`posts.${key}.title`)}
                        </h4>
                        <span className="mt-6 inline-flex items-center gap-1.5 text-base font-medium text-foreground">
                          <span className="relative">
                            {blog("readMore")}
                            <span
                              aria-hidden="true"
                              className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                            />
                          </span>
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </StaggerReveal>
          </div>
        )}
      </div>
    </section>
  ) : null;

  // Section order: tariffs sit directly after the cases block; other pages
  // (non-light hero) keep the default sequence.
  const middleSections = lightHero
    ? [
        casesSection,
        tariffsSection,
        includesSection,
        forWhomSection,
        processSection,
        faqSection,
      ]
    : [
        includesSection,
        casesSection,
        tariffsSection,
        processSection,
        forWhomSection,
        faqSection,
      ];

  return (
    <>
      {heroSection}
      {middleSections}
      {relatedSection}
      {contactSection}

      <CaseLightbox
        src={lightboxCase ? CASE_DETAIL[lightboxCase] : null}
        srcMobile={lightboxCase ? CASE_DETAIL_MOBILE[lightboxCase] : null}
        alt={lightboxCase ? solutions(`${lightboxCase}.title`) : ""}
        onClose={() => setLightboxCase(null)}
      />
    </>
  );
}
