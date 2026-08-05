"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Clock } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { ServiceCard } from "@/components/sections/service-card";
import { BLOG_POSTS, SERVICES_BY_ARTICLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Section {
  heading: string;
  body: string[];
}

export function BlogArticle({ postKey }: { postKey: string }) {
  const t = useTranslations("blog");
  const p = useTranslations(`blog.posts.${postKey}`);

  const post = BLOG_POSTS.find((item) => item.key === postKey);
  const cover = post?.cover;
  const sections = p.raw("sections") as Section[];
  const takeaways = (p.raw("takeaways") as string[] | undefined) ?? [];
  const related = BLOG_POSTS.filter((item) => item.key !== postKey);
  const services = SERVICES_BY_ARTICLE[postKey] ?? [];

  return (
    <>
      <article className="surface-light relative overflow-hidden pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="text-foreground/50 flex flex-wrap items-center gap-2 text-sm">
              <li>
                <a
                  href="/"
                  className="hover:text-foreground cursor-pointer transition-colors"
                >
                  {t("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight className="text-foreground/30 h-4 w-4" aria-hidden="true" />
              <li>
                <Link
                  href="/blog/"
                  className="hover:text-foreground cursor-pointer transition-colors"
                >
                  {t("breadcrumb")}
                </Link>
              </li>
              <ChevronRight className="text-foreground/30 h-4 w-4" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {p("category")}
              </li>
            </ol>
          </nav>

          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                <span className="border-border bg-muted text-foreground rounded-full border px-3 py-1 text-xs font-medium tracking-[0.12em] uppercase">
                  {p("category")}
                </span>
                <span>{p("date")}</span>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {p("readingTime")}
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="heading-display mt-6">{p("title")}</h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-large text-muted-foreground mt-8">{p("lead")}</p>
            </Reveal>
          </div>

          {cover && (
            <Reveal delay={0.15}>
              <div className="border-border bg-surface relative mx-auto mt-12 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-2xl border">
                <Image
                  src={cover}
                  alt={p("title")}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
              </div>
            </Reveal>
          )}
        </div>
      </article>

      <div className="surface-light section-padding pt-8 md:pt-12">
        <div className="container-premium">
          <div className="mx-auto max-w-4xl">
            {/* Table of contents */}
            <Reveal>
              <nav
                aria-label={t("tocTitle")}
                className="border-border bg-muted/40 mb-14 rounded-2xl border p-6 md:p-8"
              >
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                  {t("tocTitle")}
                </p>
                <ol className="mt-4 flex flex-col gap-2.5">
                  {sections.map((section, index) => (
                    <li key={section.heading}>
                      <a
                        href={`#section-${index}`}
                        className="group text-foreground/80 hover:text-accent-foreground inline-flex items-start gap-3 text-base transition-colors duration-300"
                      >
                        <span className="text-muted-foreground group-hover:text-accent-foreground mt-0.5 text-sm font-semibold transition-colors duration-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="group-hover:border-accent border-b border-transparent transition-colors duration-300">
                          {section.heading}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </Reveal>

            {/* Body */}
            <div className="flex flex-col gap-12">
              {sections.map((section, index) => (
                <Reveal key={section.heading}>
                  <section id={`section-${index}`} className="scroll-mt-28">
                    <h2 className="heading-section text-foreground">{section.heading}</h2>
                    <div className="mt-6 flex flex-col gap-5">
                      {section.body.map((paragraph, i) => (
                        <p key={i} className="body-large text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>

            {/* Takeaways */}
            {takeaways.length > 0 && (
              <Reveal>
                <div className="border-accent-border bg-accent-muted mt-16 rounded-2xl border p-8 md:p-10">
                  <h2 className="heading-subsection text-foreground">
                    {t("takeawaysTitle")}
                  </h2>
                  <ul className="mt-6 flex flex-col gap-4">
                    {takeaways.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="bg-accent text-accent-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="body-base text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            <div className="mt-14">
              <Link
                href="/blog/"
                className="text-foreground hover:text-accent-foreground inline-flex items-center gap-2 text-base font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("backToList")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Услуги по теме статьи — коммерческий выход из информационного текста.
          Стоит перед «Читайте также» намеренно: тот блок уводит глубже в блог,
          и если поставить его первым, до услуг читатель уже не доберётся. */}
      {services.length > 0 && (
        <section className="surface-light section-padding border-border border-t pt-16 md:pt-20">
          <div className="container-premium">
            <Reveal>
              <h2 className="heading-section">{t("servicesTitle")}</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="body-base text-muted-foreground mt-6 max-w-2xl">
                {t("servicesSubtitle")}
              </p>
            </Reveal>
            <StaggerReveal
              className={cn(
                "mt-12 grid gap-6 md:gap-8",
                services.length === 1
                  ? "max-w-md"
                  : services.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {services.map((key, index) => (
                <div key={key} className="h-full">
                  <ServiceCard serviceKey={key} index={index} />
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      {/* Related posts */}
      {related.length > 0 && (
        <section className="surface-light section-padding border-border border-t pt-16 md:pt-20">
          <div className="container-premium">
            <Reveal>
              <h2 className="heading-section">{t("relatedTitle")}</h2>
            </Reveal>
            <StaggerReveal className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {related.map((item) => (
                <div key={item.key} className="h-full">
                  <Link
                    href={`/blog/${item.slug}/`}
                    className="group border-border bg-background hover:border-accent focus-visible:outline-accent flex h-full gap-5 rounded-2xl border p-5 transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_0_38px_rgba(180,224,45,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <div className="bg-surface relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={item.cover}
                        alt={t(`posts.${item.key}.title`)}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
                        {t(`posts.${item.key}.category`)}
                      </span>
                      <h3 className="text-foreground mt-2 text-lg font-semibold">
                        {t(`posts.${item.key}.title`)}
                      </h3>
                      <span className="text-foreground mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
                        <span className="relative">
                          {t("readMore")}
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                          />
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      <ContactSection />
    </>
  );
}
