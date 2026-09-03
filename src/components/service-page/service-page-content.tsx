"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactChannels } from "@/components/contact/contact-channels";
import { CaseLightbox } from "@/components/sections/case-lightbox";
import { ServiceCard } from "@/components/sections/service-card";
import { casesForService, formatTags, type CaseItem } from "@/lib/cases";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { ServiceHeroVisual } from "@/components/service-hero/service-hero-visual";
import type { ServiceHeroVariant } from "@/components/service-hero/service-hero-3d";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { DRAFT_SERVICES, RELATED_SERVICES } from "@/lib/constants";
import type { ServicePage } from "@/lib/services/types";
import type { BlogPost } from "@/lib/blog";
import { cn, typographicNbsp } from "@/lib/utils";

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
  webDesign: "webDesign",
  branding: "branding",
  security: "security",
  messenger: "messenger",
  infrastructure: "infrastructure",
  migration: "migration",
  os: "os",
  itOutsourcing: "itOutsourcing",
  infosecAudit: "infosecAudit",
  infosecTools: "infosecTools",
  infosecConsulting: "infosecConsulting",
  infosecMonitoring: "infosecMonitoring",
  collaboration: "collaboration",
  businessSystems: "businessSystems",
  businessSystemsCustom: "businessSystemsCustom",
  industrial: "industrial",
};

const CASE_ROTATE_MS = 5000;
const STEP_ROTATE_MS = 3000;

export function ServicePageContent({
  servicePage,
  cases: allCases,
  articles,
}: {
  /**
   * Тексты своей услуги. Приходят пропсом, а не из каталога `next-intl`:
   * каталог уезжает клиенту целиком на каждой странице сайта, так что там
   * страница услуги стоила бы всем остальным страницам своих тарифов и FAQ.
   */
  servicePage: ServicePage;
  /** Все кейсы сайта; страница берёт из них те, на которые ссылается. */
  cases: CaseItem[];
  /** Статьи блога об этой услуге. Связь живёт в самой статье и правится в панели. */
  articles: BlogPost[];
}) {
  const c = useTranslations("servicePages.common");
  const service = useTranslations("services.items");
  const blog = useTranslations("blog");
  const { openContactModal } = useContactModal();
  const { scrollToSection } = useSmoothScroll();

  const { key: pageKey, includes, forWhom, steps, faq } = servicePage;
  // Кейсы больше не перечисляются в каталоге у каждой услуги: теперь кейс сам
  // знает, к каким услугам относится, и это редактируется в панели.
  const cases = casesForService(allCases, pageKey);
  const tariffs = servicePage.tariffs ?? [];
  // Черновики отсюда убираются: смежная услуга — это ссылка, а страница,
  // которой ещё нет в каталоге и в карте сайта, ссылок на себя получать не
  // должна. Опубликуется — появится сама, без правки этого списка.
  const relatedServices = (RELATED_SERVICES[pageKey] ?? []).filter(
    (key) => !DRAFT_SERVICES.has(key),
  );

  const heroVariant = HERO_VISUAL[pageKey];
  // All service pages use the light hero (dark text on white) + re-sequenced
  // layout that was piloted on the Telegram page.
  const lightHero = true;

  const [activeStep, setActiveStep] = useState(0);
  const [lightboxCase, setLightboxCase] = useState<CaseItem | null>(null);

  const total = cases.length;
  const hasCases = total > 0;
  const hasSlider = total > 1;

  // Infinite slider. `page` is an unbounded counter (up on next, down on prev);
  // the visible case is derived via modulo, so it loops forever in either
  // direction. Each change animates a single slide in/out horizontally, which
  // stays robust under fast clicking (no clone bookkeeping to overshoot).
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const realIndex = total ? ((page % total) + total) % total : 0;

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

  const renderCaseInner = (item: CaseItem) => (
    <div className="flex h-full flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-14">
      <div className="flex items-center justify-center lg:h-full">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={item.cover}
            alt={item.title}
            width={720}
            height={540}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 lg:h-full">
        <h3 className="heading-section text-white">{item.title}</h3>
        <p className="body-large text-white/65">{item.description}</p>
        <blockquote className="border-accent border-l-2 pl-5 text-white/80">
          {item.quote}
        </blockquote>
        <p className="text-sm text-white/45">{formatTags(item.tags)}</p>
        <div className="mt-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setLightboxCase(item)}
            className="group/more hover:text-foreground focus-visible:outline-accent relative inline-flex h-14 w-full max-w-xs cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-white bg-transparent px-8 text-base font-medium text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:max-w-none"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 translate-y-full bg-white transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:translate-y-0 motion-reduce:transition-none"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              {c("caseMore")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => openContactModal()}
            className="group/cta text-foreground hover:text-accent-foreground focus-visible:outline-accent relative inline-flex h-14 w-full max-w-xs cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-white bg-white px-8 text-base font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:max-w-none"
          >
            <span
              aria-hidden="true"
              className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-y-0 motion-reduce:transition-none"
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
        <div className="pointer-events-none relative z-0 mx-auto mb-4 aspect-[4/3] w-[92%] max-w-[460px] md:absolute md:top-1/2 md:right-[-4%] md:mx-0 md:mb-0 md:aspect-auto md:h-[72%] md:w-[62%] md:max-w-none md:-translate-y-1/2 lg:right-[-3%] lg:w-[60%] xl:w-[58%]">
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
                className={cn(
                  "h-4 w-4",
                  lightHero ? "text-foreground/30" : "text-white/30",
                )}
                aria-hidden="true"
              />
              <li>
                <a
                  href="/uslugi/"
                  className={cn(
                    "cursor-pointer transition-colors",
                    lightHero ? "hover:text-foreground" : "hover:text-white",
                  )}
                >
                  {c("breadcrumbServices")}
                </a>
              </li>
              <ChevronRight
                className={cn(
                  "h-4 w-4",
                  lightHero ? "text-foreground/30" : "text-white/30",
                )}
                aria-hidden="true"
              />
              <li
                aria-current="page"
                className={lightHero ? "text-foreground/80" : "text-white/80"}
              >
                {servicePage.breadcrumb}
              </li>
            </ol>
          </nav>

          <Reveal>
            <h1
              className={cn("heading-display", heroVariant ? "max-w-none" : "max-w-4xl")}
            >
              {typographicNbsp(servicePage.h1)}
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
              {servicePage.lead}
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
                      "text-xs font-medium tracking-[0.14em] uppercase",
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
                    {service(`${pageKey}.budget`)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt
                    className={cn(
                      "text-xs font-medium tracking-[0.14em] uppercase",
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
                    {service(`${pageKey}.deadline`)}
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
                      "hover:border-accent hover:text-accent inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-8 text-base font-medium transition-colors duration-300 sm:w-auto",
                      lightHero
                        ? "border-foreground/20 text-foreground"
                        : "border-white/20 text-white",
                    )}
                  >
                    {c("viewTariffs")}
                  </button>
                )}
                <a
                  href="/uslugi/"
                  className={cn(
                    "hover:border-accent hover:text-accent inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-8 text-base font-medium transition-colors duration-300 sm:w-auto",
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
              className="border-border bg-background flex items-start gap-4 rounded-2xl border p-6"
            >
              <span className="bg-accent text-accent-foreground mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
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
    <section
      key="cases"
      className="surface-dark section-padding relative overflow-hidden"
    >
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
                {cases.map((item) => (
                  <div key={item.slug} className="col-start-1 row-start-1">
                    {renderCaseInner(item)}
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
                className="group/arrow bg-surface hover:border-accent hover:text-accent-foreground absolute top-1/2 left-0 z-20 hidden h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 text-white transition-colors duration-300 lg:-left-7 lg:flex"
              >
                <span
                  aria-hidden="true"
                  className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
                />
                <ChevronLeft className="relative z-10 h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Следующий кейс"
                className="group/arrow bg-surface hover:border-accent hover:text-accent-foreground absolute top-1/2 right-0 z-20 hidden h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 text-white transition-colors duration-300 lg:-right-7 lg:flex"
              >
                <span
                  aria-hidden="true"
                  className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
                />
                <ChevronRight className="relative z-10 h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {hasSlider && (
          <div className="mt-10 flex justify-center gap-2">
            {cases.map((item, i) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => goToReal(i)}
                aria-label={`Кейс ${i + 1}`}
                aria-current={i === realIndex}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                  i === realIndex
                    ? "w-8 bg-white/80"
                    : "w-4 bg-white/25 hover:bg-white/40",
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
                className="group/arrow bg-surface hover:border-accent hover:text-accent-foreground relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 text-white transition-colors duration-300"
              >
                <span
                  aria-hidden="true"
                  className="bg-accent pointer-events-none absolute inset-0 z-0 translate-y-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/arrow:translate-y-0 motion-reduce:transition-none"
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
                    "group border-border bg-background relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border p-8 transition-transform duration-[1100ms] ease-[cubic-bezier(0.37,0,0.23,1)] will-change-transform motion-reduce:transition-none",
                    isActive && "-translate-y-2.5",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "bg-accent pointer-events-none absolute inset-0 z-0 origin-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
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
                      "heading-subsection relative z-10 transition-colors duration-500",
                      isActive ? "text-accent-foreground" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      "body-base relative z-10 transition-colors duration-500",
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
    <section
      key="forwhom"
      className="surface-dark section-padding relative overflow-hidden"
    >
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
                <h3 className="heading-subsection group-hover:text-foreground text-white transition-colors duration-500">
                  {item.title}
                </h3>
                <p className="body-base group-hover:text-muted-foreground text-white/60 transition-colors duration-500">
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
        <div className="mt-14">
          <FaqAccordion items={faq} surface={lightHero ? "dark" : "light"} />
        </div>
      </div>
    </section>
  );

  const contactSection = (
    <section
      key="contact"
      className="surface-light section-padding border-border relative border-t"
    >
      <div className="container-premium relative z-10">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <Reveal>
              <h2 className="heading-section max-w-xl">{c("contactTitle")}</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="body-large text-muted-foreground mt-6 max-w-md">
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
            <ContactChannels message={servicePage.h1} />
          </Reveal>
        </div>
      </div>
    </section>
  );

  const tariffsSection = tariffs.length ? (
    <section
      key="tariffs"
      id="tariffs"
      className="surface-light section-padding relative"
    >
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section max-w-3xl">{c("tariffsTitle")}</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body-base text-muted-foreground mt-5 max-w-2xl">
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
                  <span className="bg-accent text-accent-foreground absolute top-8 right-7 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase md:right-8">
                    {c("recommendedLabel")}
                  </span>
                )}
                <h3 className="heading-subsection text-foreground">{tier.name}</h3>
                <p className="text-foreground mt-5 text-3xl font-semibold md:text-4xl">
                  {tier.price}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {c("deadlineLabel")}: {tier.deadline}
                </p>

                <ul className="mt-7 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="bg-accent text-accent-foreground mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
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
          <p className="text-muted-foreground mt-8 text-sm">{c("tariffsNote")}</p>
        </Reveal>
      </div>
    </section>
  ) : null;

  const relatedSection = relatedServices.length ? (
    <section
      key="related"
      className="surface-light section-padding border-border relative border-t"
    >
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section max-w-3xl">{c("relatedTitle")}</h2>
        </Reveal>
        <StaggerReveal className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
          {relatedServices.map((key, index) => (
            <div key={key} className="h-full">
              <ServiceCard serviceKey={key} index={index} />
            </div>
          ))}
        </StaggerReveal>

        {articles.length > 0 && (
          <div className="mt-16">
            <Reveal>
              <h3 className="text-muted-foreground text-sm font-semibold tracking-[0.16em] uppercase">
                {c("relatedArticlesTitle")}
              </h3>
            </Reveal>
            <StaggerReveal className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
              {articles.map((post) => (
                <div key={post.slug} className="h-full">
                  <Link
                    href={`/blog/${post.slug}/`}
                    className="group border-border bg-background hover:border-accent focus-visible:outline-accent flex h-full flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_0_38px_rgba(180,224,45,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <div className="bg-surface relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-7 md:p-8">
                      <h4 className="heading-subsection text-foreground">{post.title}</h4>
                      <span className="text-foreground mt-6 inline-flex items-center gap-1.5 text-base font-medium">
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
              ))}
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
        src={lightboxCase?.detail ?? null}
        srcMobile={lightboxCase?.detailMobile ?? null}
        alt={lightboxCase?.title ?? ""}
        onClose={() => setLightboxCase(null)}
      />
    </>
  );
}
