"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Clock } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { BLOG_POSTS } from "@/lib/constants";

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

  return (
    <>
      <article className="surface-light relative overflow-hidden pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-foreground/50">
              <li>
                <a href="/" className="cursor-pointer transition-colors hover:text-foreground">
                  {t("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight className="h-4 w-4 text-foreground/30" aria-hidden="true" />
              <li>
                <Link
                  href="/blog/"
                  className="cursor-pointer transition-colors hover:text-foreground"
                >
                  {t("breadcrumb")}
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-foreground/30" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {p("category")}
              </li>
            </ol>
          </nav>

          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-foreground">
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
              <p className="body-large mt-8 text-muted-foreground">{p("lead")}</p>
            </Reveal>
          </div>

          {cover && (
            <Reveal delay={0.15}>
              <div className="relative mx-auto mt-12 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface">
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
                className="mb-14 rounded-2xl border border-border bg-muted/40 p-6 md:p-8"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("tocTitle")}
                </p>
                <ol className="mt-4 flex flex-col gap-2.5">
                  {sections.map((section, index) => (
                    <li key={section.heading}>
                      <a
                        href={`#section-${index}`}
                        className="group inline-flex items-start gap-3 text-base text-foreground/80 transition-colors duration-300 hover:text-accent-foreground"
                      >
                        <span className="mt-0.5 text-sm font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-accent-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="border-b border-transparent transition-colors duration-300 group-hover:border-accent">
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
                <div className="mt-16 rounded-2xl border border-accent-border bg-accent-muted p-8 md:p-10">
                  <h2 className="heading-subsection text-foreground">{t("takeawaysTitle")}</h2>
                  <ul className="mt-6 flex flex-col gap-4">
                    {takeaways.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
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
                className="inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-accent-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("backToList")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="surface-light section-padding border-t border-border pt-16 md:pt-20">
          <div className="container-premium">
            <Reveal>
              <h2 className="heading-section">{t("relatedTitle")}</h2>
            </Reveal>
            <StaggerReveal className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {related.map((item) => (
                <div key={item.key} className="h-full">
                  <Link
                    href={`/blog/${item.slug}/`}
                    className="group flex h-full gap-5 rounded-2xl border border-border bg-background p-5 transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:shadow-[0_0_38px_rgba(180,224,45,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-surface">
                      <Image
                        src={item.cover}
                        alt={t(`posts.${item.key}.title`)}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {t(`posts.${item.key}.category`)}
                      </span>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">
                        {t(`posts.${item.key}.title`)}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
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
