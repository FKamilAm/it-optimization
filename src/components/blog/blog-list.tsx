"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronRight, Clock } from "lucide-react";
import { Reveal, StaggerReveal } from "@/components/animations/reveal";
import { ContactSection } from "@/components/sections/contact-section";
import { BLOG_POSTS } from "@/lib/constants";

export function BlogList() {
  const t = useTranslations("blog");

  return (
    <>
      <section className="surface-light relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-foreground/50">
              <li>
                <a href="/" className="cursor-pointer transition-colors hover:text-foreground">
                  {t("breadcrumbHome")}
                </a>
              </li>
              <ChevronRight className="h-4 w-4 text-foreground/30" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>

          <Reveal>
            <h1 className="heading-display max-w-4xl">{t("title")}</h1>
          </Reveal>

          <StaggerReveal className="mt-14 grid grid-cols-1 gap-8 md:mt-16 md:grid-cols-2 md:gap-10 xl:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article key={post.key} className="h-full">
                <Link
                  href={`/blog/${post.slug}/`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:shadow-[0_0_38px_rgba(180,224,45,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    <Image
                      src={post.cover}
                      alt={t(`posts.${post.key}.title`)}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-white backdrop-blur">
                      {t(`posts.${post.key}.category`)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-7 md:p-8">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{t(`posts.${post.key}.date`)}</span>
                      <span className="text-border">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(`posts.${post.key}.readingTime`)}
                      </span>
                    </div>

                    <h2 className="heading-subsection mt-4 text-foreground">
                      {t(`posts.${post.key}.title`)}
                    </h2>
                    <p className="body-base mt-3 flex-1 text-muted-foreground">
                      {t(`posts.${post.key}.excerpt`)}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-1.5 text-base font-medium text-foreground">
                      <span className="relative">
                        {t("readMore")}
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                        />
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
