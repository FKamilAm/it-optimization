import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import {
  SECTIONS,
  blogPath,
  privacyPath,
  projectsPath,
  sectionBySegment,
  segment,
  servicesPath,
} from "@/i18n/routes";
import { isPrivacyTranslated } from "@/lib/coverage";
import { BlogListPage } from "@/views/blog-list-page";
import { pageMetadata } from "@/views/page-metadata";
import { PrivacyPage } from "@/views/privacy-page";
import { ProjectsPage } from "@/views/projects-page";
import { ServicesHub } from "@/views/services-hub";

/**
 * Разделы языковых версий одним маршрутом.
 *
 * Сегмент динамический, потому что он разный в каждой локали: `/en/services/`,
 * но `/es/servicios/`. Статическая папка в App Router одна на все локали, так
 * что разводить разделы приходится здесь, по таблице из i18n/routes.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.flatMap((locale) =>
    SECTIONS.map((section) => ({ locale, section: segment(section, locale) })),
  );
}

interface Props {
  params: Promise<{ locale: string; section: string }>;
}

const NAMESPACE = {
  services: "servicesPage",
  projects: "projectsPage",
  blog: "blog",
  privacy: "privacyPage",
} as const;

const PATH = {
  services: servicesPath,
  projects: projectsPath,
  blog: blogPath,
  privacy: privacyPath,
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  const resolved = sectionBySegment(section, locale);
  if (!resolved) notFound();

  return pageMetadata({
    locale,
    namespace: NAMESPACE[resolved],
    path: PATH[resolved],
    noindex: resolved === "privacy" && !isPrivacyTranslated(locale),
  });
}

export default async function Page({ params }: Props) {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  const resolved = sectionBySegment(section, locale);
  if (!resolved) notFound();

  setRequestLocale(locale);
  const typed = locale as Locale;

  switch (resolved) {
    case "services":
      return <ServicesHub locale={typed} />;
    case "projects":
      return <ProjectsPage locale={typed} />;
    case "blog":
      return <BlogListPage locale={typed} />;
    case "privacy":
      return <PrivacyPage locale={typed} />;
  }
}
